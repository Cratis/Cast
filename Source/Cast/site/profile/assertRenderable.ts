// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isCalendarDate, isCalendarMonth, isInstant, isPartialDate } from '../../config/calendar';
import { accentTokens } from '../lib/accent';
import { alsoText, apply, formatMonth, initialProjection, normalizeDate, yearsBetween } from '../lib/career';
import { foldCalendar, formatDay, formatMonthLong } from '../lib/contributions';
import { parseInline, plainText } from '../lib/inline';
import { safeJson } from '../lib/safeJson';
import { clientCast } from './clientCast';
import type { CastView } from './CastView';

const webProtocols = new Set(['http:', 'https:']);

function fail(what: string, value: unknown): never {
    throw new Error(`${what}: cannot render ${JSON.stringify(value)?.slice(0, 120)}`);
}

function url(what: string, value: string, base?: string, protocols: ReadonlySet<string> = webProtocols): void {
    let parsed: URL;
    try {
        parsed = new URL(value, base);
    } catch {
        fail(what, value);
    }
    if (!protocols.has(parsed.protocol)) fail(what, value);
}

function count(what: string, value: number | undefined): void {
    if (value !== undefined && !(Number.isSafeInteger(value) && value >= 0)) fail(what, value);
}

/** A date the components format: an unreadable one shows as 'Invalid Date', or as a month name that does not exist. */
function shown(what: string, formatted: string, value: string): void {
    if (formatted.includes('Invalid Date') || formatted.startsWith(' ')) fail(what, value);
}

function inline(what: string, text: string | undefined): void {
    if (text === undefined) return;
    if (typeof text !== 'string') fail(what, text);
    parseInline(text);
    plainText(text);
}

function links(cast: CastView): void {
    const { config, person, github, posts } = cast;
    for (const [key, value] of Object.entries(person.links)) url(`person.links.${key}`, value);
    if (person.email) url('person.email', `mailto:${person.email}`, undefined, new Set(['mailto:']));
    url('site.url', config.site.url);
    if (config.site.source) url('site.source', config.site.source);
    // Base resolves the portrait against the site; the directory resolves relative links in text against the member's site.
    if (cast.photoUrl) url('photo', cast.photoUrl, config.site.url, new Set(['https:']));
    if (cast.host.linkOrigin) url('linkOrigin', cast.host.linkOrigin);
    for (const [key, value] of Object.entries(cast.cratis?.links ?? {})) url(`cratis.links.${key}`, value);
    for (const repo of cast.cratisRepos) if (repo.url) url(`cratis.repos.${repo.name}`, repo.url);
    for (const project of cast.liveProjects) url(`projects.${project.name}`, project.url);
    for (const talk of cast.talks) if (talk.url) url(`talks.${talk.title}`, talk.url);
    for (const certification of cast.certifications) if (certification.url) url(`certifications.${certification.title}`, certification.url);
    for (const item of cast.agentic?.items ?? []) if (item.url) url(`agentic.items.${item.name}`, item.url);
    if (cast.eventModel) url('eventModel.repo', cast.eventModel.repo);
    for (const event of cast.careerEvents) if (event.orgUrl) url(`career.${event.title}.orgUrl`, event.orgUrl);
    for (const pullRequest of github.mergedPullRequests.latest) url(`github.pullRequest.${pullRequest.number}`, pullRequest.url);
    for (const [name, release] of Object.entries(github.releases)) url(`github.releases.${name}`, release.url);
    if (github.profile?.avatarUrl) url('github.avatarUrl', github.profile.avatarUrl);
    for (const source of cast.writing.sources) url('writing.sources', source);
    for (const post of posts) url(`writing.posts.${post.title}`, post.url);
}

function texts(cast: CastView): void {
    const { person, cratis, agentic, eventModel } = cast;
    for (const [what, text] of [['tagline', person.tagline], ['intro', person.intro], ['cratis.pitch', cratis?.pitch], ['cratis.role', cratis?.role], ['agentic.pitch', agentic?.pitch], ['eventModel.intro', eventModel?.intro]] as const) inline(what, text);
    person.about.forEach((text, index) => inline(`about.${index}`, text));
    cast.careerEvents.forEach((event, index) => inline(`career.${index}.summary`, event.summary));
    cast.projects.forEach((project, index) => inline(`projects.${index}.pitch`, project.pitch));
    cast.talks.forEach((talk, index) => inline(`talks.${index}.summary`, talk.summary));
    cast.cratisRepos.forEach((repo, index) => inline(`cratis.repos.${index}.desc`, repo.desc));
    agentic?.workflow.forEach((step, index) => inline(`agentic.workflow.${index}`, step.text));
    agentic?.items.forEach((item, index) => inline(`agentic.items.${index}`, item.text));
    eventModel?.cards.forEach((card, index) => inline(`eventModel.cards.${index}`, card.note));
    eventModel?.steps.forEach((step, index) => inline(`eventModel.steps.${index}`, step.text));
    cast.sections.forEach((section, index) => {
        inline(`sections.${index}.title`, section.title);
        inline(`sections.${index}.intro`, section.intro);
    });
}

