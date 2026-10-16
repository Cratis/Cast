// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseInline, renderInline, type InlineToken } from '../inline';

describe('when markup carries html', () => {
    const tokens = parseInline('I build *<img src=x onerror=alert(1)>* and [click](javascript:alert(1)) and [ok](https://cratis.io)');
    const em = tokens.find((token): token is Extract<InlineToken, { kind: 'em' | 'strong' }> => token.kind === 'em')!;

    it('should keep the accent as a span of text', () => em.children.should.deep.equal([{ kind: 'text', text: '<img src=x onerror=alert(1)>' }]));
    it('should leave a javascript link as plain text', () => tokens.some(token => token.kind === 'link' && token.href.startsWith('javascript')).should.be.false);
    it('should keep the https link', () => tokens.some(token => token.kind === 'link' && token.href === 'https://cratis.io').should.be.true);
    it('should escape it when rendered to a string', () => renderInline('*<img src=x onerror=alert(1)>*').should.equal('<em class="serif">&lt;img src=x onerror=alert(1)&gt;</em>'));
    it('should escape a quote in the emphasis class', () => renderInline('*a*', '" onmouseover="x').should.not.contain('" onmouseover'));
});
