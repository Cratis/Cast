---
title: The directory
description: What cast.cratis.io shows, where its data comes from and how it is built.
---

The directory at [cast.cratis.io](https://cast.cratis.io) is the Cast in one place. Its source is in [`Directory/`](https://github.com/Cratis/Cast/tree/main/Directory).

## Pages

| Page | Shows |
| --- | --- |
| `/` | Everyone, grouped by tier: Core and Partner cards, then the wall of Contributors. A search box filters by name, handle, role or place. |
| `/<handle>` | The verification page for one person, with badge embed snippets. |
| `/<handle>/badge.svg`, `/<handle>/badge-card.svg` | The authoritative badges. |
| `/join` | How to get a Cast site and how each tier is earned. |
| `/members.json` | Every verified member as JSON. |

## Where the data comes from

- **The registry** in this repository decides Core and Partner. The directory reads the file directly, so a merged registry change is live on the next build.
- **GitHub** supplies public profiles (name, avatar, bio, location), and finds contributors: commit authors in the public, non-fork repositories of the Cratis organization, with bots left out. Discovery alone never makes anyone a Contributor. Each person is confirmed with a search for their merged public pull requests in the organization.
- **Members' own Cast sites**: when a registry entry has `site:`, the directory reads its `/cast.json` and shows the title and tagline from it. Nothing else is taken from member sites; in particular, never a tier.

Searches are rate-limited, so each build checks people who were never checked first, then the stalest (older than seven days), up to 40 per build plus every registry member. Set `CAST_DIRECTORY_VERIFY_LIMIT` to change the limit. People still waiting are counted on the home page and get no page until they are confirmed.

Everything is kept in `Directory/.cast/directory.json`. A build without `GITHUB_TOKEN`, with GitHub unreachable or rate-limited, keeps that file's values for whatever it could not fetch: a partial contributor discovery adds to the known list instead of replacing it, failed count checks keep their previous counts, and an unknown login in a profile batch does not drop the others. The directory never fails to build because of the network; only an invalid registry stops it.

## Building it

```sh
yarn workspace @cratis/cast build                                       # schema and bundled registry
GITHUB_TOKEN=$(gh auth token) yarn workspace @cratis/cast-directory build
```

The [Directory Pages](https://github.com/Cratis/Cast/blob/main/.github/workflows/directory-pages.yml) workflow builds and deploys it to GitHub Pages on pushes to `main` that touch `Directory/`, `Registry/` or `Source/Cast/`, every hour, and on demand. `Directory/public/CNAME` names `cast.cratis.io`.
