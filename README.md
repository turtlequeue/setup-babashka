# setup-babashka

This action sets up Babashka environment for using in GitHub Actions.

# Usage

```yaml
name: Simple example of using the babashka action

on: [push]

jobs:
  simple:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Babashka
        uses: turtlequeue/setup-babashka@master
        with:
          babashka-version: 0.2.3

      - name: Check bb runs
        run: bb --version
```

# Development

```
nvm use
yarn install
yarn package
```

```
git addm
git cia --no-edit
yarn package && git addm && git cia --no-edit &&  git push -f
```

# License
Copyright © 2020 Turtlequeue Ltd

Distributed under the EPL License. See LICENSE.
