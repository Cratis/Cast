// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Tier } from './Tier';

/** One reviewed line in Registry/members.yaml. */
export type RegistryMember = {
    github: string;
    tier: Tier.Core | Tier.Partner;
    since?: string;
    role?: string;
    site?: string;
    /** URL of the member's /cast.json, for sites that publish it elsewhere. Defaults to `<site>/cast.json`. */
    profile?: string;
    company?: string;
    /** 1-based line in members.yaml where this entry starts, for "verified from" links. */
    line?: number;
};
