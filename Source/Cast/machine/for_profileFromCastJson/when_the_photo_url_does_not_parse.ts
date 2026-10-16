// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonProfile } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when the photo url does not parse', () => {
    let profile: CastJsonProfile;
    let dropped: string[];

    beforeEach(() => {
        const document = aCastJson();
        at(document, 'profile', 'cast', 'person')['photo'] = 'https://%';
        const result = profileFromCastJson(document, 'ada');
        if (!('profile' in result)) throw new Error(result.problems.join('; '));
        ({ profile, dropped } = result);
    });

    it('should keep the profile', () => profile.handle.should.equal('ada'));
    it('should drop the portrait', () => (profile.photoUrl === undefined).should.be.true);
    it('should report it dropped the portrait', () => dropped.should.include('profile.cast.person.photo'));
});
