// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import { CastConfigError } from '../CastConfigError';
import { minimalCast } from './given/a_minimal_cast';

describe('when a field is invalid', () => {
    let error: CastConfigError;

    beforeEach(() => {
        try {
            parseCast(minimalCast.replace('https://ada.example', 'not a url') + '\ntheme:\n  accent: violet\n');
        } catch (caught) {
            error = caught as CastConfigError;
        }
    });

    it('should report the site url by path', () => error.problems.some(problem => problem.startsWith('site.url')).should.be.true);
    it('should report the accent by path', () => error.problems.some(problem => problem.startsWith('theme.accent')).should.be.true);
});
