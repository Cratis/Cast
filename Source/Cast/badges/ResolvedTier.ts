// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RegistryMember } from './RegistryMember';
import type { Tier } from './Tier';
import type { TierSource } from './TierSource';

/** The tier a handle holds, as verified at build time. */
export type ResolvedTier = {
    handle: string;
    tier?: Tier;
    source: TierSource;
    /** The registry entry, when the tier came from the registry. */
    member?: RegistryMember;
    /** Merged public pull requests in the Cratis organization, when known. */
    mergedPullRequests?: number;
};
