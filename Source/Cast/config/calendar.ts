// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})/;

/** True when `year`, `month` and `day` name a real day: '2026-02-30' and '2026-99-99' do not. */
function isRealDay(year: number, month: number, day: number): boolean {
    if (year < 1000 || month < 1 || month > 12 || day < 1) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** True for a real calendar day written as 'YYYY-MM-DD'. */
export function isCalendarDate(value: string): boolean {
    const match = dayPattern.exec(value);
    return match !== null && match[0].length === value.length && isRealDay(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** True for 'YYYY' or 'YYYY-MM' with a real month. */
export function isCalendarMonth(value: string): boolean {
    const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
    return match !== null && isRealDay(Number(match[1]), Number(match[2] ?? 1), 1);
}

/** True for 'YYYY-MM-DD', 'YYYY-MM' or 'YYYY', each a real day or month. */
export function isPartialDate(value: string): boolean {
    return value.length === 10 ? isCalendarDate(value) : isCalendarMonth(value);
}

/** True for an ISO 8601 date or date and time that starts with a real calendar day and that `Date` can read. */
export function isInstant(value: string): boolean {
    const match = dayPattern.exec(value);
    return match !== null && isRealDay(Number(match[1]), Number(match[2]), Number(match[3])) && Number.isFinite(Date.parse(value));
}
