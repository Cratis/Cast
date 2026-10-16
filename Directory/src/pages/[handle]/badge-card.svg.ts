// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute, GetStaticPaths } from 'astro';
import { badgeCardSvg } from '@cratis/cast/badges';
import { everyone, type DirectoryMember } from '../../lib/directory';

export const getStaticPaths: GetStaticPaths = () => everyone.map(member => ({ params: { handle: member.handle.toLowerCase() }, props: { member } }));

export const GET: APIRoute = ({ props }) => {
    const { member } = props as { member: DirectoryMember };
    return new Response(badgeCardSvg(member.tier, { handle: member.handle, name: member.name, since: member.since }), {
        headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
    });
};
