// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { z } from 'zod';
import { TierSource } from '../badges/TierSource';
import type { CastConfig } from '../config/CastConfig';
import { CastConfigError } from '../config/CastConfigError';
import { parseCastObject } from '../config/parseCast';
import { resolveSections } from '../config/resolveSections';
import { emptySnapshot, type GitHubSnapshot } from '../github/GitHubSnapshot';
import { assertRenderable } from '../site/profile/assertRenderable';
import { directoryHost } from '../site/profile/CastHost';
import { castView } from '../site/profile/CastView';
import type { WritingSnapshot } from '../writing/WritingSnapshot';
import { castJsonSchema, castJsonVersion } from './castJsonSchema';

/** The largest cast.json the directory reads, in bytes. */
export const maximumCastJsonBytes = 1_000_000;

/** A profile read from a cast.json, ready to render. It never carries a tier: tiers come from the directory. */
export type CastJsonProfile = {
    handle: string;
    generator?: string;
    builtAt?: string;
    config: CastConfig;
    /** Present only when it was captured for the profile handle. */
    github?: GitHubSnapshot;
    writing?: WritingSnapshot;
    /** The portrait, when `person.photo` is an https URL. */
    photoUrl?: string;
};

/** The outcome of reading a cast.json: the profile and what was dropped from it, or why it was refused. */
export type CastJsonResult =
    | { profile: CastJsonProfile; dropped: string[] }
    | { problems: string[] };

type Path = PropertyKey[];
type Container = Record<PropertyKey, unknown> | unknown[];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const sameLogin = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();
const describe = (path: Path) => path.map(String).join('.');

function at(root: unknown, path: Path): unknown {
    return path.reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<PropertyKey, unknown>)[key] : undefined), root);
}

function remove(root: unknown, path: Path): void {
    const parent = at(root, path.slice(0, -1)) as Container | undefined;
    const key = path[path.length - 1]!;
    if (Array.isArray(parent) && typeof key === 'number') parent.splice(key, 1);
    else if (parent && typeof parent === 'object') delete (parent as Record<PropertyKey, unknown>)[key];
}

/** A link or address that failed validation (javascript:, data:, relative and so on): dropped, not fatal. */
const isBadLink = (issue: z.core.$ZodIssue): boolean =>
    issue.code === 'invalid_format' && (issue.format === 'url' || issue.format === 'email');

/** How large any one part of a cast.json may be. The file itself is at most {@link maximumCastJsonBytes}. */
const limits = { depth: 24, string: 20_000, items: 2_000 };

/** Where the document exceeds {@link limits}, if anywhere. */
function oversized(value: unknown, path: Path = []): string | undefined {
    if (path.length > limits.depth) return `${describe(path)}: nested deeper than ${limits.depth} levels`;
    if (typeof value === 'string') return value.length > limits.string ? `${describe(path)}: longer than ${limits.string} characters` : undefined;
    if (!value || typeof value !== 'object') return undefined;
    const entries = Array.isArray(value) ? value.map((item, index) => [index, item] as const) : Object.entries(value);
    if (entries.length > limits.items) return `${describe(path) || '(root)'}: more than ${limits.items} entries`;
    for (const [key, item] of entries) {
        const problem = (typeof key === 'string' && key.length > limits.string ? `${describe(path)}: a key longer than ${limits.string} characters` : undefined) ?? oversized(item, [...path, key]);
        if (problem) return problem;
    }
    return undefined;
}

/** A portrait the directory can show: an absolute https URL that parses. */
function isHttpsUrl(value: unknown): value is string {
    if (typeof value !== 'string' || value.length > 2_000 || !URL.canParse(value)) return false;
    return new URL(value).protocol === 'https:';
}

/** The optional build-time captures: when one does not validate, it is dropped and the directory uses its own data. */
const captures: Path[] = [['profile', 'github'], ['profile', 'writing']];
const captureOf = (path: Path): Path | undefined => captures.find(capture => capture.every((key, index) => path[index] === key));

/** The path of the array element closest to `path`, when there is one. */
function enclosingElement(path: Path): Path | undefined {
    for (let index = path.length - 1; index > 0; index--) {
        if (typeof path[index] === 'number') return path.slice(0, index + 1);
    }
    return undefined;
}

/**
 * Validates a cast.json document (format version 2) for rendering by someone other than its owner. Every
 * link must be http(s) and every address an email: other links are dropped, and an array item whose
 * required link was dropped goes with it. The identity must equal `expectedLogin` when given, case-insensitively.
 * A tier anywhere in the file is ignored. A GitHub or writing capture that does not validate, or that the profile
 * pages cannot render, is dropped. The rest is checked the way the profile pages use it (real dates, URLs that
 * parse, a career that replays); unknown versions, oversized parts and anything else that does not validate or
 * render are refused, so one member's file can never stop the directory build.
 */
