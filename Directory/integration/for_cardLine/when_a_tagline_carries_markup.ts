// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { TierSource } from '@cratis/cast/badges';
import { cardLine } from '../cardLine';
import { castSummary } from '../fetchDirectory';

const tagline = 'I build systems that *remember everything.* See [Cratis](https://cratis.io) and `cast`.';
const plain = 'I build systems that remember everything. See Cratis and cast.';

describe('when a tagline carries markup', () => {
    describe('and the cast.json writes it at the top level', () => {
        const summary = castSummary({ castJsonVersion: 2, tagline }, 'https://ada.example');

        it('should keep it as plain text', () => summary!.tagline!.should.equal(plain));
    });

    describe('and the cast.json writes it only in the profile', () => {
        const summary = castSummary({ castJsonVersion: 2, profile: { cast: { person: { tagline } } } }, 'https://ada.example');

        it('should keep it as plain text', () => summary!.tagline!.should.equal(plain));
    });

    describe('and a card shows a summary kept from an earlier build', () => {
        const line = cardLine({ handle: 'ada', source: TierSource.Registry, cast: { url: 'https://ada.example', tagline } });

        it('should show it as plain text', () => line!.should.equal(plain));
    });

    describe('and there is no tagline', () => {
        const line = cardLine({ handle: 'ada', source: TierSource.Registry, bio: 'Bio', cast: { url: 'https://ada.example', title: 'Analyst' } });

        it('should fall back to the title', () => line!.should.equal('Analyst'));
    });
});
