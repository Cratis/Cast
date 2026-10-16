# Cast

**The people behind the play.** Verified, event-sourced profile sites for everyone who builds with [Cratis](https://cratis.io), and the directory of those people at [cast.cratis.io](https://cast.cratis.io).

Cratis is *software that remembers*. Cast is *careers that remember*.

## Packages / Deployables

[![NPM](https://img.shields.io/npm/v/@cratis/cast?label=@cratis/cast&logo=npm)](https://www.npmjs.com/package/@cratis/cast)
[![NPM](https://img.shields.io/npm/v/@cratis/create-cast?label=@cratis/create-cast&logo=npm)](https://www.npmjs.com/package/@cratis/create-cast)

## Builds

[![JavaScript Build](https://github.com/cratis/cast/actions/workflows/javascript-build.yml/badge.svg)](https://github.com/cratis/cast/actions/workflows/javascript-build.yml)
[![Publish](https://github.com/cratis/cast/actions/workflows/publish.yml/badge.svg)](https://github.com/cratis/cast/actions/workflows/publish.yml)
[![Directory Pages](https://github.com/cratis/cast/actions/workflows/directory-pages.yml/badge.svg)](https://github.com/cratis/cast/actions/workflows/directory-pages.yml)

## What it is

You write one `cast.yaml`. Cast builds a static personal site from it:

- your career as an **event stream** that visitors can replay, with every role, organization and skill computed as a projection;
- your **public GitHub work** as it happens: a contribution heatmap, your standing in the repositories you lead, and a live feed of merged pull requests;
- a **printable CV**, built from the same events;
- a **Cast badge** (Core, Partner or Contributor) that the site cannot claim for itself, verified against the reviewed [registry](https://github.com/Cratis/Cast/blob/main/Registry/README.md) and GitHub on every build;
- **machine-readable profiles** at `/cast.json`, `/resume.json` and `/llms.txt`.

The design is the Cratis design language: near-black and warm off-white themes, Inter, JetBrains Mono and the Fraunces italic accent, with Event Modeling's command, event and read model colors and one accent of your own.

## Start here

```sh
npm create @cratis/cast@latest my-site
cd my-site
npm install
npm run dev
```

Then fill in `cast.yaml` and push. The generated workflow publishes to GitHub Pages and rebuilds every hour.

- [Getting started](https://github.com/Cratis/Cast/blob/main/Documentation/getting-started.md)
- [cast.yaml reference](https://github.com/Cratis/Cast/blob/main/Documentation/cast-yaml.md)
- [Badges and the registry](https://github.com/Cratis/Cast/blob/main/Documentation/badges-and-registry.md)
- [The directory](https://github.com/Cratis/Cast/blob/main/Documentation/directory.md)
- [Theming](https://github.com/Cratis/Cast/blob/main/Documentation/theming.md)
- [Vision and roadmap](https://github.com/Cratis/Cast/blob/main/Documentation/vision.md)

## In this repository

| Folder | Contents |
| --- | --- |
| [`Source/Cast`](https://github.com/Cratis/Cast/tree/main/Source/Cast) | `@cratis/cast`, the Astro integration. |
| [`Source/CreateCast`](https://github.com/Cratis/Cast/tree/main/Source/CreateCast) | `@cratis/create-cast`, the scaffolder behind `npm create @cratis/cast`. |
| [`Registry`](https://github.com/Cratis/Cast/tree/main/Registry) | `members.yaml`, the reviewed Core and Partner list, and how to join. |
| [`Directory`](https://github.com/Cratis/Cast/tree/main/Directory) | The cast.cratis.io site. |
| [`Samples/woksin`](https://github.com/Cratis/Cast/tree/main/Samples/woksin) | A complete site using every section. |
| [`Documentation`](https://github.com/Cratis/Cast/tree/main/Documentation) | Product documentation. |

## Develop

Requires Node.js 23 or newer. The repository uses Yarn 4 workspaces.

```sh
yarn install
yarn ci                                              # clean, lint, build and test every workspace
yarn workspace @cratis/cast-sample-woksin dev        # the sample site
yarn workspace @cratis/cast-directory dev            # the directory
```

Builds read public GitHub data when `GITHUB_TOKEN` or `GH_TOKEN` is set (`GITHUB_TOKEN=$(gh auth token)`), and fall back to the committed snapshots otherwise.

## License

[MIT](https://github.com/Cratis/Cast/blob/main/LICENSE)
