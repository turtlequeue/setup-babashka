import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { ok } from 'assert'
import fs from 'fs'
import { ToolName, Inputs, Outputs } from './constants'


// Another approach would be to copy the logic from
// https://raw.githubusercontent.com/babashka/babashka/master/install
//
// Pros: easier
// Cons: need to keep up to date in case the script changes and so might be less reliable. One extra http call.
//
// Decision: optimize for reliability, and use the official install script
//
// TODO follow general organization of
// https://github.com/actions/cache/blob/0c45773b623bea8c8e75f6c82b208c3cf94ea4f9/src/restoreImpl.ts#L12
// https://github.com/actions/toolkit/blob/59e9d284e9f7d2bd1a24d2c2e83f19923caaac30/packages/tool-cache/__tests__/tool-cache.test.ts#L209-L224
//


// exported for tests only
export async function _downloadFile(fileURL: string): Promise<string> {
  try {
    const downloadedPath = await tc.downloadTool(fileURL)
    core.debug(`Downloaded file from ${fileURL} to ${downloadedPath}`)
    return downloadedPath
  } catch (error) {
    core.error(`Error downloading file from ${fileURL}: ${error}`)
    core.setFailed(`could not download file ${fileURL}`)
    throw error
  }
}

function _getTempDirectory(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || ''
  ok(tempDirectory, 'Expected RUNNER_TEMP to be defined')
  return tempDirectory
}

// useful for testing babashka CI snapshot builds
export async function _installFromUrl(
  url: string,
  version: string,
  failOnCacheMiss: boolean = false
): Promise<void> {
  //
  // TODO replaces so that it matches the CI builds
  // https://github.com/babashka/babashka/blob/126d2ff7287c398e488143422c7573337cf580a0/.circleci/script/release#L18
  // https://github.com/babashka/babashka/blob/77daea7362d8e2562c89c315b1fbcefde6fa56a5/appveyor.yml#L63
  // os.arch() os.platform()
  //

  // TODO allow a version like "-1" to skip caching ?
  const toolPath = tc.find(ToolName, version, os.arch())


  if (core.isDebug()) {
    const allBabashkaVersions = tc.findAllVersions(ToolName)
    core.debug(`Versions of babashka available: ${allBabashkaVersions}`)
  }

  if (toolPath) {
    core.info(`${ToolName} found in cache ${toolPath}`)
    core.setOutput(Outputs.CacheHit, 'true') // for tests
    core.addPath(toolPath);
    return;
  } else {
    core.info(`${ToolName} not found in cache`)
    const downloadedFilePath = await _downloadFile(url)
    core.setOutput(Outputs.CacheHit, 'false') // for tests


    if (failOnCacheMiss) {
      core.setFailed(`Cache miss for ${ToolName} version ${version} arch ${os.arch()} and failOnCacheMiss is true.`);
      return;
    }

    if (core.isDebug()) {
      if (fs.existsSync(downloadedFilePath)) {
        core.info(`Downloaded ${url} in ${downloadedFilePath}`)
        const stats = fs.statSync(downloadedFilePath)
        const fileSizeInBytes = stats.size
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
        core.debug(`File is ${fileSizeInMegabytes}MB, isDir:${stats.isDirectory()}, isFile:${stats.isFile()}`)
        // archive should be like ~20MB (~80MB+ decompressed) - may be an issue otherwise
      }
      else {
        core.error(`could not download file ${url}`);
        return
      }
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

    const cachedPath = await tc.cacheFile(
      executable,
      executable,
      ToolName,
      version, // semver, should end with -SNAPSHOT here
      os.arch()
    )

    core.info(`cachedPath ${cachedPath}`)
    core.info(`toolpath ${toolPath}`)
    core.addPath(cachedPath)
  }

  core.addPath(toolPath)

  return
}

// the usual way to install
export async function _installFromVersion(version: string, failOnCacheMiss: boolean = false): Promise<void> {
  let toolPath = tc.find(ToolName, version, os.arch())

  if (core.isDebug()) {
    const allBabashkaVersions = tc.findAllVersions(ToolName)
    core.debug(`Versions of babashka available: ${allBabashkaVersions}`)
  }

  if (toolPath) {
    core.info(`${ToolName} found in cache ${toolPath}`)
    core.setOutput(Outputs.CacheHit, 'true') // for tests
    core.addPath(toolPath);
    return;
  } else {
    core.info(`${ToolName} not found in cache`)
    core.setOutput(Outputs.CacheHit, 'false') // for tests

    if (failOnCacheMiss) {
      core.setFailed(`Cache miss for ${ToolName} version ${version} arch ${os.arch()} and ${Inputs.FailOnCacheMiss} is true.`);
      return;
    }

    if (process.platform !== 'win32') {
      // Linux, macOS: rely on babashka's bash installer
      const tmpPath = path.join(_getTempDirectory(), uuidv4())
      await io.mkdirP(tmpPath)

      core.info(`temporary directory ${tmpPath}`)

      const installerFile = await _downloadFile('https://raw.githubusercontent.com/babashka/babashka/master/install')
      core.info(`Downloaded installer file ${installerFile}`)

      core.startGroup('master_script');
      await exec.exec('bash', [
        installerFile,
        '--dir',
        tmpPath,
        '--version',
        version
      ])
      core.endGroup();

      core.info(`babashka installed to ${tmpPath}`)

      toolPath = await tc.cacheDir(tmpPath, ToolName, version, os.arch())
    }
    else {
      // Windows: rely on a known url and powershell extraction
      core.info(`Windows detected, setting up bb.exe`)

      await exec.exec('powershell', [
        '-command',
        `if (Test-Path('bb.exe')) { return } else { (New-Object Net.WebClient).DownloadFile('https://github.com/babashka/babashka/releases/download/v${version}/babashka-${version}-windows-amd64.zip', 'bb.zip') }`
      ])
      await exec.exec('powershell', [
        '-command',
        "if (Test-Path('bb.exe')) { return } else { Expand-Archive bb.zip . }"
      ])

      const bbExePath = path.join(process.cwd(), "bb.exe");

      core.info(`exists? bb.exe ${fs.existsSync(bbExePath)}`);
      toolPath = await tc.cacheFile(
        bbExePath,
        'bb.exe',
        ToolName,
        version,
        os.arch()
      )
    }

    core.addPath(toolPath)
    core.info(`babashka setup at ${toolPath}`)
  }
}

export async function getBabashka(
  url: string | undefined,
  version: string,
  failOnCacheMiss: boolean
): Promise<void> {
  if (url && url.length) {
    return _installFromUrl(url, version, failOnCacheMiss)
  } else {
    return _installFromVersion(version, failOnCacheMiss)
  }
}
