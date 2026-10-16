// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cratisOrganization } from '@cratis/cast/badges';
import { graphql, searchCount } from '@cratis/cast/github/fetchGitHub';
import { isBot, mergedPullRequestQuery, type ContributorEntry } from '@cratis/cast/github/parse';
import type { CastProfile } from './DirectoryMember';
import type { DirectorySnapshot } from './DirectorySnapshot';

type Warn = (message: string) => void;
const userAgent = 'cratis-cast-directory';
const maximumRepositories = 200;

async function rest<T>(path: string, token: string): Promise<{ body: T; next: boolean }> {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: { authorization: `bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': userAgent },
        signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 202 || response.status === 204) return { body: [] as T, next: false };
    if (response.status !== 200) throw new Error(`${path}: GitHub answered ${response.status}`);
    return { body: await response.json() as T, next: response.headers.get('link')?.includes('rel="next"') ?? false };
}

/** Public, non-archived, non-fork repositories of the Cratis organization. */
export async function publicRepositories(token: string, warn: Warn): Promise<string[]> {
    const names: string[] = [];
    for (let page = 1; names.length < maximumRepositories; page++) {
        const { body, next } = await rest<{ name: string; private: boolean; fork: boolean }[]>(`/orgs/${cratisOrganization}/repos?type=public&per_page=100&page=${page}`, token);
        names.push(...body.filter(repository => !repository.private && !repository.fork).map(repository => repository.name));
        if (!next) break;
    }
    if (names.length >= maximumRepositories) warn(`repository discovery capped at ${maximumRepositories}`);
    return names;
}

/**
 * Commit authors with GitHub accounts across public Cratis repositories (first page of 100 per repository),
 * bots excluded. This is discovery only: a contributor is confirmed by a merged pull request search.
 */
export async function discoverContributors(repositories: readonly string[], token: string, warn: Warn): Promise<DirectorySnapshot['activity']> {
    const activity: Record<string, { commits: number; repositories: Map<string, number> }> = {};
    for (const repository of repositories) {
        try {
            const { body } = await rest<ContributorEntry[]>(`/repos/${cratisOrganization}/${repository}/contributors?per_page=100`, token);
            for (const contributor of body) {
                if (!contributor.login || isBot(contributor)) continue;
                const login = contributor.login.toLowerCase();
                activity[login] ??= { commits: 0, repositories: new Map() };
                activity[login]!.commits += contributor.contributions;
                activity[login]!.repositories.set(repository, contributor.contributions);
            }
        } catch (error) {
            warn(`${repository}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return Object.fromEntries(Object.entries(activity).map(([login, entry]) => [login, {
        commits: entry.commits,
        repositories: [...entry.repositories.entries()].sort((left, right) => right[1] - left[1]).slice(0, 6).map(([name]) => name),
    }]));
}

/** Public profile fields for many logins, 40 per GraphQL request. Unknown logins are skipped. */
export async function fetchProfiles(logins: readonly string[], token: string, warn: Warn): Promise<DirectorySnapshot['profiles']> {
    const profiles: DirectorySnapshot['profiles'] = {};
    for (let start = 0; start < logins.length; start += 40) {
        const batch = logins.slice(start, start + 40);
        const query = `query { ${batch.map((login, index) => `u${index}: user(login: ${JSON.stringify(login)}) { login name avatarUrl bio location }`).join('\n')} }`;
        try {
            type Profile = { login: string; name: string | null; avatarUrl: string | null; bio: string | null; location: string | null } | null;
            const data = await graphql<Record<string, Profile>>(query, {}, token);
            for (const profile of Object.values(data)) {
                if (!profile) continue;
                profiles[profile.login.toLowerCase()] = {
                    ...(profile.name ? { name: profile.name } : {}),
                    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
                    ...(profile.bio ? { bio: profile.bio } : {}),
                    ...(profile.location ? { location: profile.location } : {}),
                };
            }
        } catch (error) {
            // GraphQL returns errors for logins that are organizations or gone; keep what resolved.
            warn(`profiles ${start}-${start + batch.length}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return profiles;
}

/** Verifies merged public pull requests in the Cratis organization for each login. */
export async function verifyCounts(logins: readonly string[], token: string, now: Date, warn: Warn): Promise<DirectorySnapshot['counts']> {
    const counts: DirectorySnapshot['counts'] = {};
    for (const login of logins) {
        try {
            counts[login] = { mergedPullRequests: await searchCount(mergedPullRequestQuery(login, [cratisOrganization]), token), checkedAt: now.toISOString() };
        } catch (error) {
            warn(`${login}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return counts;
}

/** Reads a member's /cast.json. Only the fields the directory shows are kept, and only from https sites. */
export async function fetchCastProfile(site: string, warn: Warn): Promise<CastProfile | undefined> {
    const url = new URL('/cast.json', site);
    if (url.protocol !== 'https:') return undefined;
    try {
        const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
        if (!response.ok) return undefined;
        const body = await response.json() as { castJsonVersion?: unknown; title?: unknown; tagline?: unknown };
        if (typeof body.castJsonVersion !== 'number') return undefined;
        return {
            url: site,
            castJsonVersion: body.castJsonVersion,
            ...(typeof body.title === 'string' ? { title: body.title.slice(0, 160) } : {}),
            ...(typeof body.tagline === 'string' ? { tagline: body.tagline.slice(0, 200) } : {}),
        };
    } catch (error) {
        warn(`${url}: ${error instanceof Error ? error.message : String(error)}`);
        return undefined;
    }
}
