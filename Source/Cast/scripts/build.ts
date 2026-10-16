// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Build step for @cratis/cast: writes cast.schema.json for editors and bundles a validated copy of the
// Cast registry as the offline fallback. The engine itself ships as source; Astro compiles it in each site.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { castSchema } from '../config/castSchema';
import { parseRegistry } from '../badges/registry';

const packageRoot = new URL('../', import.meta.url);
const registrySource = new URL('../../../Registry/members.yaml', import.meta.url);

const schema = z.toJSONSchema(castSchema, { io: 'input', target: 'draft-2020-12', unrepresentable: 'any' }) as Record<string, unknown>;
schema['$id'] = 'https://unpkg.com/@cratis/cast/cast.schema.json';
schema['title'] = 'Cratis Cast: cast.yaml';
schema['description'] = 'One file that becomes a verified, event-sourced profile site. See https://github.com/Cratis/Cast/blob/main/Documentation/cast-yaml.md';
await writeFile(fileURLToPath(new URL('cast.schema.json', packageRoot)), `${JSON.stringify(schema, null, 4)}\n`);

const members = parseRegistry(await readFile(registrySource, 'utf8'));
await mkdir(fileURLToPath(new URL('registry/', packageRoot)), { recursive: true });
await copyFile(registrySource, new URL('registry/members.yaml', packageRoot));

console.log(`cast.schema.json written; registry bundled with ${members.length} members.`);
