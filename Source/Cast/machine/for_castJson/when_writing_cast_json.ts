// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { castJson } from '../castJson';
import { castJsonSchema } from '../castJsonSchema';
import { siteData } from '../for_profileFromCastJson/given/a_cast_json';

describe('when writing cast.json', () => {
    const document = castJson(siteData(), 'https://ada.example/_astro/ada.jpeg');

    it('should be version 2', () => document.castJsonVersion.should.equal(2));
    it('should validate against its own schema', () => castJsonSchema.safeParse(JSON.parse(JSON.stringify(document))).success.should.be.true);
    it('should keep the version 1 summary', () => document.tagline.should.equal('I write programs.'));
    it('should carry the full profile', () => document.profile.cast.projects.length.should.equal(2));
    it('should point the portrait at an absolute url', () => document.profile.cast.person.photo!.should.equal('https://ada.example/_astro/ada.jpeg'));
    it('should mark the tier as a claim', () => document.verification.claimedTier!.should.equal('core'));
});
