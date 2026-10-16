// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { z } from 'zod';
import { isCalendarDate, isInstant } from '../config/calendar';

/** A whole, finite, non-negative number. */
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const repository = z.string().max(200).regex(/^[\w.-]+\/[\w.-]+$/, 'Use owner/name');
const maximumEntries = 500;
const fewEntries = (value: object) => Object.keys(value).length <= maximumEntries;
const tooMany = `At most ${maximumEntries} entries`;
const instant = z.string().max(40).refine(isInstant, 'Use an ISO 8601 date and time on a real day');
const https = z.url({ protocol: /^https$/ });

/** A merged pull request; the URL must be the pull request on github.com. */
export const pullRequestSchema = z.object({
    title: z.string().min(1).max(300),
    repository,
    number: z.number().int().positive(),
    url: z.url({ protocol: /^https$/, hostname: /^github\.com$/ }),
    mergedAt: instant,
});

export const contributionWeekSchema = z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(isCalendarDate, 'Use a real day: YYYY-MM-DD'),
    counts: z.array(count).max(7),
});

/** Public GitHub data a profile renders: the build-time snapshot a Cast site captures, as it appears in cast.json. */
export const gitHubSnapshotSchema = z.object({
    fetchedAt: instant.optional(),
    login: z.string().min(1).max(39).describe('GitHub login the data was captured for. Must be the profile handle.'),
    orgs: z.array(z.string().min(1).max(100)).max(20).default([]),
    profile: z.object({
        login: z.string().min(1).max(39),
        name: z.string().max(200).optional(),
        bio: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        blog: z.string().max(500).optional(),
        avatarUrl: https.optional(),
        followers: count.optional(),
        publicRepositories: count.optional(),
    }).optional(),
    contributions: z.object({
        total: count,
        commits: count.optional(),
        weeks: z.array(contributionWeekSchema).max(60).default([]),
    }).default({ total: 0, weeks: [] }).describe('The contribution calendar of the last year, one entry per week starting on Sunday.'),
    mergedPullRequests: z.object({
        total: count,
        byOrg: z.record(z.string().max(100), count).refine(fewEntries, tooMany).default({}),
        latest: z.array(pullRequestSchema).max(30).default([]),
    }).default({ total: 0, byOrg: {}, latest: [] }),
    repositories: z.record(repository, z.object({ commits: count, rank: count, prs: count })).refine(fewEntries, tooMany).default({}).describe('Standing in each tracked repository, by owner/name.'),
    releases: z.record(repository, z.object({ tag: z.string().min(1).max(100), publishedAt: instant, url: https })).refine(fewEntries, tooMany).default({}),
    stars: z.record(repository, count).refine(fewEntries, tooMany).default({}),
});