export function profileFromCastJson(json: unknown, expectedLogin?: string): CastJsonResult {
    if (!isObject(json)) return { problems: ['cast.json is not a JSON object'] };
    if (json['castJsonVersion'] !== castJsonVersion) return { problems: [`castJsonVersion ${JSON.stringify(json['castJsonVersion'])} is not supported; expected ${castJsonVersion}`] };

    const tooLarge = oversized(json);
    if (tooLarge) return { problems: [tooLarge] };

    const document = JSON.parse(JSON.stringify(json)) as Record<string, unknown>;
    const dropped: string[] = [];
    const cast = at(document, ['profile', 'cast']);
    if (isObject(cast)) {
        // A tier is never read from a profile; the directory decides it.
        if ('tier' in cast) {
            delete cast['tier'];
            dropped.push('profile.cast.tier');
        }
        const person = cast['person'];
        if (isObject(person) && person['photo'] !== undefined && !isHttpsUrl(person['photo'])) {
            delete person['photo'];
            dropped.push('profile.cast.person.photo');
        }
    }

    const removed = new Set<string>();
    for (let attempt = 0; attempt < 200; attempt++) {
        const result = castJsonSchema.safeParse(document);
        if (result.success) return finish(result.data, document, expectedLogin, dropped);

        const issue = result.error.issues.find(candidate => isBadLink(candidate) || removed.has(describe(candidate.path)));
        if (!issue) {
            const capture = result.error.issues.map(candidate => captureOf(candidate.path)).find(Boolean);
            if (!capture) return { problems: result.error.issues.map(problem => `${describe(problem.path) || '(root)'}: ${problem.message}`) };
            remove(document, capture);
            dropped.push(describe(capture));
            removed.clear();
            continue;
        }
        const path = issue.path;
        if (isBadLink(issue) && !removed.has(describe(path))) {
            remove(document, path);
            removed.add(describe(path));
            dropped.push(describe(path));
            continue;
        }
        // A required link was dropped: drop the item that needs it.
        const element = enclosingElement(path);
        if (!element) return { problems: [`${describe(path)}: required, and its value was not a valid link`] };
        remove(document, element);
        dropped.push(describe(element));
        removed.clear();
    }
    return { problems: ['cast.json has too many invalid links'] };
}

function finish(data: z.output<typeof castJsonSchema>, document: Record<string, unknown>, expectedLogin: string | undefined, dropped: string[]): CastJsonResult {
    if (expectedLogin && !sameLogin(data.handle, expectedLogin)) return { problems: [`handle '${data.handle}' is not '${expectedLogin}'`] };

    let config: CastConfig;
    try {
        // Parsed from the document as written, so defaults apply the same way as for cast.yaml.
        config = parseCastObject(at(document, ['profile', 'cast']), 'cast.json profile.cast');
    } catch (error) {
        return { problems: error instanceof CastConfigError ? error.problems : [String(error)] };
    }
    if (!sameLogin(config.person.handle, data.handle)) return { problems: [`profile.cast.person.handle '${config.person.handle}' is not the handle '${data.handle}'`] };

    let github: GitHubSnapshot | undefined = data.profile.github as GitHubSnapshot | undefined;
    if (github && !sameLogin(github.login, data.handle)) {
        dropped.push('profile.github');
        github = undefined;
    }
    const photo = config.person.photo;
    const profile: CastJsonProfile = {
        handle: data.handle,
        ...(data.generator ? { generator: data.generator } : {}),
        ...(data.builtAt ? { builtAt: data.builtAt } : {}),
        config,
        ...(github ? { github } : {}),
        ...(data.profile.writing ? { writing: data.profile.writing as WritingSnapshot } : {}),
        ...(photo ? { photoUrl: photo } : {}),
    };

    // Rendered without the captures when only they cannot be: the directory then uses its own GitHub data.
    // A refused file keeps nothing, captures included: rejected member data never feeds the GitHub-only page.
    const problem = renderProblem(profile);
    if (!problem) return { dropped, profile };
    const { github: _github, writing: _writing, ...withoutCaptures } = profile;
    if ((profile.github || profile.writing) && !renderProblem(withoutCaptures)) {
        dropped.push(...(profile.github ? ['profile.github'] : []), ...(profile.writing ? ['profile.writing'] : []));
        return { dropped, profile: withoutCaptures };
    }
    return { problems: [problem] };
}

/** Why the profile pages could not render this profile, when they could not. */
function renderProblem(profile: CastJsonProfile): string | undefined {
    const { config, handle } = profile;
    try {
        assertRenderable(castView({
            config,
            sections: resolveSections(config),
            github: profile.github ?? emptySnapshot(handle, config.github.orgs),
            writing: profile.writing ?? { sources: [], posts: [] },
            tier: { handle, source: TierSource.None },
            ...(profile.photoUrl ? { photoUrl: profile.photoUrl } : {}),
            build: { builtAt: profile.builtAt ?? new Date(0).toISOString(), castVersion: profile.generator ?? 'cast.json', githubSource: 'none', registrySource: 'live' },
        }, directoryHost(handle, config.site.url)));
        return undefined;
    } catch (error) {
        return `does not render: ${error instanceof Error ? error.message : String(error)}`;
    }
}
