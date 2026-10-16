// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { z } from 'zod';
import { isInstant } from '../config/calendar';

const instant = z.string().max(64).refine(isInstant, 'Use an ISO 8601 date and time on a real day');

/** The most a writing capture holds; the build that writes one keeps to the same limits. */
export const writingLimits = { sources: 20, posts: 300, title: 300, description: 2000, tags: 30, tag: 100 } as const;

/** One captured post. */
export const postSchema = z.object({
    title: z.string().min(1).max(writingLimits.title),
    url: z.url({ protocol: /^https?$/ }),
    date: z.string().max(64).regex(/^\d{4}-\d{2}-\d{2}/, 'Start with YYYY-MM-DD').refine(isInstant, 'Use an ISO 8601 date on a real day'),
    minutes: z.number().min(0).max(10_000).optional(),
    description: z.string().max(writingLimits.description).default(''),
    tags: z.array(z.string().max(writingLimits.tag)).max(writingLimits.tags).default([]),
});

/** Writing captured from feeds, as it appears in cast.json. */
export const writingSnapshotSchema = z.object({
    fetchedAt: instant.optional(),
    sources: z.array(z.url({ protocol: /^https?$/ })).max(writingLimits.sources).default([]),
    posts: z.array(postSchema).max(writingLimits.posts).default([]),
});
