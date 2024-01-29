import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import { _downloadFile, _installFromUrl } from '../src/installer'
import { Inputs, Outputs } from '../src/constants'

// https://github.com/actions/checkout/blob/master/__test__/input-helper.test.ts

jest.mock('@actions/core', () => ({
    ...jest.requireActual('@actions/core'),
    debug: jest.fn(),
    error: jest.fn(),
    setFailed: jest.fn()
}));

jest.mock('@actions/tool-cache', () => ({
    ...jest.requireActual('@actions/tool-cache'),
    downloadTool: jest.fn(),
    find: jest.fn(),
}));

beforeEach(() => {
    jest.resetAllMocks();
});

afterEach(() => {
    jest.resetAllMocks();
});

describe('_downloadFile impl test', () => {

    test('_downloadFile should download a file from the given URL', async () => {
        const mockDownloadedPath = '/dummy/downloaded/path';
        (tc.downloadTool as jest.MockedFunction<typeof tc.downloadTool>).mockResolvedValue(mockDownloadedPath);

        const fileURL = 'https://example.com/example-file.txt';
        const downloadedPath = await _downloadFile(fileURL);

        expect(tc.downloadTool).toHaveBeenCalledWith(fileURL);
        expect(downloadedPath).toBe(mockDownloadedPath);
        expect(core.debug).toHaveBeenCalledWith(`Downloaded file from ${fileURL} to ${mockDownloadedPath}`);
    });

    test('downloadFile should throw an error when downloading fails', async () => {
        const fileURL = 'https://example.com/non-existent-file.txt';
        (tc.downloadTool as jest.MockedFunction<typeof tc.downloadTool>).mockRejectedValue(new Error('Download failed'));

        await expect(_downloadFile(fileURL)).rejects.toThrow(new Error('Download failed'));
        expect(core.error).toHaveBeenCalledWith(`Error downloading file from ${fileURL}: Error: Download failed`);
    });

})

describe('FailOnCacheMiss behavior', () => {
    test('should fail action on cache miss when FailOnCacheMiss is true', async () => {
        (tc.find as jest.MockedFunction<typeof tc.find>).mockReturnValue(''); // Simulate cache miss
        const setFailedMock = core.setFailed as jest.MockedFunction<typeof core.setFailed>;

        await _installFromUrl('https://example.com/bb.tar.gz', '1.0.0', true);

        expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('Cache miss for Babashka version 1.0.0'));
    });
});
