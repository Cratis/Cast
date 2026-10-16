// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { Tier } from '../../badges/Tier';
import { siteTier } from '../../integration/resolveData';
import { fetchGitHub, type GitHubFetchResult } from '../fetchGitHub';
import { emptySnapshot, type GitHubSnapshot } from '../GitHubSnapshot';

const profile = {
    data: {
        user: {
            login: 'ada', name: 'Ada', bio: null, location: null, websiteUrl: null, avatarUrl: null,
            followers: { totalCount: 1 }, repositories: { totalCount: 1 },
            contributionsCollection: { totalCommitContributions: 1, contributionCalendar: { totalContributions: 1, weeks: [] } },
        },
        merged: { issueCount: 0, nodes: [] },
    },
};

/** A snapshot the site owner edited to claim 12 merged Cratis pull requests. */
const editedSnapshot: GitHubSnapshot = { ...emptySnapshot('ada', ['Cratis']), mergedPullRequests: { total: 12, byOrg: { Cratis: 12 }, latest: [] } };

const fetchWith = async (search: () => Response): Promise<GitHubFetchResult> => {
    const stub = sinon.stub(globalThis, 'fetch').callsFake(async (input) =>
        String(input).includes('/graphql') ? new Response(JSON.stringify(profile)) : search());
    try {
        return (await fetchGitHub({ login: 'ada', orgs: ['Cratis'], repositories: [], releases: [], stars: [], searchDelayMilliseconds: 0 }, 'token', editedSnapshot, () => undefined))!;
    } finally {
        stub.restore();
    }
};

describe('when fetching contributor evidence', () => {
    describe('and the Cratis search fails while the profile succeeds', () => {
        let result: GitHubFetchResult;
        beforeEach(async () => {
            result = await fetchWith(() => new Response('rate limited', { status: 403 }));
        });

        it('should keep the previous count for display', () => result.snapshot.mergedPullRequests.byOrg['Cratis']!.should.equal(12));
        it('should have no fresh evidence', () => (result.fresh.cratisMergedPullRequests === undefined).should.be.true);
        it('should not make a contributor', () => (siteTier('ada', [], result.fresh.cratisMergedPullRequests).tier === undefined).should.be.true);
        it('should not persist evidence in the snapshot', () => JSON.stringify(result.snapshot).should.not.contain('fresh'));
    });

    describe('and the Cratis search finds none', () => {
        let result: GitHubFetchResult;
        beforeEach(async () => {
            result = await fetchWith(() => new Response(JSON.stringify({ total_count: 0, incomplete_results: false })));
        });

        it('should record zero as fresh evidence', () => result.fresh.cratisMergedPullRequests!.should.equal(0));
        it('should not make a contributor', () => (siteTier('ada', [], result.fresh.cratisMergedPullRequests).tier === undefined).should.be.true);
    });

    describe('and the Cratis search finds some', () => {
        let result: GitHubFetchResult;
        beforeEach(async () => {
            result = await fetchWith(() => new Response(JSON.stringify({ total_count: 3, incomplete_results: false })));
        });

        it('should make a contributor', () => siteTier('ada', [], result.fresh.cratisMergedPullRequests).tier!.should.equal(Tier.Contributor));
    });
});
