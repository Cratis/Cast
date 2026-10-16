// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RegistryMember } from '../../badges/RegistryMember';
import { Tier } from '../../badges/Tier';
import { TierSource } from '../../badges/TierSource';
import { emptySnapshot, type GitHubSnapshot } from '../../github/GitHubSnapshot';
import { siteTier, usableSnapshot } from '../resolveData';

const registry: RegistryMember[] = [{ github: 'woksin', tier: Tier.Core }];
const snapshotFor = (login: string, cratisPullRequests: number): GitHubSnapshot => ({
    ...emptySnapshot(login, ['Cratis']),
    mergedPullRequests: { total: cratisPullRequests, byOrg: { Cratis: cratisPullRequests }, latest: [] },
});

describe('when resolving the tier a site shows', () => {
    describe('from a snapshot captured for someone else', () => {
        it('should not use the snapshot at all', () => (usableSnapshot(snapshotFor('woksin', 3000), 'ada') === undefined).should.be.true);
    });

    describe('from a snapshot captured for the same login in another case', () => {
        it('should use the snapshot', () => usableSnapshot(snapshotFor('Ada', 1), 'ada')!.login.should.equal('Ada'));
    });

    describe('from a snapshot claiming merged pull requests', () => {
        const resolved = siteTier('ada', registry, 'snapshot', snapshotFor('ada', 12));

        it('should not raise the tier', () => (resolved.tier === undefined).should.be.true);
        it('should say there is no source', () => resolved.source.should.equal(TierSource.None));
    });

    describe('from live data for the same login', () => {
        const resolved = siteTier('ada', registry, 'live', snapshotFor('ada', 2));

        it('should make a contributor', () => resolved.tier!.should.equal(Tier.Contributor));
    });

    describe('from live data for a different login', () => {
        const resolved = siteTier('ada', registry, 'live', snapshotFor('woksin', 3000));

        it('should not make a contributor', () => (resolved.tier === undefined).should.be.true);
    });

    describe('for a registry member without any GitHub data', () => {
        const resolved = siteTier('WOKSIN', registry, 'none', emptySnapshot('woksin', ['Cratis']));

        it('should take the tier from the registry by login', () => resolved.tier!.should.equal(Tier.Core));
    });
});
