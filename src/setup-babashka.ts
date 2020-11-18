import * as core from '@actions/core'
import * as installer from './installer'

async function run(): Promise<void> {
    try {
        const version = core.getInput('babashka-version', { required: true })
        await installer.getBabashka(version)

    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
