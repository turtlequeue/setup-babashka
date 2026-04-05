# notes for myself

# Use a CI version

You probably don't want to do that.
Using a CI build of babashka is possible. They can be found on the [babashka GitHub releases](https://github.com/babashka/babashka/releases) page (for stable builds) or as GitHub Actions artifacts on the babashka repo (expire after 90 days).

Keep in mind that:
- the CI builds from babashka will expire
- the platform detection is up to you

```yaml
- name: Setup Babashka
  uses: turtlequeue/setup-babashka@v1.7.0
  with:
    # this will eventually expire
    babashka-version: 0.8.157-SNAPSHOT
    babashka-url: https://29579-201467090-gh.circle-artifacts.com/0/release/babashka-0.8.157-SNAPSHOT-linux-amd64-static.tar.gz
```

# Development

```bash
nvm use
yarn install
yarn package
nodemon -e ts --exec yarn test
```

# Test in CI

```bash
git addm
git cia --no-edit
yarn package && git addm && git cia --no-edit &&  git push -f
```

# Push a release

```bash
yarn package && git addm && git cia --no-edit &&  git tag -a -f -m "bump JS deps" v1.4.0 && git push -f --follow-tags
```
