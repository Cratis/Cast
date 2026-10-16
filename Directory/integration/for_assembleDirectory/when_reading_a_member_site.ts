// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { addProfiles, fetchCastSummary, type ProfileNode } from '../fetchDirectory';
import type { CastSummary } from '../DirectoryMember';
import type { DirectorySnapshot } from '../DirectorySnapshot';

describe('when reading a member site', () => {
    let profile: CastSummary | undefined;
    let fetchStub: sinon.SinonStub;

    beforeEach(async () => {
        fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response(JSON.stringify({
            castJsonVersion: 1, title: 'Chief Architect', tagline: 'Hi', verification: { claimedTier: 'core' }, tier: 'core',
        })));
        profile = await fetchCastSummary('https://member.example', () => undefined);
    });

    afterEach(() => fetchStub.restore());

    it('should keep only display fields', () => Object.keys(profile!).sort().should.deep.equal(['castJsonVersion', 'tagline', 'title', 'url']));
});

describe('when a profile batch holds an unknown login', () => {
    const profiles: DirectorySnapshot['profiles'] = {};
    const data: Record<string, ProfileNode> = { u0: { login: 'Ada', name: 'Ada', avatarUrl: null, bio: null, location: null }, u1: null };
    addProfiles(profiles, data);

    it('should keep the logins that resolved', () => Object.keys(profiles).should.deep.equal(['ada']));
});
