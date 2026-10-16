// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ogImageSvg } from '../ogImageSvg';

describe('when text carries markup', () => {
    const svg = ogImageSvg({ name: 'Ada Lovelace', title: 'Analyst', tagline: 'I write *programs.*', host: 'ada.example', accent: '#ff8a3d' });

    it('should draw the tagline as plain text', () => svg.should.contain('I write programs.'));
    it('should show no emphasis markers', () => svg.should.not.contain('*'));
});
