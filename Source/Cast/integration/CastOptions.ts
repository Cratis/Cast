// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Options for the `cast()` integration. */
export type CastOptions = {
    /** Path to cast.yaml, relative to the project root. Defaults to `./cast.yaml`. */
    config?: string;

    /** Where the last good build-time data is kept, relative to the project root. Defaults to `./.cast/snapshot.json`. */
    snapshot?: string;

    /**
     * When to fetch GitHub, writing and registry data. `build` (the default) fetches on `astro build` only;
     * `always` also fetches when the dev server starts; `never` uses the snapshot only.
     */
    fetch?: 'build' | 'always' | 'never';
};
