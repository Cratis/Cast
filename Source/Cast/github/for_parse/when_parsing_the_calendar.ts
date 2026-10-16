// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCalendar } from '../parse';

describe('when parsing the calendar', () => {
    const weeks = parseCalendar([
        { contributionDays: [{ date: '2026-01-04', contributionCount: 1 }, { date: '2026-01-05', contributionCount: 3 }] },
        { contributionDays: [] },
    ]);

    it('should drop empty weeks', () => weeks.should.have.lengthOf(1));
    it('should start a week on its first day', () => weeks[0]!.start.should.equal('2026-01-04'));
    it('should keep daily counts', () => weeks[0]!.counts.should.deep.equal([1, 3]));
});
