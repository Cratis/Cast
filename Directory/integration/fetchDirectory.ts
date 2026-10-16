// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cratisOrganization } from '@cratis/cast/badges';
import { graphql, searchCount } from '@cratis/cast/github/fetchGitHub';
import { isBot, mergedPullRequestQuery, type ContributorEntry } from '@cratis/cast/github/parse';
import { plainText } from '@cratis/cast/profile';
import type { CastSummary } from './DirectoryMember';
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
 * bots excluded, with their commits and rank among the humans in their top repositories. This is discovery only: a contributor is confirmed by a merged pull request search.
 */
export async function discoverContributors(repositories: readonly string[], token: string, warn: Warn): Promise<{ activity: DirectorySnapshot['activity']; complete: boolean }> {
    let complete = true;
    const activity: Record<string, { commits: number; repositories: Map<string, number>; ranks: Map<string, number> }> = {};
    for (const repository of repositories) {
        try {
            const { body } = await rest<ContributorEntry[]>(`/repos/${cratisOrganization}/${repository}/contributors?per_page=100`, token);
            const humans = body.filter(contributor => contributor.login && !isBot(contributor)).sort((left, right) => right.contributions - left.contributions);
            humans.forEach((contributor, index) => {
                const login = contributor.login.toLowerCase();
                activity[login] ??= { commits: 0, repositories: new Map(), ranks: new Map() };
                activity[login]!.commits += contributor.contributions;
                activity[login]!.repositories.set(repository, contributor.contributions);
                activity[login]!.ranks.set(repository, index + 1);
            });
        } catch (error) {
            complete = false;
            warn(`${repository}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return { complete, activity: Object.fromEntries(Object.entries(activity).map(([login, entry]) => {
        const top = [...entry.repositories.entries()].sort((left, right) => right[1] - left[1]).slice(0, 6);
        return [login, {
            commits: entry.commits,
            repositories: top.map(([name]) => name),
            standings: Object.fromEntries(top.map(([name, commits]) => [name, { commits, rank: entry.ranks.get(name) ?? 0 }])),
        }];
    })) };
}

/**
 * Public profile fields for many logins, 40 per GraphQL request. An unknown or renamed login resolves to null
 * with a GraphQL error; the rest of its batch is kept. A batch that fails outright is retried one login at a
 * time, so one bad login never drops the others.
 */
export async function fetchProfiles(logins: readonly string[], token: string, warn: Warn): Promise<DirectorySnapshot['profiles']> {
    const profiles: DirectorySnapshot['profiles'] = {};
    for (let start = 0; start < logins.length; start += 40) {
        const batch = logins.slice(start, start + 40);
        const query = `query { ${batch.map((login, index) => `u${index}: user(login: ${JSON.stringify(login)}) { login name avatarUrl bio location }`).join('\n')} }`;
        const partial = { allowPartial: true as const, onErrors: (messages: string[]) => warn(`profiles: ${messages.join('; ')}`) };
        try {
            addProfiles(profiles, await graphql<Record<string, ProfileNode>>(query, {}, token, partial));
        } catch (error) {
            warn(`profiles ${start}-${start + batch.length}: ${error instanceof Error ? error.message : String(error)}; retrying one by one`);
            for (const login of batch) {
                try {
                    addProfiles(profiles, await graphql<Record<string, ProfileNode>>(`query { u0: user(login: ${JSON.stringify(login)}) { login name avatarUrl bio location } }`, {}, token, partial));
                } catch (single) {
                    warn(`profile ${login}: ${single instanceof Error ? single.message : String(single)}`);
                }
            }
        }
    }
    return profiles;
}

/** A user node; null for logins that do not resolve to a user. */
export type ProfileNode = { login: string; name: string | null; avatarUrl: string | null; bio: string | null; location: string | null } | null;

/** Adds the resolved users of one GraphQL response, skipping nulls. */
export function addProfiles(profiles: DirectorySnapshot['profiles'], data: Record<string, ProfileNode>): void {
    for (const profile of Object.values(data)) {
        if (!profile?.login) continue;
        profiles[profile.login.toLowerCase()] = {
            ...(profile.name ? { name: profile.name } : {}),
            ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
            ...(profile.bio ? { bio: profile.bio } : {}),
            ...(profile.location ? { location: profile.location } : {}),
        };
    }
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

/** The largest cast.json the directory reads, in bytes. */
export const maximumCastJsonBytes = 1_000_000;

const localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/;

/** What {@link fetchCastJson} returns when the site answers that the file is gone (404 or 410). */
export const castJsonGone = Symbol('cast.json gone');

/**
 * Reads a cast.json: https only (plain http only for a local development override), also after redirects,
 * within 10 seconds and at most {@link maximumCastJsonBytes}. Returns the parsed JSON, {@link castJsonGone}
 * when the site answers 404 or 410, or undefined (with a warning) on any other problem.
 */
export async function fetchCastJson(address: string, warn: Warn, options: { allowLocal?: boolean } = {}): Promise<unknown> {
    let url: URL;
    try {
        url = new URL(address);
    } catch {
        warn(`${address}: not a URL`);
        return undefined;
    }
    const readable = (candidate: URL) => candidate.protocol === 'https:' || (options.allowLocal === true && candidate.protocol === 'http:' && localHost.test(candidate.hostname));
    if (!readable(url)) {
        warn(`${url}: only https is read`);
        return undefined;
    }
    try {
        const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'application/json' }, redirect: 'follow', signal: AbortSignal.timeout(10_000) });
        if (response.url && !readable(new URL(response.url))) throw new Error(`redirected to ${response.url}; only https is read`);
        if (response.status === 404 || response.status === 410) {
            warn(`${url}: answered ${response.status}; the cast.json is gone`);
            return castJsonGone;
        }
        if (!response.ok) throw new Error(`answered ${response.status}`);
        if (Number(response.headers.get('content-length') ?? 0) > maximumCastJsonBytes) throw new Error(`larger than ${maximumCastJsonBytes} bytes`);
        const text = await readLimited(response, maximumCastJsonBytes);
        return JSON.parse(text) as unknown;
    } catch (error) {
        warn(`${url}: ${error instanceof Error ? error.message : String(error)}`);
        return undefined;
    }
}

async function readLimited(response: Response, limit: number): Promise<string> {
    if (!response.body) return '';
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
            await reader.cancel();
            throw new Error(`larger than ${limit} bytes`);
        }
        chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
}

/** The display fields of a cast.json (any version), for directory cards. Never a tier. */
export function castSummary(json: unknown, url: string): CastSummary | undefined {
    const body = json as { castJsonVersion?: unknown; title?: unknown; tagline?: unknown; profile?: { cast?: { person?: { title?: unknown; tagline?: unknown } } } } | null;
    if (!body || typeof body !== 'object' || typeof body.castJsonVersion !== 'number') return undefined;
    const person = body.profile?.cast?.person;
    const title = typeof body.title === 'string' ? body.title : typeof person?.title === 'string' ? person.title : undefined;
    // Taglines carry inline markup (`*accent*`, links, code); cards show them as plain text, whoever wrote the file.
    const rawTagline = typeof body.tagline === 'string' ? body.tagline : typeof person?.tagline === 'string' ? person.tagline : undefined;
    const tagline = rawTagline === undefined ? undefined : plainText(rawTagline);
    return {
        url,
        castJsonVersion: body.castJsonVersion,
        ...(title ? { title: title.slice(0, 160) } : {}),
        ...(tagline ? { tagline: tagline.slice(0, 200) } : {}),
    };
}

/** Reads a member's cast.json and keeps only the fields the directory cards show. */
export async function fetchCastSummary(address: string, warn: Warn): Promise<CastSummary | undefined> {
    const json = await fetchCastJson(address, warn);
    return json === undefined || json === castJsonGone ? undefined : castSummary(json, address);
}
