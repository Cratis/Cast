// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import { ThemeMode } from '../ThemeMode';
import type { CastConfig } from '../CastConfig';
import { minimalCast } from './given/a_minimal_cast';

describe('when parsing a minimal file', () => {
    let config: CastConfig;

    beforeEach(() => {
        config = parseCast(minimalCast);
    });

    it('should default the accent to Cratis violet', () => config.theme.accent.should.equal('#8b5cf6'));
    it('should default the theme to dark', () => config.theme.mode.should.equal(ThemeMode.Dark));
    it('should count merged pull requests in the Cratis organization', () => config.github.orgs.should.deep.equal(['Cratis']));
    it('should use the handle as the GitHub login', () => config.github.login.should.equal('ada'));
    it('should have no career events', () => config.career.events.should.be.empty);
    it('should leave the cratis section out', () => (config.cratis === undefined).should.be.true);
});
