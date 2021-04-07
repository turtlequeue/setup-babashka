# notes for myself

Handy shortcut to test in CI
```
git addm
git cia --no-edit
yarn package && git addm && git cia --no-edit &&  git push -f
```

Push a release:
yarn package && git addm && git cia --no-edit &&  git tag -a -f -m "CI builds from url" v1.3.0 && git push -f --follow-tags
