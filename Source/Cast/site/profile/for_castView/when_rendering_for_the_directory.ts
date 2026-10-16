// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { siteData } from '../../../machine/for_profileFromCastJson/given/a_cast_json';
import { clientCast } from '../clientCast';
import { directoryHost, siteHost } from '../CastHost';
import { castView } from '../CastView';

describe('when rendering for the directory', () => {
    const cast = castView(siteData(), directoryHost('Ada', 'https://ada.example'));
    const client = clientCast(cast);

    it('should put pages under the login', () => cast.href('cv').should.equal('/ada/cv'));
    it('should link the home page under the login', () => cast.href().should.equal('/ada/'));
    it('should mark member links as user content', () => cast.host.rel.should.equal('noopener nofollow ugc'));
    it('should show the tier as verified', () => cast.host.verified.should.be.true);
    it('should give the browser scripts the login', () => client.login.should.equal('ada'));
    it('should give the browser scripts the base path', () => client.base.should.equal('/ada/'));
    it('should keep site pages at the root on a Cast site', () => castView(siteData(), siteHost).href('cv').should.equal('/cv'));
});
