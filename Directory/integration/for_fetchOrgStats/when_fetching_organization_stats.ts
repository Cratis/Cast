// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { fileURLToPath } from 'node:url';
import fixture from './given/org-stats.json';
import { fetchOrgStats, orgStatsUrl } from '../fetchOrgStats';

const fixtureFile = fileURLToPath(new URL('./given/org-stats.json', import.meta.url));

describe('when fetching organization stats', () => {
    let fetchStub: sinon.SinonStub;
    let warn: sinon.SinonSpy;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch').resolves(Response.json(fixture));
        warn = sinon.spy();
    });
    afterEach(() => sinon.restore());

    it('should read the public snapshot without a token', async () => {
        (await fetchOrgStats(warn, {}))!.should.deep.equal(fixture);
        fetchStub.firstCall.args[0].should.equal(orgStatsUrl);
        fetchStub.firstCall.args[1].signal.should.be.instanceOf(AbortSignal);
        warn.called.should.be.false;
    });

    it('should use the URL override', async () => {
        await fetchOrgStats(warn, { ORG_STATS_URL: 'http://127.0.0.1:1/unreachable.json' });
        fetchStub.firstCall.args[0].should.equal('http://127.0.0.1:1/unreachable.json');
    });

    it('should use the fixture file instead of fetching even with a URL override', async () => {
        (await fetchOrgStats(warn, { ORG_STATS_FILE: fixtureFile, ORG_STATS_URL: 'https://unreachable.example' }))!.should.deep.equal(fixture);
        fetchStub.called.should.be.false;
    });

    it('should omit stats when the file is missing rather than fetch', async () => {
        ((await fetchOrgStats(warn, { ORG_STATS_FILE: `${fixtureFile}.missing` })) === undefined).should.be.true;
        fetchStub.called.should.be.false;
        warn.calledOnce.should.be.true;
    });

    it('should omit stats on an HTTP failure', async () => {
        fetchStub.resolves(new Response('', { status: 404 }));
        ((await fetchOrgStats(warn, {})) === undefined).should.be.true;
        warn.calledOnce.should.be.true;
    });

    it('should omit stats when the response is not JSON', async () => {
        fetchStub.resolves(new Response('not json'));
        ((await fetchOrgStats(warn, {})) === undefined).should.be.true;
        warn.calledOnce.should.be.true;
    });

    it('should omit stats when the request times out', async () => {
        fetchStub.rejects(new DOMException('timed out', 'TimeoutError'));
        ((await fetchOrgStats(warn, {})) === undefined).should.be.true;
        warn.calledOnce.should.be.true;
    });

    it('should omit stats when the version is unsupported', async () => {
        fetchStub.resolves(Response.json({ ...fixture, schemaVersion: 2 }));
        ((await fetchOrgStats(warn, {})) === undefined).should.be.true;
        warn.calledOnce.should.be.true;
    });

    it('should not reuse an earlier successful snapshot after failure', async () => {
        await fetchOrgStats(warn, {});
        fetchStub.rejects(new Error('offline'));
        ((await fetchOrgStats(warn, {})) === undefined).should.be.true;
    });
});
