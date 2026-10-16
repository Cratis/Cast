// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ScaffoldInput } from '../../ScaffoldInput.js';

/** A fixed input, so the generated files can be compared with the committed snapshots. */
export const input: ScaffoldInput = {
    directory: 'sites/Ada Cast',
    profile: {
        login: 'ada',
        name: 'Ada Lovelace',
        bio: 'Analyst of engines. Writes "programs".',
        location: 'London',
        blog: 'https://ada.example',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
    domain: 'www.ada.example',
    castVersion: '^1.2.3',
};
