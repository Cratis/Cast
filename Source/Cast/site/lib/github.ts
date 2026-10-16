// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Typed access to the GitHub data captured at build time.
import type { z } from 'zod';
import type { cratisRepositorySchema, projectSchema } from '../../config/castSchema';
import { config, cratis, github, projects } from '../data';

export type { PullRequest, ContributionWeek as Week } from '../../github/GitHubSnapshot';
export type CratisRepo = z.output<typeof cratisRepositorySchema> & { role: string };
export type Project = z.output<typeof projectSchema>;

export { github };

/** Merged pull requests across the configured organizations, falling back to a stat written in cast.yaml. */
export const mergedPrTotal: number = github.mergedPullRequests.total || (config.stats.find(stat => stat.live === 'mergedPullRequests')?.value ?? 0);

/** Floors to hundreds for an honest "3,100+" style figure. */
export const mergedPrFloor: number = mergedPrTotal >= 100 ? Math.floor(mergedPrTotal / 100) * 100 : mergedPrTotal;

const roleFor = (repo: z.output<typeof cratisRepositorySchema>, rank: number): string =>
    repo.founded
        ? (rank === 1 ? 'Founder & lead' : 'Founder')
        : rank === 1
            ? (repo.role?.startsWith('#') ? '#1 committer' : 'Lead developer')
            : rank === 2
                ? (repo.group === 'client' ? '#2 contributor' : '#2 all-time')
                : 'Contributor';

/** Per-repository figures prefer the snapshot; values written in cast.yaml are fallbacks only. */
export const cratisRepos: CratisRepo[] = (cratis?.repos ?? []).map(repo => {
    const counts = repo.url ? github.repositories[`Cratis/${repo.name}`] : undefined;
    if (!counts) return { ...repo, role: repo.role ?? roleFor(repo, repo.rank) };
    return { ...repo, ...counts, role: roleFor(repo, counts.rank) };
});

/** owner/name of a github.com URL. */
export const repositoryOf = (url: string): string | undefined => url.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)/i)?.[1];

/** Projects with versions taken from the latest GitHub release when one was captured. */
export const liveProjects: Project[] = projects.map(project => {
    const repository = repositoryOf(project.url);
    const release = repository ? Object.entries(github.releases).find(([name]) => name.toLowerCase() === repository.toLowerCase())?.[1] : undefined;
    return release ? { ...project, version: release.tag } : project;
});

/** Stars for an owner/name, if tracked. */
export const starsFor = (repository: string): number | undefined =>
    Object.entries(github.stars).find(([name]) => name.toLowerCase() === repository.toLowerCase())?.[1];

export const snapshotDate = (date = github.fetchedAt): string =>
    date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'the last build';

/** Repository names in the live feed, most recent first, without duplicates. */
export const liveRepos: string[] = [...new Set(github.mergedPullRequests.latest.map(pullRequest => pullRequest.repository.split('/')[1] ?? pullRequest.repository))];
