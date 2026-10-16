// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CastConfig } from '../config/CastConfig';
import { project } from '../site/lib/career';
import { plainText } from '../site/lib/inline';

const network: Record<string, string> = { github: 'GitHub', linkedin: 'LinkedIn', mastodon: 'Mastodon', bluesky: 'Bluesky', x: 'X', twitter: 'X', youtube: 'YouTube' };

/** 'YYYY-MM' stays; 'YYYY' stays: both are valid JSON Resume ISO 8601 partial dates. */
const isoDate = (date: string): string => date;

const username = (url: string): string => url.replace(/\/+$/, '').split('/').pop() ?? '';

/** Splits "Norwegian (native)" into language and fluency. */
const language = (entry: string) => {
    const match = entry.match(/^(.*?)\s*\((.+)\)\s*$/);
    return match ? { language: match[1]!, fluency: match[2]! } : { language: entry };
};

/** Maps cast.yaml to a JSON Resume document (https://jsonresume.org/schema). */
export function resumeJson(config: CastConfig, imageUrl?: string) {
    const person = config.person;
    const projection = project(config.career.events);
    const volunteerTypes = new Set(['VolunteerTeamJoined']);
    const [city] = (person.location ?? '').split(',').map(part => part.trim());

    return {
        $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
        basics: {
            name: person.fullName ?? person.name,
            label: person.title,
            ...(imageUrl ? { image: imageUrl } : {}),
            ...(person.email ? { email: person.email } : {}),
            url: config.site.url,
            summary: plainText(person.about.length ? person.about.join('\n\n') : person.intro),
            ...(person.location ? { location: { city, ...(person.country ? { countryCode: person.country } : {}) } } : {}),
            profiles: [
                { network: 'GitHub', username: config.github.login, url: `https://github.com/${config.github.login}` },
                ...Object.entries(person.links)
                    .filter(([key]) => key !== 'github')
                    .map(([key, url]) => ({ network: network[key.toLowerCase()] ?? key, username: username(url), url })),
            ],
        },
        work: [...projection.roles].reverse().map(role => ({
            name: role.org,
            position: role.title,
            ...(role.orgUrl ? { url: role.orgUrl } : {}),
            ...(role.location ? { location: role.location } : {}),
            startDate: isoDate(role.from),
            ...(role.to ? { endDate: isoDate(role.to) } : {}),
            summary: plainText(role.summary),
            ...(role.skills.length ? { highlights: role.skills } : {}),
        })),
        volunteer: config.career.events.filter(event => volunteerTypes.has(event.type)).map(event => ({
            organization: event.org ?? '',
            position: event.title,
            ...(event.orgUrl ? { url: event.orgUrl } : {}),
            startDate: isoDate(event.date),
            ...(event.endDate ? { endDate: isoDate(event.endDate) } : {}),
            summary: plainText(event.summary),
        })),
        education: config.education.map(entry => ({
            institution: entry.school,
            studyType: entry.degree,
            startDate: entry.from,
            ...(entry.to ? { endDate: entry.to } : {}),
        })),
        certificates: config.certifications.map(certificate => ({
            name: certificate.title,
            issuer: certificate.issuer,
            date: certificate.year,
            ...(certificate.url ? { url: certificate.url } : {}),
        })),
        skills: Object.entries(config.skills).map(([name, keywords]) => ({ name, keywords })),
        languages: person.languages.map(language),
        interests: person.interests.map(name => ({ name })),
        projects: config.projects.map(entry => ({
            name: entry.name,
            url: entry.url,
            description: plainText(entry.pitch),
            ...(entry.features.length ? { highlights: entry.features } : {}),
            ...(entry.stack.length ? { keywords: entry.stack } : {}),
        })),
        meta: { canonical: `${config.site.url.replace(/\/$/, '')}/resume.json`, version: 'v1.0.0' },
    };
}
