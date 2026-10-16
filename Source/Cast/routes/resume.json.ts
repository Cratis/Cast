// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { config } from 'virtual:cast';
import { resumeJson } from '../machine/resumeJson';

export const prerender = true;

export const GET: APIRoute = ({ site }) =>
    new Response(JSON.stringify(resumeJson(config, new URL('/apple-touch-icon.png', site ?? config.site.url).toString()), null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
    });
