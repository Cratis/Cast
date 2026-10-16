// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { cratisOrganization, parseRegistry, profileUrlOf, type RegistryMember } from '@cratis/cast/badges';
import { fetchGitHub, gitHubToken } from '@cratis/cast/github/fetchGitHub';
import type { GitHubSnapshot } from '@cratis/cast/github/GitHubSnapshot';
import { profileFromCastJson, type CastJsonProfile } from '@cratis/cast/machine';
import { assembleDirectory, loginsToVerify } from './assembleDirectory';
import type { CastSummary } from './DirectoryMember';
import type { DirectorySnapshot } from './DirectorySnapshot';
import { castJsonGone, castSummary, discoverContributors, fetchCastJson, fetchProfiles, publicRepositories, verifyCounts } from './fetchDirectory';
import { memberProfile, usableGitHub, type MemberProfile } from './memberProfile';
import { profileOverride } from './profileOverride';

const emptySnapshot = (): DirectorySnapshot => ({ version: 1, builtAt: new Date().toISOString(), members: [], contributors: [], pending: 0, counts: {}, profiles: {}, activity: {} });

async function readJson<T>(file: string): Promise<T | undefined> {
    try {
        return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
        return undefined;
    }
}

async function writeJson(file: string, value: unknown): Promise<void> {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

const moduleId = 'virtual:cast-directory/profiles';
const resolvedModuleId = `\0${moduleId}`;

/**
 * Builds the directory data before Astro renders: the registry in this repository is the source of truth
 * for Core and Partner; GitHub supplies public profiles, discovery and verified merged pull request counts.
 * Registry members' cast.json files become their full profile pages; everyone else gets a GitHub-only page.
 * Never fails the build on network problems or rate limits: every step is caught, failed steps keep the
 * snapshot's values (or the last good copy in the build cache), and the committed snapshot is used when
 * nothing can be fetched. Only an invalid registry stops the build.
 */
export default function castDirectory(options: { registry?: string; snapshot?: string; cache?: string; verifyLimit?: number } = {}): AstroIntegration {
    let pages: Record<string, MemberProfile> = {};

    return {
        name: '@cratis/cast-directory',
        hooks: {
            'astro:config:setup': async ({ config, command, addWatchFile, updateConfig, logger }) => {
                const root = fileURLToPath(config.root);
                const registryFile = path.resolve(root, options.registry ?? '../Registry/members.yaml');
                const snapshotFile = path.resolve(root, options.snapshot ?? '.cast/directory.json');
                const cacheFolder = path.resolve(root, options.cache ?? '.cast/cache');
                addWatchFile(registryFile);
                const warn = (message: string) => logger.warn(message);

                const registry = parseRegistry(await readFile(registryFile, 'utf8'));
                const previous = { ...emptySnapshot(), ...await readJson<DirectorySnapshot>(snapshotFile) };
                const casts: Record<string, CastSummary> = Object.fromEntries(previous.members.filter(member => member.cast).map(member => [member.handle.toLowerCase(), member.cast!]));
                let { counts, profiles, activity } = previous;
                let fetchedAt = previous.fetchedAt;

                const token = gitHubToken();
                if (command === 'build' && !token) warn('no GITHUB_TOKEN or GH_TOKEN; using the committed directory snapshot and the build cache for GitHub data');
                if (command === 'build' && token) {
                    const now = new Date();
                    try {
                        const repositories = await publicRepositories(token, warn);
                        const discovery = await discoverContributors(repositories, token, warn);
                        // A partial discovery (rate limits, outages) adds to what is known; only a complete one replaces it.
                        activity = discovery.complete ? discovery.activity : { ...activity, ...discovery.activity };
                        logger.info(`discovered ${Object.keys(discovery.activity).length} people across ${repositories.length} public repositories${discovery.complete ? '' : ' (partial; kept earlier discoveries)'}`);
                        const memberLogins = registry.map(member => member.github.toLowerCase());
                        const everyone = [...new Set([...memberLogins, ...Object.keys(activity)])];
                        const limit = options.verifyLimit ?? Number(process.env.CAST_DIRECTORY_VERIFY_LIMIT ?? 40);
                        const toVerify = [...new Set([...memberLogins, ...loginsToVerify(everyone, counts, now, limit)])];
                        counts = { ...counts, ...await verifyCounts(toVerify, token, now, warn) };
                        profiles = { ...profiles, ...await fetchProfiles(everyone.filter(login => memberLogins.includes(login) || (counts[login]?.mergedPullRequests ?? 0) > 0), token, warn) };
                        fetchedAt = now.toISOString();
                        logger.info(`verified ${toVerify.length} merged pull request counts (limit ${limit})`);
                    } catch (error) {
                        warn(`GitHub: ${error instanceof Error ? error.message : String(error)}; keeping the snapshot`);
                    }
                }

                // Registry members' cast.json: their full profile. Tiers never come from it.
                const castJsons: Record<string, { profile: CastJsonProfile; url: string }> = {};
                for (const member of registry) {
                    const read = await readMemberCastJson(member, command === 'build', path.join(cacheFolder, 'profiles'), warn);
                    if (!read) continue;
                    const login = member.github.toLowerCase();
                    const summary = castSummary(read.json, member.site ?? read.url);
                    if (summary) casts[login] = summary;
                    const parsed = profileFromCastJson(read.json, member.github);
                    if ('problems' in parsed) {
                        warn(`${read.url}: not used for the full profile (${parsed.problems.slice(0, 3).join('; ')})`);
                        continue;
                    }
                    if (parsed.dropped.length) warn(`${read.url}: dropped ${parsed.dropped.join(', ')}`);
                    castJsons[login] = { profile: parsed.profile, url: read.url };
                    logger.info(`${member.github}: full profile from ${read.url}${read.cached ? ' (last good copy)' : ''}`);
                }

                const builtAt = new Date().toISOString();
                const snapshot = assembleDirectory({ registry, counts, profiles, activity, casts, discovered: Object.keys(activity) }, builtAt, fetchedAt);
                await writeJson(snapshotFile, snapshot);
                logger.info(`${snapshot.members.length} registry members, ${snapshot.contributors.length} verified contributors, ${snapshot.pending} pending verification`);

                // Per-person GitHub data (contribution calendar, merged pull request feed), cached between builds.
                const people = [...snapshot.members, ...snapshot.contributors];
                const gitHubFolder = path.join(cacheFolder, 'github');
                const gitHubLimit = Number(process.env.CAST_DIRECTORY_GITHUB_LIMIT ?? 60);
                let fetched = 0;
                pages = {};
                for (const person of people) {
                    const login = person.handle.toLowerCase();
                    const file = path.join(gitHubFolder, `${login}.json`);
                    let captured: GitHubSnapshot | undefined = usableGitHub(await readJson<unknown>(file), person.handle);
                    const ownSnapshot = castJsons[login]?.profile.github !== undefined;
                    if (command === 'build' && token && !ownSnapshot && fetched < gitHubLimit) {
                        fetched++;
                        const result = await fetchGitHub({ login: person.handle, orgs: [cratisOrganization], repositories: [], releases: [], stars: [], searchDelayMilliseconds: 2100 }, token, captured, message => warn(`${person.handle}: ${message}`));
                        if (result) {
                            captured = result.snapshot;
                            await writeJson(file, captured);
                        }
                    }
                    pages[login] = memberProfile(person, castJsons[login], captured, builtAt, warn);
                }
                if (fetched) logger.info(`captured GitHub data for ${fetched} people`);

                updateConfig({
                    vite: {
                        plugins: [{
                            name: 'cratis-cast-directory:profiles',
                            resolveId: (id: string) => (id === moduleId ? resolvedModuleId : undefined),
                            load: (id: string) => (id === resolvedModuleId ? `export const profiles = ${JSON.stringify(pages)};` : undefined),
                        }],
                    },
                });
            },
        },
    };
}

/**
 * A registry member's cast.json: the development override, else their `profile` URL or `<site>/cast.json`.
 * A fresh copy replaces the last good one in the build cache; when the fetch fails the cached copy is used.
 * When the site answers that the file is gone (404 or 410), the owner removed it: the cached copy goes too.
 */
async function readMemberCastJson(member: RegistryMember, fetchLive: boolean, cacheFolder: string, warn: (message: string) => void): Promise<{ json: unknown; url: string; cached: boolean } | undefined> {
    const override = profileOverride(member.github, process.env);
    const url = override ?? profileUrlOf(member);
    if (!url) return undefined;
    const file = path.join(cacheFolder, `${member.github.toLowerCase()}.json`);
    const usable = (json: unknown) => !('problems' in profileFromCastJson(json, member.github));
    let fresh: unknown;
    if (fetchLive || override) {
        fresh = await fetchCastJson(url, warn, { allowLocal: override !== undefined });
        if (fresh === castJsonGone) {
            if (!override) await rm(file, { force: true });
            return undefined;
        }
        if (fresh !== undefined && usable(fresh)) {
            if (!override) await writeJson(file, { url, json: fresh });
            return { json: fresh, url, cached: false };
        }
    }
    // The development override never falls back: it is there to test one copy.
    const cached = override ? undefined : await readJson<{ url: string; json: unknown }>(file);
    if (cached && cached.url === url && usable(cached.json)) return { json: cached.json, url, cached: true };
    return fresh === undefined ? undefined : { json: fresh, url, cached: false };
}
