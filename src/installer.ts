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

// useful for testing babashka CI snapshot builds
export async function installFromUrl(url: string, version: string): Promise<void> {

  const finalUrl = url.replace(/\${version}/, version).replace(/\${os}/, os.arch());
  core.info(`Final URL: ${finalUrl}`)
  // TODO rename some so it matches?
  // https://github.com/babashka/babashka/blob/126d2ff7287c398e488143422c7573337cf580a0/.circleci/script/release#L18
  // https://github.com/babashka/babashka/blob/77daea7362d8e2562c89c315b1fbcefde6fa56a5/appveyor.yml#L63
  //
  // os.arch()
  // 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'
  //
  // os.platform()
  //
  //
  const toolPath = await tc.cacheFile(
    'bb',
    finalUrl,
    'Babashka',
    version,
    os.arch())

  core.info(`toolpath ${toolPath}`)

  return;
}

// the usual way to install
export async function installFromVersion(version: string): Promise<void>  {

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

export async function getBabashka(url: string|undefined, version: string): Promise<void> {
  if(url && url.length) {
    return installFromUrl(url, version);
  } else {
    return installFromVersion(version);
  }
}
