// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { project, yearsBetween, alsoText, type CareerProjection } from '../career';
import { career } from './given/a_career';

describe('when replaying the whole stream', () => {
    let projection: CareerProjection;

    beforeEach(() => {
        projection = project(career);
    });

    it('should be at the last position', () => projection.position.should.equal(5));
    it('should end the role an event ended', () => projection.roles.find(role => role.org === 'Acme')!.to!.should.equal('2023-03'));
    it('should hold every open role, newest first', () => projection.currentRoles.map(role => role.org).should.deep.equal(['Cratis', 'Globex']));
    it('should collect affiliations once each, in order', () => projection.affiliations.should.deep.equal(['University', 'Acme', 'Globex', 'Cratis']));
    it('should collect skills without duplicates', () => projection.skills.should.deep.equal(['Functional programming', 'C#', 'gRPC', 'Kubernetes']));
    it('should start the clock at the first non-education event', () => projection.shippingSince!.should.equal('2018-07'));
    it('should count event types', () => projection.eventTypes['EmploymentStarted']!.should.equal(2));
    it('should describe the other open roles', () => alsoText(projection).should.equal('also Lead · Globex'));
    it('should measure years in the field', () => yearsBetween(projection.shippingSince, projection.clock).should.equal(6.5));
});
