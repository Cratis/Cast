// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import type { CastData } from './integration/CastData';
import type { CastOptions } from './integration/CastOptions';
import { resolveData } from './integration/resolveData';
import { castVirtualModule } from './integration/virtualModule';

export type { CastOptions } from './integration/CastOptions';
export type { CastData } from './integration/CastData';
export * from './config/index';
export * from './badges/index';

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string };

/** The pages and files every Cast site serves. */
const routes: [pattern: string, entrypoint: string][] = [
    ['/', 'index.astro'],
    ['/cv', 'cv.astro'],
    ['/404', '404.astro'],
    ['/cast.json', 'cast.json.ts'],
    ['/resume.json', 'resume.json.ts'],
    ['/llms.txt', 'llms.txt.ts'],
    ['/badge.svg', 'badge.svg.ts'],
    ['/badge-card.svg', 'badge-card.svg.ts'],
    ['/og.png', 'og.png.ts'],
    ['/favicon.svg', 'favicon.svg.ts'],
    ['/apple-touch-icon.png', 'apple-touch-icon.png.ts'],
    ['/robots.txt', 'robots.txt.ts'],
];

/**
 * The Cast integration. Reads cast.yaml, captures public GitHub and writing data at build time, verifies the
 * tier against the Cast registry and injects every page. Tailwind, fonts and the sitemap are configured here,
 * so a site needs nothing but `integrations: [cast()]`.
 */
export default function cast(options: CastOptions = {}): AstroIntegration {
    let data: CastData | undefined;
    let photoFile: string | undefined;

    return {
        name: '@cratis/cast',
        hooks: {
            'astro:config:setup': async ({ config, command, updateConfig, injectRoute, addWatchFile, logger }) => {
                const root = fileURLToPath(config.root);
                const configFile = path.resolve(root, options.config ?? 'cast.yaml');
                const snapshotFile = path.resolve(root, options.snapshot ?? '.cast/snapshot.json');
                const fetchMode = options.fetch ?? 'build';
                addWatchFile(configFile);

                const resolved = await resolveData({
                    configFile,
                    snapshotFile,
                    fetch: fetchMode === 'always' || (fetchMode === 'build' && command === 'build'),
                    castVersion: packageJson.version,
                    log: logger,
                });
                data = resolved.data;
                photoFile = resolved.photoFile;
                const site = data.config.site.url;
                logger.info(`${data.config.person.name} (@${data.config.person.handle}): tier ${data.tier.tier ?? 'none'} from ${data.tier.source}`);

                for (const [pattern, entrypoint] of routes) {
                    injectRoute({ pattern, entrypoint: `@cratis/cast/routes/${entrypoint}`, prerender: true });
                }

                updateConfig({
                    site: config.site ?? site,
                    trailingSlash: 'ignore',
                    redirects: { '/resume': '/cv', ...config.redirects },
                    integrations: [sitemap({ filter: page => !page.endsWith('/404/') && !page.endsWith('/404') })],
                    vite: {
                        plugins: [
                            tailwindcss(),
                            castVirtualModule(() => data!, () => photoFile),
                        ],
                    },
                } as Parameters<typeof updateConfig>[0]);
            },
        },
    };
}
