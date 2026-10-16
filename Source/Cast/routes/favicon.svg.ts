// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { config } from 'virtual:cast';
import { faviconSvg } from '../machine/ogImageSvg';
import { accentTokens } from '../site/lib/accent';

export const prerender = true;

export const GET: APIRoute = () => {
    const initial = (config.person.name.trim()[0] ?? 'C').toUpperCase();
    return new Response(faviconSvg(initial, config.theme.accent, accentTokens(config.theme.accent).ink), {
        headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
    });
};
