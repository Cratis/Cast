// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonResult } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when a date is impossible', () => {
    describe('in the contribution calendar', () => {
        let result: CastJsonResult;

        beforeEach(() => {
            const document = aCastJson();
            (at(document, 'profile', 'github', 'contributions', 'weeks', 0))['start'] = '2026-99-99';
            result = profileFromCastJson(document, 'ada');
        });

        it('should keep the profile', () => ('profile' in result).should.be.true);
        it('should drop the github capture, so the directory uses its own', () => (('profile' in result) && result.profile.github === undefined)!.should.be.true);
        it('should report it dropped the capture', () => (('dropped' in result) && result.dropped)!.should.include('profile.github'));
    });

    describe('on a pull request', () => {
        let result: CastJsonResult;

        beforeEach(() => {
            const document = aCastJson();
            (at(document, 'profile', 'github', 'mergedPullRequests', 'latest', 0))['mergedAt'] = '2026-02-30T10:00:00Z';
            result = profileFromCastJson(document, 'ada');
        });

        it('should drop the github capture', () => (('profile' in result) && result.profile.github === undefined)!.should.be.true);
    });

    describe('in the career', () => {
        let result: CastJsonResult;

        beforeEach(() => {
            const document = aCastJson();
            (at(document, 'profile', 'cast', 'career', 'events', 0))['date'] = '2018-13';
            result = profileFromCastJson(document, 'ada');
        });

        it('should refuse the file', () => ('problems' in result).should.be.true);
        it('should name the date', () => (('problems' in result) && result.problems.join())!.should.contain('profile.cast.career.events.0.date'));
    });
});
