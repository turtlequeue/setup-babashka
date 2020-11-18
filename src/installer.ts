import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'

export async function getBabashka(version: string): Promise<void> {
    let toolPath = tc.find('Babashka', version, os.arch())

    const allBabashkaVersions = tc.findAllVersions('Babashka')

    if (allBabashkaVersions.length) {
        core.info(`No versions of babashka are available yet`)
    } else {
        core.info(`Versions of babashka available: ${allBabashkaVersions}`)
    }


    if (toolPath) {
        core.debug(`Babashka found in cache ${toolPath}`)
    } else if (process.platform !== 'win32') {
        // Linux, osx WIP
        // rely on babashka's installer
        const installerFile = await tc.downloadTool("https://raw.githubusercontent.com/borkdude/babashka/master/install")
        core.info('INSTALLER FILE ' + installerFile)
        const tmpPath = os.tmpdir()
        core.info('tmp path  ' + tmpPath)
        exec.exec('bash', [installerFile, "--install-dir", tmpPath])


        core.debug(`babashka installed to #{toolPath}`)
        toolPath = await tc.cacheDir(
            tmpPath,
            'Babashka',
            version
        )
    } else {
        // windows WIP
        exec.exec('iwr', ["-useb", "get.scoop.sh", "|", "iex"])
        exec.exec('scoop', ["install", "babashka"])

    }

    core.addPath(path.join(toolPath, 'bin'));
}
