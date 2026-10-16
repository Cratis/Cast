// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { castYaml, siteUrl } from './castYaml.js';
import type { ScaffoldInput } from './ScaffoldInput.js';

/** A package name npm accepts, derived from the directory name. */
export const packageName = (directory: string): string =>
    directory.split(/[\\/]/).filter(Boolean).pop()!.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[._-]+|[._-]+$/g, '') || 'cast-site';

const packageJson = (input: ScaffoldInput): string => `${JSON.stringify({
    name: packageName(input.directory),
    version: '0.0.0',
    private: true,
    type: 'module',
    description: `${input.profile.name ?? input.profile.login}'s Cast site.`,
    scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
    },
    engines: { node: '>=23.0.0' },
    dependencies: {
        '@cratis/cast': input.castVersion,
        astro: '^7.2.0',
    },
}, null, 2)}\n`;

const astroConfig = `import cast from '@cratis/cast';
import { defineConfig } from 'astro/config';

// cast() reads ./cast.yaml, captures public GitHub data at build time and adds every page.
export default defineConfig({
    integrations: [cast()],
});
`;

const workflow = `name: Build and deploy Cast site

on:
  push:
    branches: [main]
  pull_request:
  # Hourly rebuild keeps the public GitHub numbers, the feed and the Cast badge current.
  schedule:
    - cron: '23 * * * *'
  workflow_dispatch:

# Least privilege by default; only the deploy job can write to Pages.
permissions:
  contents: read

concurrency:
  group: \${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || 'pages' }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 23.x
      - name: Install
        run: if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
      - name: Build
        run: npm run build
        env:
          # Read-only: Cast captures public GitHub data at build time and never fails the build on it.
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - name: Upload artifact
        if: github.event_name != 'pull_request'
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

const gitignore = `node_modules/
dist/
.astro/
.DS_Store
# .cast/snapshot.json is the last good GitHub data. Commit it so builds without a token still show numbers.
`;

const readme = (input: ScaffoldInput): string => `# ${input.profile.name ?? input.profile.login}

My [Cratis Cast](https://cast.cratis.io) site: one [\`cast.yaml\`](cast.yaml), built with [@cratis/cast](https://github.com/Cratis/Cast).

## Next steps

1. Install and run it:

   \`\`\`sh
   npm install
   npm run dev        # http://localhost:4321
   \`\`\`

2. Fill in [\`cast.yaml\`](cast.yaml). Every section has a commented example; uncomment what you want. Your editor completes fields from the schema.
3. Build with live GitHub numbers (optional locally, automatic in CI):

   \`\`\`sh
   GITHUB_TOKEN=$(gh auth token) npm run build
   \`\`\`

4. Push to GitHub and turn on Pages: **Settings → Pages → Source: GitHub Actions**. The workflow in [\`.github/workflows/publish.yaml\`](.github/workflows/publish.yaml) builds on every push and every hour.
${input.domain ? `5. Point the DNS for \`${input.domain}\` at GitHub Pages; [\`public/CNAME\`](public/CNAME) already names it.\n` : ''}
The site will be at ${siteUrl(input)}.

## Your badge

Your Cast badge is checked on every build: Core and Partner come from the [Cast registry](https://github.com/Cratis/Cast/blob/main/Registry/README.md), Contributor from merged public pull requests in the Cratis organization. Verification page: https://cast.cratis.io/${input.profile.login.toLowerCase()}
`;

/** Every file of a new Cast site, by relative path. */
export function generateFiles(input: ScaffoldInput): Record<string, string> {
    return {
        'cast.yaml': castYaml(input),
        'package.json': packageJson(input),
        'astro.config.mjs': astroConfig,
        '.github/workflows/publish.yaml': workflow,
        '.gitignore': gitignore,
        'README.md': readme(input),
        ...(input.domain ? { 'public/CNAME': `${input.domain}\n` } : {}),
    };
}
