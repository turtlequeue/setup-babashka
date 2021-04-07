import * as core from '@actions/core'
import * as installer from './installer'


function isEmptyOrNull(str: string|undefined) {
  return (!str || str.length === 0 || str === "");
}

async function run(): Promise<void> {
  try {
    const version = core.getInput('babashka-version')
    const url = core.getInput('babashka-url')

    if(isEmptyOrNull(version) && isEmptyOrNull(url)) {
      core.setFailed("Input required and not supplied: babashka-version")
    } else {
      await installer.getBabashka(url, version)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
