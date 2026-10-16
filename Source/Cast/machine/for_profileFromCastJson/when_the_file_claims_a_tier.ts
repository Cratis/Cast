// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when the file claims a tier', () => {
    const document = aCastJson();
    at(document, 'verification')['claimedTier'] = 'core';
    at(document, 'profile', 'cast')['tier'] = 'core';
    document['tier'] = 'partner';
    const result = profileFromCastJson(document, 'ada');

    it('should still read the profile', () => ('profile' in result).should.be.true);
    it('should report the tier it ignored', () => ('profile' in result && result.dropped.includes('profile.cast.tier')).should.be.true);
    it('should carry no tier anywhere', () => JSON.stringify('profile' in result ? result.profile : {}).should.not.match(/"tier"|claimedTier/));
});
