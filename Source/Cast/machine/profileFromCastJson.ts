// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { z } from 'zod';
import type { CastConfig } from '../config/CastConfig';
import { CastConfigError } from '../config/CastConfigError';
import { parseCastObject } from '../config/parseCast';
import type { GitHubSnapshot } from '../github/GitHubSnapshot';
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
 * A tier anywhere in the file is ignored. Unknown versions and anything else that does not validate are refused.
 */
export function profileFromCastJson(json: unknown, expectedLogin?: string): CastJsonResult {
    if (!isObject(json)) return { problems: ['cast.json is not a JSON object'] };
    if (json['castJsonVersion'] !== castJsonVersion) return { problems: [`castJsonVersion ${JSON.stringify(json['castJsonVersion'])} is not supported; expected ${castJsonVersion}`] };

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
        if (isObject(person) && person['photo'] !== undefined && !(typeof person['photo'] === 'string' && /^https:\/\/[^\s]+$/i.test(person['photo']))) {
            delete person['photo'];
            dropped.push('profile.cast.person.photo');
        }
    }

    const removed = new Set<string>();
    for (let attempt = 0; attempt < 200; attempt++) {
        const result = castJsonSchema.safeParse(document);
        if (result.success) return finish(result.data, document, expectedLogin, dropped);

        const issue = result.error.issues.find(candidate => isBadLink(candidate) || removed.has(describe(candidate.path)));
        if (!issue) return { problems: result.error.issues.map(problem => `${describe(problem.path) || '(root)'}: ${problem.message}`) };
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
    return {
        dropped,
        profile: {
            handle: data.handle,
            ...(data.generator ? { generator: data.generator } : {}),
            ...(data.builtAt ? { builtAt: data.builtAt } : {}),
            config,
            ...(github ? { github } : {}),
            ...(data.profile.writing ? { writing: data.profile.writing as WritingSnapshot } : {}),
            ...(photo ? { photoUrl: photo } : {}),
        },
    };
}
