#!/usr/bin/env node
/* eslint-disable header/header */

// Packs every public workspace package (dry run) and fails when the archive would carry specifications.
//
// Specifications live next to the code they describe, in `for_*` folders. `tsc -b` type-checks and emits
// them with everything else, so the build output contains them and only the `files` list in each
// package.json keeps them out of the archive. This checks the real packed file list, so a package that
// drops or loosens that exclusion fails here instead of shipping compiled specifications.
//
// Run it after `yarn build`, from the repository root:
//
//     node ./verify-package-contents.js

const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawnSync;
const glob = require('glob').sync;

const specificationFolder = /(^|\/)for_[^/]+\//;
const testRunnerImport = /(?:\bfrom\s*|\brequire\(\s*|\bimport\(\s*)['"](?:vitest|chai|chai-as-promised|sinon|sinon-chai|@testing-library\/[^'"]+)['"]/;
const runtimeScript = /\.(?:js|cjs|mjs|ts|astro)$/;

function packedFiles(packageDirectory) {
    const result = spawn('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: packageDirectory, encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(`npm pack failed in '${packageDirectory}':\n${result.stderr}`);
    }

    // npm 10 runs the package's `prepare` script even with --ignore-scripts, and that script writes its own
    // progress to stdout ahead of the JSON report, so parse from the line where the report starts.
    // npm reports an array of packed packages; newer versions key the same entries by package name.
    const start = result.stdout.search(/^[[{]\s*$/m);
    if (start < 0) {
        throw new Error(`npm pack reported no packed files in '${packageDirectory}':\n${result.stdout}`);
    }

    const report = JSON.parse(result.stdout.slice(start));
    const entry = Array.isArray(report) ? report[0] : Object.values(report)[0];
    return entry.files.map(_ => _.path);
}

const packageFiles = glob('Source/*/package.json', { cwd: process.cwd(), ignore: ['**/dist/**', '**/node_modules/**'] });
const problems = [];
let packages = 0;

for (const packageFile of packageFiles.sort()) {
    const packageDirectory = path.dirname(packageFile);
    const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    if (packageJson.private === true) {
        continue;
    }

    packages++;
    const files = packedFiles(packageDirectory);
    // @cratis/cast ships its source (Astro compiles it in the consumer); only packages with a `bin` need built output.
    if (packageJson.bin && !files.some(_ => _.startsWith('dist/'))) {
        problems.push(`${packageJson.name}: the archive has no 'dist/' output - run the build before verifying`);
        continue;
    }

    for (const file of files) {
        if (specificationFolder.test(file)) {
            problems.push(`${packageJson.name}: '${file}' is a specification and must not be packed`);
        } else if (runtimeScript.test(file) && testRunnerImport.test(fs.readFileSync(path.join(packageDirectory, file), 'utf8'))) {
            problems.push(`${packageJson.name}: '${file}' imports a test runner`);
        }
    }

    console.log(`Verified '${packageJson.name}': ${files.length} packed files`);
}

if (packages === 0) {
    console.log('No public packages found under Source');
    process.exit(1);
}

if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s) in packed packages:`);
    problems.forEach(_ => console.log(`  ${_}`));
    process.exit(1);
}

console.log(`\nNo specifications or test-runner imports in ${packages} packed package(s)`);
