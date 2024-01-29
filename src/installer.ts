import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import {v4 as uuidv4} from 'uuid'
import {ok} from 'assert'
import fs from 'fs'

async function downloadFile(fileURL: string): Promise<string> {
  try {
    const downloadedPath = await tc.downloadTool(fileURL)
    core.debug(`Downloaded file from ${fileURL} to ${downloadedPath}`)
    return downloadedPath
  } catch (error) {
    core.error(`Error downloading file from ${fileURL}: ${error}`)
    throw error
  }
}

function _getTempDirectory(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || ''
  ok(tempDirectory, 'Expected RUNNER_TEMP to be defined')
  return tempDirectory
}

// useful for testing babashka CI snapshot builds
export async function installFromUrl(
  url: string,
  version: string
): Promise<void> {
  //
  // TODO replaces so that it matches the CI builds
  // https://github.com/babashka/babashka/blob/126d2ff7287c398e488143422c7573337cf580a0/.circleci/script/release#L18
  // https://github.com/babashka/babashka/blob/77daea7362d8e2562c89c315b1fbcefde6fa56a5/appveyor.yml#L63
  // os.arch() os.platform()
  //

  // TODO allow a version like "-1" to skip caching ?
  let toolPath = tc.find('Babashka', version, os.arch())

  if (toolPath) {
    core.info(`Babashka found in cache ${toolPath}`)
    core.setOutput('cache-hit', 'true') // for tests
  } else {
    const downloadedFilePath = await downloadFile(url)
    core.setOutput('cache-hit', 'false') // for tests

    if (fs.existsSync(downloadedFilePath)) {
      core.info(`Downloaded ${url} in ${downloadedFilePath}`)
      const stats = fs.statSync(downloadedFilePath)
      const fileSizeInBytes = stats.size
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
      core.debug(
        `File is ${fileSizeInMegabytes}MB, isDir:${stats.isDirectory()}, isFile:${stats.isFile()}`
      )
      // archive should be like ~20MB (~80MB+ decompressed) - may be an issue otherwise
    } else {
      core.setFailed(`could not download file ${url}`)
      return
    }

    let folder
    if (url.endsWith('.tar.gz')) {
      folder = await tc.extractTar(downloadedFilePath, '.')
    } else if (url.endsWith('.zip')) {
      folder = await tc.extractZip(downloadedFilePath, '.')
    } else if (url.endsWith('.7z')) {
      folder = await tc.extract7z(downloadedFilePath, '.')
    }

    if (!folder) {
      core.error(`Unsupported babashka-url ${url}`)
      core.setFailed('babashka-url format is unknown. Must me .tar.gz, .zip or .7z')
      return
    } else {
      const stats = fs.statSync(folder)
      const fileSizeInBytes = stats.size
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
      core.debug(`Extracted folder ${folder} is ${fileSizeInMegabytes}MB, isDir:${stats.isDirectory()}, isFile:${stats.isFile()}`)
      const extractedFiles = fs.readdirSync(folder)
      core.debug(`Extracted files are ${extractedFiles}`)
    }

    // bb should now be just here
    let executable
    if (process.platform !== 'win32') {
      executable = 'bb'
    } else {
      executable = 'bb.exe'
    }

    toolPath = await tc.cacheFile(
      executable,
      executable,
      'Babashka',
      version, // semver, should end with -SNAPSHOT here
      os.arch()
    )

    core.info(`toolpath ${toolPath}`)
  }

  core.addPath(toolPath)

  return
}

// the usual way to install
export async function installFromVersion(version: string): Promise<void> {
  const allBabashkaVersions = tc.findAllVersions('Babashka')
  let toolPath = tc.find('Babashka', version, os.arch())

  core.debug(`Versions of babashka available: ${allBabashkaVersions}`)

  if (toolPath) {
    core.info(`Babashka found in cache ${toolPath}`)
    core.setOutput('cache-hit', 'true') // for tests
  } else {
    core.info(`Babashka not found in cache ${toolPath}`)
    core.setOutput('cache-hit', 'false') // for tests
  }

  if (process.platform !== 'win32') {
    // Linux, osx
    // rely on babashka's installer
    const tmpPath = path.join(_getTempDirectory(), uuidv4())
    await io.mkdirP(tmpPath)

    core.debug(`temporary directory ${tmpPath}`)

    const installerFile = await tc.downloadTool(
      'https://raw.githubusercontent.com/babashka/babashka/master/install'
    )
    core.info(`Downloaded installer file ${installerFile}`)

    await exec.exec('bash', [
      installerFile,
      '--dir',
      tmpPath,
      '--version',
      version
    ])

    core.info(`babashka installed to ${tmpPath}`)

    toolPath = await tc.cacheDir(tmpPath, 'Babashka', version, os.arch())
  } else {
    core.info(`Windows detected, setting up bb.exe`)

    await exec.exec('powershell', [
      '-command',
      `if (Test-Path('bb.exe')) { return } else { (New-Object Net.WebClient).DownloadFile('https://github.com/babashka/babashka/releases/download/v${version}/babashka-${version}-windows-amd64.zip', 'bb.zip') }`
    ])
    await exec.exec('powershell', [
      '-command',
      "if (Test-Path('bb.exe')) { return } else { Expand-Archive bb.zip . }"
    ])

    toolPath = await tc.cacheFile(
      'bb.exe',
      'bb.exe',
      'Babashka',
      version,
      os.arch()
    )
  }

  core.addPath(toolPath)
  core.info(`babashka setup at ${toolPath}`)
}

export async function getBabashka(
  url: string | undefined,
  version: string
): Promise<void> {
  if (url && url.length) {
    return installFromUrl(url, version)
  } else {
    return installFromVersion(version)
  }
}
