// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { plainText, renderInline } from '../inline';

describe('when rendering inline markup', () => {
    it('should turn emphasis into the serif accent', () => renderInline('I build *systems.*').should.equal('I build <em class="serif">systems.</em>'));
    it('should escape html', () => renderInline('<script>').should.equal('&lt;script&gt;'));
    it('should render https links', () => renderInline('[Cratis](https://cratis.io)').should.contain('href="https://cratis.io"'));
    it('should not render javascript links', () => renderInline('[x](javascript:alert(1))').should.not.contain('href'));
    it('should strip markup for plain text', () => plainText('A *b* [c](https://d.e) `f`').should.equal('A b c f'));
});
