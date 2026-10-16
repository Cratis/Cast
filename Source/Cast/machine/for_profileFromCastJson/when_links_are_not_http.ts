// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { profileFromCastJson, type CastJsonProfile } from '../profileFromCastJson';
import { aCastJson, at } from './given/a_cast_json';

describe('when links are not http', () => {
    let profile: CastJsonProfile;
    let dropped: string[];

    beforeEach(() => {
        const document = aCastJson();
        const person = at(document, 'profile', 'cast', 'person');
        (person['links'] as Record<string, string>)['evil'] = 'javascript:alert(1)';
        person['photo'] = 'javascript:alert(1)';
        (at(document, 'profile', 'cast', 'projects', 0))['url'] = 'javascript:alert(1)';
        (at(document, 'profile', 'github', 'mergedPullRequests', 'latest', 0))['url'] = 'https://evil.example/pull/7';
        const result = profileFromCastJson(document, 'ada');
        if (!('profile' in result)) throw new Error(result.problems.join('; '));
        ({ profile, dropped } = result);
    });

    it('should drop the link', () => Object.keys(profile.config.person.links).should.deep.equal(['linkedin']));
    it('should drop the portrait', () => (profile.photoUrl === undefined).should.be.true);
    it('should drop the project that needs the link', () => profile.config.projects.map(project => project.name).should.deep.equal(['loom']));
    it('should drop a pull request that is not on github.com', () => profile.github!.mergedPullRequests.latest.should.be.empty);
    it('should report what it dropped', () => dropped.should.include.members(['profile.cast.person.links.evil', 'profile.cast.person.photo', 'profile.cast.projects.0']));
});
