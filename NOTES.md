# notes for myself

# Development

```bash
nvm use
yarn install
yarn package
```

# Test in CI

```bash
git addm
git cia --no-edit
yarn package && git addm && git cia --no-edit &&  git push -f
```

# Push a release

```bash
yarn package && git addm && git cia --no-edit &&  git tag -a -f -m "CI builds from url" v1.3.0 && git push -f --follow-tags
```
