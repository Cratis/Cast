// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CareerEvent } from '../../config/CastConfig';
import type { PullRequest } from '../../github/GitHubSnapshot';
import type { WritingTheme } from '../lib/blog';
import { anchorFor } from '../lib/sections';
import type { CastView, ProfileLink } from './CastView';

/**
 * What the browser scripts (live feed, replay, palette, terminal) read about the profile on the page. The
 * layout embeds it as a JSON island, so the same scripts serve every profile the directory renders.
 */
export type ClientCast = {
    /** Path of the profile's home page, ending with '/'. */
    base: string;
    verificationUrl: string;
    /** rel for links from the member's data. */
    rel: string;
    login: string;
    orgs: string[];
    feedOrg: string;
    person: { name: string; handle: string; title: string; location?: string; tagline: string; email?: string };
    firstName: string;
    now: Record<string, string | string[]>;
    careerEvents: CareerEvent[];
    skills: Record<string, string[]>;
    talks: { date: string; title: string; host: string; url?: string }[];
    profileLinks: ProfileLink[];
    cratis?: { pitch?: string; links: Record<string, string>; repos: { name: string; role: string; url?: string; desc: string }[] };
    eventModelName?: string;
    /** DOM ids of the sections that render, in page order. */
    sections: string[];
    projects: { name: string; url: string; pitch: string; version?: string; category: string; features: string[]; stack: string[]; install?: string }[];
    pullRequests: PullRequest[];
    mergedPrTotal: number;
    snapshotDate: string;
    posts: { headline: string; url: string; part?: number; minutes?: number; themes: string[] }[];
    themes: WritingTheme[];
    blogHost: string;
};

/** The client data for one profile view. */
export function clientCast(cast: CastView): ClientCast {
    const { person } = cast;
    return {
        base: cast.host.base,
        verificationUrl: cast.verificationUrl,
        rel: cast.host.rel,
        login: cast.config.github.login,
        orgs: cast.config.github.orgs,
        feedOrg: cast.feedOrg,
        person: {
            name: person.name,
            handle: person.handle,
            title: person.title,
            tagline: person.tagline,
            ...(person.location ? { location: person.location } : {}),
            ...(person.email ? { email: person.email } : {}),
        },
        firstName: cast.firstName,
        now: cast.now,
        careerEvents: cast.careerEvents,
        skills: cast.skills,
        talks: cast.talks.map(talk => ({ date: talk.date, title: talk.title, host: talk.host, ...(talk.url ? { url: talk.url } : {}) })),
        profileLinks: cast.profileLinks,
        ...(cast.cratis ? {
            cratis: {
                ...(cast.cratis.pitch ? { pitch: cast.cratis.pitch } : {}),
                links: cast.cratis.links,
                repos: cast.cratisRepos.map(repo => ({ name: repo.name, role: repo.role, desc: repo.desc, ...(repo.url ? { url: repo.url } : {}) })),
            },
        } : {}),
        ...(cast.eventModel ? { eventModelName: cast.eventModel.name } : {}),
        sections: cast.sections.map(section => anchorFor[section.id]),
        projects: cast.liveProjects.map(project => ({
            name: project.name,
            url: project.url,
            pitch: project.pitch,
            category: project.category,
            features: project.features,
            stack: project.stack,
            ...(project.version ? { version: project.version } : {}),
            ...(project.install ? { install: project.install } : {}),
        })),
        pullRequests: cast.github.mergedPullRequests.latest,
        mergedPrTotal: cast.mergedPrTotal,
        snapshotDate: cast.snapshotDate(),
        posts: cast.posts.map(post => ({
            headline: post.headline,
            url: post.url,
            themes: post.themes,
            ...(post.part !== undefined ? { part: post.part } : {}),
            ...(post.minutes !== undefined ? { minutes: post.minutes } : {}),
        })),
        themes: cast.themes,
        blogHost: cast.blogHost,
    };
}

let cachedText: string | undefined;
let cachedValue: ClientCast | undefined;

/** Reads the client data of the page currently shown. Read again on every use: the router swaps pages. */
export function readClientCast(): ClientCast | undefined {
    const text = document.querySelector('script[data-cast-client]')?.textContent ?? undefined;
    if (!text) return undefined;
    if (text !== cachedText) {
        try {
            cachedValue = JSON.parse(text) as ClientCast;
            cachedText = text;
        } catch {
            return undefined;
        }
    }
    return cachedValue;
}
