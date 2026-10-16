// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A merged pull request in the live feed. */
export type PullRequest = {
    title: string;
    /** owner/name */
    repository: string;
    number: number;
    url: string;
    mergedAt: string;
};

/** One week of the contribution calendar, starting on `start` (a Sunday). */
export type ContributionWeek = { start: string; counts: number[] };

/** A person's standing in one repository, among human committers only. */
export type RepositoryStanding = { commits: number; rank: number; prs: number };

/** A release of a tracked repository. */
export type Release = { tag: string; publishedAt: string; url: string };

/** Public GitHub profile fields. */
export type GitHubProfile = {
    login: string;
    name?: string;
    bio?: string;
    location?: string;
    blog?: string;
    avatarUrl?: string;
    followers?: number;
    publicRepositories?: number;
};

/** Everything Cast captures from GitHub at build time. Only public data. */
export type GitHubSnapshot = {
    fetchedAt?: string;
    login: string;
    orgs: string[];
    profile?: GitHubProfile;
    contributions: { total: number; commits?: number; weeks: ContributionWeek[] };
    mergedPullRequests: {
        /** Across every configured organization. */
        total: number;
        /** Per organization, including Cratis even when it is not configured (it decides Contributor). */
        byOrg: Record<string, number>;
        latest: PullRequest[];
    };
    /** By owner/name. */
    repositories: Record<string, RepositoryStanding>;
    /** By owner/name. */
    releases: Record<string, Release>;
    /** By owner/name. */
    stars: Record<string, number>;
};

/** A snapshot with nothing in it, for first builds without a token. */
export const emptySnapshot = (login: string, orgs: string[]): GitHubSnapshot => ({
    login,
    orgs,
    contributions: { total: 0, weeks: [] },
    mergedPullRequests: { total: 0, byOrg: {}, latest: [] },
    repositories: {},
    releases: {},
    stars: {},
});
