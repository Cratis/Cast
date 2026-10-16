// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { safeJson } from '../safeJson';

describe('when embedding JSON in a script', () => {
    const value = { name: '</script><script>alert(1)</script>', note: 'a & b > c', separators: 'x\u2028y\u2029z' };
    const json = safeJson(value);

    it('should not contain a closing script tag', () => json.toLowerCase().should.not.contain('</script'));
    it('should not contain raw angle brackets or ampersands', () => /[<>&]/.test(json).should.be.false);
    it('should escape line and paragraph separators', () => /[\u2028\u2029]/.test(json).should.be.false);
    it('should parse back to the same value', () => JSON.parse(json).should.deep.equal(value));
});
