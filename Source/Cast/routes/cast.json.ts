// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import * as data from 'virtual:cast';
import { castJson } from '../machine/castJson';

export const prerender = true;

/** The portrait as an absolute https URL: the built local image, else the remote one. */
const portrait = (): string | undefined => {
    if (data.photo) return new URL(data.photo.src, data.config.site.url).toString();
    return data.photoUrl;
};

export const GET: APIRoute = () =>
    new Response(JSON.stringify(castJson(data, portrait()), null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
