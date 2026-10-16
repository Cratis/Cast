// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { parseArguments } from '../parseArguments.js';

describe('when parsing arguments', () => {
    it('should read the directory and flags', () =>
        parseArguments(['my-site', '--github', 'ada', '--domain=www.ada.example', '--yes']).should.deep.equal({ directory: 'my-site', github: 'ada', domain: 'www.ada.example', yes: true, help: false }));
    it('should accept short flags', () => parseArguments(['-y', '-h']).should.deep.equal({ yes: true, help: true }));
    it('should refuse unknown options', () => (() => parseArguments(['--nope'])).should.throw('Unknown option'));
});
