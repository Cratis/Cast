// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Typed views over the GitHub data captured at build time.
import type { z } from 'zod';
import type { CastConfig } from '../../config/CastConfig';
import type { cratisRepositorySchema, projectSchema } from '../../config/castSchema';
import type { GitHubSnapshot } from '../../github/GitHubSnapshot';

export type { PullRequest, ContributionWeek as Week } from '../../github/GitHubSnapshot';
export type CratisRepo = z.output<typeof cratisRepositorySchema> & { role: string };
export type Project = z.output<typeof projectSchema>;

const roleFor = (repo: z.output<typeof cratisRepositorySchema>, rank: number): string =>
    repo.founded
        ? (rank === 1 ? 'Founder & lead' : 'Founder')
        : rank === 1
            ? (repo.role?.startsWith('#') ? '#1 committer' : 'Lead developer')
            : rank === 2
                ? (repo.group === 'client' ? '#2 contributor' : '#2 all-time')
                : 'Contributor';

/** owner/name of a github.com URL. */
export const repositoryOf = (url: string): string | undefined => url.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)/i)?.[1];

/** Formats a capture date as "Oct 16, 2026", or "the last build" when unknown. */
export const formatSnapshotDate = (date: string | undefined): string =>
    date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'the last build';

/** What the sections read from the GitHub snapshot, with cast.yaml values as fallbacks. */
export type GitHubView = {
    github: GitHubSnapshot;
    /** Merged pull requests across the configured organizations, falling back to a stat written in cast.yaml. */
    mergedPrTotal: number;
    /** Floors to hundreds for an honest "3,100+" style figure. */
    mergedPrFloor: number;
    /** Per-repository figures prefer the snapshot; values written in cast.yaml are fallbacks only. */
    cratisRepos: CratisRepo[];
    /** Projects with versions taken from the latest GitHub release when one was captured. */
    liveProjects: Project[];
    /** Stars for an owner/name, if tracked. */
    starsFor: (repository: string) => number | undefined;
    /** The capture date of a snapshot, by default this one. */
    snapshotDate: (date?: string) => string;
    /** Repository names in the live feed, most recent first, without duplicates. */
    liveRepos: string[];
};

/** Builds the GitHub view for one profile. */
export function gitHubView(config: CastConfig, github: GitHubSnapshot): GitHubView {
    const mergedPrTotal = github.mergedPullRequests.total || (config.stats.find(stat => stat.live === 'mergedPullRequests')?.value ?? 0);
    const cratisRepos = (config.cratis?.repos ?? []).map(repo => {
        const counts = repo.url ? github.repositories[`Cratis/${repo.name}`] : undefined;
        if (!counts) return { ...repo, role: repo.role ?? roleFor(repo, repo.rank) };
        return { ...repo, ...counts, role: roleFor(repo, counts.rank) };
    });
    const liveProjects = config.projects.map(project => {
        const repository = repositoryOf(project.url);
        const release = repository ? Object.entries(github.releases).find(([name]) => name.toLowerCase() === repository.toLowerCase())?.[1] : undefined;
        return release ? { ...project, version: release.tag } : project;
    });
    return {
        github,
        mergedPrTotal,
        mergedPrFloor: mergedPrTotal >= 100 ? Math.floor(mergedPrTotal / 100) * 100 : mergedPrTotal,
        cratisRepos,
        liveProjects,
        starsFor: repository => Object.entries(github.stars).find(([name]) => name.toLowerCase() === repository.toLowerCase())?.[1],
        snapshotDate: (date = github.fetchedAt) => formatSnapshotDate(date),
        liveRepos: [...new Set(github.mergedPullRequests.latest.map(pullRequest => pullRequest.repository.split('/')[1] ?? pullRequest.repository))],
    };
}
