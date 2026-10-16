// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Tier, TierSource } from '@cratis/cast/badges';
import { profileFromCastJson, type CastJsonProfile } from '@cratis/cast/machine';
import { aCastJson } from '@cratis/cast/machine/for_profileFromCastJson/given/a_cast_json.ts';
import type { DirectoryMember } from '../DirectoryMember';
import { memberProfile, ProfileKind } from '../memberProfile';

const builtAt = '2026-10-16T00:00:00.000Z';
const castJson = (): { profile: CastJsonProfile; url: string } => {
    const result = profileFromCastJson(aCastJson(), 'ada');
    if (!('profile' in result)) throw new Error(result.problems.join('; '));
    return { profile: result.profile, url: 'https://ada.example/cast.json' };
};
const core: DirectoryMember = { handle: 'ada', tier: Tier.Core, source: TierSource.Registry, site: 'https://ada.example', mergedPullRequests: 3, avatarUrl: 'https://avatars.githubusercontent.com/u/1' };
const contributor: DirectoryMember = { handle: 'ada', tier: Tier.Contributor, source: TierSource.Contributions, mergedPullRequests: 3, commits: 9, repositories: ['Arc'], standings: { Arc: { commits: 9, rank: 2 } } };

describe('when building member pages', () => {
    describe('for a registry member with a usable cast.json', () => {
        const page = memberProfile(core, castJson(), undefined, builtAt);

        it('should render the full profile', () => page.kind.should.equal(ProfileKind.CastJson));
        it('should name the cast.json it came from', () => page.source!.should.equal('https://ada.example/cast.json'));
        it('should take the career from it', () => page.data.config.career.events.length.should.equal(1));
        it('should keep its own github snapshot', () => page.data.github.contributions.total.should.equal(12));
    });

    describe('for a verified contributor whose site publishes a cast.json', () => {
        const page = memberProfile(contributor, castJson(), undefined, builtAt);

        it('should never render the site content', () => page.kind.should.equal(ProfileKind.GitHub));
        it('should take the name from GitHub, not the site', () => page.data.config.person.title.should.equal('Cratis Cast Contributor'));
        it('should rank them from discovery', () => page.data.github.repositories['Cratis/Arc']!.rank.should.equal(2));
        it('should show the cratis repositories', () => page.data.config.cratis!.repos.map(repo => repo.name).should.deep.equal(['Arc']));
    });

    describe('for a registry member whose cast.json is for someone else', () => {
        const page = memberProfile({ ...core, handle: 'grace' }, castJson(), undefined, builtAt);

        it('should fall back to GitHub', () => page.kind.should.equal(ProfileKind.GitHub));
    });

    describe('for a registry member without a cast.json', () => {
        const page = memberProfile(core, undefined, undefined, builtAt);

        it('should render a GitHub-only profile', () => page.kind.should.equal(ProfileKind.GitHub));
        it('should use the GitHub avatar', () => page.data.photoUrl!.should.equal(core.avatarUrl));
        it('should link their site', () => page.data.config.person.links['website']!.should.equal('https://ada.example'));
        it('should show the verified merged pull requests', () => page.data.github.mergedPullRequests.total.should.equal(3));
    });
});
