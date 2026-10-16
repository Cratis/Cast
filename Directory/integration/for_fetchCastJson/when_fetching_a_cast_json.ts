// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { fetchCastJson, maximumCastJsonBytes } from '../fetchDirectory';
import { profileOverride } from '../profileOverride';

describe('when fetching a cast.json', () => {
    let fetchStub: sinon.SinonStub;
    let warnings: string[];
    const warn = (message: string) => warnings.push(message);

    beforeEach(() => {
        warnings = [];
        fetchStub = sinon.stub(globalThis, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('should read valid JSON', async () => {
        fetchStub.resolves(new Response('{"castJsonVersion":2}'));
        (await fetchCastJson('https://ada.example/cast.json', warn) as { castJsonVersion: number }).castJsonVersion.should.equal(2);
    });

    it('should give up on invalid JSON', async () => {
        fetchStub.resolves(new Response('<html>not json</html>'));
        ((await fetchCastJson('https://ada.example/cast.json', warn)) === undefined).should.be.true;
    });

    it('should give up on a file that is too large', async () => {
        fetchStub.resolves(new Response(`{"padding":"${'x'.repeat(maximumCastJsonBytes)}"}`));
        ((await fetchCastJson('https://ada.example/cast.json', warn)) === undefined).should.be.true;
        warnings[0]!.should.contain('larger than');
    });

    it('should give up when the server says it is too large', async () => {
        fetchStub.resolves(new Response('{}', { headers: { 'content-length': String(maximumCastJsonBytes + 1) } }));
        ((await fetchCastJson('https://ada.example/cast.json', warn)) === undefined).should.be.true;
    });

    it('should never read plain http', async () => {
        ((await fetchCastJson('http://ada.example/cast.json', warn)) === undefined).should.be.true;
        fetchStub.called.should.be.false;
    });

    it('should not read plain http from another host even for an override', async () => {
        ((await fetchCastJson('http://ada.example/cast.json', warn, { allowLocal: true })) === undefined).should.be.true;
        fetchStub.called.should.be.false;
    });

    it('should read a local override over plain http', async () => {
        fetchStub.resolves(new Response('{}'));
        ((await fetchCastJson('http://localhost:4321/cast.json', warn, { allowLocal: true })) !== undefined).should.be.true;
    });

    it('should give up when the request fails', async () => {
        fetchStub.rejects(new Error('timeout'));
        ((await fetchCastJson('https://ada.example/cast.json', warn)) === undefined).should.be.true;
    });
});

describe('when a development override is set', () => {
    it('should read the site cast.json', () => profileOverride('woksin', { CAST_DIRECTORY_PROFILE_OVERRIDE_woksin: 'http://localhost:4321' })!.should.equal('http://localhost:4321/cast.json'));
    it('should take a cast.json URL as it is', () => profileOverride('woksin', { CAST_DIRECTORY_PROFILE_OVERRIDE_WOKSIN: 'http://localhost:4321/x/cast.json' })!.should.equal('http://localhost:4321/x/cast.json'));
    it('should match logins with dashes', () => profileOverride('torgeir-hansen', { CAST_DIRECTORY_PROFILE_OVERRIDE_TORGEIR_HANSEN: 'http://localhost:1/' })!.should.equal('http://localhost:1/cast.json'));
    it('should be absent when not set', () => (profileOverride('woksin', {}) === undefined).should.be.true);
});
