---
title: Badges and the registry
description: The Core, Partner and Contributor tiers, how each is verified, and why a site cannot claim one.
---

Every Cast member can carry a badge. A badge says one thing: what the person's relationship to Cratis is, as checked by a build. It is not a certification.

## The tiers

| Tier | Who | Verified from |
| --- | --- | --- |
| **Core** | Founders and maintainers of Cratis. | A line in [`Registry/members.yaml`](https://github.com/Cratis/Cast/blob/main/Registry/members.yaml), added by Cratis. |
| **Partner** | Consultants and companies Cratis vouches for. | A line in the same file, added through a reviewed pull request. |
| **Contributor** | Anyone with at least one merged pull request in a public repository in the Cratis organization. | GitHub, counted at build time. |

How to join, and the removal policy, are in the [registry README](https://github.com/Cratis/Cast/blob/main/Registry/README.md).

## One identity

Your Cast identity is your GitHub login: `person.handle` in `cast.yaml`. If you also set `github.login`, it must be the same login (case does not matter), or the build stops. The registry lookup, the Contributor count, the badge, `/cast.json` and your verification page all use that one login.

## Who decides

**A Cast site is static and controlled by its owner. The directory is the source of truth.**

Anyone can edit their own site's files, including `.cast/snapshot.json`, so what a site shows is a *claim*. Every badge on a site links to `https://cast.cratis.io/<login>`, which Cratis builds from the registry in this repository and live GitHub data, every hour. That page, and the badge images it serves, are what to trust and what to link to. The directory never reads tiers from member sites: from a member's `/cast.json` it takes only the title and tagline it displays.

## How a site resolves its claim

On every build, a Cast site:

1. Reads the registry from `https://raw.githubusercontent.com/Cratis/Cast/main/Registry/members.yaml`. If it cannot be read, or does not validate, the copy bundled in the installed `@cratis/cast` package is used.
2. If the login is in the registry, the claim is the registry's tier.
3. Otherwise, if the search for that login's merged public pull requests in the Cratis organization succeeded during this build and found one or more, the claim is Contributor. That count is used for the claim and never saved. Numbers from `.cast/snapshot.json` never set a tier (when the search fails, the snapshot's count is still shown, but not used), and a snapshot captured for another login is ignored entirely.
4. Otherwise there is no claim, and no badge is shown.

Nothing written in `cast.yaml` takes part. There is no tier field, and a `tier` key makes the build fail.

The directory resolves tiers the same way for everyone it lists, with its own GitHub token and the registry in this repository.

## The badges

| Where | What |
| --- | --- |
| Navigation, hero and `/cv` header of a Cast site | The inline badge: the site's claim, labeled "verify at cast.cratis.io" and linking to the verification page. |
| `https://cast.cratis.io/<handle>` | The verification page: tier, where it was verified from (with a link to the registry line or the pull request search), role, since, site and embed snippets. |
| `https://cast.cratis.io/<handle>/badge.svg` | The 20 px badge, for READMEs and profiles. |
| `https://cast.cratis.io/<handle>/badge-card.svg` | The large card. |
| `/badge.svg`, `/badge-card.svg` on a Cast site | The same images for the site's own claim. Link to the directory's instead. |

Embed it in Markdown:

```md
[![Cratis Cast](https://cast.cratis.io/your-login/badge.svg)](https://cast.cratis.io/your-login)
```

The three badges are drawn to read on light and dark pages: Core in the Cratis violet-to-teal gradient, Partner in teal, Contributor in amber, each with the Cratis mark.

## Machine-readable claims

`/cast.json` on every Cast site includes a `verification` object with the site's claim and where to check it:

```json
{
  "url": "https://cast.cratis.io/ada",
  "claimedTier": "contributor",
  "source": "contributions",
  "claimedAt": "2026-10-16T09:00:00.000Z",
  "registry": "live",
  "note": "Claimed by this site when it was built. The directory page at url is the source of truth."
}
```

`source` is `registry`, `contributions` or `none`; `registry` says whether the live registry or the bundled copy was used. The directory's `/members.json` lists every member as the directory verified them.
