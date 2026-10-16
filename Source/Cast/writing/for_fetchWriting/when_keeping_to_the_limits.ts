// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { withinLimits } from '../fetchWriting';
import type { Post } from '../WritingSnapshot';
import { writingLimits, writingSnapshotSchema } from '../writingSnapshotSchema';

const post = (index: number, change: Partial<Post> = {}): Post => ({ title: `Post ${index}`, url: `https://ada.example/${index}`, date: '2026-10-16T00:00:00.000Z', description: '', tags: [], ...change });

describe('when keeping to the limits', () => {
    const kept = withinLimits([
        post(0, { title: 'x'.repeat(1_000), description: 'y'.repeat(5_000), tags: Array.from({ length: 50 }, (_, index) => `tag-${index}`) }),
        post(1, { date: '2026-02-30' }),
        post(2, { title: '' }),
        ...Array.from({ length: 400 }, (_, index) => post(index + 3)),
    ]);

    it('should keep at most the posts a reader takes', () => kept.length.should.equal(writingLimits.posts));
    it('should shorten long titles', () => kept.find(entry => entry.url.endsWith('/0'))!.title.length.should.equal(writingLimits.title));
    it('should shorten long descriptions', () => kept.find(entry => entry.url.endsWith('/0'))!.description.length.should.equal(writingLimits.description));
    it('should keep at most the tags a reader takes', () => kept.find(entry => entry.url.endsWith('/0'))!.tags.length.should.equal(writingLimits.tags));
    it('should leave out a post on an impossible day', () => kept.some(entry => entry.url.endsWith('/1')).should.be.false);
    it('should leave out a post without a title', () => kept.some(entry => entry.url.endsWith('/2')).should.be.false);
    it('should write what a reader accepts', () => writingSnapshotSchema.safeParse({ sources: [], posts: kept }).success.should.be.true);
});
