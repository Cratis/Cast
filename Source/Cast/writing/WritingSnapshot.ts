// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A post as captured from a feed or an author page. */
export type Post = {
    title: string;
    url: string;
    date: string;
    minutes?: number;
    description: string;
    tags: string[];
};

/** Everything Cast captured from the configured writing sources. */
export type WritingSnapshot = {
    fetchedAt?: string;
    /** Where the posts came from, for "on blog.example.com" links. */
    sources: string[];
    posts: Post[];
};
