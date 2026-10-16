// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseDocument, isSeq, isMap } from 'yaml';
import { z } from 'zod';
import type { RegistryMember } from './RegistryMember';
import { Tier } from './Tier';

export const registryMemberSchema = z.object({
    github: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/, 'Must be a GitHub login'),
    tier: z.enum([Tier.Core, Tier.Partner]),
    since: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM').optional(),
    role: z.string().min(1).optional(),
    site: z.url({ protocol: /^https$/ }).optional(),
    profile: z.url({ protocol: /^https$/ }).optional(),
    company: z.string().min(1).optional(),
}).strict();

export const registrySchema = z.array(registryMemberSchema);

/** Thrown when members.yaml does not validate. */
export class RegistryError extends Error {
    constructor(readonly problems: string[]) {
        super(`Registry/members.yaml is not valid:\n${problems.map(problem => `  - ${problem}`).join('\n')}`);
        this.name = 'RegistryError';
    }
}

/** Parses and validates the registry. Handles are unique, compared case-insensitively. */
export function parseRegistry(yamlText: string): RegistryMember[] {
    const document = parseDocument(yamlText);
    if (document.errors.length > 0) {
        throw new RegistryError(document.errors.map(error => error.message));
    }

    const result = registrySchema.safeParse(document.toJS() ?? []);
    if (!result.success) {
        throw new RegistryError(result.error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`));
    }

    const lines = entryLines(document, yamlText);
    const seen = new Set<string>();
    const problems: string[] = [];
    const members = result.data.map((member, index) => {
        const key = member.github.toLowerCase();
        if (seen.has(key)) problems.push(`${index}.github: '${member.github}' is listed more than once`);
        seen.add(key);
        return { ...member, line: lines[index] } as RegistryMember;
    });
    if (problems.length > 0) throw new RegistryError(problems);
    return members;
}

function entryLines(document: ReturnType<typeof parseDocument>, yamlText: string): (number | undefined)[] {
    if (!isSeq(document.contents)) return [];
    return document.contents.items.map(item => {
        const offset = isMap(item) ? item.range?.[0] : undefined;
        return offset === undefined ? undefined : yamlText.slice(0, offset).split('\n').length;
    });
}

/** Where the directory reads a member's profile: `profile`, else `<site>/cast.json`, else nowhere. */
export const profileUrlOf = (member: Pick<RegistryMember, 'site' | 'profile'>): string | undefined =>
    member.profile ?? (member.site ? new URL('/cast.json', member.site).toString() : undefined);

/** Finds a member by GitHub login, case-insensitively. */
export const findMember = (members: readonly RegistryMember[], handle: string): RegistryMember | undefined =>
    members.find(member => member.github.toLowerCase() === handle.toLowerCase());
