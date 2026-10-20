// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A person's first merged pull request in the public Cratis organization snapshot. */
export type FirstTimeContributor = {
    login: string;
    name?: string | null;
    avatarUrl: string;
    profileUrl: string;
    firstMergedAt: string;
    repository: string;
    pullRequestUrl: string;
    pullRequestTitle: string;
};

/** Only the schema v1 fields used by the directory; the publisher may add more. */
export type OrgStats = {
    schemaVersion: 1;
    generatedAt: string;
    releases: {
        last7Days: number;
        last30Days: number;
        last7DaysByKind: { major: number; minor: number };
    };
    mergedPullRequests: { last7Days: number; last30Days: number };
    contributors: { activeLast30Days: number; firstTime: FirstTimeContributor[] };
};
