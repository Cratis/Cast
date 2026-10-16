// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ContributionWeek, PullRequest } from './GitHubSnapshot';

/** A contributor as the REST contributors endpoint returns it. */
export type ContributorEntry = { login: string; type?: string; contributions: number };

/** A pull request node as the GraphQL search returns it. */
export type PullRequestNode = {
    title?: string;
    number?: number;
    url?: string;
    mergedAt?: string | null;
    repository?: { nameWithOwner?: string; name?: string; owner?: { login?: string }; isPrivate?: boolean };
} | null;

const botLogins = new Set(['cratis-bot', 'dependabot', 'github-actions', 'renovate', 'copilot', 'copilot-swe-agent']);

/** True for bots: GitHub's Bot type, `[bot]` logins and well-known automation accounts. */
export function isBot(entry: { login: string; type?: string }): boolean {
    const login = entry.login.toLowerCase();
    return entry.type === 'Bot' || login.endsWith('[bot]') || botLogins.has(login);
}

/** Commits and 1-based rank of `login` among human contributors; rank 0 when absent. */
export function standingAmongHumans(contributors: readonly ContributorEntry[], login: string): { commits: number; rank: number } {
    const humans = contributors.filter(contributor => !isBot(contributor)).sort((left, right) => right.contributions - left.contributions);
    const index = humans.findIndex(contributor => contributor.login.toLowerCase() === login.toLowerCase());
    return index < 0 ? { commits: 0, rank: 0 } : { commits: humans[index]!.contributions, rank: index + 1 };
}

/**
 * Turns search nodes into the feed: merged, public only (the token may see private work, the site never
 * shows it), newest first, capped at `limit`.
 */
export function parseMergedPullRequests(nodes: readonly PullRequestNode[], limit: number): PullRequest[] {
    return nodes
        .filter((node): node is NonNullable<PullRequestNode> => !!node?.mergedAt && node.repository?.isPrivate === false && !!node.url && node.number !== undefined)
        .sort((left, right) => right.mergedAt!.localeCompare(left.mergedAt!))
        .slice(0, limit)
        .map(node => ({
            title: node.title ?? '',
            repository: node.repository!.nameWithOwner ?? `${node.repository!.owner?.login ?? ''}/${node.repository!.name ?? ''}`,
            number: node.number!,
            url: node.url!,
            mergedAt: node.mergedAt!,
        }));
}

/** A contribution calendar as the GraphQL API returns it. */
export type CalendarWeekNode = { contributionDays: { date: string; contributionCount: number }[] };

/** Compacts the calendar into week starts and daily counts. */
export const parseCalendar = (weeks: readonly CalendarWeekNode[]): ContributionWeek[] =>
    weeks.filter(week => week.contributionDays.length > 0).map(week => ({
        start: week.contributionDays[0]!.date,
        counts: week.contributionDays.map(day => day.contributionCount),
    }));

/** The search query for merged public pull requests by `login` in any of `orgs`. */
export const mergedPullRequestQuery = (login: string, orgs: readonly string[]): string =>
    `author:${login} ${orgs.map(org => `org:${org}`).join(' ')} is:public is:pr is:merged`;
