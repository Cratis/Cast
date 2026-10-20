// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFile } from 'node:fs/promises';
import type { FirstTimeContributor, OrgStats } from './OrgStats';

export const orgStatsUrl = 'https://raw.githubusercontent.com/Cratis/.github/main/stats/org-stats.json';

type Warn = (message: string) => void;
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const timestamp = (value: unknown): value is string => text(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value));
const httpsUrl = (value: unknown): value is string => {
    if (!text(value)) return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
        return false;
    }
};

function firstTimeContributor(value: unknown): value is FirstTimeContributor {
    return record(value)
        && text(value.login) && /^[a-z\d]+(?:-[a-z\d]+)*$/i.test(value.login)
        && (value.name === undefined || value.name === null || typeof value.name === 'string')
        && httpsUrl(value.avatarUrl) && httpsUrl(value.profileUrl) && httpsUrl(value.pullRequestUrl)
        && timestamp(value.firstMergedAt) && text(value.repository) && text(value.pullRequestTitle);
}

/** Rejects unsupported snapshots or invalid display fields; unrelated fields are ignored. */
export function isOrgStats(value: unknown): value is OrgStats {
    if (!record(value) || value.schemaVersion !== 1 || !timestamp(value.generatedAt)) return false;
    const { releases, mergedPullRequests, contributors } = value;
    return record(releases) && count(releases.last7Days) && count(releases.last30Days)
        && record(releases.last7DaysByKind) && count(releases.last7DaysByKind.major) && count(releases.last7DaysByKind.minor)
        && record(mergedPullRequests) && count(mergedPullRequests.last7Days) && count(mergedPullRequests.last30Days)
        && record(contributors) && count(contributors.activeLast30Days)
        && Array.isArray(contributors.firstTime) && contributors.firstTime.every(firstTimeContributor);
}

/**
 * Optional, build-time organization data, independent of the member cache and GitHub token.
 * ORG_STATS_FILE takes precedence over ORG_STATS_URL. A failed read never reuses stale stats.
 */
export async function fetchOrgStats(warn: Warn, env: NodeJS.ProcessEnv = process.env): Promise<OrgStats | undefined> {
    try {
        let json: unknown;
        if (env.ORG_STATS_FILE) {
            json = JSON.parse(await readFile(env.ORG_STATS_FILE, 'utf8')) as unknown;
        } else {
            const response = await fetch(env.ORG_STATS_URL || orgStatsUrl, {
                headers: { accept: 'application/json', 'user-agent': 'cratis-cast-directory' },
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) throw new Error(`answered ${response.status}`);
            json = await response.json();
        }
        if (!isOrgStats(json)) throw new Error('invalid schema v1 display fields');
        return json;
    } catch (error) {
        warn(`organization stats omitted: ${error instanceof Error ? error.message : String(error)}`);
        return undefined;
    }
}
