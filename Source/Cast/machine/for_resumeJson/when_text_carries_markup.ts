// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { siteData } from '../for_profileFromCastJson/given/a_cast_json';
import { resumeJson } from '../resumeJson';

describe('when text carries markup', () => {
    const config = siteData().config;
    config.person.intro = 'The *first* programmer.';
    const text = JSON.stringify(resumeJson(config));

    it('should write the summary as plain text', () => text.should.contain('The first programmer.'));
    it('should show no emphasis markers', () => text.should.not.contain('*'));
});
