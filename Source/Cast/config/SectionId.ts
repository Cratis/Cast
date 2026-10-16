// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Every section a Cast home page can render, in their default order. */
export enum SectionId {
    Hero = 'hero',
    Now = 'now',
    Stats = 'stats',
    Career = 'career',
    Model = 'model',
    Cratis = 'cratis',
    Activity = 'activity',
    Agentic = 'agentic',
    Projects = 'projects',
    Writing = 'writing',
    Talks = 'talks',
    Skills = 'skills',
    Contact = 'contact',
}

export const defaultSectionOrder: SectionId[] = Object.values(SectionId);
