#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { fetchProfile } from './fetchProfile.js';
import { generateFiles } from './generateFiles.js';
import { parseArguments } from './parseArguments.js';

const usage = `Create a Cratis Cast site.

Usage:
  npm create @cratis/cast@latest [directory] -- [--github <login>] [--domain <domain>] [--yes]
  yarn create @cratis/cast [directory] [--github <login>] [--domain <domain>] [--yes]

Options:
  --github <login>   Your GitHub login. Prefills cast.yaml from your public profile.
  --domain <domain>  Custom domain, for example www.example.com. Writes public/CNAME.
  --yes, -y          Do not ask; use the options given and defaults for the rest.
  --help, -h         Show this help.
`;

const ownVersion = (): string => {
    const packageFile = fileURLToPath(new URL('../package.json', import.meta.url));
    return (JSON.parse(readFileSync(packageFile, 'utf8')) as { version: string }).version;
};

const isEmptyDirectory = (directory: string): boolean => !existsSync(directory) || readdirSync(directory).filter(entry => entry !== '.git').length === 0;

async function main(): Promise<number> {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
        process.stdout.write(usage);
        return 0;
    }

    const interactive = !options.yes && process.stdin.isTTY === true;
    const prompt = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : undefined;
    const ask = async (question: string, fallback: string): Promise<string> => {
        if (!prompt) return fallback;
        const answer = (await prompt.question(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim();
        return answer || fallback;
    };

    try {
        const github = options.github ?? await ask('Your GitHub login', '');
        if (!github || !/^[A-Za-z0-9-]+$/.test(github)) {
            process.stderr.write('A GitHub login is needed: pass --github <login>.\n');
            return 1;
        }
        const directory = options.directory ?? await ask('Directory for the site', `${github.toLowerCase()}-cast`);
        const domain = options.domain ?? (await ask('Custom domain (leave empty for GitHub Pages)', '') || undefined);
        const target = path.resolve(directory);
        if (!isEmptyDirectory(target)) {
            process.stderr.write(`${target} is not empty. Choose a new or empty directory.\n`);
            return 1;
        }

        process.stdout.write(`Reading the public GitHub profile of ${github}...\n`);
        const { profile, found } = await fetchProfile(github);
        if (!found) process.stdout.write('Could not read the profile (offline or unknown login); cast.yaml gets placeholders instead.\n');

        const files = generateFiles({ directory, profile, domain, castVersion: `^${ownVersion()}` });
        for (const [relative, content] of Object.entries(files)) {
            const file = path.join(target, relative);
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, content);
        }

        const relative = path.relative(process.cwd(), target);
        const shown = relative === '' ? '.' : relative.startsWith('..') ? target : relative;
        process.stdout.write(`\nYour Cast site is in ${shown}.\n\nNext:\n  cd ${shown}\n  npm install\n  npm run dev\n\nThen fill in cast.yaml. The README lists how to publish it.\n`);
        return 0;
    } finally {
        prompt?.close();
    }
}

main().then(code => process.exit(code), error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
