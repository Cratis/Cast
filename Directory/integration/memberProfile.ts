// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { castDirectoryUrl, cratisOrganization, tierStyles, TierSource } from '@cratis/cast/badges';
import { parseCastObject, resolveSections, type CastConfig } from '@cratis/cast/config';
import { emptySnapshot, type GitHubSnapshot } from '@cratis/cast/github/GitHubSnapshot';
import type { CastJsonProfile } from '@cratis/cast/machine';
import type { CastData } from '@cratis/cast';
import type { DirectoryMember } from './DirectoryMember';

/** Where a member page's content comes from. */
export enum ProfileKind {
    /** The member's cast.json (format version 2), rendered in full. */
    CastJson = 'cast-json',
    /** Public GitHub data only: no cast.json, or one that could not be used. */
    GitHub = 'github',
}

/** Everything a member page renders, except the tier, which the page takes from the directory snapshot. */
export type MemberProfile = {
    handle: string;
    kind: ProfileKind;
    /** The cast.json the profile was read from. */
    source?: string;
    /** The member's own site, for the provenance line. */
    site?: string;
    data: Omit<CastData, 'tier'>;
};

const sameLogin = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();
const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

/** The GitHub data a page shows: the captured snapshot with the directory's own counts and standings filled in. */
export function memberGitHub(member: DirectoryMember, captured: GitHubSnapshot | undefined): GitHubSnapshot {
    const base = captured && sameLogin(captured.login, member.handle) ? captured : emptySnapshot(member.handle, [cratisOrganization]);
    const merged = member.mergedPullRequests;
    const standings = Object.fromEntries(Object.entries(member.standings ?? {}).map(([name, standing]) => [`${cratisOrganization}/${name}`, { ...standing, prs: 0 }]));
    return {
        ...base,
        ...(base.profile || member.avatarUrl ? { profile: { login: member.handle, ...base.profile, ...(member.avatarUrl && !base.profile?.avatarUrl ? { avatarUrl: member.avatarUrl } : {}) } } : {}),
        mergedPullRequests: {
            ...base.mergedPullRequests,
            total: base.mergedPullRequests.total || (merged ?? 0),
            byOrg: { ...(merged !== undefined ? { [cratisOrganization]: merged } : {}), ...base.mergedPullRequests.byOrg },
        },
        repositories: { ...standings, ...base.repositories },
    };
}

/**
 * The cast.yaml equivalent of a member known only from public GitHub data: name, avatar, bio and location,
 * their standing in public Cratis repositories, the contribution calendar and merged pull requests. Every
 * sentence is a fact the directory checked; nothing is written in the member's voice.
 */
