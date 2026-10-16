// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseRegistry, RegistryError } from '../registry';
import { Tier } from '../Tier';

const parseError = (yamlText: string): RegistryError => {
    try {
        parseRegistry(yamlText);
    } catch (error) {
        return error as RegistryError;
    }
    throw new Error('expected the registry to be refused');
};

describe('when parsing the registry', () => {
    describe('the committed Registry/members.yaml', () => {
        const members = parseRegistry(readFileSync(fileURLToPath(new URL('../../../../Registry/members.yaml', import.meta.url)), 'utf8'));

        it('should validate', () => members.length.should.be.greaterThan(0));
        it('should only hold core and partner tiers', () => members.every(member => member.tier === Tier.Core || member.tier === Tier.Partner).should.be.true);
        it('should record the line of every entry', () => members.every(member => typeof member.line === 'number').should.be.true);
    });

    describe('with a duplicate handle in another case', () => {
        const error = parseError('- { github: ada, tier: core }\n- { github: ADA, tier: partner }\n');

        it('should refuse it', () => error.problems[0]!.should.contain('more than once'));
    });

    describe('with a contributor entry', () => {
        const error = parseError('- { github: ada, tier: contributor }\n');

        it('should refuse it, because contributor is computed', () => error.should.be.instanceOf(RegistryError));
    });

    describe('with an unknown field', () => {
        const error = parseError('- { github: ada, tier: core, verified: true }\n');

        it('should refuse it', () => error.should.be.instanceOf(RegistryError));
    });
});
