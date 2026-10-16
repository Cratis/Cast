// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { z } from 'zod';
import { LiveStat } from './LiveStat';
import { SectionId } from './SectionId';
import { ThemeMode } from './ThemeMode';

/** 'YYYY-MM' or 'YYYY'. */
const month = z.string().regex(/^\d{4}(-\d{2})?$/, 'Use YYYY-MM or YYYY');

/** 'YYYY-MM-DD', 'YYYY-MM' or 'YYYY'. */
const date = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Use YYYY-MM-DD, YYYY-MM or YYYY');

const url = z.url({ protocol: /^https?$/ });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color such as #8b5cf6');

/** Inline text may use *emphasis*, `code` and [links](https://example.com). */
const text = z.string().min(1);

export const personSchema = z.object({
    name: z.string().min(1).describe('Display name, for example "Ada Lovelace".'),
    fullName: z.string().optional().describe('Full legal name when it differs from the display name.'),
    handle: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/, 'Must be your GitHub login').describe('Your GitHub login: your one Cast identity. Tier, badge, /cast.json and the verification page all use it.'),
    title: z.string().min(1).describe('Role line under your name.'),
    titleShort: z.string().optional().describe('Shorter role line for small screens.'),
    location: z.string().optional(),
    country: z.string().length(2).optional().describe('ISO 3166 two-letter country code, used in structured data.'),
    email: z.email().optional(),
    photo: z.string().optional().describe('Portrait: a path relative to cast.yaml (for example ./avatar.jpeg) or an https URL.'),
    links: z.record(z.string(), url).default({}).describe('Profile links by name: github, linkedin, mastodon, bluesky, website or anything else.'),
    tagline: text.describe('The hero headline. Wrap the words to accent in *asterisks*.'),
    intro: text.describe('One paragraph under the headline.'),
    about: z.array(text).default([]),
    interests: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
});

export const careerEventSchema = z.object({
    seq: z.number().int().positive().optional().describe('Stream position. Assigned in file order when omitted.'),
    date: month,
    endDate: month.optional().describe('End of an engagement that does not set a role.'),
    type: z.string().regex(/^[A-Z][A-Za-z]+$/, 'Event types are past-tense PascalCase, for example EmploymentStarted').describe('Past-tense event name.'),
    title: z.string().min(1),
    org: z.string().optional(),
    orgUrl: url.optional(),
    location: z.string().optional(),
    summary: text,
    skills: z.array(z.string()).optional(),
    role: z.string().optional().describe('Sets the current role in the projection.'),
    endsRole: z.string().optional().describe('Organization whose open role this event ends.'),
});

export const statSchema = z.object({
    value: z.number(),
    prefix: z.string().default(''),
    suffix: z.string().default(''),
    label: z.string().min(1),
    live: z.enum(LiveStat).optional().describe('Replace the value with a build-time number.'),
    plain: z.boolean().default(false).describe('Show the value without counting up or thousands separators.'),
});

export const cratisRepositorySchema = z.object({
    name: z.string().min(1).describe('Repository name in the Cratis organization.'),
    url: url.optional().describe('Omit for repositories that are not public; they are then never fetched.'),
    kind: z.string().min(1),
    group: z.enum(['pipeline', 'tooling', 'client']).default('tooling'),
    step: z.string().optional(),
    note: z.string().optional(),
    role: z.string().optional().describe('Fallback role text; replaced by the live rank when GitHub data is available.'),
    rank: z.number().int().min(0).default(0),
    founded: z.boolean().default(false),
    commits: z.number().int().min(0).default(0),
    prs: z.number().int().min(0).default(0),
    desc: text,
});

export const cratisSchema = z.object({
    title: z.string().default('What I lead at Cratis.'),
    label: z.string().default('Cratis'),
    pitch: text.optional(),
    role: text.describe('What you do at Cratis, in your own words.'),
    links: z.record(z.string(), url).default({ 'cratis.io': 'https://cratis.io', 'github.com/Cratis': 'https://github.com/Cratis' }),
    pipeline: z.array(z.string()).default([]).describe('Repository names shown as the model-to-running-app pipeline, left to right.'),
    clientLanguages: z.array(z.string()).default([]),
    repos: z.array(cratisRepositorySchema).default([]),
    highlights: z.array(z.string()).default([]),
});

export const projectSchema = z.object({
    name: z.string().min(1),
    url: url,
    pitch: text,
    features: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    install: z.string().optional().describe('Install command with a copy button.'),
    version: z.string().optional().describe('Fallback version; replaced by the latest GitHub release when tracked.'),
    category: z.string().default('project'),
    featured: z.boolean().default(false).describe('Show the card at double width.'),
});

export const projectCategorySchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    filter: z.string().optional().describe('Filter chip label; defaults to label.'),
});

export const talkSchema = z.object({
    title: z.string().min(1),
    lang: z.string().default('en').describe('BCP 47 language of the talk, for example "en" or "no".'),
    host: z.string().min(1),
    with: z.string().optional(),
    date: date,
    url: url.optional(),
    summary: text,
});

export const communitySchema = z.object({
    title: z.string().min(1),
    detail: z.string().default(''),
    date: date,
});

