// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Where a profile is rendered: on the member's own Cast site, or by the Cast directory. */
export type CastHost = {
    /** Path of the profile's home page, ending with '/': '/' on a Cast site, '/<login>/' in the directory. */
    base: string;

    /** True when the directory renders the profile. The tier is then verified there, not claimed by the site. */
    verified: boolean;

    /** The rel attribute for links that come from the member's data. */
    rel: string;

    /** True when the site's own files (og.png, cast.json, llms.txt, favicon, sitemap) are served next to the pages. */
    siteFiles: boolean;

    /** Origin that relative links in inline text ('/posts/x') resolve against. Kept relative when undefined. */
    linkOrigin?: string;
};

/** A member's own Cast site. */
export const siteHost: CastHost = { base: '/', verified: false, rel: 'noopener', siteFiles: true };

/** A profile rendered by the Cast directory at `/<login>/`: links from member data are user content. */
export const directoryHost = (login: string, site?: string): CastHost => ({
    base: `/${login.toLowerCase()}/`,
    verified: true,
    rel: 'noopener nofollow ugc',
    siteFiles: false,
    ...(site ? { linkOrigin: site } : {}),
});
