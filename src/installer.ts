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
  } else {
    core.info(`Windows detected, setting up bb.exe`)

    await exec.exec('powershell', ['-command', `if (Test-Path('bb.exe')) { return } else { (New-Object Net.WebClient).DownloadFile('https://github.com/babashka/babashka/releases/download/v${version}/babashka-${version}-windows-amd64.zip', 'bb.zip') }`]);
    await exec.exec('powershell', ['-command', "if (Test-Path('bb.exe')) { return } else { Expand-Archive bb.zip . }"]);

    toolPath = await tc.cacheFile(
      'bb.exe',
      'bb.exe',
      'Babashka',
      version,
      os.arch())
  }

  core.info(`babashka setup at ${toolPath}`)

  core.addPath(toolPath)

}
