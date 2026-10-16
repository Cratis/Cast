// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson } from '../profileFromCastJson';

describe('when written by hand', () => {
    // The smallest cast.json a site that is not built with Cast can publish.
    const result = profileFromCastJson({
        castJsonVersion: 2,
        handle: 'ada',
        profile: {
            cast: {
                site: { url: 'https://ada.example' },
                person: { name: 'Ada Lovelace', handle: 'ada', title: 'Analyst', tagline: 'I write *programs.*', intro: 'The first programmer.', photo: 'https://ada.example/ada.jpeg' },
                career: { events: [{ date: '1843', type: 'NotesPublished', title: 'Notes', summary: 'Published the notes.' }] },
            },
        },
    }, 'ada');

    it('should accept it', () => ('profile' in result).should.be.true);
    it('should apply the cast.yaml defaults', () => ('profile' in result && result.profile.config.github.orgs).should.deep.equal(['Cratis']));
    it('should number the career stream', () => ('profile' in result && result.profile.config.career.events[0]!.seq).should.equal(1));
    it('should have no github snapshot of its own', () => ('profile' in result && result.profile.github === undefined).should.be.true);
});
