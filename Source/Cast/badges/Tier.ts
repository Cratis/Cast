// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Cast membership tiers. Core and Partner come only from the reviewed registry; Contributor is earned. */
export enum Tier {
    /** Founders and maintainers of Cratis. */
    Core = 'core',

    /** Consultants and companies Cratis vouches for. */
    Partner = 'partner',

    /** Anyone with at least one merged public pull request in the Cratis organization. */
    Contributor = 'contributor',
}
