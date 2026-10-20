// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { TierSource } from '@cratis/cast/badges';
import fixture from '../../../integration/for_fetchOrgStats/given/org-stats.json';
import { contributorProfileUrl } from '../firstTimeContributors';

const contributor = fixture.contributors.firstTime[0]!;

describe('when linking first-time contributors', () => {
    it('should link to a registry member profile, matching the login without case', () => {
        contributorProfileUrl(contributor, [{ handle: 'woksin', source: TierSource.Registry }]).should.equal('/woksin/');
    });
    it('should link to a discovered contributor profile as well', () => {
        contributorProfileUrl(contributor, [{ handle: 'WOKSIN', source: TierSource.Contributions }]).should.equal('/woksin/');
    });
    it('should link to GitHub when no directory page exists', () => {
        contributorProfileUrl(contributor, []).should.equal(contributor.profileUrl);
    });
    it('should not mistake an unrelated member for the contributor', () => {
        contributorProfileUrl(contributor, [{ handle: 'someone-else', source: TierSource.Registry }]).should.equal(contributor.profileUrl);
    });
});
