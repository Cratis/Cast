// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ResolvedTier } from '../badges/ResolvedTier';
import type { CastConfig } from '../config/CastConfig';
import type { ResolvedSection } from '../config/ResolvedSection';
import type { GitHubSnapshot } from '../github/GitHubSnapshot';
import type { WritingSnapshot } from '../writing/WritingSnapshot';

/** Everything the site renders from, resolved once per build and served through `virtual:cast`. */
export type CastData = {
    config: CastConfig;
    sections: ResolvedSection[];
    github: GitHubSnapshot;
    writing: WritingSnapshot;
    tier: ResolvedTier;
    /** Remote portrait URL, when `person.photo` is an https URL. */
    photoUrl?: string;
    build: { builtAt: string; castVersion: string; githubSource: 'live' | 'snapshot' | 'none'; registrySource: 'live' | 'bundled' };
};
