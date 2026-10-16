// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// The one place components read cast.yaml and build-time data from.
import { config, github, writing, tier, sections, build, photo, photoUrl } from 'virtual:cast';

export { config, github, writing, tier, sections, build, photo, photoUrl };

export const person = config.person;
export const now = config.now;
export const careerEvents = config.career.events;
export const cratis = config.cratis;
export const projects = config.projects;
export const talks = config.talks;
export const community = config.community;
export const education = config.education;
export const certifications = config.certifications;
export const skills = config.skills;
export const agentic = config.agentic;
export const eventModel = config.eventModel;
export const stats = config.stats;

/** First word of the display name: projections are named `<FirstName>.Now`, `<FirstName>.Career`. */
export const firstName = person.name.split(/\s+/)[0] ?? person.handle;

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

/** Profile links with labels, GitHub first. */
export const profileLinks: { key: string; label: string; url: string }[] = Object.entries(person.links)
    .map(([key, url]) => ({ key, label: linkLabels[key.toLowerCase()] ?? key, url }))
    .sort((left, right) => Number(right.key === 'github') - Number(left.key === 'github'));

/** The GitHub profile URL: from links, else from the handle. */
export const githubUrl = person.links['github'] ?? `https://github.com/${config.github.login}`;

/** The organization whose merged pull requests feed the live feed. */
export const feedOrg = config.github.orgs[0] ?? 'Cratis';
