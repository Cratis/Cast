---
title: Cast
description: The Cratis profile-site engine and verified people directory. One cast.yaml becomes a personal site where your career is an event stream, with a badge anyone can check.
---

Cast turns one `cast.yaml` into a personal profile site for someone who builds with Cratis. You describe yourself and your work; Cast renders the profile, a printable CV at `/cv`, and machine-readable profiles at `/cast.json`, `/resume.json` ([JSON Resume](https://jsonresume.org/schema)) and `/llms.txt`.

Your career is an **event stream**: roles, organizations and skills are projections of the events you write, and visitors can replay them. Alongside that story, Cast can show your public GitHub work through a contribution heatmap, your standing in the repositories you list, and a feed of merged pull requests. You choose which content to include and how to present it.

The directory at [cast.cratis.io](https://cast.cratis.io) brings the people together: the Cast, *the people behind the play*. It is also where a visitor checks a **Cast badge**. Core and Partner come from the reviewed [registry](https://github.com/Cratis/Cast/blob/main/Registry/members.yaml); Contributor comes from verified merged public pull requests. Your site's badge is a claim resolved on each build and linked to the directory for verification. Publishing a profile does not grant a tier.

## The parts

| Part | What it is |
| --- | --- |
| [`@cratis/cast`](https://www.npmjs.com/package/@cratis/cast) | The Astro integration. `integrations: [cast()]` reads `cast.yaml` and adds every page. Tailwind, fonts and the sitemap come with it. |
| [`@cratis/create-cast`](https://www.npmjs.com/package/@cratis/create-cast) | `npm create @cratis/cast`: writes a new site from your public GitHub profile. |
| [Registry](https://github.com/Cratis/Cast/tree/main/Registry) | `members.yaml`: the reviewed list of Core and Partner members. |
| [Directory](https://github.com/Cratis/Cast/tree/main/Directory) | The site at [cast.cratis.io](https://cast.cratis.io): everyone in the Cast, a verification page per person, and the authoritative badges. |

## Where to go next

Choose the path that fits the site you want to publish:

- **Start a new site:** [Getting started](getting-started.md) takes you from the scaffold to a profile you can preview, edit and publish.
- **Keep an existing Astro project:** [add Cast to it](getting-started.md#add-cast-to-an-existing-astro-site), after preparing `cast.yaml` and making room for the routes Cast supplies.
- **Keep your own publisher:** produce [cast.json](cast-json.md) from your data. The directory imports full profiles only for reviewed Core and Partner members; the format itself is open to any publisher.

Once you have a profile, use the [cast.yaml reference](cast-yaml.md) to add content and [Theming](theming.md) to choose your accent and light or dark appearance within the Cratis design language. [The directory](directory.md) explains what gets listed and how profile updates reach it; [Badges and the registry](badges-and-registry.md) explains the tiers and what a visitor can verify.
