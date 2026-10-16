// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ResolvedSection } from '../../config/ResolvedSection';
import { SectionId } from '../../config/SectionId';

/** The DOM id each section renders with; kept stable so links like /#career keep working. */
export const anchorFor: Record<SectionId, string> = {
    [SectionId.Hero]: 'top',
    [SectionId.Now]: 'about',
    [SectionId.Stats]: 'stats',
    [SectionId.Career]: 'career',
    [SectionId.Model]: 'model',
    [SectionId.Cratis]: 'cratis',
    [SectionId.Activity]: 'activity',
    [SectionId.Agentic]: 'agentic',
    [SectionId.Projects]: 'projects',
    [SectionId.Writing]: 'writing',
    [SectionId.Talks]: 'talks',
    [SectionId.Skills]: 'skills',
    [SectionId.Contact]: 'contact',
};

const navLabels: Partial<Record<SectionId, string>> = {
    [SectionId.Now]: 'Now',
    [SectionId.Career]: 'Career',
    [SectionId.Cratis]: 'Cratis',
    [SectionId.Projects]: 'Projects',
    [SectionId.Contact]: 'Contact',
};

/** Primary navigation: up to five of the sections that render, in page order. */
export const navLinks = (sections: readonly ResolvedSection[]): { id: string; label: string }[] =>
    sections
        .filter(section => navLabels[section.id] !== undefined)
        .slice(0, 5)
        .map(section => ({ id: anchorFor[section.id], label: navLabels[section.id]! }));

/** The resolved entry for a section, if it renders. */
export const sectionFor = (sections: readonly ResolvedSection[], id: SectionId): ResolvedSection | undefined =>
    sections.find(section => section.id === id);
