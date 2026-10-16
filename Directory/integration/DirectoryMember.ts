// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Tier, TierSource } from '@cratis/cast/badges';

/** What a member's own Cast site says about them, read from its /cast.json. */
export type CastProfile = {
    url: string;
    title?: string;
    tagline?: string;
    castJsonVersion?: number;
};

/** One person in the directory: a registry member or a discovered contributor. */
export type DirectoryMember = {
    handle: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    tier?: Tier;
    source: TierSource;
    since?: string;
    role?: string;
    company?: string;
    site?: string;
    /** Line in Registry/members.yaml, for "verified from" links. */
    registryLine?: number;
    /** Merged public pull requests in the Cratis organization, when verified. */
    mergedPullRequests?: number;
    /** Commits on default branches of public Cratis repositories, from the contributors API. */
    commits?: number;
    /** Public Cratis repositories they have commits in, most commits first. */
    repositories?: string[];
    cast?: CastProfile;
};
