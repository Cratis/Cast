// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Post } from './WritingSnapshot';

/** Strips tags, decodes the common entities and collapses whitespace. */
export const decodeHtml = (value: string): string =>
    value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&#x27;|&apos;/g, '\'')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

/** Parses the post previews on a Starlight Blog author page. Only links on `origin` are kept. */
export function parseStarlightAuthorPage(html: string, origin: string): Post[] {
    const posts: Post[] = [];
    for (const block of html.split('<article class="sl-blog-preview').slice(1)) {
        const href = block.match(/class="sl-blog-preview-link[^"]*" href="([^"]+)"/)?.[1];
        const title = block.match(/<h2 class="sl-blog-preview-title[^"]*">([\s\S]*?)<\/h2>/)?.[1];
        const date = block.match(/<time[^>]*datetime="([^"]+)"/)?.[1];
        if (!href || !title || !date) continue;
        const url = new URL(href, origin);
        if (url.protocol !== 'https:' || url.origin !== origin) continue;
        const minutes = Number(block.match(/(\d+) min read/)?.[1]) || undefined;
        const excerpt = block.match(/sl-blog-preview-excerpt[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
        const tags = [...block.matchAll(/class="sl-blog-tag[^"]*" href="[^"]*">([^<]+)<\/a>/g)].map(match => decodeHtml(match[1]!));
        posts.push({ title: decodeHtml(title), url: url.toString(), date, minutes, description: decodeHtml(excerpt), tags });
    }
    return posts;
}

const tagValue = (block: string, name: string): string | undefined =>
    block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

/** Parses RSS 2.0 items and Atom entries. With `author`, keeps only entries naming that author. */
export function parseFeed(xml: string, author?: string): Post[] {
    const blocks = [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)].map(match => match[0]);
    const posts: Post[] = [];
    for (const block of blocks) {
        const title = tagValue(block, 'title');
        const link = block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? tagValue(block, 'link');
        const date = tagValue(block, 'pubDate') ?? tagValue(block, 'published') ?? tagValue(block, 'updated') ?? tagValue(block, 'dc:date');
        if (!title || !link || !date) continue;
        const authors = [tagValue(block, 'author'), tagValue(block, 'dc:creator'), tagValue(block, 'name')].filter(Boolean).map(value => decodeHtml(value!));
        if (author && !authors.some(name => name.toLowerCase().includes(author.toLowerCase()))) continue;
        let url: URL;
        try {
            url = new URL(decodeHtml(link));
        } catch {
            continue;
        }
        if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
        const parsedDate = new Date(decodeHtml(date));
        if (Number.isNaN(parsedDate.getTime())) continue;
        const description = decodeHtml(tagValue(block, 'description') ?? tagValue(block, 'summary') ?? '').slice(0, 400);
        const tags = [...block.matchAll(/<category(?:[^>]*term="([^"]+)"[^>]*\/?>|[^>]*>([\s\S]*?)<\/category>)/gi)]
            .map(match => decodeHtml(match[1] ?? match[2] ?? '').toLowerCase().replace(/\s+/g, '-'))
            .filter(Boolean);
        posts.push({ title: decodeHtml(title), url: url.toString(), date: parsedDate.toISOString(), description, tags });
    }
    return posts;
}

/** Newest first, one entry per URL. */
export const mergePosts = (posts: readonly Post[]): Post[] =>
    [...new Map(posts.map(post => [post.url, post])).values()].sort((left, right) => right.date.localeCompare(left.date));
