# Sample: www.woksin.com on Cast

Sindre Wilting's profile site, ported from [woksin/woksin.github.io](https://github.com/woksin/woksin.github.io) to a single [`cast.yaml`](cast.yaml). It uses every Cast section and is the end-to-end check for the engine in this repository: it builds against the workspace copy of `@cratis/cast`.

```sh
yarn install
yarn workspace @cratis/cast-sample-woksin build     # static site in dist/
yarn workspace @cratis/cast-sample-woksin dev       # http://localhost:4321
```

Without `GITHUB_TOKEN` or `GH_TOKEN` the build uses the committed [`.cast/snapshot.json`](.cast/snapshot.json). With a token (`GITHUB_TOKEN=$(gh auth token)`), it captures fresh public numbers and updates the snapshot.
