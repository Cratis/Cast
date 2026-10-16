// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { GitHubSnapshot } from '../github/GitHubSnapshot';
import type { WritingSnapshot } from '../writing/WritingSnapshot';

/** The file at `.cast/snapshot.json`: the last data that was captured successfully. */
export type Snapshot = {
    version: 1;
    github?: GitHubSnapshot;
    writing?: WritingSnapshot;
};
