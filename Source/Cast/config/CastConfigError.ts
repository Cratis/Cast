// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Thrown when cast.yaml does not validate. The message lists every problem with its path. */
export class CastConfigError extends Error {
    constructor(readonly problems: string[], source = 'cast.yaml') {
        super(`${source} is not valid:\n${problems.map(problem => `  - ${problem}`).join('\n')}`);
        this.name = 'CastConfigError';
    }
}
