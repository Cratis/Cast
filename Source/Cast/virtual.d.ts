// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

declare module 'virtual:cast' {
    type CastData = import('./integration/CastData').CastData;

    export const config: CastData['config'];
    export const sections: CastData['sections'];
    export const github: CastData['github'];
    export const writing: CastData['writing'];
    export const tier: CastData['tier'];
    export const photoUrl: CastData['photoUrl'];
    export const build: CastData['build'];
    export const photo: import('astro').ImageMetadata | undefined;
}
