// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { ogImageSvg } from '@cratis/cast/machine/ogImageSvg';

/** The 1200 × 630 social preview for the directory's home and join pages, drawn with the same card as member sites. */
export const GET: APIRoute = async () => {
    const svg = ogImageSvg({
        name: 'Cratis Cast',
        title: 'The verified directory of people who build with Cratis',
        tagline: 'The people behind the play.',
        host: 'cast.cratis.io',
        accent: '#8b5cf6',
    });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
