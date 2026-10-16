// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonResult } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when counts are not counts', () => {
    const withTotal = (total: unknown): CastJsonResult => {
        const document = aCastJson();
        (at(document, 'profile', 'github', 'contributions'))['total'] = total;
        return profileFromCastJson(document, 'ada');
    };
    const githubOf = (result: CastJsonResult) => ('profile' in result ? result.profile.github : 'refused');

    it('should drop a capture with a negative count', () => (githubOf(withTotal(-1)) === undefined).should.be.true);
    it('should drop a capture with a fraction', () => (githubOf(withTotal(1.5)) === undefined).should.be.true);
    it('should drop a capture with a count that is not finite', () => (githubOf(withTotal(Number.POSITIVE_INFINITY)) === undefined).should.be.true);
    it('should drop a capture with a count that is not a number', () => (githubOf(withTotal('12')) === undefined).should.be.true);
});
