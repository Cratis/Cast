// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SectionId } from './SectionId';

/** A section that will render, with its two-digit index and any copy overrides. */
export type ResolvedSection = {
    id: SectionId;
    index: string;
    title?: string;
    label?: string;
    intro?: string;
};
