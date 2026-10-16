// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PublicProfile } from './PublicProfile.js';

/** Everything the generator needs. Pure data, so the output is deterministic. */
export type ScaffoldInput = {
    /** Directory name; becomes the package name. */
    directory: string;
    profile: PublicProfile;
    /** Custom domain, for public/CNAME and site.url. */
    domain?: string;
    /** Version range of @cratis/cast to depend on. */
    castVersion: string;
};
