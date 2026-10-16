// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { parseRegistry, type RegistryMember } from '@cratis/cast/badges';

const file = fileURLToPath(new URL('../members.yaml', import.meta.url));
const schema = JSON.parse(readFileSync(fileURLToPath(new URL('../members.schema.json', import.meta.url)), 'utf8')) as {
    items: { properties: Record<string, unknown>; required: string[] };
};

describe('when validating members', () => {
    let members: RegistryMember[];

    beforeEach(() => {
        members = parseRegistry(readFileSync(file, 'utf8'));
    });

    it('should parse and validate every entry', () => members.length.should.be.greaterThan(0));
    it('should have unique handles', () => new Set(members.map(member => member.github.toLowerCase())).size.should.equal(members.length));
    it('should only use the tiers the registry decides', () => members.every(member => ['core', 'partner'].includes(member.tier)).should.be.true);
    it('should only use fields the JSON schema knows', () => {
        const known = Object.keys(schema.items.properties);
        (parse(readFileSync(file, 'utf8')) as Record<string, unknown>[]).every(entry => Object.keys(entry).every(key => known.includes(key))).should.be.true;
    });
    it('should give every entry the fields the JSON schema requires', () => {
        (parse(readFileSync(file, 'utf8')) as Record<string, unknown>[]).every(entry => schema.items.required.every(key => key in entry)).should.be.true;
    });
});
