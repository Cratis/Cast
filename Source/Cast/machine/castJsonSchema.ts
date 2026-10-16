// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { z } from 'zod';
import { isInstant } from '../config/calendar';
import { castSchema } from '../config/castSchema';
import { gitHubSnapshotSchema } from '../github/gitHubSnapshotSchema';
import { writingSnapshotSchema } from '../writing/writingSnapshotSchema';

/** The cast.json format version this engine writes and the directory renders. */
export const castJsonVersion = 2;

const login = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/, 'Must be a GitHub login');

/**
 * cast.json, format version 2: the complete, render-ready profile. `profile.cast` is cast.yaml as JSON
 * (validated against cast.schema.json; `person.photo` must be an https URL). `profile.github` and
 * `profile.writing` are optional build-time captures. Everything outside `profile` is a summary for agents
 * and earlier readers; `verification` is the site's own claim, which the directory never reads.
 */
export const castJsonSchema = z.object({
    $schema: z.string().optional(),
    castJsonVersion: z.literal(castJsonVersion),
    handle: login.describe('The GitHub login: the profile identity. Must equal profile.cast.person.handle.'),
    generator: z.string().max(200).optional().describe('What wrote the file, for example "@cratis/cast 1.2.0".'),
    builtAt: z.string().max(64).refine(isInstant, 'Use an ISO 8601 date and time on a real day').optional().describe('When the file was written, ISO 8601.'),
    profile: z.object({
        cast: castSchema.describe('cast.yaml as JSON. See https://github.com/Cratis/Cast/blob/main/Documentation/cast-yaml.md'),
        github: gitHubSnapshotSchema.optional().describe('Public GitHub data captured at build time. Without it the directory uses its own.'),
        writing: writingSnapshotSchema.optional().describe('Posts captured from the writing sources.'),
    }),
}).loose();

/** A cast.json document as written. */
export type CastJsonInput = z.input<typeof castJsonSchema>;
