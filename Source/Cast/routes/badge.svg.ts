// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { tier } from 'virtual:cast';
import { badgeSvg } from '../badges/badgeSvg';

export const prerender = true;

/** This site's badge, as verified when it was built. The directory serves the authoritative one. */
export const GET: APIRoute = () => new Response(badgeSvg(tier.tier), { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } });
