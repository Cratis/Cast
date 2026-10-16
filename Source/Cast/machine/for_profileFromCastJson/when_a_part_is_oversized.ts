// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when a part is oversized', () => {
    it('should refuse a string that is too long', () => {
        const document = aCastJson();
        at(document, 'profile', 'cast', 'person')['intro'] = 'x'.repeat(20_001);
        ('problems' in profileFromCastJson(document, 'ada')).should.be.true;
    });

    it('should refuse a list that is too long', () => {
        const document = aCastJson();
        at(document, 'profile', 'cast', 'person')['interests'] = Array.from({ length: 2_001 }, () => 'x');
        ('problems' in profileFromCastJson(document, 'ada')).should.be.true;
    });

    it('should refuse nesting that is too deep', () => {
        const document = aCastJson();
        let deep: unknown = 'x';
        for (let level = 0; level < 30; level++) deep = [deep];
        document['extra'] = deep;
        ('problems' in profileFromCastJson(document, 'ada')).should.be.true;
    });
});
