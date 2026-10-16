// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/// <reference types="vitest/globals" />
/// <reference types="chai" />

declare global {
    interface Object {
        should: Chai.Assertion;
    }
}

export {};
