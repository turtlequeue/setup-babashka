import * as core from '@actions/core'
import * as installer from './installer'

export function assertIsError(error: unknown): asserts error is Error {
  // https://stackoverflow.com/a/70993058/1327651
  // GH doesn't seem to have node assert
  if (!(error instanceof Error)) {
    throw error
  }
}

async function run(): Promise<void> {
  try {
    const version = core.getInput('babashka-version', {required: true})
    const url = core.getInput('babashka-url')
    const failOnCacheMiss = core.getInput('fail-on-cache-miss') === 'true';

    await installer.getBabashka(url, version, failOnCacheMiss)
  } catch (error) {
    assertIsError(error)
    core.setFailed(error.message)
  }
}

run()
