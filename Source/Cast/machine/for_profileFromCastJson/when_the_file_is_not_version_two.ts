// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson } from '../profileFromCastJson';
import { aCastJson } from './given/a_cast_json';

describe('when the file is not version two', () => {
    it('should refuse version 1', () => ('problems' in profileFromCastJson({ ...aCastJson(), castJsonVersion: 1 }, 'ada')).should.be.true);
    it('should refuse a future version', () => ('problems' in profileFromCastJson({ ...aCastJson(), castJsonVersion: 3 }, 'ada')).should.be.true);
    it('should refuse something that is not an object', () => ('problems' in profileFromCastJson([1, 2], 'ada')).should.be.true);
    it('should refuse a file without a profile', () => ('problems' in profileFromCastJson({ castJsonVersion: 2, handle: 'ada' }, 'ada')).should.be.true);
});
