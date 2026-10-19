// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import castDirectory from './integration/index.ts';

export default defineConfig({
    site: 'https://cast.cratis.io',
    trailingSlash: 'ignore',
    integrations: [castDirectory(), sitemap({
            // Only the directory's own pages. Member profiles stay crawlable through links but are not
            // promoted in the sitemap until profile indexing is decided (Cratis/SEO#6).
            filter: (page) => ['https://cast.cratis.io/', 'https://cast.cratis.io/join/'].includes(page),
        })],
    vite: {
        plugins: [tailwindcss()],
    },
});
