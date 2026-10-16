// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CareerEvent } from '../../../config/CastConfig';
import { siteData } from '../../../machine/for_profileFromCastJson/given/a_cast_json';
import { assertRenderable } from '../assertRenderable';
import { directoryHost } from '../CastHost';
import { castView, type CastProfile } from '../CastView';

const check = (change: (profile: CastProfile) => void) => () => {
    const profile: CastProfile = siteData();
    change(profile);
    assertRenderable(castView(profile, directoryHost('ada', 'https://ada.example')));
};

describe('when checking a profile renders', () => {
    it('should pass a profile the pages can render', () => check(() => undefined).should.not.throw());
    it('should refuse a portrait that does not parse', () => check(profile => { profile.photoUrl = 'https://%'; }).should.throw('photo'));
    it('should refuse a portrait that is not https', () => check(profile => { profile.photoUrl = 'http://ada.example/a.jpeg'; }).should.throw('photo'));
    it('should refuse a link that does not parse', () => check(profile => { profile.config.person.links['site'] = 'https://%'; }).should.throw('person.links.site'));
    it('should refuse an impossible contribution week', () => check(profile => { profile.github.contributions.weeks[0]!.start = '2026-99-99'; }).should.throw('weeks'));
    it('should refuse a count that is not a number', () => check(profile => { profile.github.mergedPullRequests.total = Number.NaN; }).should.throw('mergedPullRequests'));
    it('should refuse a negative count', () => check(profile => { profile.github.contributions.total = -1; }).should.throw('contributions'));
    it('should refuse an impossible career month', () => check(profile => { profile.config.career.events[0]!.date = '2018-13'; }).should.throw('career'));
    it('should refuse a career that cannot be reduced', () => check(profile => {
        (profile.config.career.events[0] as unknown as Record<string, unknown>)['skills'] = 42;
    }).should.throw());
    it('should refuse an impossible pull request date', () => check(profile => { profile.github.mergedPullRequests.latest[0]!.mergedAt = 'yesterday'; }).should.throw('mergedAt'));
    it('should refuse a post on an impossible day', () => check(profile => {
        profile.writing = { sources: [], posts: [{ title: 'Post', url: 'https://ada.example/post', date: '2026-02-30', description: '', tags: [] }] };
    }).should.throw('writing'));
    it('should refuse text that is not text', () => check(profile => { (profile.config.person as unknown as Record<string, unknown>)['tagline'] = 42; }).should.throw('tagline'));
    it('should accept every career event the schema allows', () => check(profile => {
        profile.config.career.events.push({ ...profile.config.career.events[0]!, date: '2020', endsRole: 'Acme' } as CareerEvent);
    }).should.not.throw());
});
