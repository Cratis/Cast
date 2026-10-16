// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Where a resolved tier came from. */
export enum TierSource {
    /** A reviewed line in Registry/members.yaml. */
    Registry = 'registry',

    /** Merged public pull requests in the Cratis organization, counted at build time. */
    Contributions = 'contributions',

    /** Neither: the person is not (yet) part of the Cast. */
    None = 'none',
}
