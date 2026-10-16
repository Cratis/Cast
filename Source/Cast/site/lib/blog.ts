// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Typed access to the writing captured at build time.
import type { Post as RawPost } from '../../writing/WritingSnapshot';
import { config, writing } from '../data';

export type ThemeId = string;
export type Post = RawPost & { headline: string; series?: string; part?: number; themes: ThemeId[] };

/** Reading themes for the filter, each a set of tags, from cast.yaml. */
export const themes: { id: ThemeId; label: string; tags: string[] }[] = config.writing.themes;

/** Splits "Title · Series, Part 3" into its parts. */
function split(title: string): Pick<Post, 'headline' | 'series' | 'part'> {
    const parts = title.match(/^(.*?)\s+·\s+(.+?),\s+Part\s+(\d+)$/);
    if (parts) return { headline: parts[1]!, series: parts[2]!, part: Number(parts[3]) };
    const series = title.match(/^(.*?)\s+·\s+(.+)$/);
    return series ? { headline: series[1]!, series: series[2]! } : { headline: title };
}

/** Newest first; posts published together keep their series order. */
export const posts: Post[] = writing.posts
    .map(post => ({ ...post, ...split(post.title), themes: themes.filter(theme => post.tags.some(tag => theme.tags.includes(tag))).map(theme => theme.id) }))
    .sort((left, right) => right.date.slice(0, 10).localeCompare(left.date.slice(0, 10)) || (left.part ?? 0) - (right.part ?? 0));

/** The first source, for "on blog.example.com" links. */
export const blogSource: string = writing.sources[0] ?? '';
export const blogHost: string = blogSource ? new URL(blogSource).host : '';
export const blogFetchedAt = writing.fetchedAt;
export const readingMinutes = posts.reduce((total, post) => total + (post.minutes ?? 0), 0);
export const postsFor = (theme: ThemeId | undefined): Post[] => (theme ? posts.filter(post => post.themes.includes(theme)) : []);
