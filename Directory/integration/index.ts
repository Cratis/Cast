// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { parseRegistry } from '@cratis/cast/badges';
import { gitHubToken } from '@cratis/cast/github/fetchGitHub';
import { assembleDirectory, loginsToVerify } from './assembleDirectory';
import type { CastProfile } from './DirectoryMember';
import type { DirectorySnapshot } from './DirectorySnapshot';
import { discoverContributors, fetchCastProfile, fetchProfiles, publicRepositories, verifyCounts } from './fetchDirectory';

const emptySnapshot = (): DirectorySnapshot => ({ version: 1, builtAt: new Date().toISOString(), members: [], contributors: [], pending: 0, counts: {}, profiles: {}, activity: {} });

async function readSnapshot(file: string): Promise<DirectorySnapshot> {
    try {
        return { ...emptySnapshot(), ...JSON.parse(await readFile(file, 'utf8')) as DirectorySnapshot };
    } catch {
        return emptySnapshot();
    }
}

/**
 * Builds the directory data before Astro renders: the registry in this repository is the source of truth
 * for Core and Partner; GitHub supplies public profiles, discovery and verified merged pull request counts.
 * Never fails the build on network problems or rate limits: every GitHub step is caught, failed steps keep the
 * snapshot's values, and the committed snapshot is used when nothing can be fetched. Only an invalid registry
 * stops the build.
 */
export default function castDirectory(options: { registry?: string; snapshot?: string; verifyLimit?: number } = {}): AstroIntegration {
    return {
        name: '@cratis/cast-directory',
        hooks: {
            'astro:config:setup': async ({ config, command, addWatchFile, logger }) => {
                const root = fileURLToPath(config.root);
                const registryFile = path.resolve(root, options.registry ?? '../Registry/members.yaml');
                const snapshotFile = path.resolve(root, options.snapshot ?? '.cast/directory.json');
                addWatchFile(registryFile);
                const warn = (message: string) => logger.warn(message);

                const registry = parseRegistry(await readFile(registryFile, 'utf8'));
                const previous = await readSnapshot(snapshotFile);
                const casts: Record<string, CastProfile> = Object.fromEntries(previous.members.filter(member => member.cast).map(member => [member.handle.toLowerCase(), member.cast!]));
                let { counts, profiles, activity } = previous;
                let fetchedAt = previous.fetchedAt;

                const token = gitHubToken();
                if (command === 'build' && !token) warn('no GITHUB_TOKEN or GH_TOKEN; using the committed directory snapshot for GitHub data');
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
                    // Member sites only contribute display text (title, tagline). Tiers never come from them.
                    for (const member of registry.filter(entry => entry.site)) {
                        const cast = await fetchCastProfile(member.site!, warn);
                        if (cast) casts[member.github.toLowerCase()] = cast;
                    }
                }

                const snapshot = assembleDirectory({ registry, counts, profiles, activity, casts, discovered: Object.keys(activity) }, new Date().toISOString(), fetchedAt);
                await mkdir(path.dirname(snapshotFile), { recursive: true });
                await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`);
                logger.info(`${snapshot.members.length} registry members, ${snapshot.contributors.length} verified contributors, ${snapshot.pending} pending verification`);
            },
        },
    };
}