export function gitHubOnlyCast(member: DirectoryMember): CastConfig {
    const name = member.name ?? member.handle;
    const tierLabel = member.tier ? tierStyles[member.tier].label : undefined;
    const repositories = member.repositories ?? [];
    const facts = [
        member.mergedPullRequests ? `${formatNumber(member.mergedPullRequests)} merged public pull ${member.mergedPullRequests === 1 ? 'request' : 'requests'} in the Cratis organization` : undefined,
        member.commits ? `${formatNumber(member.commits)} ${member.commits === 1 ? 'commit' : 'commits'} on default branches of public Cratis repositories` : undefined,
    ].filter(Boolean);
    const now: Record<string, string | string[]> = {
        ...(member.role ? { role: member.role } : {}),
        ...(member.company ? { company: member.company } : {}),
        ...(member.since ? { since: member.since } : {}),
        ...(member.location ? { location: member.location } : {}),
        ...(repositories.length ? { repositories } : {}),
    };
    const bio = member.bio?.replace(/\s+/g, ' ').trim();
    const shortBio = bio && bio.length <= 80 ? bio : undefined;
    const factLine = facts.length ? `${facts.join(', and ')}, counted when the directory was built.` : 'Public work in the Cratis organization, as the directory last verified it.';
    const links: Record<string, string> = { github: `https://github.com/${member.handle}`, ...(member.site ? { website: member.site } : {}) };

    return parseCastObject({
        site: {
            url: `${castDirectoryUrl}/${member.handle.toLowerCase()}/`,
            description: `${name} (@${member.handle}) in the Cratis Cast${tierLabel ? ` as ${tierLabel}` : ''}: public work in the Cratis organization, verified when the directory was built.`,
        },
        person: {
            name,
            handle: member.handle,
            title: member.role ?? (tierLabel ? `Cratis Cast ${tierLabel}` : 'Cratis contributor'),
            ...(member.location ? { location: member.location } : {}),
            links,
            tagline: shortBio ?? 'Building with *Cratis.*',
            intro: bio && !shortBio ? `${bio} ${factLine}` : factLine,
        },
        now,
        ...(repositories.length ? {
            cratis: {
                title: 'Where they work in *Cratis.*',
                label: 'Cratis',
                role: `Commits in ${repositories.length} public Cratis ${repositories.length === 1 ? 'repository' : 'repositories'}, ranked among the human committers of each.`,
                repos: repositories.map(repository => ({
                    name: repository,
                    url: `https://github.com/${cratisOrganization}/${repository}`,
                    kind: 'repository',
                    group: 'tooling',
                    // Read as a commit rank: '#1 committer', '#2 all-time', never a title they did not claim.
                    role: '#committer',
                    desc: `github.com/${cratisOrganization}/${repository}`,
                })),
            },
        } : {}),
        github: { login: member.handle, orgs: [cratisOrganization] },
        sections: [
            'hero',
            ...(Object.keys(now).length ? [{ id: 'now', title: 'Where they are *now.*' }] : []),
            ...(repositories.length ? ['cratis'] : []),
            { id: 'activity', title: 'Every contribution, *appended.*', intro: 'The public GitHub contribution calendar, re-projected as an event store: one partition per day, brighter means more events appended. Captured when the directory was built.' },
        ],
    }, `${member.handle} (GitHub)`);
}

/** The page data for one member: their cast.json when it is usable and they are in the registry, else GitHub. */
export function memberProfile(member: DirectoryMember, castJson: { profile: CastJsonProfile; url: string } | undefined, captured: GitHubSnapshot | undefined, builtAt: string): MemberProfile {
    // Only reviewed registry members get their own content on cast.cratis.io.
    const usable = castJson && member.source === TierSource.Registry && sameLogin(castJson.profile.handle, member.handle) ? castJson : undefined;
    if (usable) {
        const { profile } = usable;
        const github = profile.github ?? memberGitHub(member, captured);
        return {
            handle: member.handle,
            kind: ProfileKind.CastJson,
            source: usable.url,
            site: member.site ?? profile.config.site.url,
            data: {
                config: profile.config,
                sections: resolveSections(profile.config),
                github,
                writing: profile.writing ?? { sources: [], posts: [] },
                ...(profile.photoUrl ?? member.avatarUrl ? { photoUrl: profile.photoUrl ?? member.avatarUrl } : {}),
                build: { builtAt: profile.builtAt ?? builtAt, castVersion: profile.generator ?? 'cast.json', githubSource: profile.github ? 'snapshot' : captured ? 'live' : 'none', registrySource: 'live' },
            },
        };
    }
    const config = gitHubOnlyCast(member);
    const github = memberGitHub(member, captured);
    const avatar = github.profile?.avatarUrl ?? member.avatarUrl;
    return {
        handle: member.handle,
        kind: ProfileKind.GitHub,
        ...(member.site ? { site: member.site } : {}),
        data: {
            config,
            sections: resolveSections(config),
            github,
            writing: { sources: [], posts: [] },
            ...(avatar ? { photoUrl: avatar } : {}),
            build: { builtAt, castVersion: 'directory', githubSource: captured ? 'live' : 'none', registrySource: 'live' },
        },
    };
}
