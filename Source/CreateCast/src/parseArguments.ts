// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Command-line options of create-cast. */
export type Arguments = {
    directory?: string;
    github?: string;
    domain?: string;
    yes: boolean;
    help: boolean;
};

/** Parses `[dir] [--github <login>] [--domain <domain>] [--yes] [--help]`; `--flag=value` works too. */
export function parseArguments(argv: readonly string[]): Arguments {
    const result: Arguments = { yes: false, help: false };
    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index]!;
        const [flag, inline] = argument.startsWith('--') ? argument.split(/=(.*)/s, 2) as [string, string | undefined] : [argument, undefined];
        const value = () => inline ?? argv[++index];
        switch (flag) {
            case '--github': result.github = value(); break;
            case '--domain': result.domain = value(); break;
            case '--yes': case '-y': result.yes = true; break;
            case '--help': case '-h': result.help = true; break;
            default:
                if (!argument.startsWith('-') && result.directory === undefined) result.directory = argument;
                else throw new Error(`Unknown option '${argument}'. Run with --help for usage.`);
        }
    }
    return result;
}
