// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonResult } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when the profile cannot render with its captures', () => {
    describe('and only the captures are at fault', () => {
        let result: CastJsonResult;

        beforeEach(() => {
            const document = aCastJson();
            (at(document, 'profile', 'github', 'contributions', 'weeks', 0))['start'] = '2026-99-99';
            at(document, 'profile')['writing'] = { sources: [], posts: [{ title: 'Post', url: 'https://ada.example/post', date: '2026-02-30', description: '', tags: [] }] };
            result = profileFromCastJson(document, 'ada');
        });

        it('should keep the profile', () => ('profile' in result).should.be.true);
        it('should discard the github capture', () => (('profile' in result) && result.profile.github === undefined)!.should.be.true);
        it('should discard the writing capture', () => (('profile' in result) && result.profile.writing === undefined)!.should.be.true);
    });

    describe('and the profile itself is at fault too', () => {
        let result: CastJsonResult;

        beforeEach(() => {
            const document = aCastJson();
            (at(document, 'profile', 'github', 'contributions', 'weeks', 0))['start'] = '2026-99-99';
            // Valid to the schema, but the pages cannot show the month.
            (at(document, 'profile', 'cast'))['now'] = { since: '2026-13' };
            result = profileFromCastJson(document, 'ada');
        });

        it('should refuse the file', () => ('problems' in result).should.be.true);
        it('should say it does not render', () => (('problems' in result) && result.problems.join())!.should.contain('does not render'));
        it('should return no captures for anything to fall back on', () => ('profile' in result).should.be.false);
    });
});
