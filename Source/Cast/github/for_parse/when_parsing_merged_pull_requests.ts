// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mergedPullRequestQuery, parseMergedPullRequests, type PullRequestNode } from '../parse';

describe('when parsing merged pull requests', () => {
    const nodes: PullRequestNode[] = [
        { title: 'Older', number: 1, url: 'https://github.com/Cratis/Arc/pull/1', mergedAt: '2026-01-01T00:00:00Z', repository: { nameWithOwner: 'Cratis/Arc', isPrivate: false } },
        { title: 'Secret', number: 2, url: 'https://github.com/Cratis/Hidden/pull/2', mergedAt: '2026-03-01T00:00:00Z', repository: { nameWithOwner: 'Cratis/Hidden', isPrivate: true } },
        { title: 'Newer', number: 3, url: 'https://github.com/Cratis/Chronicle/pull/3', mergedAt: '2026-02-01T00:00:00Z', repository: { nameWithOwner: 'Cratis/Chronicle', isPrivate: false } },
        { title: 'Open', number: 4, url: 'https://github.com/Cratis/Arc/pull/4', mergedAt: null, repository: { nameWithOwner: 'Cratis/Arc', isPrivate: false } },
        { title: 'Unknown visibility', number: 5, url: 'https://github.com/Cratis/Arc/pull/5', mergedAt: '2026-04-01T00:00:00Z', repository: { nameWithOwner: 'Cratis/Arc' } },
        null,
    ];
    const feed = parseMergedPullRequests(nodes, 10);

    it('should only keep merged pull requests in public repositories', () => feed.map(pullRequest => pullRequest.number).should.deep.equal([3, 1]));
    it('should order newest first', () => feed[0]!.title.should.equal('Newer'));
    it('should carry owner and name', () => feed[0]!.repository.should.equal('Cratis/Chronicle'));
    it('should respect the limit', () => parseMergedPullRequests(nodes, 1).should.have.lengthOf(1));
    it('should search public merged pull requests in every organization', () =>
        mergedPullRequestQuery('woksin', ['Cratis', 'dolittle']).should.equal('author:woksin org:Cratis org:dolittle is:public is:pr is:merged'));
});
