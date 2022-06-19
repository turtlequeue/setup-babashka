import * as core from '@actions/core'
import * as installer from './installer'
import { strict as assert } from 'node:assert';

async function run(): Promise<void> {
  try {
    const version = core.getInput('babashka-version', {required: true})
    const url = core.getInput('babashka-url')

    await installer.getBabashka(url, version)

  } catch (error) {
    assert(error instanceof Error);
    core.setFailed(error.message)
  }
}

run()
