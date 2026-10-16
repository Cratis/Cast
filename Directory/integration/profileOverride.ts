// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Prefix of the development-only environment variables that point a member's profile at another cast.json. */
export const profileOverridePrefix = 'CAST_DIRECTORY_PROFILE_OVERRIDE_';

/**
 * The cast.json URL a development override gives a login, if any: `CAST_DIRECTORY_PROFILE_OVERRIDE_<login>`
 * (case-insensitive, `-` written as `_`) set to a cast.json URL or to a site, whose /cast.json is then read.
 * For trying a profile locally, for example a site served by `astro preview`; never set it in CI.
 */
export function profileOverride(login: string, environment: Record<string, string | undefined>): string | undefined {
    const name = `${profileOverridePrefix}${login.replace(/-/g, '_')}`.toLowerCase();
    const value = Object.entries(environment).find(([key]) => key.toLowerCase() === name)?.[1]?.trim();
    if (!value) return undefined;
    try {
        const url = new URL(value);
        return url.pathname.endsWith('.json') ? url.toString() : new URL('cast.json', url.toString().replace(/\/?$/, '/')).toString();
    } catch {
        return undefined;
    }
}
