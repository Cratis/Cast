// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { config, tier } from 'virtual:cast';
import { badgeCardSvg } from '../badges/badgeSvg';

export const prerender = true;

export const GET: APIRoute = () =>
    new Response(badgeCardSvg(tier.tier, { handle: config.person.handle, name: config.person.name, since: tier.member?.since }), {
        headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
    });
