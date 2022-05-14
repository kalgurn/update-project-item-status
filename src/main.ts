import * as core from '@actions/core'
import {updateProjectItemStatus} from './update-project-item-status'

updateProjectItemStatus()
  .catch(err => {
    core.setFailed(err.message)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
