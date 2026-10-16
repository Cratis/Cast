---
title: cast.json reference
description: The cast.json format, version 2. The complete profile a site publishes and the Cast directory renders.
---

`cast.json` is a complete, render-ready Cast profile in one JSON file. The [directory](directory.md) renders a registry member's full profile at `https://cast.cratis.io/<login>/` from it. Agents and other tools can read it too.

Every Cast site publishes it at `/cast.json`. You do not need Cast to publish one. Any site can write the file from its own data, by hand or in its own build, and the directory renders it the same way.

For completion and validation in your editor, point `$schema` at the published JSON Schema:

```json
{ "$schema": "https://unpkg.com/@cratis/cast/cast-json.schema.json" }
```

The schema ships in the `@cratis/cast` package as `cast-json.schema.json`.

## The smallest file

```json
{
  "$schema": "https://unpkg.com/@cratis/cast/cast-json.schema.json",
  "castJsonVersion": 2,
  "handle": "ada",
  "profile": {
    "cast": {
      "site": { "url": "https://ada.example" },
      "person": {
        "name": "Ada Lovelace",
        "handle": "ada",
        "title": "Analyst",
        "tagline": "I write *programs.*",
        "intro": "The first programmer.",
        "photo": "https://ada.example/ada.jpeg"
      }
    }
  }
}
```

## Top level

| Field | Required | Meaning |
| --- | --- | --- |
| `castJsonVersion` | yes | `2`. Readers refuse any other version. |
| `handle` | yes | Your GitHub login: your Cast identity. It must equal `profile.cast.person.handle` and the `github:` login in the registry (case does not matter). The directory ignores a file whose handle is someone else's. |
| `profile` | yes | The profile. See below. |
| `generator` | no | What wrote the file, for example `@cratis/cast 1.2.0` or `woksin.com build`. |
| `builtAt` | no | When the file was written, ISO 8601. |
| `$schema` | no | The JSON Schema URL above. |

Cast sites also write the version 1 summary next to `profile` (`name`, `title`, `tagline`, `intro`, `site`, `links`, `career`, `projects`, `stats`) and a `verification` object with the tier the site claims. Readers may use them; the directory uses `title` and `tagline` on its cards, and nothing else from outside `profile`. Any other top-level field is allowed and ignored.

## profile

| Field | Required | Meaning |
| --- | --- | --- |
| `cast` | yes | Your profile in the [cast.yaml format](cast-yaml.md), as JSON. Every field, default and rule in the cast.yaml reference applies, and the content is validated against [`cast.schema.json`](https://unpkg.com/@cratis/cast/cast.schema.json). One difference: `person.photo` must be an absolute `https://` URL, because a path means nothing outside your site. |
| `github` | no | Public GitHub data captured at build time: the contribution calendar, merged pull requests, repository standings, releases and stars. Without it, the directory fills these in from its own GitHub data for your login. Leave it out unless you capture it yourself. |
| `writing` | no | Posts captured from your writing sources, for the writing section. |

### profile.github

| Field | Meaning |
| --- | --- |
| `login` | The login the data was captured for. Must be `handle`, or the directory drops the whole object. |
| `fetchedAt` | When it was captured, ISO 8601. |
| `orgs` | Organizations whose merged public pull requests were counted. |
| `profile` | `login`, `name`, `bio`, `location`, `blog`, `avatarUrl` (https), `followers`, `publicRepositories`. |
| `contributions` | `total`, `commits` and `weeks`: up to 60 entries of `{ "start": "YYYY-MM-DD", "counts": [up to 7 numbers] }`, each week starting on Sunday. |
| `mergedPullRequests` | `total`, `byOrg` (counts by organization) and `latest`: up to 30 `{ title, repository: "owner/name", number, url, mergedAt }`. `url` must be the pull request on `https://github.com`. |
| `repositories` | By `owner/name`: `{ commits, rank, prs }`, your standing among human committers. |
| `releases` | By `owner/name`: `{ tag, publishedAt, url }`. |
| `stars` | By `owner/name`: the star count. |

### profile.writing

| Field | Meaning |
| --- | --- |
| `fetchedAt` | When the posts were captured. |
| `sources` | The feeds or author pages they came from (http or https). The first one names the blog in the writing section. |
| `posts` | Up to 300 `{ title, url, date: "YYYY-MM-DD…", minutes?, description?, tags? }`. |

## How the directory reads it

The directory reads a registry member's `cast.json` from the registry's `profile:` URL, or from `<site>/cast.json` when the entry has only `site:`. Only reviewed registry members (Core and Partner) get a profile from their file. Verified Contributors always get a profile built from public GitHub data.

- **https only**, at most 1 MB, within 10 seconds, also after redirects. A file that cannot be read, is not version 2 or does not validate is not used, and the page falls back to the last good copy the build kept, and then to a GitHub-only profile. When your site answers 404 or 410, the file is treated as removed and the kept copy is dropped too. A broken file never fails the directory build.
- **Checked the way it renders.** Dates must be real (`2026-02-30` and month `13` are refused), counts whole and not negative, URLs must parse, and the career must replay. No single text may be longer than 20,000 characters, and no list longer than 2,000 entries. Before a file is used, the directory computes what the page shows from it; a file the page could not render is not used. When only `profile.github` or `profile.writing` is the problem, that capture is dropped and the directory uses its own GitHub data.
- **Identity.** `handle` and `profile.cast.person.handle` must be the registry login, case-insensitively, or the file is ignored.
- **Tiers.** The directory decides the tier. A `tier` in `profile.cast`, the `verification` object and any other claim are ignored.
- **Links.** Every URL must be `http://` or `https://`, `person.photo` must be an `https://` URL, and `person.email` must be an email address. A link with another scheme (such as `javascript:` or `data:`) is dropped. When a required link is dropped, the item that needs it goes too: a project whose `url` is dropped is left out. Links in inline text follow the [text formatting](cast-yaml.md#text-formatting) rules, and relative links resolve against your site.
- **Text.** Everything is shown as text. Inline markup (`*accent*`, `**strong**`, `` `code` ``, `[label](https://…)`) is rendered as elements, never as HTML.
- **Look.** The page uses the Cratis Cast design. Your `theme.accent` colours it, adjusted for contrast as on a Cast site; `theme.mode` sets the default theme.

## Producing it without Cast

Write `profile.cast` from your own data using the [cast.yaml reference](cast-yaml.md). Career events, projects, talks, skills and the rest all render on the directory page as they would on a Cast site. Then:

1. Validate the file against `https://unpkg.com/@cratis/cast/cast-json.schema.json`.
2. Serve it at `https://<your site>/cast.json` with `content-type: application/json`, or anywhere over https and set `profile:` in your registry entry to its URL.
3. The directory picks it up on its next build, within the hour.

To check a file before it is public, build the directory locally against it with a development override (see [The directory](directory.md#trying-a-profile-locally)).
