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

## How a tier is resolved

On every build, a Cast site and the directory do the same thing:

1. Read the registry from `https://raw.githubusercontent.com/Cratis/Cast/main/Registry/members.yaml`. If it cannot be read, or does not validate, the copy bundled in the installed `@cratis/cast` package is used.
2. If the handle is in the registry, its tier is the registry's tier.
3. Otherwise, if the handle has one or more merged public pull requests in the Cratis organization, it is a Contributor.
4. Otherwise there is no tier, and no badge is shown.

Nothing in `cast.yaml` takes part. There is no tier field, and a `tier` key makes the build fail. The site's own `/badge.svg` and `/cast.json` report the tier as verified when the site was built; the directory's badge at `https://cast.cratis.io/<handle>/badge.svg` is the one to link to, because the directory rebuilds every hour from the registry in this repository.

## The badges

| Where | What |
| --- | --- |
| Navigation, hero and `/cv` header of a Cast site | The inline badge, linking to the verification page. |
| `https://cast.cratis.io/<handle>` | The verification page: tier, where it was verified from (with a link to the registry line or the pull request search), role, since, site and embed snippets. |
| `https://cast.cratis.io/<handle>/badge.svg` | The 20 px badge, for READMEs and profiles. |
| `https://cast.cratis.io/<handle>/badge-card.svg` | The large card. |
| `/badge.svg`, `/badge-card.svg` on a Cast site | The same images, as verified by that site's last build. |

Embed it in Markdown:

```md
[![Cratis Cast](https://cast.cratis.io/your-login/badge.svg)](https://cast.cratis.io/your-login)
```

The three badges are drawn to read on light and dark pages: Core in the Cratis violet-to-teal gradient, Partner in teal, Contributor in amber, each with the Cratis mark.

## Machine-readable verification

`/cast.json` on every Cast site includes a `verification` object:

```json
{
  "url": "https://cast.cratis.io/ada",
  "tier": "contributor",
  "source": "contributions",
  "verifiedAt": "2026-10-16T09:00:00.000Z",
  "registry": "live"
}
```

`source` is `registry`, `contributions` or `none`; `registry` says whether the live registry or the bundled copy was used. The directory's `/members.json` lists every verified member.
