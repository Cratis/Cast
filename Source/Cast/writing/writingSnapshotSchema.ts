// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { z } from 'zod';

const instant = z.string().refine(value => Number.isFinite(Date.parse(value)), 'Use an ISO 8601 date and time');

/** Writing captured from feeds, as it appears in cast.json. */
export const writingSnapshotSchema = z.object({
    fetchedAt: instant.optional(),
    sources: z.array(z.url({ protocol: /^https?$/ })).max(20).default([]),
    posts: z.array(z.object({
        title: z.string().min(1).max(300),
        url: z.url({ protocol: /^https?$/ }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Start with YYYY-MM-DD'),
        minutes: z.number().min(0).optional(),
        description: z.string().max(2000).default(''),
        tags: z.array(z.string()).max(30).default([]),
    })).max(300).default([]),
});
