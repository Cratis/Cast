// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { TierSource } from '../../../badges/TierSource';
import { Tier } from '../../../badges/Tier';
import { parseCast } from '../../../config/parseCast';
import { resolveSections } from '../../../config/resolveSections';
import { minimalCast } from '../../../config/for_parseCast/given/a_minimal_cast';
import { emptySnapshot } from '../../../github/GitHubSnapshot';
import type { CastData } from '../../../integration/CastData';
import { castJson } from '../../castJson';

/** A site's build data, as the engine resolves it. */
export const siteData = (): CastData => {
    const config = parseCast(`${minimalCast}
  links:
    linkedin: https://www.linkedin.com/in/ada/
projects:
  - { name: engine, url: https://github.com/ada/engine, pitch: Computes *things*. }
  - { name: loom, url: https://github.com/ada/loom, pitch: Weaves. }
career:
  events:
    - { date: '2018-07', type: EmploymentStarted, title: Engineer, org: Acme, role: Engineer, summary: Joined. }
`);
    return {
        config,
        sections: resolveSections(config),
        github: {
            ...emptySnapshot('ada', ['Cratis']),
            fetchedAt: '2026-10-16T00:00:00.000Z',
            contributions: { total: 12, weeks: [{ start: '2026-10-11', counts: [1, 2, 3, 0, 0, 6, 0] }] },
            mergedPullRequests: { total: 1, byOrg: { Cratis: 1 }, latest: [{ title: 'Fix', repository: 'Cratis/Arc', number: 7, url: 'https://github.com/Cratis/Arc/pull/7', mergedAt: '2026-10-15T10:00:00Z' }] },
        },
        writing: { sources: [], posts: [] },
        tier: { handle: 'ada', tier: Tier.Core, source: TierSource.Registry },
        build: { builtAt: '2026-10-16T00:00:00.000Z', castVersion: '1.2.0', githubSource: 'live', registrySource: 'live' },
    };
};

/** The cast.json that site publishes, as plain JSON. */
export const aCastJson = (): Record<string, unknown> => JSON.parse(JSON.stringify(castJson(siteData(), 'https://ada.example/_astro/ada.jpeg'))) as Record<string, unknown>;

/** Reaches into a cast.json document by path. */
export const at = (document: unknown, ...path: (string | number)[]): Record<string, unknown> =>
    path.reduce<unknown>((value, key) => (value as Record<string | number, unknown>)[key], document) as Record<string, unknown>;
