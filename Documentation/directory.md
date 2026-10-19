---
title: The directory
description: What cast.cratis.io shows, where its data comes from and how it is built.
---

The directory at [cast.cratis.io](https://cast.cratis.io) is the Cast in one place. Its source is in [`Directory/`](https://github.com/Cratis/Cast/tree/main/Directory).

## Pages

| Page | Shows |
| --- | --- |
| `/` | Everyone, grouped by tier: Core and Partner cards, then the wall of Contributors. A search box filters by name, handle, role or place. |
| `/<handle>/` | The person's full Cast profile with the directory's verification near the top. See [Member pages](#member-pages). |
| `/<handle>/cv/` | Their printable CV, from the same data. |
| `/<handle>/badge.svg`, `/<handle>/badge-card.svg` | The authoritative badges. |
| `/join` | How to get a Cast site and how each tier is earned. |
| `/members.json` | Every verified member as JSON. |

## Where the data comes from

- **The registry** in this repository decides Core and Partner. The directory reads the file directly, so a merged registry change is live on the next build.
- **GitHub** supplies public profiles (name, avatar, bio, location), and finds contributors: commit authors in the public, non-fork repositories of the Cratis organization, with bots left out. Discovery alone never makes anyone a Contributor. Each person is confirmed with a search for their merged public pull requests in the organization.
- **Members' cast.json**: for a registry entry with `profile:` or `site:`, the directory reads the member's [cast.json](cast-json.md) and renders their full profile from it, and shows its title and tagline on their card. Never a tier.

Each build with a token also captures every person's contribution calendar and latest merged pull requests (one GraphQL query and one search each, up to 60 people per build; set `CAST_DIRECTORY_GITHUB_LIMIT` to change it), except members whose `cast.json` carries its own.

Searches are rate-limited, so each build checks people who were never checked first, then the stalest (older than seven days), up to 40 per build plus every registry member. Set `CAST_DIRECTORY_VERIFY_LIMIT` to change the limit. People still waiting are counted on the home page and get no page until they are confirmed.

Everything is kept in `Directory/.cast/directory.json`. A build without `GITHUB_TOKEN`, with GitHub unreachable or rate-limited, keeps that file's values for whatever it could not fetch: a partial contributor discovery adds to the known list instead of replacing it, failed count checks keep their previous counts, and an unknown login in a profile batch does not drop the others. The directory never fails to build because of the network; only an invalid registry stops it.

## Member pages

Every person with a page gets a full Cast profile at `/<handle>/`, in the Cratis Cast design, with everything a Cast site has: the hero with the event-model board, the sections their data fills (Now, stats, the career replay, Cratis, projects, writing, talks, agentic, skills, the contribution heatmap and live pull request feed, contact), the terminal (`` ` ``), the command palette (⌘K or Ctrl+K), light and dark themes and a printable CV at `/<handle>/cv/`.

The directory adds what only it can say:

- **Verification**, right after the hero: the tier from the registry or from verified merged pull requests, since when, the role, a link to the registry line, and the badge embed snippets.
- **The badge in the navigation reads as verified**, because the directory is the authority. On a member's own site the same badge is a claim that links here.
- **Provenance**: "This profile is from ada.example, rendered by Cratis Cast", or "built from public GitHub data", with a link to their own site.
- **The way back**: the Cratis Cast mark in the navigation, "Back to the Cast" above the verification, and the directory links in the footer.

### Where a page's content comes from

| Who | Content |
| --- | --- |
| Core or Partner with a usable `cast.json` | Their full profile from it. The contribution calendar and pull request feed come from its `profile.github`, or from the directory's own GitHub data when it has none. |
| Core or Partner without one, or whose file cannot be used | A GitHub-only profile. |
| Verified Contributor | A GitHub-only profile, always. The directory never renders content from a site it has not reviewed. |

A GitHub-only profile shows the public GitHub name, avatar, bio and location, the merged pull requests and commits in the Cratis organization, their rank among the human committers of their top public Cratis repositories, the contribution calendar and the merged pull request feed. Every sentence on it is a fact the directory checked.

In the browser, a member page refreshes that member's merged pull requests and public events from GitHub, the same way a Cast site does, cached per member for five minutes. The page works the same without it.

### Reading cast.json

The directory reads a member's `cast.json` from the registry's `profile:` URL, else from `<site>/cast.json`, over https only, at most 1 MB and within 10 seconds. The rules for identity, tiers, links and text are in the [cast.json reference](cast-json.md#how-the-directory-reads-it). A good copy is kept in `Directory/.cast/cache/profiles/` and used when the next fetch fails. The cache, together with per-person GitHub captures in `Directory/.cast/cache/github/`, is never committed, so a fresh checkout without a token shows GitHub-only profiles without a contribution calendar until a build with a token has run.

### Safety

Member data is shown as text. Inline markup is parsed into elements rather than inserted as HTML, links must be `http(s)` (and `mailto:` for email), links from member data carry `rel="noopener nofollow ugc"`, and the data the browser scripts read is embedded as HTML-safe JSON. The terminal and the command palette work only on that parsed data.

### Trying a profile locally

To render a `cast.json` that is not public yet, point the directory at it with a development override. Set `CAST_DIRECTORY_PROFILE_OVERRIDE_<login>` to a site or a `cast.json` URL; plain `http` is accepted only for `localhost`. For example, with the sample site:

```sh
yarn workspace @cratis/cast-sample-woksin build
yarn workspace @cratis/cast-sample-woksin preview --port 4411
CAST_DIRECTORY_PROFILE_OVERRIDE_woksin=http://localhost:4411 yarn workspace @cratis/cast-directory build
yarn workspace @cratis/cast-directory preview
```

The override is for local builds only; never set it in CI. Logins with `-` use `_` in the variable name.

## Building it

```sh
yarn workspace @cratis/cast build                                       # schema and bundled registry
GITHUB_TOKEN=$(gh auth token) yarn workspace @cratis/cast-directory build
```

The [Directory Pages](https://github.com/Cratis/Cast/blob/main/.github/workflows/directory-pages.yml) workflow builds and deploys it to GitHub Pages on pushes to `main` that touch `Directory/`, `Registry/` or `Source/Cast/`, every six hours, and on demand. `Directory/public/CNAME` names `cast.cratis.io`.
