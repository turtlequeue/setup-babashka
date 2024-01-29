import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import fs from 'fs';
import { Inputs, Outputs } from '../src/constants';
import { _installFromUrl } from '../src/installer';

// https://github.com/actions/cache/blob/0c45773b623bea8c8e75f6c82b208c3cf94ea4f9/src/stateProvider.ts

jest.mock('@actions/core', () => ({
    ...jest.requireActual('@actions/core'),
    setOutput: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    setFailed: jest.fn()
}));

jest.mock('@actions/tool-cache', () => ({
    ...jest.requireActual('@actions/tool-cache'),
    find: jest.fn(),
    findAllVersions: jest.fn().mockReturnValue(['1.0.0', '2.0.0']),
    downloadTool: jest.fn(),
    cacheFile: jest.fn(),
    addPath: jest.fn(),
    extractTar: jest.fn(),
    extractZip: jest.fn(),
    extract7z: jest.fn(),
}));

jest.mock('os', () => ({
    ...jest.requireActual('os'),
    arch: jest.fn().mockReturnValue('x64')
}));

beforeEach(() => {
    jest.clearAllMocks();
});

jest.spyOn(fs, 'existsSync').mockReturnValue(true);
jest.spyOn(fs, 'statSync').mockReturnValue({
    size: 1024,
    isFile: () => true,
    isDirectory: () => false,
} as fs.Stats); // to satisfy TypeScript's type checking.

test('tc.downloadTool is called with the correct URL', async () => {
    const mockDownloadedFilePath = '/dummy/downloaded/path';
    const downloadToolMock = tc.downloadTool as jest.MockedFunction<typeof tc.downloadTool>;
    downloadToolMock.mockResolvedValue(mockDownloadedFilePath);

    await _installFromUrl('https://example.com/bb.tar.gz', '1.0.0');
    expect(downloadToolMock).toHaveBeenCalledWith('https://example.com/bb.tar.gz');
});
