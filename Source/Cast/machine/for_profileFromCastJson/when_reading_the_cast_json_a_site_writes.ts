// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonResult } from '../profileFromCastJson';
import { aCastJson, siteData } from './given/a_cast_json';

describe('when reading the cast.json a site writes', () => {
    let result: CastJsonResult;

    beforeEach(() => {
        result = profileFromCastJson(aCastJson(), 'ADA');
    });

    const profile = () => (result as Extract<CastJsonResult, { profile: unknown }>).profile;

    it('should accept it', () => ('profile' in result).should.be.true);
    it('should drop nothing', () => (result as Extract<CastJsonResult, { profile: unknown }>).dropped.should.be.empty);
    it('should keep the configuration', () => profile().config.should.deep.equal({ ...siteData().config, person: { ...siteData().config.person, photo: 'https://ada.example/_astro/ada.jpeg' } }));
    it('should keep the github snapshot', () => profile().github!.contributions.total.should.equal(12));
    it('should take the portrait from the absolute photo url', () => profile().photoUrl!.should.equal('https://ada.example/_astro/ada.jpeg'));
    it('should carry no tier', () => Object.keys(profile()).should.not.include('tier'));
});
