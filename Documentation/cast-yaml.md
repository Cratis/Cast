---
title: cast.yaml reference
description: Every field of cast.yaml, the one file a Cast site is built from.
---

`cast.yaml` is validated when the site builds. A problem stops the build with the path of every invalid field, for example `site.url: Invalid URL`. Unknown top-level keys are refused, including `tier`: a site cannot declare its own tier (see [Badges and the registry](badges-and-registry.md)).

For completion in your editor, keep this comment on the first line:

```yaml
# yaml-language-server: $schema=https://unpkg.com/@cratis/cast/cast.schema.json
```

## Text formatting

Text fields (taglines, intros, summaries, paragraphs) can use a little inline markup. Everything else is escaped.

| Markup | Renders as |
| --- | --- |
| `*words*` | The italic serif accent (Fraunces), the Cratis signature. |
| `**words**` | Strong. |
| `` `code` `` | Inline code. |
| `[label](https://…)` | A link. Only `https://`, `http://`, `/`, `#` and `mailto:` targets become links. |

Dates are `YYYY-MM` or `YYYY`; talks and community entries may also use `YYYY-MM-DD`.

## site

| Field | Required | Meaning |
| --- | --- | --- |
| `url` | yes | Public URL of the site, for example `https://www.example.com`. Used for canonical links, the sitemap and the machine-readable outputs. |
| `description` | | Meta description. Defaults to the tagline followed by the intro. |
| `source` | | Repository of the site, linked in the footer. |
| `language` | | Page language. Default `en`. |

## person

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | yes | Display name. Its first word names the projections, such as `Ada.Now`. |
| `fullName` | | Full name, when it differs. Used on the CV. |
| `handle` | yes | Your GitHub login: your one Cast identity. Tier, badge, `/cast.json` and your verification page (`https://cast.cratis.io/<handle>`) all use it. |
| `title` | yes | The role line under your name. |
| `titleShort` | | A shorter role line for small screens. |
| `location` | | For example `Oslo, Norway`. |
| `country` | | Two-letter ISO 3166 code, for structured data. Quote `"NO"`. |
| `email` | | Shown in the contact section and on the CV. Leave out to show no address. |
| `photo` | | A path relative to `cast.yaml` (optimized at build) or an `https://` URL. Without it, your GitHub avatar is used once GitHub data has been captured. |
| `links` | | Profile links by name. `github`, `linkedin`, `mastodon`, `bluesky`, `x`, `youtube`, `website` and `blog` get proper labels; any other key is shown as written. |
| `tagline` | yes | The hero headline. Wrap the accent in `*asterisks*`. |
| `intro` | yes | One paragraph under the headline. |
| `about` | | Paragraphs for the about column and the CV summary. |
| `interests` | | Short tags. |
| `languages` | | For example `Norwegian (native)`. `Language (fluency)` is split into the JSON Resume fields. |

## now

The "now" read model: ordered rows of `key: value`. Values can be text or lists (shown as tags). `YYYY-MM` values are shown as months.

```yaml
now:
  role: Senior Consultant
  company: Everdeen
  since: 2025-06
  building: [Screenplay, Stage]
```

## stats

Big numbers under the hero.

| Field | Meaning |
| --- | --- |
| `value` | The number. |
| `prefix`, `suffix` | Text around the number, such as `#` or `+`. |
| `label` | What the number counts. |
| `live` | Replace the value at build time: `contributionsLastYear` (floored to hundreds), `mergedPullRequests` (merged public pull requests in `github.orgs`, floored to hundreds), `rankOneRepositories` (replaces the first number in the label with the count of `cratis.repos` where you are the top human committer), `clientLanguages` (the length of `cratis.clientLanguages`). |
| `plain` | Show the value as written, without counting up. |

## career

`career.events` is the stream the career section replays, the CV is built from, and `/resume.json` maps.

| Field | Required | Meaning |
| --- | --- | --- |
| `date` | yes | When it happened. |
| `type` | yes | A past-tense PascalCase event name, such as `EmploymentStarted`, `CompanyCoFounded`, `TalkGiven`. |
| `title` | yes | Headline. |
| `summary` | yes | What happened and why it mattered. |
| `org`, `orgUrl`, `location` | | Organization and where. |
| `skills` | | Skills this event introduced. The skill cloud is their running union. |
| `role` | | Sets the current role in the projection (needs `org`). |
| `endsRole` | | Ends the open role at this organization. |
| `endDate` | | End of an engagement that does not set a role. |
| `seq` | | Stream position. Assigned in file order when left out; must be unique. |

These types have presentation rules: `StudiesStarted`, `VolunteerTeamJoined`, `PartTimeRoleStarted`, `ContractStarted`, `EmploymentStarted` and `CompanyCoFounded` add an organization; `StudiesStarted`, `DegreeCompleted` and `CertificationsEarned` do not start the years-in-the-field clock; `SystemDeployed` and `LeadershipAssigned` are listed under the role they happened in on the CV; `VolunteerTeamJoined`, `PartTimeRoleStarted` and `ContractStarted` appear under "Earlier" on the CV; `VolunteerTeamJoined` maps to JSON Resume `volunteer`. Any other type is shown as written.

## cratis

"What I lead at Cratis". The section renders only when this key is present.

