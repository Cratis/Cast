// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Build-time sources a stat can take its value from instead of the value written in cast.yaml. */
export enum LiveStat {
    /** GitHub contributions in the last year, floored to hundreds. */
    ContributionsLastYear = 'contributionsLastYear',

    /** Merged public pull requests in the configured organizations, floored to hundreds. */
    MergedPullRequests = 'mergedPullRequests',

    /** Number of tracked repositories where the person is the top human committer. */
    RankOneRepositories = 'rankOneRepositories',

    /** Number of entries in `cratis.clientLanguages`. */
    ClientLanguages = 'clientLanguages',
}
