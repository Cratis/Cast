// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Typed views over the writing captured at build time.
import type { CastConfig } from '../../config/CastConfig';
import type { Post as RawPost, WritingSnapshot } from '../../writing/WritingSnapshot';

export type ThemeId = string;
export type Post = RawPost & { headline: string; series?: string; part?: number; themes: ThemeId[] };
export type WritingTheme = { id: ThemeId; label: string; tags: string[] };

/** Splits "Title · Series, Part 3" into its parts. */
function split(title: string): Pick<Post, 'headline' | 'series' | 'part'> {
    const parts = title.match(/^(.*?)\s+·\s+(.+?),\s+Part\s+(\d+)$/);
    if (parts) return { headline: parts[1]!, series: parts[2]!, part: Number(parts[3]) };
    const series = title.match(/^(.*?)\s+·\s+(.+)$/);
    return series ? { headline: series[1]!, series: series[2]! } : { headline: title };
}

const hostOf = (url: string): string => {
    try {
        return new URL(url).host;
    } catch {
        return '';
    }
};

/** What the writing sections read. */
export type WritingView = {
    /** Reading themes for the filter, each a set of tags, from cast.yaml. */
    themes: WritingTheme[];
    /** Newest first; posts published together keep their series order. */
    posts: Post[];
    /** The first source, for "on blog.example.com" links. */
    blogSource: string;
    blogHost: string;
    blogFetchedAt?: string;
    readingMinutes: number;
    postsFor: (theme: ThemeId | undefined) => Post[];
};

/** Builds the writing view for one profile. */
export function writingView(config: CastConfig, writing: WritingSnapshot): WritingView {
    const themes = config.writing.themes;
    const posts: Post[] = writing.posts
        .map(post => ({ ...post, ...split(post.title), themes: themes.filter(theme => post.tags.some(tag => theme.tags.includes(tag))).map(theme => theme.id) }))
        .sort((left, right) => right.date.slice(0, 10).localeCompare(left.date.slice(0, 10)) || (left.part ?? 0) - (right.part ?? 0));
    const blogSource = writing.sources[0] ?? '';
    return {
        themes,
        posts,
        blogSource,
        blogHost: blogSource ? hostOf(blogSource) : '',
        ...(writing.fetchedAt ? { blogFetchedAt: writing.fetchedAt } : {}),
        readingMinutes: posts.reduce((total, post) => total + (post.minutes ?? 0), 0),
        postsFor: theme => (theme ? posts.filter(post => post.themes.includes(theme)) : []),
    };
}
