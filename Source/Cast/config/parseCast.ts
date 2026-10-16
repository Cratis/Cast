// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parse as parseYaml } from 'yaml';
import { castSchema } from './castSchema';
import { CastConfigError } from './CastConfigError';
import type { CastConfig } from './CastConfig';

/**
 * Validates an already-parsed cast.yaml document and applies defaults.
 * Career events without `seq` get their position in the file; the stream is then ordered by `seq`.
 */
export function parseCastObject(document: unknown, source = 'cast.yaml'): CastConfig {
    if (document && typeof document === 'object' && 'tier' in document) {
        throw new CastConfigError(['tier: a site cannot declare its own tier. Core and Partner come from the reviewed Cast registry; Contributor is computed from merged pull requests.'], source);
    }

    const result = castSchema.safeParse(document ?? {});
    if (!result.success) {
        const problems = result.error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
        throw new CastConfigError(problems, source);
    }

    const config = result.data;
    const events = config.career.events
        .map((event, index) => ({ ...event, seq: event.seq ?? index + 1 }))
        .sort((left, right) => left.seq - right.seq);

    const sequences = new Set<number>();
    for (const event of events) {
        if (sequences.has(event.seq)) {
            throw new CastConfigError([`career.events: seq ${event.seq} is used more than once`], source);
        }
        sequences.add(event.seq);
    }

    return {
        ...config,
        career: { events },
        github: { ...config.github, login: config.github.login ?? config.person.handle },
    };
}

/** Parses cast.yaml text. */
export function parseCast(yamlText: string, source = 'cast.yaml'): CastConfig {
    let document: unknown;
    try {
        document = parseYaml(yamlText);
    } catch (error) {
        throw new CastConfigError([`YAML: ${error instanceof Error ? error.message : String(error)}`], source);
    }
    return parseCastObject(document, source);
}
