// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { verificationUrl } from '../badges/constants';
import type { CastData } from '../integration/CastData';
import { plainText } from '../site/lib/inline';

/** Version of the /cast.json document. Bumped on breaking changes; additions keep the version. */
export const castJsonVersion = 1;

/**
 * The machine-readable profile at /cast.json. The directory aggregates these, and agents can read them.
 * `tier` is the claim as verified when the site was built, never something the site asserted.
 */
export function castJson(data: CastData) {
    const { config, tier, github, build } = data;
    const person = config.person;
    return {
        castJsonVersion,
        generator: `@cratis/cast ${build.castVersion}`,
        builtAt: build.builtAt,
        handle: person.handle,
        name: person.name,
        ...(person.fullName ? { fullName: person.fullName } : {}),
        title: person.title,
        ...(person.location ? { location: person.location } : {}),
        tagline: plainText(person.tagline),
        intro: plainText(person.intro),
        site: config.site.url,
        verification: {
            url: verificationUrl(person.handle),
            tier: tier.tier ?? null,
            source: tier.source,
            ...(tier.member?.since ? { since: tier.member.since } : {}),
            ...(tier.member?.role ? { role: tier.member.role } : {}),
            verifiedAt: build.builtAt,
            registry: build.registrySource,
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
