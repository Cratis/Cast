// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Shared Vitest settings: specs live in `for_*` folders, setup registers Chai's `should`. */
export function createConfig(): ViteUserConfig {
    return {
        test: {
            globals: true,
            environment: 'node',
            include: ['**/for_*/when_*/**/*.ts', '**/for_*/**/when_*.ts'],
            exclude: ['**/dist/**', '**/node_modules/**', '**/given/**'],
            setupFiles: [path.join(root, 'vitest.setup.ts')],
        },
    };
}
