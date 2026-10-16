// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Snapshot } from './Snapshot';

/** Reads the snapshot; a missing or unreadable file is an empty snapshot. */
export async function readSnapshot(file: string): Promise<Snapshot> {
    try {
        const parsed = JSON.parse(await readFile(file, 'utf8')) as Snapshot;
        return parsed && typeof parsed === 'object' ? { ...parsed, version: 1 } : { version: 1 };
    } catch {
        return { version: 1 };
    }
}

/** Writes the snapshot with per-week count arrays on one line so diffs stay readable. */
export async function writeSnapshot(file: string, snapshot: Snapshot): Promise<void> {
    await mkdir(path.dirname(file), { recursive: true });
    const json = JSON.stringify(snapshot, null, 2).replace(/\[\s*(\d[\d,\s]*?)\s*\]/g, (_, numbers: string) => `[${numbers.split(/[\s,]+/).join(', ')}]`);
    await writeFile(file, `${json}\n`);
}
