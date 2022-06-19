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
        uses: turtlequeue/setup-babashka@v1.3.0
        with:
          babashka-version: 0.8.156

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


# Use a CI version

You probably don't want to do that.
Using a CI build of babashka is possible. They can be found on the babashka CI build artefacts or on [appveyor](https://ci.appveyor.com/project/borkdude/babashka) for windows builds.

Keep in mind that:
- the CI builds from babashka will expire
- the platform detection is up to you

```yaml
name: install babashka

on: [push]

jobs:
  simple:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Babashka
        uses: turtlequeue/setup-babashka@v1.3.0
        with:
          # this will eventually expire
          babashka-version: 0.8.157-SNAPSHOT
          babashka-url: https://29579-201467090-gh.circle-artifacts.com/0/release/babashka-0.8.157-SNAPSHOT-linux-amd64-static.tar.gz

      - name: Check bb runs
        run: bb --version
```

# License
Copyright © 2022 Turtlequeue Ltd

Distributed under the EPL License. See LICENSE.
