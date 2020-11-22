import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
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
    core.info(`Downloaded installer file ${installerFile}`)

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
    //throw (new Error("Windows not supported, PR welcome. Installing using https://github.com/littleli/scoop-clojure should be possible. See my attempt at https://github.com/turtlequeue/setup-babashka/tree/feature/windows"))

    // windows - PR welcome
    //
    // https://scoop.sh/
    // https://github.com/littleli/scoop-clojure
    // https://github.com/actions/toolkit/blob/2bf7365352507ee52b4017790934cf9cefabc5f4/packages/exec/src/toolrunner.ts#L110
    // https://superuser.com/questions/1080239/run-powershell-command-from-cmd
    // https://stackoverflow.com/a/61219838/1327651
    //
    // attempt below

    // const dotnetVersion = core.getInput('dotnet-version', { required: true });
    // const powerShellVersion = core.getInput('powershell-version', { required: true });

    await exec.exec('powershell', ["-command", "Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://get.scoop.sh')"])
    // fails below
    // maybe need powershell v5 as written there: https://scoop.sh/
    // https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepsrun
    // https://github.community/t/use-runas-to-run-cmd-exe-shell-on-windows-to-run-command-as-non-admin-user/142362//

    var res = await exec.exec('C:\\windows\\system32\\cmd.exe', ["/D", "/E:ON", "/V:OFF", "/S", "/C", 'CALL "DIR"'])
    core.info('RES' +  res)
    res =await exec.exec('C:\\windows\\system32\\cmd.exe', ["/D", "/E:ON", "/V:OFF", "/S", "/C", 'CALL "scoop install babashka"'])
    core.info('RES' + res)

    // await exec.exec('scoop', ['install', 'babashka'])

  }


}
