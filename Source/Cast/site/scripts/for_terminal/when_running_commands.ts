// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { cast, terminalElements } from './given/a_terminal';

vi.mock('../../profile/clientCast', () => ({ readClientCast: () => cast }));
vi.mock('../live', () => ({ getLiveMerged: () => undefined }));
vi.mock('../../lib/nav', () => ({ go: vi.fn(), goSection: vi.fn(), openExternal: vi.fn(), profilePath: (path: string) => `/${path}`, startReplay: vi.fn() }));
vi.mock('../../lib/clipboard', () => ({ copyText: async () => true }));
vi.mock('../../lib/theme', () => ({ currentTheme: () => 'dark', setTheme: vi.fn() }));
import { openTerminal } from '../terminal';

const cases = [
    ['help', 'Commands are projections over the same event stream as the page.'],
    ['whoami', 'Ada Lovelace (ada)'], ['now', 'Projection: Ada.Now'],
    ['ls', 'top/  about/  projects/'], ['ls projects', 'cat <project> for details'],
    ['ls unknown', "cannot access 'unknown'"], ['cat loom', 'stack   TypeScript'],
    ['cat missing', 'missing: no such project'], ['cat', 'missing project name'],
    ['git log', 'Started work.'], ['git log --oneline', '#01 (HEAD -> stream) 2020-01 EmploymentStarted Joined · Acme'],
    ['git status', "'status' is not supported here."],
    ['stream tail', 'EventNotFound: the snapshot has no merged pull requests.'],
    ['stream', 'try stream tail'], ['skills', 'languages  TypeScript'],
    ['contact', 'contact --copy copies the email address'], ['contact --copy', '✓ copied ada@example.test'],
    ['open unknown', 'choose one of github'], ['open github', 'opening github.com/ada'],
    ['brew', 'Usage: brew install <tool>'], ['brew install unknown', 'No available formula with the name "unknown".'],
    ['brew install loom', '✓ copied to the clipboard'], ['theme', 'theme is dark'], ['theme light', 'theme set to light'],
    ['blog', '1 post on example.test'], ['blog events', '1 post about Events on example.test'],
    ['blog missing', 'themes are events'], ['talks', '2025 Events · Meetup'],
    ['cratis', 'Cratis makes event sourcing practical.'], ['echo one two', 'one two'],
    ['vim', 'You are now trapped.'], ['sudo anything', 'Permission denied: event streams are append-only.'],
    ['rm anything', 'Events are immutable. Try appending a compensating event.'],
    ['hlp', 'Did you mean help, ls? Or type help.'], ['zzzzzzz', 'Type help for the list of commands.'],
] as const;

describe('when running terminal commands', () => {
    let terminal: ReturnType<typeof terminalElements>;
    beforeEach(() => { terminal = terminalElements(); openTerminal(); });
    afterEach(() => vi.unstubAllGlobals());

    for (const [command, expected] of cases) {
        it(`should preserve the output of ${command}`, async () => (await terminal.exec(command)).should.contain(expected));
    }
    it('should greet only once per dialog', () => {
        const greeting = terminal.out.text();
        terminal.dialog.open = false;
        openTerminal();
        terminal.out.text().should.equal(greeting);
    });
    it('should clear the output', async () => (await terminal.exec('clear')).should.equal(''));
    it('should close the dialog', async () => { await terminal.exec('exit'); terminal.dialog.open.should.be.false; });
    it('should recall history and restore the draft', async () => {
        await terminal.exec('whoami');
        terminal.input.value = 'draft';
        terminal.key('ArrowUp');
        terminal.input.value.should.equal('whoami');
        terminal.key('ArrowDown');
        terminal.input.value.should.equal('draft');
    });
    it('should complete commands and arguments', () => {
        terminal.input.value = 'who'; terminal.key('Tab'); terminal.input.value.should.equal('whoami ');
        terminal.input.value = 'cat lo'; terminal.key('Tab'); terminal.input.value.should.equal('cat loom ');
    });
    it('should list ambiguous completions', () => {
        terminal.input.value = 'c'; terminal.key('Tab');
        terminal.input.value.should.equal('c'); terminal.out.text().should.contain('cd  cat  cv  contact  cratis  clear');
    });
    it('should cancel a line without a selection', () => {
        terminal.input.value = 'draft'; terminal.key('c', { ctrlKey: true });
        terminal.input.value.should.equal(''); terminal.out.text().should.contain('draft^C');
    });
});
