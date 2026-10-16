// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isBot, standingAmongHumans } from '../parse';

describe('when ranking contributors', () => {
    const contributors = [
        { login: 'dependabot[bot]', type: 'Bot', contributions: 9000 },
        { login: 'cratis-bot', type: 'User', contributions: 5000 },
        { login: 'einari', type: 'User', contributions: 4000 },
        { login: 'Woksin', type: 'User', contributions: 3800 },
        { login: 'ada', type: 'User', contributions: 10 },
    ];

    it('should exclude bots from the ranking', () => standingAmongHumans(contributors, 'woksin').rank.should.equal(2));
    it('should report the commits', () => standingAmongHumans(contributors, 'woksin').commits.should.equal(3800));
    it('should rank zero when absent', () => standingAmongHumans(contributors, 'grace').rank.should.equal(0));
    it('should treat bracket logins as bots', () => isBot({ login: 'renovate[bot]' }).should.be.true);
    it('should treat -bot logins as bots', () => isBot({ login: 'snyk-bot', type: 'User' }).should.be.true);
    it('should treat people as people', () => isBot({ login: 'einari', type: 'User' }).should.be.false);
});
