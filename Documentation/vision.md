---
title: Vision
description: Why Cast exists, what it is, how it earns trust, and where it is going.
---

**Cast is how the people who build with Cratis show their work, and how Cratis shows its people.** Each person gets a verified, event-sourced profile site. Cratis gets a living directory of its Core team, Partners and Contributors.

> Cratis: *Software that remembers.*
> Cast: *Careers that remember.*

## Why

Today, someone who is good at Cratis has no credible way to show it. "Event Sourcing" on a CV says nothing, and a client cannot tell someone who read the docs from someone who ships with Chronicle. Contributors get little recognition outside GitHub, and the community has no face. And event sourcing is easier to show than to explain: most people have never watched a system rebuild its state by replaying facts.

Cast changes that:

- **Proof instead of claims.** Tiers come from a registry Cratis reviews, and from merged public pull requests. Numbers come from GitHub on every build. Nobody can give themselves a badge.
- **Every profile is a demonstration.** A visitor replays a career and watches the projection rebuild. That is event sourcing in ten seconds, on a page they came to for another reason.
- **Every profile leads to Cratis.** Each site carries the Cast badge and links to the directory and to the projects the person works on.
- **The network becomes visible.** Anyone can browse the people who build with Cratis.

## What it is

| Piece | What it does |
| --- | --- |
| `@cratis/cast` | An Astro integration: one `cast.yaml` becomes a complete site. Home, career replay, live GitHub data, writing, talks, projects, a terminal, a command palette, a printable `/cv`, and light and dark themes in Cratis branding with a personal accent. |
| `npm create @cratis/cast` | Give it a GitHub handle and it prefills the profile and writes the deploy workflow, with an hourly refresh, for GitHub Pages. |
| The registry | `Registry/members.yaml`, the source of truth for Core and Partner. Changed only through reviewed pull requests. |
| Badges | Core (violet to teal, with the Cratis mark), Partner (teal), Contributor (amber, earned automatically). Embeddable images, each linking to a verification page. |
| The directory | [cast.cratis.io](https://cast.cratis.io): the people behind the play, a verification page per person, embed snippets, how to join, and a wall of everyone with merged work in Cratis. |
| An open profile format | Every site publishes `/cast.json`, `/resume.json` (JSON Resume) and `/llms.txt`. People, the directory and AI agents read the same data. |

## How it looks and feels

**A visitor**, say someone checking out a consultant:

1. They land on the consultant's site. A live Event Modeling board drifts behind the headline, and the navigation shows the Cast badge.
2. A "where the stream is now" read model shows what the person does today.
3. They press play. The career replays event by event, and the role, organizations and skills rebuild as it goes.
4. The numbers come from GitHub: merged pull requests, contributions, releases. None are typed in by hand.
5. They click the badge, reach the person's page on cast.cratis.io, and see what verified it and since when, with a link to the registry entry.
6. They print `/cv` and get a clean CV generated from the same data.

**A member** runs `npm create @cratis/cast`, edits one YAML file with completion in the editor, and pushes. Engine updates arrive as a version bump; a custom domain is one line. The badge goes in their GitHub README, email signature and profiles.

**Cratis** merges a pull request to add a Partner. The directory picks it up on its next build: right away for a registry change, otherwise within six hours; the person's site on its next hourly build.

## Trust

- **No self-assertion.** `cast.yaml` has no tier field. Tiers are resolved at build time from the registry (Core and Partner) or from GitHub (Contributor).
- **Verifiable everywhere.** Every badge links to a directory page, which links to the registry line and its pull request history.
- **Public data only.** Private repositories are filtered out at every step.
- **Opt-in and removable.** Partners join through a pull request and can leave the same way. Cratis can remove a listing, under a written [removal policy](https://github.com/Cratis/Cast/blob/main/Registry/README.md).
- **Honest by design.** No invented metrics, testimonials or clients. Not everyone who asks becomes a Partner.

## Roadmap

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
