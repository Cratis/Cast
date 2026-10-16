// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import eslint from '@eslint/js';
import header from '@tony.ganchev/eslint-plugin-header';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const licenseHeader = [
    'error',
    {
        header: {
            commentType: 'line',
            lines: [
                ' Copyright (c) Cratis. All rights reserved.',
                ' Licensed under the MIT license. See LICENSE file in the project root for full license information.',
            ],
        },
        trailingEmptyLines: {
            minimum: 1,
        },
    },
];

// Astro components carry the header as the first lines of their frontmatter. The line-comment header rule
// cannot see it through the Astro parser, so a small local rule checks the file text instead.
const headerText = `---\n${licenseHeader[1].header.lines.map(line => `//${line}`).join('\n')}\n`;
const astroHeader = {
    rules: {
        header: {
            meta: { type: 'problem', schema: [], messages: { missing: 'Astro files start with ---, then the Cratis license header.' } },
            create(context) {
                return {
                    Program(node) {
                        if (!context.sourceCode.text.startsWith(headerText)) {
                            context.report({ node, loc: { line: 1, column: 0 }, messageId: 'missing' });
                        }
                    },
                };
            },
        },
    },
};

const typescriptRules = {
    semi: [2, 'always'],
    'no-irregular-whitespace': 0,
    'no-prototype-builtins': 0,
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-empty-object-type': 0,
};

export default tseslint.config(
    {
        ignores: [
            '**/*.d.ts',
            '**/*.js',
            '**/*.cjs',
            '**/dist/**',
            '**/node_modules/**',
            '**/.astro/**',
            '**/.yarn/**',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...astro.configs.recommended,
    {
        files: ['**/*.ts', '**/*.mjs', '**/*.astro'],
        plugins: {
            '@tony.ganchev': header,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            sourceType: 'module',
        },
        rules: {
            ...typescriptRules,
            '@tony.ganchev/header': licenseHeader,
        },
    },
    {
        // Astro templates are not semicolon-terminated statements; the frontmatter still is.
        files: ['**/*.astro'],
        plugins: {
            cratis: astroHeader,
        },
        rules: {
            semi: 0,
            '@tony.ganchev/header': 0,
            'cratis/header': 'error',
        },
    },
    {
        // Client scripts inside Astro components belong to the component, whose file carries the header.
        files: ['**/*.astro/*.ts', '**/*.astro/*.js'],
        rules: {
            '@tony.ganchev/header': 0,
        },
    },
    {
        files: ['**/for_*/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 0,
            '@typescript-eslint/no-empty-function': 'off',
        },
    },
);
