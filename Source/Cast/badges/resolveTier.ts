// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findMember } from './registry';
import type { RegistryMember } from './RegistryMember';
import type { ResolvedTier } from './ResolvedTier';
import { Tier } from './Tier';
import { TierSource } from './TierSource';

/**
 * Resolves a handle's tier. The registry decides Core and Partner. Without a registry entry, one or more
 * merged public pull requests in the Cratis organization make a Contributor. There is no other input:
 * nothing a site writes about itself can change the result.
 */
export function resolveTier(handle: string, registry: readonly RegistryMember[], mergedPullRequests?: number): ResolvedTier {
    const member = findMember(registry, handle);
    if (member) {
        return { handle: member.github, tier: member.tier, source: TierSource.Registry, member, mergedPullRequests };
    }
    if (mergedPullRequests !== undefined && mergedPullRequests >= 1) {
        return { handle, tier: Tier.Contributor, source: TierSource.Contributions, mergedPullRequests };
    }
    return { handle, source: TierSource.None, mergedPullRequests };
}
