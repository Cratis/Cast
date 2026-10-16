// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../../../config/parseCast';
import { minimalCast } from '../../../config/for_parseCast/given/a_minimal_cast';
import { emptySnapshot, type GitHubSnapshot } from '../../../github/GitHubSnapshot';
import { gitHubView } from '../github';

const config = parseCast(`${minimalCast}
stats:
  - { value: 3150, suffix: '+', label: merged pull requests, live: mergedPullRequests }
`);
const snapshot = (total: number): GitHubSnapshot => ({
    ...emptySnapshot('ada', ['Cratis']),
    fetchedAt: '2026-10-16T00:00:00.000Z',
    mergedPullRequests: { total, byOrg: {}, latest: [] },
});

describe('when merged pull requests were not captured', () => {
    describe('and cast.yaml states a figure', () => {
        const view = gitHubView(config, snapshot(0));

        it('should fall back to the stated figure', () => view.mergedPrTotal.should.equal(3150));
        it('should mark it self-reported', () => view.mergedPrSelfReported.should.be.true);
        it('should not date it as a snapshot', () => view.mergedPrStatus.should.equal('self-reported'));
    });

    describe('and they were captured', () => {
        const view = gitHubView(config, snapshot(42));

        it('should use the capture', () => view.mergedPrTotal.should.equal(42));
        it('should not mark it self-reported', () => view.mergedPrSelfReported.should.be.false);
        it('should date it as of the capture', () => view.mergedPrStatus.should.equal('as of Oct 16, 2026'));
    });
});
