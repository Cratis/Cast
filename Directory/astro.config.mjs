// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import castDirectory from './integration/index.ts';

export default defineConfig({
    site: 'https://cast.cratis.io',
    trailingSlash: 'ignore',
    integrations: [castDirectory()],
    vite: {
        plugins: [tailwindcss()],
    },
});