/** The career replay and the CV fold every event in order: each position must reduce to dates they can show. */
function career(cast: CastView): void {
    let state = initialProjection;
    for (const event of cast.careerEvents) {
        if (!isCalendarMonth(event.date)) fail(`career.${event.title}.date`, event.date);
        if (event.endDate !== undefined && !isCalendarMonth(event.endDate)) fail(`career.${event.title}.endDate`, event.endDate);
        state = apply(state, event);
        alsoText(state);
        if (!isCalendarMonth(normalizeDate(event.date))) fail(`career.${event.title}.date`, event.date);
    }
    for (const role of state.roles) [role.from, role.to].forEach(date => date !== undefined && shown(`career.roles.${role.org}`, formatMonth(date), date));
    if (!Number.isFinite(yearsBetween(state.shippingSince, state.clock))) fail('career.years', state.clock);
}

function calendar(cast: CastView): void {
    const { github } = cast;
    for (const week of github.contributions.weeks) {
        if (!isCalendarDate(week.start)) fail('github.contributions.weeks.start', week.start);
        week.counts.forEach(value => count('github.contributions.weeks.counts', value));
    }
    const folded = foldCalendar(github.contributions.weeks);
    for (const day of [folded.first, folded.last, folded.busiest.date].filter(Boolean)) shown('github.contributions', formatDay(day), day);
    for (const { month } of folded.months) shown('github.contributions.months', formatMonthLong(month), month);
}

function dates(cast: CastView): void {
    const { github } = cast;
    for (const [what, value] of [['github.fetchedAt', github.fetchedAt], ['writing.fetchedAt', cast.blogFetchedAt]] as const) {
        if (value !== undefined && !isInstant(value)) fail(what, value);
    }
    shown('snapshotDate', cast.snapshotDate(), String(github.fetchedAt));
    for (const pullRequest of github.mergedPullRequests.latest) if (!isInstant(pullRequest.mergedAt)) fail('github.pullRequest.mergedAt', pullRequest.mergedAt);
    for (const release of Object.values(github.releases)) if (!isInstant(release.publishedAt)) fail('github.releases.publishedAt', release.publishedAt);
    for (const post of cast.posts) if (!isInstant(post.date)) fail('writing.posts.date', post.date);
    for (const entry of [...cast.talks, ...cast.community]) if (!isPartialDate(entry.date)) fail('talks.date', entry.date);
    for (const value of Object.values(cast.now)) if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) shown('now', formatMonth(value), value);
}

function counts(cast: CastView): void {
    const { github } = cast;
    count('github.contributions.total', github.contributions.total);
    count('github.contributions.commits', github.contributions.commits);
    count('github.mergedPullRequests.total', github.mergedPullRequests.total);
    for (const value of Object.values(github.mergedPullRequests.byOrg)) count('github.mergedPullRequests.byOrg', value);
    for (const standing of Object.values(github.repositories)) for (const value of Object.values(standing)) count('github.repositories', value);
    for (const value of Object.values(github.stars)) count('github.stars', value);
    count('mergedPrTotal', cast.mergedPrTotal);
    for (const stat of cast.stats) if (!Number.isFinite(stat.value)) fail(`stats.${stat.label}`, stat.value);
}

/**
 * Computes what the profile components compute from a view (URLs, the contribution calendar, the career
 * projection, dates, inline markup and the browser data), without rendering. Throws on the first value they
 * could not render, so a builder can refuse that data before a page fails the whole build.
 */
export function assertRenderable(cast: CastView): void {
    links(cast);
    texts(cast);
    career(cast);
    calendar(cast);
    dates(cast);
    counts(cast);
    accentTokens(cast.config.theme.accent);
    safeJson(clientCast(cast));
}
