// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Tier, TierSource } from '@cratis/cast/badges';
import { assembleDirectory } from '../assembleDirectory';
import type { CastSummary } from '../DirectoryMember';

describe('when member sites claim tiers', () => {
    // What a hostile /cast.json might carry beyond the fields the directory reads.
    const claiming = (url: string) => ({ url, title: 'Title', claimedTier: 'core', tier: 'core', verification: { claimedTier: 'core' } }) as unknown as CastSummary;
    const snapshot = assembleDirectory({
        registry: [{ github: 'partner', tier: Tier.Partner, site: 'https://partner.example' }],
        counts: { stranger: { mergedPullRequests: 0, checkedAt: '2026-10-01T00:00:00.000Z' } },
        profiles: {},
        activity: {},
        casts: { partner: claiming('https://partner.example'), stranger: claiming('https://stranger.example') },
        discovered: ['stranger'],
    }, '2026-10-16T00:00:00.000Z');

    it('should keep the registry tier', () => snapshot.members[0]!.tier!.should.equal(Tier.Partner));
    it('should keep the registry as the source', () => snapshot.members[0]!.source.should.equal(TierSource.Registry));
    it('should not list someone because their site claims a tier', () => snapshot.contributors.should.be.empty);
});
