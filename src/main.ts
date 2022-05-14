import * as core from '@actions/core'
import {updateProjectItemStatus} from './update-project-item-status'

async function run(): Promise<void> {
  try {
    await updateProjectItemStatus()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
