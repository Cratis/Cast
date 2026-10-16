// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { verificationUrl } from '../badges/constants';
import type { CastData } from '../integration/CastData';
import { plainText } from '../site/lib/inline';

/** Version of the /cast.json document. Bumped on breaking changes; additions keep the version. */
export const castJsonVersion = 1;

/**
 * The machine-readable profile at /cast.json. Agents can read it; the directory shows its title and tagline.
 * `verification.claimedTier` is what this site's build resolved. A site is static and controlled by its owner,
 * so it is a claim: the directory page at `verification.url` is the source of truth, and the directory never
 * reads tiers from here.
 */
export function castJson(data: CastData) {
    const { config, tier, github, build } = data;
    const person = config.person;
    return {
        castJsonVersion,
        generator: `@cratis/cast ${build.castVersion}`,
        builtAt: build.builtAt,
        handle: config.github.login,
        name: person.name,
        ...(person.fullName ? { fullName: person.fullName } : {}),
        title: person.title,
        ...(person.location ? { location: person.location } : {}),
        tagline: plainText(person.tagline),
        intro: plainText(person.intro),
        site: config.site.url,
        verification: {
            url: verificationUrl(config.github.login),
            claimedTier: tier.tier ?? null,
            source: tier.source,
            ...(tier.member?.since ? { since: tier.member.since } : {}),
            ...(tier.member?.role ? { role: tier.member.role } : {}),
            claimedAt: build.builtAt,
            registry: build.registrySource,
            note: 'Claimed by this site when it was built. The directory page at url is the source of truth.',
        },
        links: { github: `https://github.com/${config.github.login}`, ...person.links },
        career: config.career.events.map(event => ({
            seq: event.seq,
            date: event.date,
            ...(event.endDate ? { endDate: event.endDate } : {}),
            type: event.type,
            title: event.title,
            ...(event.org ? { org: event.org } : {}),
            ...(event.role ? { role: event.role } : {}),
            ...(event.endsRole ? { endsRole: event.endsRole } : {}),
            summary: plainText(event.summary),
            ...(event.skills?.length ? { skills: event.skills } : {}),
        })),
        projects: config.projects.map(project => ({ name: project.name, url: project.url, pitch: plainText(project.pitch), stack: project.stack })),
        stats: {
            capturedAt: github.fetchedAt ?? null,
            source: build.githubSource,
            contributionsLastYear: github.contributions.total,
            mergedPullRequests: github.mergedPullRequests.total,
            mergedPullRequestsByOrg: github.mergedPullRequests.byOrg,
        },
    };
}
