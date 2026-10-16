// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { z } from 'zod';
import type { writingSourceSchema } from '../config/castSchema';
import { mergePosts, parseFeed, parseStarlightAuthorPage } from './parse';
import type { Post, WritingSnapshot } from './WritingSnapshot';

type WritingSource = z.output<typeof writingSourceSchema>;
const maximumPages = 10;

async function text(url: URL): Promise<string | undefined> {
    const response = await fetch(url, { headers: { 'user-agent': 'cratis-cast-build' }, signal: AbortSignal.timeout(20_000) });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return response.text();
}

async function starlightAuthor(authorPage: string): Promise<Post[]> {
    const base = new URL(authorPage.endsWith('/') ? authorPage : `${authorPage}/`);
    const posts: Post[] = [];
    for (let page = 1; page <= maximumPages; page++) {
        const html = await text(page === 1 ? base : new URL(`${page}/`, base));
        if (!html) break;
        const found = parseStarlightAuthorPage(html, base.origin);
        if (found.length === 0) break;
        posts.push(...found);
        if (!html.includes(`${base.pathname}${page + 1}/`)) break;
    }
    return posts;
}

/** Captures posts from every source. Returns undefined when no source produced posts. Never throws. */
export async function fetchWriting(sources: readonly WritingSource[], warn: (message: string) => void): Promise<WritingSnapshot | undefined> {
    const posts: Post[] = [];
    const origins: string[] = [];
    for (const source of sources) {
        try {
            if ('rss' in source) {
                const xml = await text(new URL(source.rss));
                const found = xml ? parseFeed(xml, source.author) : [];
                posts.push(...found);
                origins.push(new URL(source.rss).origin);
            } else {
                posts.push(...await starlightAuthor(source.starlightBlogAuthor));
                origins.push(source.starlightBlogAuthor);
            }
        } catch (error) {
            warn(`writing source ${'rss' in source ? source.rss : source.starlightBlogAuthor}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (posts.length === 0) return undefined;
    return { fetchedAt: new Date().toISOString(), sources: origins, posts: mergePosts(posts) };
}