export const writingSourceSchema = z.union([
    z.object({
        rss: url.describe('RSS or Atom feed URL.'),
        author: z.string().optional().describe('Only include entries by this author name.'),
    }),
    z.object({
        starlightBlogAuthor: url.describe('Author page of a Starlight Blog site, for example https://blog.cratis.io/authors/your-name/.'),
    }),
]);

export const writingThemeSchema = z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    tags: z.array(z.string()).min(1),
});

export const writingSchema = z.object({
    sources: z.array(writingSourceSchema).default([]),
    themes: z.array(writingThemeSchema).default([]).describe('Filter chips, each a set of post tags.'),
    agenticTheme: z.string().optional().describe('Theme id whose posts the agentic section lists.'),
});

export const agenticStepSchema = z.object({
    step: z.string().min(1),
    event: z.string().regex(/^[A-Z][A-Za-z]+$/),
    who: z.string().min(1),
    text: text,
    loop: z.string().optional().describe('A loop-back note shown on the step, for example "blocker → Implement".'),
});

export const agenticItemSchema = z.object({
    name: z.string().min(1),
    url: url.optional(),
    kind: z.string().min(1),
    text: text,
    list: z.array(z.string()).optional(),
    listLabel: z.string().optional(),
});

export const agenticSchema = z.object({
    title: z.string().default('I build the harness.'),
    pitch: text,
    label: z.string().default('Agentic engineering'),
    workflowLabel: z.string().default('every change in my setup'),
    workflow: z.array(agenticStepSchema).default([]),
    items: z.array(agenticItemSchema).default([]),
});

export const modelCardSchema = z.object({
    id: z.string().min(1),
    kind: z.enum(['ui', 'command', 'event', 'view']),
    name: z.string().min(1),
    lane: z.string().min(1),
    col: z.number().int().min(0),
    source: z.string().min(1),
    note: text,
});

export const eventModelSchema = z.object({
    title: z.string().default('Start with the *event model.*'),
    label: z.string().default('How I think'),
    intro: text.optional().describe('Paragraph under the title. Defaults to a short explanation of the board.'),
    summary: z.string().optional().describe('Line under the board before a card is selected.'),
    name: z.string().min(1),
    repo: url,
    sourceRoot: z.string().default(''),
    branch: z.string().default('main'),
    columns: z.number().int().positive(),
    lanes: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    cards: z.array(modelCardSchema).min(1),
    edges: z.array(z.tuple([z.string(), z.string()])).default([]),
    steps: z.array(z.object({ title: z.string().min(1), text: text, cards: z.array(z.string()) })).default([]),
});

export const educationSchema = z.object({
    degree: z.string().min(1),
    school: z.string().min(1),
    from: z.string().min(1),
    to: z.string().optional(),
});

export const certificationSchema = z.object({
    title: z.string().min(1),
    issuer: z.string().min(1),
    year: z.string().min(1),
    url: url.optional(),
});

export const githubSchema = z.object({
    login: z.string().optional().describe('Must equal person.handle (case-insensitive) when given; your GitHub login is your one identity.'),
    orgs: z.array(z.string()).default(['Cratis']).describe('Organizations whose merged public pull requests are counted. The first one feeds the live pull request feed.'),
    releases: z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/)).default([]).describe('owner/name repositories whose latest release versions your projects.'),
    stars: z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/)).default([]).describe('owner/name repositories whose star count is shown.'),
});

export const themeSchema = z.object({
    accent: hex.default('#8b5cf6').describe('Your accent color. Defaults to Cratis violet.'),
    mode: z.enum(ThemeMode).default(ThemeMode.Dark),
});

export const sectionEntrySchema = z.union([
    z.enum(SectionId),
    z.object({
        id: z.enum(SectionId),
        title: z.string().optional(),
        label: z.string().optional(),
        intro: text.optional(),
    }),
]);

export const siteSchema = z.object({
    url: url.describe('Public URL of the site, for example https://ada.dev.'),
    description: z.string().optional().describe('Meta description; defaults to the tagline and intro.'),
    source: url.optional().describe('Source repository, linked in the footer.'),
    language: z.string().default('en'),
});

export const castSchema = z.object({
    $schema: z.string().optional(),
    site: siteSchema,
    person: personSchema,
    now: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}).describe('The "now" read model: ordered key/value rows. YYYY-MM values are shown as months.'),
    stats: z.array(statSchema).default([]),
    career: z.object({ events: z.array(careerEventSchema).default([]) }).default({ events: [] }),
    cratis: cratisSchema.optional(),
    projects: z.array(projectSchema).default([]),
    projectCategories: z.array(projectCategorySchema).default([]),
    talks: z.array(talkSchema).default([]),
    community: z.array(communitySchema).default([]),
    writing: writingSchema.default({ sources: [], themes: [] }),
    agentic: agenticSchema.optional(),
    eventModel: eventModelSchema.optional(),
    skills: z.record(z.string(), z.array(z.string())).default({}),
    education: z.array(educationSchema).default([]),
    certifications: z.array(certificationSchema).default([]),
    github: githubSchema.default({ orgs: ['Cratis'], releases: [], stars: [] }),
    theme: themeSchema.default({ accent: '#8b5cf6', mode: ThemeMode.Dark }),
    sections: z.array(sectionEntrySchema).optional().describe('Section order. Listed sections render in this order; omitted ones are hidden. Omit the key to show every section that has data.'),
}).strict();
