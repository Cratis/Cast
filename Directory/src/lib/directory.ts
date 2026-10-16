// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// The directory data, written by the integration before Astro renders.
import { Tier, TierSource, type ResolvedTier } from '@cratis/cast/badges';
import { castView, directoryHost, type CastView } from '@cratis/cast/profile';
import { profiles } from 'virtual:cast-directory/profiles';
import { ProfileKind, type MemberProfile } from '../../integration/memberProfile';
import raw from '../../.cast/directory.json';
import type { DirectoryMember } from '../../integration/DirectoryMember';
import type { DirectorySnapshot } from '../../integration/DirectorySnapshot';

export type { DirectoryMember, MemberProfile };
export { ProfileKind };

export const directory = raw as unknown as DirectorySnapshot;

export const core = directory.members.filter(member => member.tier === Tier.Core);
export const partners = directory.members.filter(member => member.tier === Tier.Partner);
export const contributors = directory.contributors;

/** Everyone with a page. */
export const everyone: DirectoryMember[] = [...directory.members, ...directory.contributors];

/** The display name, falling back to the handle. */
export const displayName = (member: DirectoryMember): string => member.name ?? member.handle;

/** A GitHub avatar at a given size. */
export const avatar = (member: DirectoryMember, size: number): string =>
    member.avatarUrl ? `${member.avatarUrl}${member.avatarUrl.includes('?') ? '&' : '?'}s=${size}` : `https://github.com/${member.handle}.png?size=${size}`;

/** Formats YYYY-MM as "Jun 2024". */
export const formatMonth = (month: string): string =>
    new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

/** The tier as the directory verified it, in the shape a profile renders. */
export function verifiedTier(member: DirectoryMember): ResolvedTier {
    return {
        handle: member.handle,
        ...(member.tier ? { tier: member.tier } : {}),
        source: member.source,
        ...(member.mergedPullRequests !== undefined ? { mergedPullRequests: member.mergedPullRequests } : {}),
        ...(member.source === TierSource.Registry && (member.tier === Tier.Core || member.tier === Tier.Partner)
            ? { member: { github: member.handle, tier: member.tier, ...(member.since ? { since: member.since } : {}), ...(member.role ? { role: member.role } : {}), ...(member.site ? { site: member.site } : {}), ...(member.company ? { company: member.company } : {}), ...(member.registryLine ? { line: member.registryLine } : {}) } }
            : {}),
    };
}

/** A member's page data and the view the profile components render. */
export function memberPage(member: DirectoryMember): { page: MemberProfile; cast: CastView } {
    const page = profiles[member.handle.toLowerCase()];
    if (!page) throw new Error(`No profile was built for '${member.handle}'`);
    const host = directoryHost(member.handle, page.kind === ProfileKind.CastJson ? page.site : undefined);
    return { page, cast: castView({ ...page.data, tier: verifiedTier(member) }, host) };
}

/** The host of a URL without www, for "from ada.dev" lines. */
export const hostOf = (url: string): string => {
    try {
        return new URL(url).host.replace(/^www\./, '');
    } catch {
        return url;
    }
};
