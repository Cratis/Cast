// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cratisOrganization } from '../badges/constants';
import type { GitHubSnapshot, Release } from './GitHubSnapshot';
import { mergedPullRequestQuery, parseCalendar, parseMergedPullRequests, standingAmongHumans, type CalendarWeekNode, type ContributorEntry, type PullRequestNode } from './parse';

/** What to capture. */
export type GitHubRequest = {
    login: string;
    orgs: string[];
    /** owner/name repositories to compute commit rank and merged pull requests for. */
    repositories: string[];
    releases: string[];
    stars: string[];
    feedLimit?: number;
};

/** Receives warnings; the fetch itself never throws. */
export type Warn = (message: string) => void;

const userAgent = 'cratis-cast-build';
const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

/** Reads the token the build should use, if any. */
export const gitHubToken = (): string | undefined => process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;

async function rest(path: string, token: string): Promise<Response> {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: { authorization: `bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': userAgent },
        signal: AbortSignal.timeout(20_000),
    });
    if (response.status !== 200) throw new Error(`${path}: GitHub answered ${response.status}`);
    return response;
}

/** Runs a GraphQL query; throws on transport or GraphQL errors. */
export async function graphql<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': userAgent },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`GitHub GraphQL answered ${response.status} ${response.statusText}`);
    const body = await response.json() as { data?: T; errors?: { message: string }[] };
    if (body.errors?.length) throw new Error(`GraphQL errors: ${body.errors.map(error => error.message).join('; ')}`);
    if (!body.data) throw new Error('GraphQL returned no data');
    return body.data;
}

/** Counts search results. Search has its own 30-per-minute limit, so calls are spaced out. */
export async function searchCount(query: string, token: string): Promise<number> {
    await sleep(2100);
    const body = await (await rest(`/search/issues?q=${encodeURIComponent(query)}&per_page=1`, token)).json() as { total_count?: number; incomplete_results?: boolean };
    if (!Number.isInteger(body.total_count) || body.incomplete_results) throw new Error('incomplete search response');
    return body.total_count!;
}

async function contributors(repository: string, token: string): Promise<ContributorEntry[]> {
    const all: ContributorEntry[] = [];
    for (let page = 1; page <= 10; page++) {
        const path = `/repos/${repository}/contributors?per_page=100&page=${page}`;
        let response: Response;
        try {
            response = await rest(path, token);
        } catch (error) {
            // 202 means GitHub is still computing the statistics; one retry is enough for a build.
            if (!String(error).includes('answered 202')) throw error;
            await sleep(1000);
            response = await rest(path, token);
        }
        const items = await response.json() as ContributorEntry[];
        all.push(...items);
        if (!response.headers.get('link')?.includes('rel="next"')) break;
    }
    if (all.length === 0) throw new Error(`${repository}: no contributors returned`);
    return all;
}

const alias = (index: number) => `r${index}`;
const split = (repository: string): [string, string] => {
    const [owner, name] = repository.split('/');
    return [owner ?? '', name ?? ''];
};

/**
 * Captures public GitHub data. Returns undefined when nothing could be captured; per-repository failures keep
 * that repository's previous values. Never throws.
 */
export async function fetchGitHub(request: GitHubRequest, token: string, previous: GitHubSnapshot | undefined, warn: Warn): Promise<GitHubSnapshot | undefined> {
    const tracked = [...new Set([...request.releases, ...request.stars, ...request.repositories])];
    const repositoryFields = tracked.map((repository, index) => {
        const [owner, name] = split(repository);
        return `${alias(index)}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { nameWithOwner isPrivate stargazerCount latestRelease { tagName publishedAt url } }`;
    }).join('\n  ');

    const query = `query($login: String!, $prs: String!) {
  user(login: $login) {
    login name bio location websiteUrl avatarUrl
    followers { totalCount }
    repositories(privacy: PUBLIC) { totalCount }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
  ${repositoryFields}
  merged: search(query: $prs, type: ISSUE, first: 60) {
    issueCount
    nodes { ... on PullRequest { title number url mergedAt repository { nameWithOwner isPrivate } } }
  }
}`;

    type RepositoryNode = { nameWithOwner: string; isPrivate: boolean; stargazerCount: number; latestRelease: { tagName: string; publishedAt: string; url: string } | null } | null;
    type Data = {
        user: {
            login: string; name: string | null; bio: string | null; location: string | null; websiteUrl: string | null; avatarUrl: string | null;
            followers: { totalCount: number }; repositories: { totalCount: number };
            contributionsCollection: { totalCommitContributions: number; contributionCalendar: { totalContributions: number; weeks: CalendarWeekNode[] } };
        } | null;
        merged: { issueCount: number; nodes: PullRequestNode[] };
    } & Record<string, RepositoryNode>;

    let data: Data;
    try {
        data = await graphql<Data>(query, { login: request.login, prs: `${mergedPullRequestQuery(request.login, request.orgs)} sort:updated-desc` }, token);
    } catch (error) {
        warn(error instanceof Error ? error.message : String(error));
        return undefined;
    }
    if (!data.user) {
        warn(`GitHub has no user '${request.login}'`);
        return undefined;
    }

    const publicRepository = (repository: string): RepositoryNode | undefined => {
        const node = data[alias(tracked.indexOf(repository))];
        return node && node.isPrivate === false ? node : undefined;
    };

    const releases: Record<string, Release> = {};
    for (const repository of request.releases) {
        const release = publicRepository(repository)?.latestRelease;
        if (release) releases[repository] = { tag: release.tagName, publishedAt: release.publishedAt, url: release.url };
    }
    const stars: Record<string, number> = {};
    for (const repository of request.stars) {
        const node = publicRepository(repository);
        if (node) stars[repository] = node.stargazerCount;
    }

    const repositories: GitHubSnapshot['repositories'] = {};
    for (const repository of request.repositories) {
        // Never keep even an older snapshot for a repository that is not public now.
        if (!publicRepository(repository)) continue;
        const kept = previous?.repositories[repository];
        if (kept) repositories[repository] = kept;
        try {
            const standing = standingAmongHumans(await contributors(repository, token), request.login);
            const prs = await searchCount(`author:${request.login} repo:${repository} is:public is:pr is:merged`, token);
            repositories[repository] = { ...standing, prs };
        } catch (error) {
            warn(`${repository}: ${error instanceof Error ? error.message : String(error)} (keeping previous values)`);
        }
    }

    const byOrg: Record<string, number> = {};
    for (const org of new Set([...request.orgs, cratisOrganization])) {
        try {
            byOrg[org] = await searchCount(mergedPullRequestQuery(request.login, [org]), token);
        } catch (error) {
            const kept = previous?.mergedPullRequests.byOrg[org];
            if (kept !== undefined) byOrg[org] = kept;
            warn(`${org} merged pull requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    const user = data.user;
    const calendar = user.contributionsCollection.contributionCalendar;
    return {
        fetchedAt: new Date().toISOString(),
        login: user.login,
        orgs: request.orgs,
        profile: {
            login: user.login,
            name: user.name ?? undefined,
            bio: user.bio ?? undefined,
            location: user.location ?? undefined,
            blog: user.websiteUrl ?? undefined,
            avatarUrl: user.avatarUrl ?? undefined,
            followers: user.followers.totalCount,
            publicRepositories: user.repositories.totalCount,
        },
        contributions: {
            total: calendar.totalContributions,
            commits: user.contributionsCollection.totalCommitContributions,
            weeks: parseCalendar(calendar.weeks),
        },
        mergedPullRequests: {
            total: data.merged.issueCount,
            byOrg,
            latest: parseMergedPullRequests(data.merged.nodes, request.feedLimit ?? 12),
        },
        repositories,
        releases,
        stars,
    };
}
