// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// The directory data, written by the integration before Astro renders.
import { Tier } from '@cratis/cast/badges';
import raw from '../../.cast/directory.json';
import type { DirectoryMember } from '../../integration/DirectoryMember';
import type { DirectorySnapshot } from '../../integration/DirectorySnapshot';

export type { DirectoryMember };

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
