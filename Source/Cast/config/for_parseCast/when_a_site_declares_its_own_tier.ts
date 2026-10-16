// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import { CastConfigError } from '../CastConfigError';
import { minimalCast } from './given/a_minimal_cast';

describe('when a site declares its own tier', () => {
    let error: unknown;

    beforeEach(() => {
        try {
            parseCast(`${minimalCast}\ntier: core\n`);
        } catch (caught) {
            error = caught;
        }
    });

    it('should refuse the file', () => error!.should.be.instanceOf(CastConfigError));
    it('should explain where tiers come from', () => (error as CastConfigError).message.should.contain('registry'));
});
