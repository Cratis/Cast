// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { badgeSvg, Tier, tierStyles } from '@cratis/cast/badges';
import { badgeImage } from '../badgeImage';

describe('when rendering badges', () => {
    for (const tier of [Tier.Core, Tier.Partner, Tier.Contributor]) {
        it(`should reserve the intrinsic dimensions of the ${tier} badge`, () => {
            const image = badgeImage(tier);
            badgeSvg(tier).should.contain(`width="${image.width}" height="${image.height}"`);
            image.width.should.be.greaterThan(0);
            image.height.should.equal(20);
        });
        it(`should preserve the ${tier} badge image and accessible name`, () => {
            const image = badgeImage(tier);
            decodeURIComponent(image.src.split(',')[1]!).should.equal(badgeSvg(tier));
            image.alt.should.equal(`${tierStyles[tier].label} badge`);
        });
    }
});
