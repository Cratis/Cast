// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DirectoryMember } from './DirectoryMember';

/** A person's commits in public Cratis repositories, from the contributors API. */
export type DiscoveredActivity = {
    commits: number;
    /** Their top repositories, most commits first. */
    repositories: string[];
    /** Commits and rank among human committers in each of those repositories (first 100 committers per repository). */
    standings?: Record<string, { commits: number; rank: number }>;
};

/** Merged pull request count for one login and when it was checked. */
export type VerifiedCount = { mergedPullRequests: number; checkedAt: string };

/** The directory's data, kept at .cast/directory.json and committed as the offline fallback. */
export type DirectorySnapshot = {
    version: 1;
    fetchedAt?: string;
    builtAt: string;
    /** Registry members (Core and Partner), in registry order. */
    members: DirectoryMember[];
    /** Discovered people with verified merged pull requests, most first. */
    contributors: DirectoryMember[];
    /** Discovered people whose count has not been verified yet. They get no page until it is. */
    pending: number;
    counts: Record<string, VerifiedCount>;
    profiles: Record<string, Pick<DirectoryMember, 'name' | 'avatarUrl' | 'bio' | 'location'>>;
    activity: Record<string, DiscoveredActivity>;
};
