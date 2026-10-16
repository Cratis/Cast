// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { config } from 'virtual:cast';
import { faviconSvg } from '../machine/ogImageSvg';
import { accentTokens } from '../site/lib/accent';

export const prerender = true;

export const GET: APIRoute = async () => {
    const initial = (config.person.name.trim()[0] ?? 'C').toUpperCase();
    const svg = faviconSvg(initial, config.theme.accent, accentTokens(config.theme.accent).ink).replace('rx="14"', 'rx="0"');
    const png = await sharp(Buffer.from(svg), { density: 300 }).resize(180, 180).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
