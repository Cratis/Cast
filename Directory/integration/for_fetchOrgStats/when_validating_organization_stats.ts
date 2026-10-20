// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fixture from './given/org-stats.json';
import { isOrgStats } from '../fetchOrgStats';

const snapshot = () => structuredClone(fixture);

describe('when validating organization stats', () => {
    it('should accept the display fields with additional publisher fields', () => isOrgStats({ ...fixture, futureField: {} }).should.be.true);
    it('should accept an empty welcome list', () => {
        const value = snapshot();
        value.contributors.firstTime = [];
        isOrgStats(value).should.be.true;
    });
    it('should accept an absent display name', () => {
        const { name: _name, ...person } = fixture.contributors.firstTime[0]!;
        isOrgStats({ ...fixture, contributors: { ...fixture.contributors, firstTime: [person] } }).should.be.true;
    });
    it('should accept zero activity', () => {
        const value = snapshot();
        value.releases.last7Days = 0;
        value.contributors.activeLast30Days = 0;
        isOrgStats(value).should.be.true;
    });

    for (const invalid of [null, [], {}, { schemaVersion: 2 }, { ...fixture, contributors: null }, { ...fixture, generatedAt: 'yesterday' }]) {
        it(`should reject an invalid snapshot ${JSON.stringify(invalid)}`, () => isOrgStats(invalid).should.be.false);
    }

    for (const field of ['last7Days', 'last30Days'] as const) {
        for (const invalid of [-1, 1.5, '18', null, undefined]) {
            it(`should reject invalid ${field} counts of ${invalid}`, () => {
                isOrgStats({ ...fixture, releases: { ...fixture.releases, [field]: invalid } }).should.be.false;
                isOrgStats({ ...fixture, mergedPullRequests: { ...fixture.mergedPullRequests, [field]: invalid } }).should.be.false;
            });
        }
    }
    it('should reject invalid release kinds', () => isOrgStats({ ...fixture, releases: { ...fixture.releases, last7DaysByKind: { major: -1, minor: 0 } } }).should.be.false);
    it('should reject an invalid active count', () => isOrgStats({ ...fixture, contributors: { ...fixture.contributors, activeLast30Days: '3' } }).should.be.false);
    it('should reject a missing first-time list', () => isOrgStats({ ...fixture, contributors: { activeLast30Days: 3 } }).should.be.false);

    for (const [field, invalid] of Object.entries({
        login: '../unbuilt', name: 42, avatarUrl: 'javascript:alert(1)', profileUrl: 'http://github.com/ada',
        firstMergedAt: 'not a date', repository: '', pullRequestUrl: 'javascript:alert(1)', pullRequestTitle: null,
    })) {
        it(`should reject an invalid contributor ${field}`, () => {
            isOrgStats({ ...fixture, contributors: { ...fixture.contributors, firstTime: [{ ...fixture.contributors.firstTime[0], [field]: invalid }] } }).should.be.false;
        });
    }
});
