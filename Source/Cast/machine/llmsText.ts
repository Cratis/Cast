// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { tierStyles } from '../badges/badgeSvg';
import { verificationUrl } from '../badges/constants';
import type { CastData } from '../integration/CastData';
import { formatMonth, project } from '../site/lib/career';
import { plainText } from '../site/lib/inline';

/** A short, factual Markdown summary for AI agents, following the llms.txt convention. */
export function llmsText(data: CastData): string {
    const { config, tier, github } = data;
    const person = config.person;
    const site = config.site.url.replace(/\/$/, '');
    const projection = project(config.career.events);
    const lines: string[] = [];

    lines.push(`# ${person.name}`, '');
    lines.push(`> ${person.title}${person.location ? `, ${person.location}` : ''}. ${plainText(person.intro)}`, '');

    if (tier.tier) {
        const style = tierStyles[tier.tier];
        lines.push(`Cratis Cast: ${style.label} (${style.description.toLowerCase()}), as claimed by this site's build from ${tier.source === 'registry' ? 'the Cast registry' : 'merged public pull requests in the Cratis organization'}. The authoritative check is ${verificationUrl(config.github.login)}`, '');
    }

    if (projection.currentRoles.length > 0) {
        lines.push('## Now', '');
        for (const role of projection.currentRoles) lines.push(`- ${role.title}, ${role.org} (since ${formatMonth(role.from)})`);
        lines.push('');
    }

    if (person.about.length > 0) {
        lines.push('## About', '', ...person.about.map(paragraph => plainText(paragraph)), '');
    }

    const roles = [...projection.roles].reverse();
    if (roles.length > 0) {
        lines.push('## Experience', '');
        for (const role of roles) lines.push(`- ${formatMonth(role.from)} – ${role.to ? formatMonth(role.to) : 'present'}: ${role.title}, ${role.org}`);
        lines.push('');
    }

    if (config.projects.length > 0) {
        lines.push('## Projects', '');
        for (const entry of config.projects) lines.push(`- [${entry.name}](${entry.url}): ${plainText(entry.pitch)}`);
        lines.push('');
    }

    const skills = Object.entries(config.skills);
    if (skills.length > 0) {
        lines.push('## Skills', '');
        for (const [group, list] of skills) lines.push(`- ${group}: ${list.join(', ')}`);
        lines.push('');
    }

    if (github.fetchedAt) {
        lines.push('## Public GitHub activity', '');
        lines.push(`- ${github.contributions.total.toLocaleString('en-US')} contributions in the last year (captured ${github.fetchedAt.slice(0, 10)})`);
        for (const [org, count] of Object.entries(github.mergedPullRequests.byOrg)) lines.push(`- ${count.toLocaleString('en-US')} merged public pull requests in ${org}`);
        lines.push('');
    }

    lines.push('## Machine-readable', '');
    lines.push(`- [Cast profile](${site}/cast.json): identity, verified tier, career events, projects`);
    lines.push(`- [JSON Resume](${site}/resume.json)`);
    lines.push(`- [CV](${site}/cv)`);
    lines.push('');
    return lines.join('\n');
}
