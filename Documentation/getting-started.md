---
title: Getting started
description: Create a Cast site with npm create @cratis/cast, run it locally and publish it to GitHub Pages.
---

You need Node.js 23 or newer and a GitHub account.

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

Without a network connection the command still works: `cast.yaml` gets placeholders instead of profile values.

## Run it

```sh
cd my-site
npm install
npm run dev        # http://localhost:4321
```

Edit `cast.yaml` and the page follows. Editors that understand the `yaml-language-server` comment at the top complete and check fields from [`cast.schema.json`](https://unpkg.com/@cratis/cast/cast.schema.json).

## Build with live data

`npm run build` captures public GitHub data when `GITHUB_TOKEN` or `GH_TOKEN` is set, and your writing from the sources in `cast.yaml`:

```sh
GITHUB_TOKEN=$(gh auth token) npm run build
```

What was captured is saved to `.cast/snapshot.json`, with the login it was captured for. Commit it: builds without a token, or with GitHub unreachable, use it for the numbers on the page. It never sets your badge, and a snapshot for another login is ignored (see [Badges and the registry](badges-and-registry.md)). Network problems never fail a build. Only public data is used; private repositories are filtered out even when the token can see them.

## Publish

1. Push the site to a GitHub repository.
2. Turn on Pages: **Settings → Pages → Source: GitHub Actions**.
3. The workflow builds and deploys on every push to `main` and every hour, so the numbers and your badge stay current.

With `--domain`, point your DNS at GitHub Pages as described in [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Add Cast to an existing Astro site

```sh
npm install @cratis/cast
```

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

Cast adds these routes, so do not define them yourself: `/`, `/cv` (and a redirect from `/resume`), `/404`, `/cast.json`, `/resume.json`, `/llms.txt`, `/badge.svg`, `/badge-card.svg`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`, `/robots.txt` and the sitemap.
