import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid';
import { ok } from 'assert'

function _getTempDirectory(): string {
    const tempDirectory = process.env['RUNNER_TEMP'] || ''
    ok(tempDirectory, 'Expected RUNNER_TEMP to be defined')
    return tempDirectory
}

export async function getBabashka(version: string): Promise<void> {
    let toolPath = tc.find('Babashka', version, os.arch())


    const allBabashkaVersions = tc.findAllVersions('Babashka')

    if (allBabashkaVersions.length) {
        core.info(`No versions of babashka are available yet`)
    } else {
        core.info(`Versions of babashka available: ${allBabashkaVersions}`)
    }


    if (toolPath) {
        core.info(`Babashka found in cache ${toolPath}`)
        core.addPath(toolPath)
    } else if (process.platform !== 'win32') {
        // Linux, osx
        // rely on babashka's installer
        const tmpPath = path.join(_getTempDirectory(), uuidv4())
        await io.mkdirP(tmpPath)

        core.info('temporary directory ' + tmpPath)

        const installerFile = await tc.downloadTool("https://raw.githubusercontent.com/borkdude/babashka/master/install")
        core.info('INSTALLER FILE ' + installerFile)

        await exec.exec('bash', [installerFile, "--dir", tmpPath, "--version", version])

        core.info(`babashka installed to ${tmpPath}`)

        toolPath = await tc.cacheDir(
            tmpPath,
            'Babashka',
            version,
            os.arch())

        core.info(`babashka setup at ${toolPath}`)

        core.addPath(toolPath)
    } else {
        // windows - PR welcome
        // https://scoop.sh/
        // https://github.com/littleli/scoop-clojure
        core.info(`Windows not supported, PR welcome. Installing using https://github.com/littleli/scoop-clojure should be possible.`)
        throw (new Error("Windows not supported, PR welcome. Installing using https://github.com/littleli/scoop-clojure should be possible."))
        // await exec.exec('iwr', ["-useb", "get.scoop.sh", "|", "iex"])
        // await exec.exec('scoop', ["install", "babashka"])
    }


}
