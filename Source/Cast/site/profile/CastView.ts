// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ImageMetadata } from 'astro';
import { verificationUrl } from '../../badges/constants';
import type { CastData } from '../../integration/CastData';
import { writingView, type WritingView } from '../lib/blog';
import { gitHubView, type GitHubView } from '../lib/github';
import type { CastHost } from './CastHost';

/** Everything one profile renders from: the resolved data, plus the imported local portrait on a Cast site. */
export type CastProfile = CastData & { photo?: ImageMetadata };

/** A profile link with the label it reads as. */
export type ProfileLink = { key: string; label: string; url: string };

/** Known link names and how they read. Anything else is shown with its key. */
const linkLabels: Record<string, string> = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    mastodon: 'Mastodon',
    bluesky: 'Bluesky',
    x: 'X',
    twitter: 'X',
    youtube: 'YouTube',
    website: 'Website',
    blog: 'Blog',
};

/**
 * One profile, ready to render: the data, the shortcuts the components read and where it is rendered. Every
 * page and component of a Cast profile takes this as its `cast` prop, so the same components render a Cast
 * site and the directory's member pages.
 */
export type CastView = CastProfile & GitHubView & WritingView & {
    host: CastHost;
    person: CastData['config']['person'];
    now: CastData['config']['now'];
    careerEvents: CastData['config']['career']['events'];
    cratis: CastData['config']['cratis'];
    projects: CastData['config']['projects'];
    talks: CastData['config']['talks'];
    community: CastData['config']['community'];
    education: CastData['config']['education'];
    certifications: CastData['config']['certifications'];
    skills: CastData['config']['skills'];
    agentic: CastData['config']['agentic'];
    eventModel: CastData['config']['eventModel'];
    stats: CastData['config']['stats'];
    /** First word of the display name: projections are named `<FirstName>.Now`, `<FirstName>.Career`. */
    firstName: string;
    /** Profile links with labels, GitHub first. */
    profileLinks: ProfileLink[];
    /** The GitHub profile URL: from links, else from the login. */
    githubUrl: string;
    /** The organization whose merged pull requests feed the live feed. */
    feedOrg: string;
    /** The directory page that verifies this profile's tier. */
    verificationUrl: string;
    /** A path under the profile: `href('cv')` is `/cv` on a site and `/<login>/cv` in the directory. */
    href: (path?: string) => string;
};

/** Builds the view of one profile for one host. */
export function castView(profile: CastProfile, host: CastHost): CastView {
    const { config } = profile;
    const person = config.person;
    const profileLinks = Object.entries(person.links)
        .map(([key, url]) => ({ key, label: linkLabels[key.toLowerCase()] ?? key, url }))
        .sort((left, right) => Number(right.key === 'github') - Number(left.key === 'github'));
    return {
        ...profile,
        ...gitHubView(config, profile.github),
        ...writingView(config, profile.writing),
        host,
        person,
        now: config.now,
        careerEvents: config.career.events,
        cratis: config.cratis,
        projects: config.projects,
        talks: config.talks,
        community: config.community,
        education: config.education,
        certifications: config.certifications,
        skills: config.skills,
        agentic: config.agentic,
        eventModel: config.eventModel,
        stats: config.stats,
        firstName: person.name.split(/\s+/)[0] ?? person.handle,
        profileLinks,
        githubUrl: person.links['github'] ?? `https://github.com/${config.github.login}`,
        feedOrg: config.github.orgs[0] ?? 'Cratis',
        verificationUrl: verificationUrl(config.github.login),
        href: (path = '') => `${host.base}${path.replace(/^\//, '')}`,
    };
}
