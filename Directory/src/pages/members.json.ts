// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { castDirectoryUrl } from '@cratis/cast/badges';
import { directory, everyone } from '../lib/directory';

/** Every verified member, for tools and agents. */
export const GET: APIRoute = () =>
    new Response(JSON.stringify({
        builtAt: directory.builtAt,
        fetchedAt: directory.fetchedAt ?? null,
        members: everyone.map(member => ({
            handle: member.handle,
            name: member.name ?? null,
            tier: member.tier ?? null,
            source: member.source,
            since: member.since ?? null,
            role: member.role ?? null,
            site: member.site ?? null,
            mergedPullRequests: member.mergedPullRequests ?? null,
            verification: `${castDirectoryUrl}/${member.handle.toLowerCase()}`,
        })),
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
