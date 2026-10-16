// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { project } from '../career';
import { career } from './given/a_career';

describe('when replaying part of the stream', () => {
    const projection = project(career, 2);

    it('should stop at the position', () => projection.position.should.equal(2));
    it('should know the role at that point', () => projection.currentRole!.title.should.equal('Engineer'));
    it('should mark skills the last event introduced', () => projection.newSkills.should.deep.equal(['C#', 'gRPC']));
});
