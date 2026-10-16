// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CastData } from './CastData';

const moduleId = 'virtual:cast';
const resolvedModuleId = `\0${moduleId}`;

/** A minimal Vite plugin shape, so the engine does not depend on Vite's types directly. */
export type VirtualModulePlugin = {
    name: string;
    resolveId(id: string): string | undefined;
    load(id: string): string | undefined;
};

/**
 * Serves `virtual:cast`: the resolved data as named exports, plus `photo`, which is the imported local
 * portrait (an Astro image) when cast.yaml points at a file.
 */
export function castVirtualModule(data: () => CastData, photoFile: () => string | undefined): VirtualModulePlugin {
    return {
        name: 'cratis-cast:virtual',
        resolveId(id) {
            return id === moduleId ? resolvedModuleId : undefined;
        },
        load(id) {
            if (id !== resolvedModuleId) return undefined;
            const current = data();
            const photo = photoFile();
            return [
                photo ? `import photo from ${JSON.stringify(photo)};` : 'const photo = undefined;',
                `export const config = ${JSON.stringify(current.config)};`,
                `export const sections = ${JSON.stringify(current.sections)};`,
                `export const github = ${JSON.stringify(current.github)};`,
                `export const writing = ${JSON.stringify(current.writing)};`,
                `export const tier = ${JSON.stringify(current.tier)};`,
                `export const photoUrl = ${JSON.stringify(current.photoUrl ?? null)} ?? undefined;`,
                `export const build = ${JSON.stringify(current.build)};`,
                'export { photo };',
            ].join('\n');
        },
    };
}
