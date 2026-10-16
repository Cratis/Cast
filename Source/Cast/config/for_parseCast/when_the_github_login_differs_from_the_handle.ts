// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import { CastConfigError } from '../CastConfigError';
import { minimalCast } from './given/a_minimal_cast';

describe('when the GitHub login differs from the handle', () => {
    let error: unknown;

    beforeEach(() => {
        try {
            parseCast(`${minimalCast}\ngithub:\n  login: woksin\n`);
        } catch (caught) {
            error = caught;
        }
    });

    it('should refuse the file', () => error!.should.be.instanceOf(CastConfigError));
    it('should point at github.login', () => (error as CastConfigError).problems[0]!.should.match(/^github\.login/));
});

describe('when the GitHub login repeats the handle in another case', () => {
    const config = parseCast(`${minimalCast}\ngithub:\n  login: ADA\n`);

    it('should accept it as the same identity', () => config.github.login.toLowerCase().should.equal(config.person.handle.toLowerCase()));
});
