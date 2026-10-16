// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseCast } from '../parseCast';
import { resolveSections } from '../resolveSections';
import { SectionId } from '../SectionId';
import { minimalCast } from '../for_parseCast/given/a_minimal_cast';

describe('when resolving sections', () => {
    describe('without a sections list', () => {
        const sections = resolveSections(parseCast(`${minimalCast}\n  email: ada@example.com\n`));

        it('should only include sections with data', () => sections.map(section => section.id).should.deep.equal([SectionId.Hero, SectionId.Activity, SectionId.Contact]));
        it('should not number the hero', () => sections[0]!.index.should.equal(''));
        it('should number the rest from 01', () => sections.slice(1).map(section => section.index).should.deep.equal(['01', '02']));
    });

    describe('with a sections list', () => {
        const sections = resolveSections(parseCast(`${minimalCast}\nsections: [hero, { id: contact, title: Say hi }, cratis, activity]\n`));

        it('should keep the listed order', () => sections.map(section => section.id).should.deep.equal([SectionId.Hero, SectionId.Contact, SectionId.Activity]));
        it('should carry title overrides', () => sections[1]!.title!.should.equal('Say hi'));
        it('should leave out sections that cannot render without data', () => sections.some(section => section.id === SectionId.Cratis).should.be.false);
    });
});
