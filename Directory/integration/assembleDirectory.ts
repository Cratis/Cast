// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveTier, TierSource, type RegistryMember } from '@cratis/cast/badges';
import type { CastProfile, DirectoryMember } from './DirectoryMember';
import type { DirectorySnapshot } from './DirectorySnapshot';

/** Everything known about the people, before it is shaped into the directory. */
export type DirectoryInputs = {
    registry: RegistryMember[];
    counts: DirectorySnapshot['counts'];
    profiles: DirectorySnapshot['profiles'];
    activity: DirectorySnapshot['activity'];
    casts: Record<string, CastProfile>;
    /** Every login discovered as having work in public Cratis repositories. */
    discovered: string[];
};

const key = (login: string) => login.toLowerCase();

/**
 * Shapes the directory: registry members first (their tier comes only from the registry), then everyone
 * else whose merged public pull requests are verified, most first. Discovered people without a verified
 * count are counted as pending and get no page, so the directory never claims more than it checked.
 */
export function assembleDirectory(inputs: DirectoryInputs, builtAt: string, fetchedAt?: string): DirectorySnapshot {
    const person = (handle: string): Omit<DirectoryMember, 'source'> => {
        const login = key(handle);
        const profile = inputs.profiles[login] ?? {};
        const activity = inputs.activity[login];
        return {
            handle,
            ...profile,
            ...(inputs.counts[login] ? { mergedPullRequests: inputs.counts[login]!.mergedPullRequests } : {}),
            ...(activity ? { commits: activity.commits, repositories: activity.repositories } : {}),
        };
    };

    const members: DirectoryMember[] = inputs.registry.map(entry => {
        const resolved = resolveTier(entry.github, inputs.registry, inputs.counts[key(entry.github)]?.mergedPullRequests);
        const cast = inputs.casts[key(entry.github)];
        return {
            ...person(entry.github),
            tier: resolved.tier,
            source: resolved.source,
            ...(entry.since ? { since: entry.since } : {}),
            ...(entry.role ? { role: entry.role } : {}),
            ...(entry.company ? { company: entry.company } : {}),
            ...(entry.site ? { site: entry.site } : {}),
            ...(entry.line ? { registryLine: entry.line } : {}),
            ...(cast ? { cast } : {}),
        };
    });

    const listed = new Set(inputs.registry.map(entry => key(entry.github)));
    const others = [...new Set(inputs.discovered.map(key))].filter(login => !listed.has(login));
    const contributors = others
        .map(login => {
            const resolved = resolveTier(login, inputs.registry, inputs.counts[login]?.mergedPullRequests);
            const handle = inputs.discovered.find(found => key(found) === login) ?? login;
            return { ...person(handle), tier: resolved.tier, source: resolved.source };
        })
        .filter(member => member.source === TierSource.Contributions)
        .sort((left, right) => (right.mergedPullRequests ?? 0) - (left.mergedPullRequests ?? 0) || left.handle.localeCompare(right.handle));

    const pending = others.filter(login => inputs.counts[login] === undefined).length;

    return {
        version: 1,
        builtAt,
        ...(fetchedAt ? { fetchedAt } : {}),
        members,
        contributors,
        pending,
        counts: inputs.counts,
        profiles: inputs.profiles,
        activity: inputs.activity,
    };
}

/** Logins whose count should be (re)checked this build: never checked first, then the stalest, up to `limit`. */
export function loginsToVerify(logins: readonly string[], counts: DirectorySnapshot['counts'], now: Date, limit: number, maximumAgeDays = 7): string[] {
    const cutoff = now.getTime() - maximumAgeDays * 86_400_000;
    return [...new Set(logins.map(key))]
        .filter(login => !counts[login] || Date.parse(counts[login]!.checkedAt) < cutoff)
        .sort((left, right) => (counts[left] ? Date.parse(counts[left]!.checkedAt) : 0) - (counts[right] ? Date.parse(counts[right]!.checkedAt) : 0))
        .slice(0, limit);
}
