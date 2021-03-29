# setup-babashka

This action sets up [Babashka](https://github.com/babashka/babashka) environment for using in GitHub Actions.

# Usage

```yaml
name: Simple example of using the babashka action

on: [push]

jobs:
  simple:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Babashka
        uses: turtlequeue/setup-babashka@v1.1
        with:
          babashka-version: 0.3.0

      - name: Check bb runs
        run: bb --version
```

# Development

```
nvm use
yarn install
yarn package
```

# License
Copyright © 2021 Turtlequeue Ltd

Distributed under the EPL License. See LICENSE.
