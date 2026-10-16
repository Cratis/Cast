// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCast } from '@cratis/cast/config';
import { generateFiles } from '../generateFiles.js';
import { input } from './given/an_input.js';

const snapshots = fileURLToPath(new URL('./snapshots/', import.meta.url));
const update = process.env.UPDATE_SNAPSHOTS === '1';

describe('when generating a site', () => {
    const files = generateFiles(input);

    it('should write every file of a site', () =>
        Object.keys(files).sort().should.deep.equal(['.github/workflows/publish.yaml', '.gitignore', 'README.md', 'astro.config.mjs', 'cast.yaml', 'package.json', 'public/CNAME']));

    it('should produce a cast.yaml the engine accepts', () => parseCast(files['cast.yaml']!).person.handle.should.equal('ada'));
    it('should point the site at the custom domain', () => parseCast(files['cast.yaml']!).site.url.should.equal('https://www.ada.example'));
    it('should take the title from the first sentence of the bio', () => parseCast(files['cast.yaml']!).person.title.should.equal('Analyst of engines.'));
    it('should depend on the given @cratis/cast version', () => (JSON.parse(files['package.json']!) as { dependencies: Record<string, string> }).dependencies['@cratis/cast']!.should.equal('^1.2.3'));
    it('should derive a valid package name', () => (JSON.parse(files['package.json']!) as { name: string }).name.should.equal('ada-cast'));
    it('should grant only the deploy job write access', () => files['.github/workflows/publish.yaml']!.match(/pages: write/g)!.should.have.lengthOf(1));

    for (const [relative, content] of Object.entries(files)) {
        it(`should match the snapshot of ${relative}`, () => {
            const file = path.join(snapshots, relative.replace(/\//g, '__'));
            if (update || !existsSync(file)) {
                mkdirSync(snapshots, { recursive: true });
                writeFileSync(file, content);
            }
            content.should.equal(readFileSync(file, 'utf8'));
        });
    }
});

describe('when generating a site without a profile or domain', () => {
    const files = generateFiles({ directory: 'x', profile: { login: 'grace' }, castVersion: '^1.0.0' });
    const config = parseCast(files['cast.yaml']!);

    it('should still produce a valid cast.yaml', () => config.person.name.should.equal('grace'));
    it('should use the GitHub Pages address', () => config.site.url.should.equal('https://grace.github.io'));
    it('should not write a CNAME', () => (files['public/CNAME'] === undefined).should.be.true);
});
