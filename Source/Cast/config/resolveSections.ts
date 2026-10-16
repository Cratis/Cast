// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CastConfig } from './CastConfig';
import type { ResolvedSection } from './ResolvedSection';
import { defaultSectionOrder, SectionId } from './SectionId';

const hasData: Record<SectionId, (config: CastConfig) => boolean> = {
    [SectionId.Hero]: () => true,
    [SectionId.Now]: config => Object.keys(config.now).length > 0 || config.person.about.length > 0,
    [SectionId.Stats]: config => config.stats.length > 0,
    [SectionId.Career]: config => config.career.events.length > 0,
    [SectionId.Model]: config => config.eventModel !== undefined,
    [SectionId.Cratis]: config => config.cratis !== undefined,
    [SectionId.Activity]: () => true,
    [SectionId.Agentic]: config => config.agentic !== undefined,
    [SectionId.Projects]: config => config.projects.length > 0,
    [SectionId.Writing]: config => config.writing.sources.length > 0,
    [SectionId.Talks]: config => config.talks.length > 0 || config.community.length > 0,
    [SectionId.Skills]: config => Object.keys(config.skills).length > 0,
    [SectionId.Contact]: config => config.person.email !== undefined || Object.keys(config.person.links).length > 0,
};

/**
 * The sections the home page renders, in order, numbered from 01. The hero is never numbered.
 * Sections listed in cast.yaml render even when they have no data yet (they show their empty state),
 * except the ones that cannot render without data.
 */
export function resolveSections(config: CastConfig): ResolvedSection[] {
    const requiresData = new Set([SectionId.Model, SectionId.Cratis, SectionId.Agentic]);
    const entries = config.sections === undefined
        ? defaultSectionOrder.filter(id => hasData[id](config)).map(id => ({ id }))
        : config.sections
            .map(entry => (typeof entry === 'string' ? { id: entry } : entry))
            .filter(entry => !requiresData.has(entry.id) || hasData[entry.id](config));

    const seen = new Set<SectionId>();
    let counter = 0;
    const sections: ResolvedSection[] = [];
    for (const entry of entries) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        const numbered = entry.id !== SectionId.Hero && entry.id !== SectionId.Stats;
        if (numbered) counter++;
        sections.push({ ...entry, index: numbered ? String(counter).padStart(2, '0') : '' });
    }
    return sections;
}
