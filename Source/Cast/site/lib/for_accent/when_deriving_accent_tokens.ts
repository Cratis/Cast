// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { accentTokens, contrast } from '../accent';

const rgb = (hex: string): [number, number, number] => {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

describe('when deriving accent tokens', () => {
    for (const accent of ['#8b5cf6', '#1d4ed8', '#fde047', '#000000', '#ffffff']) {
        describe(`from ${accent}`, () => {
            const tokens = accentTokens(accent);

            it('should be AA on the dark ground', () => contrast(rgb(tokens.dark), [8, 8, 14]).should.be.at.least(4.5));
            it('should be AA on the light ground', () => contrast(rgb(tokens.light), [250, 249, 246]).should.be.at.least(4.5));
            it('should pick readable ink for the accent', () => contrast(rgb(tokens.ink), rgb(accent)).should.be.at.least(3));
        });
    }
});
