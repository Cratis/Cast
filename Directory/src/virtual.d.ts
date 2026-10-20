// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

declare module 'virtual:cast-directory/profiles' {
    /** Every member page's data by lowercase login, built by the directory integration. */
    export const profiles: Record<string, import('../integration/memberProfile').MemberProfile>;
    /** Optional organization activity, freshly read at build time rather than cached with member profiles. */
    export const orgStats: import('../integration/OrgStats').OrgStats | undefined;
}
