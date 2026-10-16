// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveTier } from '../resolveTier';
import type { RegistryMember } from '../RegistryMember';
import { Tier } from '../Tier';
import { TierSource } from '../TierSource';

const registry: RegistryMember[] = [
    { github: 'woksin', tier: Tier.Core, since: '2024-06', role: 'Co-founder & Chief Architect' },
    { github: 'Partner-Co', tier: Tier.Partner },
];

describe('when resolving tiers', () => {
    describe('for a registry member', () => {
        const resolved = resolveTier('WOKSIN', registry, 0);

        it('should take the tier from the registry', () => resolved.tier!.should.equal(Tier.Core));
        it('should say it came from the registry', () => resolved.source.should.equal(TierSource.Registry));
        it('should carry the registry entry', () => resolved.member!.since!.should.equal('2024-06'));
    });

    describe('for a registry partner who also contributed', () => {
        const resolved = resolveTier('partner-co', registry, 12);

        it('should keep the registry tier', () => resolved.tier!.should.equal(Tier.Partner));
    });

    describe('for someone with merged pull requests', () => {
        const resolved = resolveTier('ada', registry, 1);

        it('should make a contributor', () => resolved.tier!.should.equal(Tier.Contributor));
        it('should say it came from contributions', () => resolved.source.should.equal(TierSource.Contributions));
    });

    describe('for someone without merged pull requests', () => {
        const resolved = resolveTier('ada', registry, 0);

        it('should have no tier', () => (resolved.tier === undefined).should.be.true);
        it('should say there is no source', () => resolved.source.should.equal(TierSource.None));
    });

    describe('when contributions are unknown', () => {
        const resolved = resolveTier('ada', registry);

        it('should have no tier', () => (resolved.tier === undefined).should.be.true);
    });
});
