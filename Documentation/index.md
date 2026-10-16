---
title: Cast
description: The Cratis profile-site engine and verified people directory. One cast.yaml becomes a personal site where your career is an event stream, with a badge anyone can check.
---

Cast is the profile-site engine for people who build with Cratis, and the directory of those people at [cast.cratis.io](https://cast.cratis.io). The people are the Cast: *the people behind the play*.

You write one `cast.yaml`. Cast turns it into a static site:

- Your career is an **event stream**. Every role, organization and skill on the page is a projection, computed by folding those events in order, and visitors can replay it.
- Your **public GitHub work** shows up as it happens: a contribution heatmap, your standing in the repositories you list, and a live feed of merged pull requests.
- A **printable CV** at `/cv`, built from the same events.
- A **Cast badge** (Core, Partner or Contributor) that your site cannot claim for itself: it is verified against the reviewed [registry](https://github.com/Cratis/Cast/blob/main/Registry/members.yaml) and GitHub on every build.
- **Machine-readable profiles** at `/cast.json`, `/resume.json` ([JSON Resume](https://jsonresume.org/schema)) and `/llms.txt`, so the directory, other tools and AI agents can read you without scraping.

## The parts

| Part | What it is |
| --- | --- |
| [`@cratis/cast`](https://www.npmjs.com/package/@cratis/cast) | The Astro integration. `integrations: [cast()]` reads `cast.yaml` and adds every page. Tailwind, fonts and the sitemap come with it. |
| [`@cratis/create-cast`](https://www.npmjs.com/package/@cratis/create-cast) | `npm create @cratis/cast`: writes a new site from your public GitHub profile. |
| [Registry](https://github.com/Cratis/Cast/tree/main/Registry) | `members.yaml`: the reviewed list of Core and Partner members. |
| [Directory](https://github.com/Cratis/Cast/tree/main/Directory) | The site at [cast.cratis.io](https://cast.cratis.io): everyone in the Cast, a verification page per person, and the authoritative badges. |

## Where to go next

- [Getting started](getting-started.md): from nothing to a published site.
- [cast.yaml reference](cast-yaml.md): every field.
- [Badges and the registry](badges-and-registry.md): what the tiers mean and how they are verified.
- [The directory](directory.md): what cast.cratis.io shows and where it gets it.
- [Theming](theming.md): your accent, light and dark, and the Cratis design language.
