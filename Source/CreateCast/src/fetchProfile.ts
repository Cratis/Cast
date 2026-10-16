// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PublicProfile } from './PublicProfile.js';

type UserResponse = { login?: string; name?: string | null; bio?: string | null; location?: string | null; blog?: string | null; avatar_url?: string | null };

const clean = (value: string | null | undefined): string | undefined => (value && value.trim() ? value.trim() : undefined);

/** Reads a public GitHub profile. Without network or for an unknown login it returns just the login. */
export async function fetchProfile(login: string, fetchImplementation: typeof fetch = fetch): Promise<{ profile: PublicProfile; found: boolean }> {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    try {
        const response = await fetchImplementation(`https://api.github.com/users/${encodeURIComponent(login)}`, {
            headers: { accept: 'application/vnd.github+json', 'user-agent': 'cratis-create-cast', ...(token ? { authorization: `bearer ${token}` } : {}) },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return { profile: { login }, found: false };
        const user = await response.json() as UserResponse;
        const blog = clean(user.blog);
        return {
            found: true,
            profile: {
                login: clean(user.login) ?? login,
                ...(clean(user.name) ? { name: clean(user.name) } : {}),
                ...(clean(user.bio) ? { bio: clean(user.bio) } : {}),
                ...(clean(user.location) ? { location: clean(user.location) } : {}),
                ...(blog ? { blog: /^https?:\/\//.test(blog) ? blog : `https://${blog}` } : {}),
                ...(clean(user.avatar_url) ? { avatarUrl: clean(user.avatar_url) } : {}),
            },
        };
    } catch {
        return { profile: { login }, found: false };
    }
}
