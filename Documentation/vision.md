---
title: Vision
description: Why Cast exists, what it is, how it earns trust, and where it is going.
---

**Cast is how the people who build with Cratis show their work, and how Cratis shows its people.** A person maintains a profile site from one file; the directory brings Core, Partner and Contributor profiles together with verification of their relationship to Cratis.

> Cratis: *Software that remembers.*
> Cast: *Careers that remember.*

## Why

A profile needs room for both a person's account of their work and the work a visitor can inspect. Cast puts career history, projects and writing alongside public GitHub activity. The directory gives that visitor a place to check the person's relationship to Cratis, without treating a badge as proof of every skill on the page.

Keeping the career as events also makes the profile a demonstration of event sourcing. A visitor can watch roles, organizations and skills rebuild from the history, then read a CV produced from the same events. The owner maintains that history rather than separate accounts for each view.

The directory connects those individual sites. Someone following a badge can check what earned it, find the person's work in Cratis projects, and browse others in the Cast.

## What it is

| Piece | What it does |
| --- | --- |
| `@cratis/cast` | The Astro integration that renders `cast.yaml` as a profile site and printable `/cv`, with career replay and public GitHub data. |
| `npm create @cratis/cast` | Give it a GitHub handle and it prefills the profile and writes the deploy workflow, with an hourly refresh, for GitHub Pages. |
| The registry | `Registry/members.yaml`, the source of truth for Core and Partner. Changed only through reviewed pull requests. |
| Badges | The link from a site's claim to directory verification: Core (violet to teal, with the Cratis mark), Partner (teal), Contributor (amber, earned automatically). |
| The directory | [cast.cratis.io](https://cast.cratis.io): profiles, verification and badge embeds for registry members and verified Contributors. |
| An open profile format | Every site publishes `/cast.json`, `/resume.json` (JSON Resume) and `/llms.txt`. People, the directory and AI agents read the same data. |

## How it looks and feels

**A visitor**, say someone checking out a consultant:

1. They land on the consultant's site. A live Event Modeling board drifts behind the headline, and the navigation shows the Cast badge.
2. A "where the stream is now" read model shows what the person does today.
3. They press play. The career replays event by event, and the role, organizations and skills rebuild as it goes.
4. They inspect public GitHub work: merged pull requests, contributions and releases, alongside the history the owner wrote.
5. They click the badge, reach the person's page on cast.cratis.io, and see what verified it and since when, with a link to the registry entry.
6. They print `/cv` and get a clean CV generated from the same data.

**A member** runs `npm create @cratis/cast`, edits one YAML file with completion in the editor, and pushes. Engine updates arrive as a version bump; a custom domain is one line. The badge goes in their GitHub README, email signature and profiles.

**Cratis** reviews a pull request to add a Partner. A merged registry change triggers the directory workflow; the person's site reads the change when it next builds, hourly with the scaffolded workflow.

To build your own profile, start with [Getting started](getting-started.md). The [directory guide](directory.md) explains which content it imports and how it presents verification.

## Trust

- **No self-assertion.** `cast.yaml` has no tier field. Tiers are resolved at build time from the registry (Core and Partner) or from GitHub (Contributor).
- **Verifiable everywhere.** Every badge links to a directory page, which links to the registry line and its pull request history.
- **Public data only.** Private repositories are filtered out at every step.
- **Opt-in and removable.** Partners join through a pull request and can leave the same way. Cratis can remove a listing, under a written [removal policy](https://github.com/Cratis/Cast/blob/main/Registry/README.md).
- **Honest by design.** No invented metrics, testimonials or clients. Not everyone who asks becomes a Partner.

## Roadmap

These phases describe the intended progression, not a list of capabilities already available. Each linked issue defines the work for that phase.

### Phase 0: Foundation ([Cratis/Cast#1](https://github.com/Cratis/Cast/issues/1))

The engine, the scaffolder, the registry and badges, the directory, a full sample profile, documentation and workflows. Done when the first release is on npm, the directory is live at cast.cratis.io and the first member site runs on the engine.

### Phase 1: Launch ([Cratis/Cast#2](https://github.com/Cratis/Cast/issues/2))

- The rest of the Core team and the first Partners, each with their consent.
- Links to the directory from cratis.no and from blog.cratis.io author pages.
- A launch post, "Careers that remember", showing a career replay.
- The badge in the founders' GitHub profiles.

### Phase 2: Network ([Cratis/Cast#3](https://github.com/Cratis/Cast/issues/3))

- **Case studies**, opt-in and approved by the client: a profile section modeled as events (problem, model, slices, outcome), optionally with a Screenplay excerpt. The approval is recorded in the registry.
- **Verified skills** earned from evidence, such as merged pull requests in Chronicle, instead of self-declared tags.
- **A talks and writing feed** across all members on the directory.
- **A partner page** on cratis.no describing what Cratis expects of Partners and how to apply. Cast renders it; the founders write it.
- **Engine improvements:** more section types, profiles in more than one language, more themes, and per-person social images.

### Phase 3: Run the Cast on Cratis ([Cratis/Cast#4](https://github.com/Cratis/Cast/issues/4))

- **The directory on Chronicle and Arc.** Registry changes, contributions and profile updates become events, the directory becomes a set of projections, and a public timeline replays the history of the Cast.
- **Cast modeled in Screenplay**, rendered by Stage, as a reference for how Cratis builds with Cratis.
- **A Cast MCP server**, so agents can search the directory, verify a badge and read a profile.
- **`cratis cast` commands** in the Cratis CLI: scaffold, validate `cast.yaml`, preview and check your tier.

### Phase 4: Ecosystem ([Cratis/Cast#5](https://github.com/Cratis/Cast/issues/5))

- **Certification**, if Cratis decides to offer it: an assessment, such as building a slice with Screenplay, Stage and Chronicle, that adds a certified mark to the registry.
- **Introductions:** someone describes a need on cratis.no, and Cratis suggests Partners from the directory. A person always decides; it is never automatic.
- **Studio integration:** Studio workspaces show the Cast members who modeled them, with their consent.
- **Organizations:** partner companies get a page listing their verified people.

## Principles

1. **Facts, not claims.** Everything shown is verifiable, or clearly the person's own words.
2. **Public data only.** Never private repositories, and never client material without written approval.
3. **Opt-in, consent and an easy exit.**
4. **One source of truth per fact.** Tiers live in the registry, numbers come from GitHub, and stories come from `cast.yaml`.
5. **Beautiful by default.** Every member site should be the best-looking personal site its owner has had. That is what makes people use it and share it.
6. **The Cratis voice.** Plain, specific and warm, and respectful of the reader's time.
