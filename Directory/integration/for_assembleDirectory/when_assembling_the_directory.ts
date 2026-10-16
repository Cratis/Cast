// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Tier, TierSource } from '@cratis/cast/badges';
import { assembleDirectory, loginsToVerify } from '../assembleDirectory';

describe('when assembling the directory', () => {
    const checkedAt = '2026-10-01T00:00:00.000Z';
    const snapshot = assembleDirectory({
        registry: [{ github: 'woksin', tier: Tier.Core, since: '2024-06', line: 8 }, { github: 'partner', tier: Tier.Partner }],
        counts: {
            woksin: { mergedPullRequests: 3000, checkedAt },
            ada: { mergedPullRequests: 2, checkedAt },
            grace: { mergedPullRequests: 9, checkedAt },
            linus: { mergedPullRequests: 0, checkedAt },
        },
        profiles: { ada: { name: 'Ada Lovelace' } },
        activity: { ada: { commits: 4, repositories: ['Arc'] } },
        casts: { woksin: { url: 'https://www.woksin.com', title: 'Chief Architect' } },
        discovered: ['Woksin', 'ada', 'grace', 'linus', 'margaret'],
    }, '2026-10-16T00:00:00.000Z');

    it('should list registry members in registry order', () => snapshot.members.map(member => member.handle).should.deep.equal(['woksin', 'partner']));
    it('should take member tiers from the registry', () => snapshot.members.map(member => member.tier).should.deep.equal([Tier.Core, Tier.Partner]));
    it('should keep the registry line for verification links', () => snapshot.members[0]!.registryLine!.should.equal(8));
    it('should attach what the member site says', () => snapshot.members[0]!.cast!.title!.should.equal('Chief Architect'));
    it('should not list registry members again as contributors', () => snapshot.contributors.some(member => member.handle.toLowerCase() === 'woksin').should.be.false);
    it('should list verified contributors, most merged pull requests first', () => snapshot.contributors.map(member => member.handle).should.deep.equal(['grace', 'ada']));
    it('should mark contributors as verified from contributions', () => snapshot.contributors.every(member => member.source === TierSource.Contributions).should.be.true);
    it('should carry profile and activity', () => snapshot.contributors[1]!.name!.should.equal('Ada Lovelace'));
    it('should count unverified people as pending', () => snapshot.pending.should.equal(1));
});

describe('when choosing logins to verify', () => {
    const now = new Date('2026-10-16T00:00:00.000Z');
    const logins = loginsToVerify(['fresh', 'stale', 'never', 'older'], {
        fresh: { mergedPullRequests: 1, checkedAt: '2026-10-15T00:00:00.000Z' },
        stale: { mergedPullRequests: 1, checkedAt: '2026-09-01T00:00:00.000Z' },
        older: { mergedPullRequests: 1, checkedAt: '2026-08-01T00:00:00.000Z' },
    }, now, 2);

    it('should check never-checked logins first, then the stalest, within the limit', () => logins.should.deep.equal(['never', 'older']));
});
