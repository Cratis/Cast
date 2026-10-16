// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { registryUrl } from '../badges/constants';
import { parseRegistry } from '../badges/registry';
import type { RegistryMember } from '../badges/RegistryMember';

/** The registry copy bundled into the package when it is published. */
export const bundledRegistryFile = fileURLToPath(new URL('../registry/members.yaml', import.meta.url));

/** Reads the bundled registry; an absent copy is an empty registry. */
export async function readBundledRegistry(): Promise<RegistryMember[]> {
    try {
        return parseRegistry(await readFile(bundledRegistryFile, 'utf8'));
    } catch {
        return [];
    }
}

/**
 * Reads the reviewed registry from the Cast repository, falling back to the bundled copy. A registry that
 * fails validation is never used.
 */
export async function loadRegistry(fetchLive: boolean, warn: (message: string) => void): Promise<{ members: RegistryMember[]; source: 'live' | 'bundled' }> {
    if (fetchLive) {
        try {
            const response = await fetch(registryUrl, { headers: { 'user-agent': 'cratis-cast-build' }, signal: AbortSignal.timeout(15_000) });
            if (!response.ok) throw new Error(`answered ${response.status}`);
            return { members: parseRegistry(await response.text()), source: 'live' };
        } catch (error) {
            warn(`registry: ${error instanceof Error ? error.message : String(error)}; using the bundled copy`);
        }
    }
    return { members: await readBundledRegistry(), source: 'bundled' };
}
