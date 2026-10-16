// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when the identity is someone else', () => {
    describe('and the handle is another login', () => {
        const result = profileFromCastJson(aCastJson(), 'grace');

        it('should refuse it', () => ('problems' in result).should.be.true);
    });

    describe('and the profile inside names another person', () => {
        const document = aCastJson();
        at(document, 'profile', 'cast', 'person')['handle'] = 'grace';
        const result = profileFromCastJson(document, 'ada');

        it('should refuse it', () => ('problems' in result).should.be.true);
    });

    describe('and only the github snapshot is for another login', () => {
        const document = aCastJson();
        at(document, 'profile', 'github')['login'] = 'grace';
        const result = profileFromCastJson(document, 'ada');

        it('should keep the profile', () => ('profile' in result).should.be.true);
        it('should drop the snapshot', () => ('profile' in result && result.profile.github === undefined).should.be.true);
    });
});
