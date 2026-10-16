// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Tier, TierSource } from '@cratis/cast/badges';
import { emptySnapshot, type GitHubSnapshot } from '@cratis/cast/github/GitHubSnapshot';
import { profileFromCastJson, type CastJsonProfile } from '@cratis/cast/machine';
import { aCastJson } from '@cratis/cast/machine/for_profileFromCastJson/given/a_cast_json.ts';
import type { DirectoryMember } from '../DirectoryMember';
import { memberProfile, ProfileKind } from '../memberProfile';

const builtAt = '2026-10-16T00:00:00.000Z';
const castJson = (change: (profile: CastJsonProfile) => void = () => undefined): { profile: CastJsonProfile; url: string } => {
    const result = profileFromCastJson(aCastJson(), 'ada');
    if (!('profile' in result)) throw new Error(result.problems.join('; '));
    change(result.profile);
    return { profile: result.profile, url: 'https://ada.example/cast.json' };
};
const core: DirectoryMember = { handle: 'ada', tier: Tier.Core, source: TierSource.Registry, site: 'https://ada.example', mergedPullRequests: 3, avatarUrl: 'https://avatars.githubusercontent.com/u/1' };

describe('when member data cannot render', () => {
    let warnings: string[];
    const warn = (message: string) => warnings.push(message);
    beforeEach(() => warnings = []);

    describe('and the career in the cast.json cannot be reduced', () => {
        const build = () => memberProfile(core, castJson(profile => {
            (profile.config.career.events[0] as unknown as Record<string, unknown>)['skills'] = 42;
        }), undefined, builtAt, warn);

        it('should fall back to GitHub', () => build().kind.should.equal(ProfileKind.GitHub));
        it('should say why', () => {
            build();
            warnings.join().should.contain('https://ada.example/cast.json: not used for the full profile');
        });
    });

    describe('and the portrait in the cast.json does not parse', () => {
        const page = () => memberProfile(core, castJson(profile => { profile.photoUrl = 'https://%'; }), undefined, builtAt, warn);

        it('should fall back to GitHub', () => page().kind.should.equal(ProfileKind.GitHub));
        it('should use the GitHub avatar', () => page().data.photoUrl!.should.equal(core.avatarUrl));
    });

    describe('and the contribution calendar in the cast.json has an impossible week', () => {
        const page = () => memberProfile(core, castJson(profile => { profile.github!.contributions.weeks[0]!.start = '2026-99-99'; }), undefined, builtAt, warn);

        it('should fall back to GitHub', () => page().kind.should.equal(ProfileKind.GitHub));
    });

    describe('and the captured GitHub data has counts that are not counts', () => {
        const captured: GitHubSnapshot = { ...emptySnapshot('ada', ['Cratis']), contributions: { total: Number.NaN, weeks: [] }, mergedPullRequests: { total: -4, byOrg: {}, latest: [] } };
        const page = () => memberProfile(core, undefined, captured, builtAt, warn);

        it('should still build the page', () => page().kind.should.equal(ProfileKind.GitHub));
        it('should not use the captured data', () => page().data.github.mergedPullRequests.total.should.equal(3));
        it('should say it was not used', () => {
            page();
            warnings.join().should.contain('captured GitHub data is not valid');
        });
    });

    describe('and the directory data itself cannot render', () => {
        const page = () => memberProfile({ ...core, mergedPullRequests: Number.NaN, avatarUrl: 'https://%' }, undefined, undefined, builtAt, warn);

        it('should still build a page', () => page().kind.should.equal(ProfileKind.GitHub));
        it('should leave the portrait out', () => (page().data.photoUrl === undefined).should.be.true);
        it('should say it fell back', () => {
            page();
            warnings.join().should.contain('showing the handle only');
        });
    });
});
