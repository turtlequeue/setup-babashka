export const ToolName = 'Babashka';

export enum Inputs {
    BabashkaVersion = 'babashka-version', // Input
    BabashkaURL = 'babashka-url', // Input
    FailOnCacheMiss = 'fail-on-cache-miss', // Input for cache, restore action
    // TODO
    // ScriptInstallUrl = 'script-install-url' // override the default https://raw.githubusercontent.com/babashka/babashka/master/install
}

export enum Outputs {
    CacheHit = 'cache-hit', // Output from cache, restore action
    CachePrimaryKey = 'cache-primary-key', // Output from restore action
    CacheMatchedKey = 'cache-matched-key' // Output from restore action
}