| Field | Meaning |
| --- | --- |
| `role` | Required. What you do at Cratis, in your own words. |
| `title`, `label` | Section heading and label. Defaults: `What I lead at Cratis.` and `Cratis`. |
| `pitch` | A paragraph about Cratis above your role. |
| `links` | Buttons, as `label: url`. Defaults to cratis.io and github.com/Cratis. |
| `pipeline` | Repository names shown as the model-to-running-app pipeline, left to right. |
| `clientLanguages` | Chronicle client languages, for the clients panel and the `clientLanguages` stat. |
| `repos` | Repositories, see below. |
| `highlights` | Short lines about changes you landed. |

Each entry in `repos`:

| Field | Meaning |
| --- | --- |
| `name` | Repository name in the Cratis organization. |
| `url` | Its public URL. Leave out for repositories that are not public; they are then never fetched or linked. |
| `kind` | Short description such as `Event store`. |
| `group` | `pipeline`, `tooling` (default) or `client`. |
| `step` | Pipeline step label, such as `Model`. |
| `desc` | One sentence. |
| `founded` | `true` if you founded it. |
| `role`, `rank`, `commits`, `prs` | Fallbacks. With GitHub data, commits, rank among human committers (bots excluded) and your merged pull requests come from GitHub, and the role is derived from them. |
| `note` | A short extra line. |

## projects and projectCategories

| Field | Meaning |
| --- | --- |
| `name`, `url`, `pitch` | Required. |
| `features` | Bullet points. |
| `stack` | Tags. |
| `install` | An install command with a copy button. |
| `version` | Fallback version. When the repository is listed in `github.releases`, the latest release tag replaces it. |
| `category` | Groups projects for the filter. Default `project`. |
| `featured` | Double-width card. |

`projectCategories` labels categories and orders the filter: `- { id: cli, label: CLI, filter: CLI }`. Categories without an entry use their id, capitalized.

## talks and community

Talks: `title`, `host`, `date`, `summary` (required), `url`, `with` and `lang` (BCP 47, default `en`; other languages are named on the card). Community: `title`, `date`, `detail`; shown as attended.

## writing

| Field | Meaning |
| --- | --- |
| `sources` | `- rss: <feed url>` with an optional `author:` filter (RSS 2.0 or Atom), or `- starlightBlogAuthor: <author page>` for a [Starlight Blog](https://github.com/HiDeoo/starlight-blog) site such as blog.cratis.io. |
| `themes` | Filter chips: `- { id: event-sourcing, label: Event sourcing, tags: [event-sourcing, cqrs] }`. A post belongs to a theme when it has one of its tags. |
| `agenticTheme` | A theme id whose posts the agentic section lists. |

Titles like `Title · Series, Part 3` are split into headline, series and part.

## agentic

The agentic engineering section. `pitch` is required. `title`, `label` and `workflowLabel` change the headings. `workflow` lists steps (`step`, `event`, `who`, `text`, optional `loop` note). `items` lists cards (`name`, `kind`, `text`, optional `url`, `list` and `listLabel`).

## eventModel

One real slice of an event model, drawn as a board you can play. `name`, `repo`, `columns`, `lanes` (`id`, `label`) and `cards` are required. Cards have `id`, `kind` (`ui`, `command`, `event` or `view`), `name`, `lane`, `col`, `source` (a path under `sourceRoot` on `branch`, linked to the repository) and `note`. `edges` are `[from, to]` card id pairs. `steps` (`title`, `text`, `cards`) drive the play button. `title`, `label`, `intro` and `summary` change the copy.

## skills, education, certifications

`skills` maps a group name to a list. Education entries have `degree`, `school`, `from` and optional `to`. Certifications have `title`, `issuer`, `year` and optional `url`.

## github

| Field | Default | Meaning |
| --- | --- | --- |
| `login` | `person.handle` | Optional. If given, it must equal `person.handle` (case-insensitive); a different login stops the build, because the GitHub login is your one identity. |
| `orgs` | `[Cratis]` | Organizations whose merged public pull requests are counted. The live feed shows the newest across them. |
| `releases` | `[]` | `owner/name` repositories whose latest release tag versions your projects. |
| `stars` | `[]` | `owner/name` repositories whose star count is shown on pipeline cards. |

Merged pull requests in the Cratis organization are always counted, whatever `orgs` says, because they decide the Contributor tier.

## theme

| Field | Default | Meaning |
| --- | --- | --- |
| `accent` | `#8b5cf6` | Your accent, a six-digit hex color. See [Theming](theming.md). |
| `mode` | `dark` | What first-time visitors see: `dark`, `light` or `system`. Visitors can switch, and their choice is remembered. |

## sections

Order and choose the home page sections. Without this key, every section that has data is shown in the default order. With it, only the listed sections render, in that order. Each entry is an id or an object that also changes the copy:

```yaml
sections:
  - hero
  - now
  - { id: career, title: "Ten years, *replayed.*" }
  - projects
  - contact
```

Ids: `hero`, `now`, `stats`, `career`, `model`, `cratis`, `activity`, `agentic`, `projects`, `writing`, `talks`, `skills`, `contact`. Objects accept `title` and `label` for every section except the hero, and `intro` for `career`, `model`, `activity`, `projects`, `writing` and `contact`. `model`, `cratis` and `agentic` are skipped when their data is missing.
