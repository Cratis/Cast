// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { cratisOrganization } from '../badges/constants';
import { resolveTier } from '../badges/resolveTier';
import type { RegistryMember } from '../badges/RegistryMember';
import type { ResolvedTier } from '../badges/ResolvedTier';
import type { GitHubSnapshot } from '../github/GitHubSnapshot';
import type { CastConfig } from '../config/CastConfig';
import { parseCast } from '../config/parseCast';
import { resolveSections } from '../config/resolveSections';
import { fetchGitHub, gitHubToken } from '../github/fetchGitHub';
import { emptySnapshot } from '../github/GitHubSnapshot';
import { fetchWriting } from '../writing/fetchWriting';
import type { CastData } from './CastData';
import { loadRegistry } from './loadRegistry';
import { readSnapshot, writeSnapshot } from './snapshotFile';

/** Inputs for one resolution. */
export type ResolveDataOptions = {
    configFile: string;
    snapshotFile: string;
    fetch: boolean;
    castVersion: string;
    log: { info(message: string): void; warn(message: string): void };
};

/** Result of a resolution: the data plus the absolute path of a local portrait, if any. */
export type ResolvedCast = { data: CastData; photoFile?: string };

/** owner/name of every public Cratis repository the cratis section lists. */
export const trackedCratisRepositories = (config: CastConfig): string[] =>
    (config.cratis?.repos ?? [])
        .filter(repository => repository.url?.toLowerCase().startsWith(`https://github.com/${cratisOrganization.toLowerCase()}/`))
        .map(repository => `${cratisOrganization}/${repository.name}`);

const sameLogin = (left: string, right: string): boolean => left.toLowerCase() === right.toLowerCase();

/** The snapshot's GitHub data, only when it was captured for this identity. */
export const usableSnapshot = (github: GitHubSnapshot | undefined, identity: string): GitHubSnapshot | undefined =>
    github && typeof github.login === 'string' && sameLogin(github.login, identity) ? github : undefined;

/**
 * The tier a site shows: a claim, linked to the directory, which is the authority. Core and Partner come from
 * the registry by the GitHub login. Contributor comes only from merged pull requests fetched live in this build
 * for that login: never from `.cast/snapshot.json`, which the site owner controls.
 */
export function siteTier(identity: string, registry: readonly RegistryMember[], githubSource: CastData['build']['githubSource'], github: GitHubSnapshot): ResolvedTier {
    const liveCount = githubSource === 'live' && sameLogin(github.login, identity) ? github.mergedPullRequests.byOrg[cratisOrganization] : undefined;
    return resolveTier(identity, registry, liveCount);
}

/**
 * Reads cast.yaml, captures build-time data (never failing the build on network problems) and resolves the
 * verified tier. Order of truth for live data: a fresh fetch, then `.cast/snapshot.json`, then cast.yaml.
 */
export async function resolveData(options: ResolveDataOptions): Promise<ResolvedCast> {
    const configText = await readFile(options.configFile, 'utf8');
    const config = parseCast(configText, path.basename(options.configFile));
    const warn = (message: string) => options.log.warn(`${message}`);

    const identity = config.github.login;
    const snapshot = await readSnapshot(options.snapshotFile);
    const snapshotGitHub = usableSnapshot(snapshot.github, identity);
    if (snapshot.github && !snapshotGitHub) {
        warn(`.cast/snapshot.json holds GitHub data for '${snapshot.github.login}', not '${identity}'; ignoring it`);
    }
    let github = snapshotGitHub;
    let githubSource: CastData['build']['githubSource'] = github ? 'snapshot' : 'none';
    let writing = snapshot.writing;
    let changed = false;

    if (options.fetch) {
        const token = gitHubToken();
        if (!token) {
            warn('no GITHUB_TOKEN or GH_TOKEN in the environment; using the snapshot for GitHub data');
        } else {
            const fresh = await fetchGitHub({
                login: config.github.login,
                orgs: config.github.orgs,
                repositories: trackedCratisRepositories(config),
                releases: config.github.releases,
                stars: config.github.stars,
            }, token, github, warn);
            if (fresh && !sameLogin(fresh.login, identity)) {
                warn(`GitHub answered for '${fresh.login}', not '${identity}'; ignoring it`);
            } else if (fresh) {
                github = fresh;
                githubSource = 'live';
                changed = true;
                options.log.info(`GitHub: ${fresh.contributions.total} contributions, ${fresh.mergedPullRequests.total} merged pull requests, ${Object.keys(fresh.repositories).length} repositories`);
            }
        }
        if (config.writing.sources.length > 0) {
            const freshWriting = await fetchWriting(config.writing.sources, warn);
            if (freshWriting) {
                writing = freshWriting;
                changed = true;
                options.log.info(`writing: ${freshWriting.posts.length} posts`);
            } else {
                warn('no posts captured; using the snapshot for writing');
            }
        }
    }

    if (changed) {
        await writeSnapshot(options.snapshotFile, { version: 1, github, writing });
    }

    const registry = await loadRegistry(options.fetch, warn);
    const githubData = github ?? emptySnapshot(identity, config.github.orgs);
    const tier = siteTier(identity, registry.members, githubSource, githubData);

    const photo = config.person.photo;
    const photoUrl = photo && /^https:\/\//.test(photo) ? photo : undefined;
    const localPhoto = photo && !photoUrl ? path.resolve(path.dirname(options.configFile), photo) : undefined;
    if (localPhoto && !existsSync(localPhoto)) {
        warn(`person.photo: ${localPhoto} does not exist; the portrait is left out`);
    }

    return {
        data: {
            config,
            sections: resolveSections(config),
            github: githubData,
            writing: writing ?? { sources: [], posts: [] },
            tier,
            photoUrl: photoUrl ?? (localPhoto ? undefined : githubData.profile?.avatarUrl),
            build: { builtAt: new Date().toISOString(), castVersion: options.castVersion, githubSource, registrySource: registry.source },
        },
        photoFile: localPhoto && existsSync(localPhoto) ? localPhoto : undefined,
    };
}
