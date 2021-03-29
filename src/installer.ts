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

  if (allBabashkaVersions.length != 0) {
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

    const installerFile = await tc.downloadTool("https://raw.githubusercontent.com/babashka/babashka/master/install")
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
    core.info(`Windows detected, setting up babashka using scoop`)

    await exec.exec('powershell', ['-command', "Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://get.scoop.sh')", ';',
                                   'scoop', 'bucket', 'add', 'scoop-clojure', 'https://github.com/littleli/scoop-clojure', ';',
                                   'scoop', 'bucket', 'add', 'extras', ';',
                                   'scoop', 'install', 'babashka', '--independent', ';',
                                   'scoop', 'help', ';',
                                   'scoop', 'info', 'babashka', ';']);
    // TODO exact version ?
    await exec.exec('echo', ['$HOME\\scoop\\shims', '|', 'Out-File', '-FilePath', '$env:GITHUB_PATH', '-Encoding', 'utf-8', '-Append'])

    // https://github.com/littleli/scoop-clojure/blob/f44b1696884a41f92c5dc85381eea4f5e01824b8/bucket/babashka.json#L13
    // https://github.com/lukesampson/scoop/issues/3951#issuecomment-786858678
    // Checking hash of babashka-0.3.0-windows-amd64.zip ... ok.
    //   Extracting babashka-0.3.0-windows-amd64.zip ... done.
    //   Linking ~\scoop\apps\babashka\current => ~\scoop\apps\babashka\0.3.0
    // Creating shim for 'bb'.
    //   'babashka' (0.3.0) was installed successfully!
    // C:\mysql-5.7.21-winx64\bin\echo.exe $HOME\scoop\shims | Out-File -FilePath $env:GITHUB_PATH -Encoding utf-8 -Append
    // $HOME\scoop\shims | Out-File -FilePath $env:GITHUB_PATH -Encoding utf-8 -Append
    // toolPath = await tc.cacheDir(
    //   '~\\scoop\\shims\\',
    //   'Babashka',
    //   version,
    //   os.arch())

    core.info(`babashka setup at ${toolPath}`)

    core.addPath(toolPath)

    core.info(`final step`)
  }


}
