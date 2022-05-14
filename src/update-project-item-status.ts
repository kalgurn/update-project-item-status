import * as core from '@actions/core'
import * as github from '@actions/github'

// TODO: Ensure this (and the Octokit client) works for non-github.com URLs, as well.
// https://github.com/orgs|users/<ownerName>/projects/<projectNumber>
const urlParse =
  /^(?:https:\/\/)?github\.com\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

interface ProjectNodeIDResponse {
  organization?: {
    projectNext: {
      id: string
    }
  }

  user?: {
    projectNext: {
      id: string
    }
  }
}

interface ProjectFieldNodes {
    id: string,
    name: string,
    settings: string
}
interface ProjectFieldNodeIDResponse {
    projectNext: {
        fields: {
            nodes: [] | ProjectFieldNodes[]
        }
    }
}

interface ProjectUpdateItemFieldResponse {
    updateProjectNextItemField:{
        projectNextItem: {
            id: string
          }
    }

}

export async function updateProjectItemStatus(): Promise<void> {
    const projectUrl = core.getInput('project-url', {required: true})
    const ghToken = core.getInput('github-token', {required: true})
    const itemId = core.getInput('item-id', {required: true})
    const status = core.getInput('status', {required: true})


    const octokit = github.getOctokit(ghToken)
    const urlMatch = projectUrl.match(urlParse)

    core.debug(`Project URL: ${projectUrl}`)

    if (!urlMatch) {
        throw new Error(
          `Invalid project URL: ${projectUrl}. Project URL should match the format https://github.com/<orgs-or-users>/<ownerName>/projects/<projectNumber>`
        )
      }

    const ownerName = urlMatch.groups?.ownerName
    const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
    const ownerType = urlMatch.groups?.ownerType
    const ownerTypeQuery = mustGetOwnerTypeQuery(ownerType)

    core.debug(`Org name: ${ownerName}`)
    core.debug(`Project number: ${projectNumber}`)
    core.debug(`Owner type: ${ownerType}`)

    const idResp = await octokit.graphql<ProjectNodeIDResponse>(
        `query getProject($ownerName: String!, $projectNumber: Int!) { 
          ${ownerTypeQuery}(login: $ownerName) {
            projectNext(number: $projectNumber) {
              id
            }
          }
        }`,
        {
          ownerName,
          projectNumber
        }
      )
    
    const projectId = idResp[ownerTypeQuery]?.projectNext.id

    const fieldResp = await octokit.graphql<ProjectFieldNodeIDResponse>(
        `node($id: $projectId!) {
            ... on ProjectNext {
              fields(first:20) {
                nodes {
                  id
                  name
                  settings
                }
              }
            }
          }`,
          {
              projectId
          }
    )
    console.log(fieldResp.projectNext.fields)

    
}

export function mustGetOwnerTypeQuery(ownerType?: string): 'organization' | 'user' {
    const ownerTypeQuery = ownerType === 'orgs' ? 'organization' : ownerType === 'users' ? 'user' : null
  
    if (!ownerTypeQuery) {
      throw new Error(`Unsupported ownerType: ${ownerType}. Must be one of 'orgs' or 'users'`)
    }
  
    return ownerTypeQuery
  }