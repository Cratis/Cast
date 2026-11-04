---
title: Getting started
description: Create a Cast site with npm create @cratis/cast, run it locally and publish it to GitHub Pages.
---

You need Node.js 23 or newer and a GitHub account. Choose where your profile will live before setting it up:

- For a new site, follow the steps below to scaffold, preview and publish it.
- If you already have an Astro project, go to [Add Cast to an existing Astro site](#add-cast-to-an-existing-astro-site). Cast supplies the profile pages, so first check its configuration and route requirements.
- To keep another publishing stack, use the [cast.json reference](cast-json.md). You can publish that format without running Cast; full-profile import into the directory is limited to reviewed Core and Partner members.

You can preview and edit a Cast site without a GitHub token. Capturing public GitHub data comes after you have a profile to look at.

## Create the site

```sh
npm create @cratis/cast@latest my-site
```

The command asks for your GitHub login, reads your public profile (name, bio, location, website and avatar) and writes:

| File | Purpose |
| --- | --- |
| `cast.yaml` | Your site. Prefilled from the profile, with a commented example for every section. |
| `package.json` | Depends on `@cratis/cast` and `astro`. |
| `astro.config.mjs` | `integrations: [cast()]` and nothing else. |
| `.github/workflows/publish.yaml` | Builds on every push, every hour and on demand, and deploys to GitHub Pages. Only the deploy job can write. |
| `README.md` | These next steps. |
| `.gitignore` | Ignores `node_modules/`, `dist/` and `.astro/`. |
| `public/CNAME` | Only with `--domain`. |

Options work the same with `yarn create @cratis/cast`. With npm, put them after `--`:

```sh
npm create @cratis/cast@latest my-site -- --github your-login --domain www.example.com --yes
```

| Option | Meaning |
| --- | --- |
| `[directory]` | Where to write the site. Must be new or empty. Asked for when left out. |
| `--github <login>` | Your GitHub login. |
| `--domain <domain>` | A custom domain. Sets `site.url` and writes `public/CNAME`. Without it, `site.url` is `https://<login>.github.io`. |
| `--yes`, `-y` | Do not ask anything; use the options given. |
| `--help`, `-h` | Show usage. |

Without a network connection the command still works: `cast.yaml` gets placeholders instead of profile values. Before publishing, check `site.url` and the prefilled `person` fields. In particular, `person.handle` must be your GitHub login: the profile, badge and directory verification all use that identity.

## Run it

```sh
cd my-site
npm install
npm run dev        # http://localhost:4321
```

Open the local page, then edit `cast.yaml`. Start with `person.title`, the role line under your name; `person.tagline`, the headline; and `person.intro`, the paragraph beneath it. Save and check the page again. This gives you a first useful preview before you fill in the rest of your history. Editors that understand the `yaml-language-server` comment at the top complete and check fields from [`cast.schema.json`](https://unpkg.com/@cratis/cast/cast.schema.json).

Next, begin your own `career.events`; the generated file includes a commented example. These events supply the career replay and the printable CV at `/cv`. An event with `role` and `org` starts a role in the projection; `endsRole` closes the open role at that organization. Add the events you want to make public, then compare the profile's replay with `/cv`: they present the same history for different purposes. The [career reference](cast-yaml.md#career) explains event order and the other presentation rules.

You do not need to fill every section. Add the projects, writing or other content that helps a visitor understand your work, using the [cast.yaml reference](cast-yaml.md). By default, sections with data appear; use [sections](cast-yaml.md#sections) to choose and order them. For appearance, [Theming](theming.md) explains the accent and light and dark modes without changing the content.

## Build with live data

Once the profile and CV read the way you want, build the site. `npm run build` captures public GitHub data when `GITHUB_TOKEN` or `GH_TOKEN` is set, and your writing from the sources in `cast.yaml`:

```sh
GITHUB_TOKEN=$(gh auth token) npm run build
```

What was captured is saved to `.cast/snapshot.json`, with the login it was captured for. Commit it: builds without a token, or with GitHub unreachable, use it for the numbers on the page. It never sets your badge, and a snapshot for another login is ignored (see [Badges and the registry](badges-and-registry.md)). Network problems never fail a build. Only public data is used; private repositories are filtered out even when the token can see them.

## Publish

1. Push the site to a GitHub repository.
2. Turn on Pages: **Settings → Pages → Source: GitHub Actions**.
3. The workflow builds and deploys on every push to `main` and every hour, so the numbers and your badge stay current.

With `--domain`, point your DNS at GitHub Pages as described in [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

The published site also serves `/cast.json`. Publishing it does not create a directory listing or grant a badge: [The directory](directory.md#where-a-pages-content-comes-from) explains eligibility and profile updates, and [Badges and the registry](badges-and-registry.md) explains what the badge verifies.

## Add Cast to an existing Astro site

Cast supplies a site's profile pages, not a component to place inside an existing homepage. Before adding it, decide whether those pages should own the routes in your project.

Cast adds these routes, so do not define them yourself: `/`, `/cv` (and a redirect from `/resume`), `/404`, `/cast.json`, `/resume.json`, `/llms.txt`, `/badge.svg`, `/badge-card.svg`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`, `/robots.txt` and the sitemap.

Check your existing pages, redirects and public files for those paths, including the root page. Reconcile any overlap before enabling the integration.

Create `cast.yaml` in the project root. It needs [`site.url`](cast-yaml.md#site) and the required [`person` fields](cast-yaml.md#person): `name`, `handle`, `title`, `tagline` and `intro`. Use your GitHub login for `person.handle`. The other sections are optional, so you can start with this profile information and add your history after the first preview.

Install the integration:

```sh
npm install @cratis/cast
```

Add `cast()` to the integrations in your existing Astro configuration, keeping the rest of your project's settings. This example shows the minimal configuration:

```js
// astro.config.mjs
import cast from '@cratis/cast';
import { defineConfig } from 'astro/config';

export default defineConfig({
    integrations: [cast()],
});
```

`cast()` takes these options:

| Option | Default | Meaning |
| --- | --- | --- |
| `config` | `'cast.yaml'` | Path to `cast.yaml`, relative to the project root. |
| `snapshot` | `'.cast/snapshot.json'` | Where the last good captured data is kept. |
| `fetch` | `'build'` | `'build'` captures data on `astro build`; `'always'` also when the dev server starts; `'never'` uses the snapshot only. |

Start the project with its existing development command, then follow the [profile editing and CV checks](#run-it) above. The [live-data capture](#build-with-live-data) rules apply here too. The scaffolder's GitHub Pages workflow is not added by installing the integration; use your project's deployment setup to publish the built site.
