// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import type { CastConfig } from '../CastConfig';
import { minimalCast } from './given/a_minimal_cast';

describe('when parsing career events without seq', () => {
    let config: CastConfig;

    beforeEach(() => {
        config = parseCast(`${minimalCast}
career:
  events:
    - { date: '2020-01', type: StudiesStarted, title: Studies, summary: Started. }
    - { date: '2023-05', type: EmploymentStarted, title: Engineer, org: Acme, role: Engineer, summary: Joined. }
`);
    });

    it('should number them in file order', () => config.career.events.map(event => event.seq).should.deep.equal([1, 2]));
    it('should keep the event types', () => config.career.events.map(event => event.type).should.deep.equal(['StudiesStarted', 'EmploymentStarted']));
});
