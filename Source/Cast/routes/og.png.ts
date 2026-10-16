// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { config, tier } from 'virtual:cast';
import { ogImageSvg } from '../machine/ogImageSvg';
import { accentTokens } from '../site/lib/accent';

export const prerender = true;

export const GET: APIRoute = async () => {
    const svg = ogImageSvg({
        name: config.person.name,
        title: config.person.title,
        tagline: config.person.tagline,
        host: new URL(config.site.url).host,
        accent: accentTokens(config.theme.accent).darkSoft,
        tier: tier.tier,
    });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
