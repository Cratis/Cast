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

    describe('without fresh evidence', () => {
        const resolved = siteTier('ada', registry, undefined);

        it('should have no tier', () => (resolved.tier === undefined).should.be.true);
        it('should say there is no source', () => resolved.source.should.equal(TierSource.None));
    });

    describe('with a fresh count of zero', () => {
        it('should have no tier', () => (siteTier('ada', registry, 0).tier === undefined).should.be.true);
    });

    describe('with a fresh count of one', () => {
        it('should make a contributor', () => siteTier('ada', registry, 1).tier!.should.equal(Tier.Contributor));
    });

    describe('for a registry member without fresh evidence', () => {
        it('should take the tier from the registry by login', () => siteTier('WOKSIN', registry, undefined).tier!.should.equal(Tier.Core));
    });
});
