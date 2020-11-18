import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'

let tempDirectory = process.env['RUNNER_TEMP'] || ''

export async function getBabashka(version: string): Promise<void> {
    let toolPath = tc.find('Babashka', version, os.arch())
    const allBabashkaVersions = tc.findAllVersions('Babashka')
    core.info(`Versions of babashka available: ${allBabashkaVersions}`)

    if (toolPath) {
        core.debug(`Babashka found in cache ${toolPath}`)
    } else if (process.platform !== 'win32') {
        // rely on babashka's installer

        const installerFile = await tc.downloadTool("https://raw.githubusercontent.com/borkdude/babashka/master/install")
        core.debug('INSTALLER FILE ' + installerFile)

        exec.exec('bash', [installerFile, "--install-dir", toolPath])


        core.debug(`babashka installed to #{toolPath}`)
        toolPath = await tc.cacheDir(
            toolPath,
            'Babashka',
            version
        )
    } else {
        // windows WIP
        exec.exec('iwr', ["-useb", "get.scoop.sh", "|", "iex"])
        exec.exec('scoop', ["install", "babashka"])

    }

    //   const extendedJavaHome = `JAVA_HOME_${version}`
    //   core.exportVariable('JAVA_HOME', toolPath)
    //   core.exportVariable(extendedJavaHome, toolPath)
    // core.addPath(path.join(toolPath, 'bin'))
    // is babsshks in /bin
    core.addPath(path.join(toolPath, 'bin'));
}
