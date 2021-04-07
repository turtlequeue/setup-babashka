import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid';
import { ok } from 'assert'
import fs from 'fs'


function _getTempDirectory(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || ''
  ok(tempDirectory, 'Expected RUNNER_TEMP to be defined')
  return tempDirectory
}

// useful for testing babashka CI snapshot builds
export async function installFromUrl(url: string, version: string): Promise<void> {

  // TODO replaces so that it matches the CI builds
  // https://github.com/babashka/babashka/blob/126d2ff7287c398e488143422c7573337cf580a0/.circleci/script/release#L18
  // https://github.com/babashka/babashka/blob/77daea7362d8e2562c89c315b1fbcefde6fa56a5/appveyor.yml#L63
  // os.arch() os.platform()

  const downloadURL = url.replace(/\${version}/, version).replace(/\${os}/, os.arch());
  const dest = "archive.tar.gz"
  const installerFile = await tc.downloadTool(downloadURL, dest);

  core.info(`Downloaded ${downloadURL} in ${installerFile}`)
  // not a folder?
  const files = fs.readdirSync(".")
  // Error: ENOTDIR: not a directory, scandir '/home/runner/work/_temp/eb0df725-c815-4dff-842a-7a4e3d6d0540'
  core.info(`Files are ${files}`)

  let folder;
  if(url.endsWith('.tar.gz')) {
    // /usr/bin/tar xz --warning=no-unknown-keyword -C . -f /home/runner/work/_temp/0c9af1c6-ed0f-48a8-9cd3-8bd20e2c234b
    // Error: sourceFile is not a file
    folder = await tc.extractTar(installerFile, '.');
  } else if (url.endsWith('.zip')){
    folder = await tc.extractZip(installerFile, '.');
  } else if (url.endsWith('.7z')){
    folder = await tc.extract7z(installerFile, '.');
  }

  if(!folder) {
    core.error(`Unsupported babashka-url ${url}`)
    core.setFailed("babashka-url format is unknown. Must me .tar.gz, .zip or .7z")
    return;
  }

  // bb should now be just here
  let executable;
  if(process.platform !== 'win32') {
     executable = 'bb';
  } else {
     executable = 'bb.exe'
  }

  const toolPath = await tc.cacheFile(
    folder,
    executable,
    'Babashka',
    os.arch())

  core.info(`toolpath ${toolPath}`)

  core.addPath(toolPath)

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
