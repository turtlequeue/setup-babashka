import * as core from '@actions/core'
import * as installer from './installer'

async function run(): Promise<void> {
  try {
    const version = core.getInput('babashka-version', {required: true})
    const url = core.getInput('babashka-url')

    await installer.getBabashka(url, version)

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
