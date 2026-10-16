// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isCalendarDate, isCalendarMonth, isInstant, isPartialDate } from '../calendar';

describe('when checking dates', () => {
    it('should accept a real day', () => isCalendarDate('2024-02-29').should.be.true);
    it('should refuse a day that does not exist', () => isCalendarDate('2026-02-29').should.be.false);
    it('should refuse an impossible day', () => isCalendarDate('2026-99-99').should.be.false);
    it('should refuse a day with more after it', () => isCalendarDate('2026-01-01x').should.be.false);
    it('should accept a year', () => isCalendarMonth('2026').should.be.true);
    it('should accept a month', () => isCalendarMonth('2026-12').should.be.true);
    it('should refuse month thirteen', () => isCalendarMonth('2026-13').should.be.false);
    it('should refuse month zero', () => isCalendarMonth('2026-00').should.be.false);
    it('should accept a day where a partial date is allowed', () => isPartialDate('2026-10-16').should.be.true);
    it('should refuse an impossible day where a partial date is allowed', () => isPartialDate('2026-10-32').should.be.false);
    it('should accept an ISO 8601 date and time', () => isInstant('2026-10-16T10:00:00.000Z').should.be.true);
    it('should refuse a date and time on an impossible day', () => isInstant('2026-02-30T10:00:00Z').should.be.false);
    it('should refuse a date and time at an impossible hour', () => isInstant('2026-10-16T25:00:00Z').should.be.false);
    it('should refuse something that is not a date', () => isInstant('soon').should.be.false);
});
