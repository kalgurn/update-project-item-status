<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

## kalgurn/update-project-item-status

This actions was designed as a complimentary action for the [actions/add-to-project](https://github.com/actions/add-to-project). It will allow to change the status(column) on the new GitHub Projects(beta).

Useful as a part of a workflow which creates a new items in a GitHub Projects(beta) so they can be placed in the desired column

## Usage

Create a workflow which outputs an itemId for the desired item and specify the required fields.  

In the example below the newly created issues with a `bug` label would be added to a project and then the "Triage" status will be set to the resulted item.  

```yaml
name: Add bugs to bugs project

on:
  issues:
    types:
      - opened

jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@main
        id: addItem
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          labeled: bug, needs-triage
          label-operator: OR

      - uses: kalgurn/update-project-item-status@main
        with:
          project-url: https://github.com/orgs/<orgName>/projects/<projectNumber>
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
          item-id: ${{ steps.addItem.outputs.itemId }}
          status: "Triage"
```

## Inputs

- `project-url` __(required)__ is the URL of the GitHub project to add issues to.  
_eg: https://github.com/orgs|users/<ownerName>/projects/<projectNumber>_

- `github-token` __(required)__ is a personal access token with the `repo`, `write:org` and `read:org` scopes.  
_See [Creating a PAT and adding it to your repository](#creating-a-pat-and-adding-it-to-your-repository) for more details_

- `item-id` __(required)__ is an ID of the item which requires a status change.  
_Usually obtained through an [API](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/using-the-api-to-manage-projects#finding-information-about-items-in-a-project)_

- `status` __(required)__ desired status to be set for the item. Must be an existing project status

## Creating a PAT and adding it to your repository

- create a new [personal access
  token](https://github.com/settings/tokens/new) with `repo`, `write:org` and
  `read:org` scopes  
  _See [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) for more information_

- add the newly created PAT as a repository secret, this secret will be referenced by the [github-token input](#github-token)  
  _See [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) for more information_

## Development

To get started contributing to this project, clone it and install dependencies.
Note that this action runs in Node.js 16.x, so we recommend using that version
of Node (see "engines" in this action's package.json for details).

```shell
> git clone https://github.com/kalgurn/update-project-item-status
> cd add-to-project
> npm install
```

Or, use [GitHub Codespaces](https://github.com/features/codespaces).

See the [toolkit
documentation](https://github.com/actions/toolkit/blob/master/README.md#packages)
for the various packages used in building this action.

## Publish to a distribution branch

Actions are run from GitHub repositories, so we check in the packaged action in
the "dist/" directory.

```shell
> npm run build
> git add lib dist
> git commit -a -m "Build and package"
> git push origin releases/v1
```

Now, a release can be created from the branch containing the built action.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
