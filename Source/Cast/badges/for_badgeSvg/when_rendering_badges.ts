// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { badgeCardSvg, badgeSvg } from '../badgeSvg';
import { Tier } from '../Tier';

describe('when rendering badges', () => {
    describe('for each tier', () => {
        const svgs = Object.values(Tier).map(tier => badgeSvg(tier));

        it('should be 20 pixels high', () => svgs.every(svg => svg.includes('height="20"')).should.be.true);
        it('should label the tier', () => svgs.map(svg => /aria-label="Cratis Cast: (\w+)"/.exec(svg)?.[1]).should.deep.equal(['Core', 'Partner', 'Contributor']));
        it('should look different per tier', () => new Set(svgs).size.should.equal(3));
        it('should include the Cratis mark', () => svgs.every(svg => svg.includes('<path d="M1444')).should.be.true);
    });

    describe('without a tier', () => {
        const svg = badgeSvg(undefined);

        it('should say it is not verified', () => svg.should.contain('not verified'));
    });

    describe('as a card', () => {
        const svg = badgeCardSvg(Tier.Core, { handle: 'Woksin', name: 'Sindre <Wilting>', since: '2024-06' });

        it('should link to the lowercased verification address', () => svg.should.contain('cast.cratis.io/woksin'));
        it('should escape text', () => svg.should.contain('Sindre &lt;Wilting&gt;'));
        it('should show since', () => svg.should.contain('since Jun 2024'));
    });
});
