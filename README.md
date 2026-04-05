# setup-babashka

This action sets up [Babashka](https://github.com/babashka/babashka) environment for using in GitHub Actions.
So you can use a clojure interpreter in your CI environment.

# Usage

```yaml
name: Simple example of using the babashka action

on: [push]

jobs:
  simple:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Babashka
        uses: turtlequeue/setup-babashka@v1.7.0
        with:
          babashka-version: 1.3.189

      - name: Check bb runs
        run: bb --version
```

# Rationale

You may be using this already:
``` shell
$ bash < <(curl -s https://raw.githubusercontent.com/babashka/babashka/master/install)
```

That's great! And this is what this action uses under the hood.

However this action is useful still for:

- supporting more platforms (windows)
- pinning the babashka version
- using the github api to cache between runs
- (advanced) using a CI build by specifying a `babashka-url` (see below)


# License
Copyright © 2022-2024 Turtlequeue Ltd

# Contributors

* [Johan Lindbergh](https://github.com/jlindbergh)
* [Nick Pellegrino](https://github.com/nickpell)

Distributed under the EPL License. See LICENSE.
