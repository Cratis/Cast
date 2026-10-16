// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute, GetStaticPaths } from 'astro';
import { badgeSvg } from '@cratis/cast/badges';
import { everyone, type DirectoryMember } from '../../lib/directory';

export const getStaticPaths: GetStaticPaths = () => everyone.map(member => ({ params: { handle: member.handle.toLowerCase() }, props: { member } }));

/** The authoritative badge for a handle, as verified when the directory was built. */
export const GET: APIRoute = ({ props }) =>
    new Response(badgeSvg((props as { member: DirectoryMember }).member.tier), { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } });
