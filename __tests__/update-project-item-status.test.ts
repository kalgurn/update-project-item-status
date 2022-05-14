import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  updateProjectItemStatus,
  mustGetOwnerTypeQuery,
  getStatusFieldData,
  getStatusColumnIdFromSettings
} from '../src/update-project-item-status'

describe('updateProjectItemStatus', () => {
  let outputs: Record<string, string>

  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  beforeEach(() => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      'item-id': 'xxx',
      status: 'status'
    })

    outputs = mockSetOutput()
  })

  afterEach(() => {
    github.context.payload = {}
    jest.restoreAllMocks()
  })
  test('throws if project URL is not provided', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/repositories',
      'github-token': 'gh_token',
      'item-id': 'xxx',
      status: 'status'
    })

    await expect(updateProjectItemStatus()).rejects.toThrow(
      'Invalid project URL: https://github.com/orgs/github/repositories. Project URL should match the format https://github.com/<orgs-or-users>/<ownerName>/projects/<projectNumber>'
    )
  })
  test('throws if GitHub token is not provided', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': '',
      'item-id': 'xxx',
      status: 'status'
    })

    await expect(updateProjectItemStatus()).rejects.toThrow(
      'Parameter token or opts.auth is required'
    )
  })
  test('throws if item ID is not provided', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      'item-id': '',
      status: 'status'
    })

    await expect(updateProjectItemStatus()).rejects.toThrow(
      'Item ID is required'
    )
  })
  test('throws if status is not provided', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/projects/1',
      'github-token': 'gh_token',
      'item-id': 'xxx',
      status: ''
    })

    await expect(updateProjectItemStatus()).rejects.toThrow(
      'Status is required'
    )
  })
  test('throws if status column is not found', async () => {
    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectNext: {
              id: 'project-next-id'
            }
          }
        }
      },
      {
        test: /node/,
        return: {
          node: {
            fields: {
              nodes: [
                {
                  id: 'xxx',
                  name: 'Status',
                  settings:
                    '{"options":[{"id":"zzz","name":"Todo","name_html":"Todo"}]}'
                }
              ]
            }
          }
        }
      }
    )

    await expect(updateProjectItemStatus()).rejects.toThrow(
      'Status column ID not found in settings'
    )
  })

  test('update project item status', async () => {
    mockGraphQL(
      {
        test: /getProject/,
        return: {
          organization: {
            projectNext: {
              id: 'project-next-id'
            }
          }
        }
      },
      {
        test: /node/,
        return: {
          node: {
            fields: {
              nodes: [
                {
                  id: 'xxx',
                  name: 'Status',
                  settings:
                    '{"options":[{"id":"zzz","name":"status","name_html":"status"}]}'
                }
              ]
            }
          }
        }
      },
      {
        test: /updateProjectNextItemField/,
        return: {
          id: 'item-id'
        }
      }
    )

    await updateProjectItemStatus()
  })
})

describe('mustGetOwnerTypeQuery', () => {
  test('returns organization for orgs ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('orgs')

    expect(ownerTypeQuery).toEqual('organization')
  })

  test('returns user for users ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('users')

    expect(ownerTypeQuery).toEqual('user')
  })

  test('throws an error when an unsupported ownerType is set', async () => {
    expect(() => {
      mustGetOwnerTypeQuery('unknown')
    }).toThrow(
      `Unsupported ownerType: unknown. Must be one of 'orgs' or 'users'`
    )
  })
})

describe('getStatusFieldData', () => {
  test('returns the status field', async () => {
    const fieldNodes = [
      {
        name: 'Status',
        id: '123',
        settings: '{"options":[{"id":"zzz","name":"Todo","name_html":"Todo"}]}'
      }
    ]

    const statusField = getStatusFieldData(fieldNodes)

    expect(statusField.id).toEqual('123')
  })
})
describe('getStatusColumnIdFromSettings', () => {
  test('returns the status column id', async () => {
    const settings =
      '{"options":[{"id":"zzz","name":"Todo","name_html":"Todo"}]}'
    const status = 'Todo'

    const statusColumnId = getStatusColumnIdFromSettings(settings, status)

    expect(statusColumnId).toEqual('zzz')
  })
})

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string) => mocks[key] ?? ''
  return jest.spyOn(core, 'getInput').mockImplementation(mock)
}

function mockSetOutput(): Record<string, string> {
  const output: Record<string, string> = {}
  jest
    .spyOn(core, 'setOutput')
    .mockImplementation((key, value) => (output[key] = value))
  return output
}

function mockGraphQL(...mocks: {test: RegExp; return: unknown}[]): jest.Mock {
  const mock = jest.fn().mockImplementation((query: string) => {
    const match = mocks.find(m => m.test.test(query))

    if (match) {
      return match.return
    }

    throw new Error(`Unexpected GraphQL query: ${query}`)
  })

  jest.spyOn(github, 'getOctokit').mockImplementation(() => {
    return {
      graphql: mock
    } as unknown as ReturnType<typeof github.getOctokit>
  })

  return mock
}
