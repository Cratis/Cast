// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { APIRoute } from 'astro';
import { contributors, core, displayName, partners, type DirectoryMember } from '../lib/directory';

const site = 'https://cast.cratis.io';
const line = (member: DirectoryMember) => `- [${displayName(member)}](${site}/${member.handle.toLowerCase()}/)`;
const section = (heading: string, members: DirectoryMember[]) => (members.length > 0 ? [`## ${heading}`, '', ...members.map(line), ''] : []);

/** The llms.txt for the directory: what it is, where to look, and the members the home page already lists. */
export const GET: APIRoute = () => {
    const text = [
        '# Cratis Cast',
        '',
        '> Cratis Cast is a profile-site engine and directory for the people who build with Cratis, with verified, event-sourced profile pages.',
        '',
        `- [Directory](${site}/): the verified directory of Core, Partners and Contributors; every badge is checked when the directory builds.`,
        `- [Join the Cast](${site}/join): get a Cast site with one command and learn how the badges are verified.`,
        `- [members.json](${site}/members.json): the directory as machine-readable data.`,
        '- [Source code](https://github.com/Cratis/Cast): the engine and the registry.',
        '',
        ...section('Core', core),
        ...section('Partners', partners),
        ...section('Contributors', contributors),
    ].join('\n');
    return new Response(`${text.trimEnd()}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
