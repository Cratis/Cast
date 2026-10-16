// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { config } from 'virtual:cast';

export const prerender = true;

export const GET: APIRoute = () =>
    new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', config.site.url)}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
