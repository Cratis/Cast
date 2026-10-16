// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { siteData } from '../for_profileFromCastJson/given/a_cast_json';
import { llmsText } from '../llmsText';

describe('when text carries markup', () => {
    const data = siteData();
    data.config.person.intro = 'The *first* programmer, see [notes](https://ada.example/notes).';
    data.config.person.about = ['Wrote **the** `note G`.'];
    const text = llmsText(data);

    it('should write the intro as plain text', () => text.should.contain('The first programmer, see notes.'));
    it('should write the about as plain text', () => text.should.contain('Wrote the note G.'));
    it('should write project pitches as plain text', () => text.should.contain('Computes things.'));
    it('should show no emphasis markers', () => text.should.not.match(/\*/));
});
