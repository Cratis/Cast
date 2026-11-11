// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { cast, ElementStub, terminalElements } from './given/a_terminal';

vi.mock('../../profile/clientCast', () => ({ readClientCast: () => cast }));
vi.mock('../live', () => ({ getLiveMerged: vi.fn(() => undefined) }));
vi.mock('../../lib/nav', () => ({ go: vi.fn(), goSection: vi.fn(), openExternal: vi.fn(), profilePath: (path: string) => `/${path}`, startReplay: vi.fn() }));
vi.mock('../../lib/clipboard', () => ({ copyText: vi.fn(async () => true) }));
vi.mock('../../lib/theme', () => ({ currentTheme: () => 'dark', setTheme: vi.fn() }));
import { openTerminal } from '../terminal';
import { getLiveMerged } from '../live';
import { copyText } from '../../lib/clipboard';
import { go, goSection, openExternal, startReplay } from '../../lib/nav';
import { setTheme } from '../../lib/theme';

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
    ['ls blog', '1 post on example.test'], ['cd missing', 'no such section: missing'],
    ['pwd', '/ada/'], ['man', 'Commands are projections over the same event stream as the page.'],
    ['WHOAMI', 'Ada Lovelace (ada)'], ['cat LOOM', 'stack   TypeScript'],
    ['cratis', 'Cratis makes event sourcing practical.'], ['echo one two', 'one two'],
    ['vim', 'You are now trapped.'], ['sudo anything', 'Permission denied: event streams are append-only.'],
    ['rm anything', 'Events are immutable. Try appending a compensating event.'],
    ['hlp', 'Did you mean help, ls? Or type help.'], ['zzzzzzz', 'Type help for the list of commands.'],
] as const;

describe('when running terminal commands', () => {
    let terminal: ReturnType<typeof terminalElements>;
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getLiveMerged).mockReturnValue(undefined);
        vi.mocked(copyText).mockResolvedValue(true);
        terminal = terminalElements();
        openTerminal();
    });
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
    it('should leave selected text available for copying', () => {
        terminal.input.value = 'draft'; terminal.input.selectionEnd = 3;
        terminal.key('c', { ctrlKey: true }); terminal.input.value.should.equal('draft');
    });
    it('should clear with Ctrl+L without changing the draft', () => {
        terminal.input.value = 'draft'; terminal.key('l', { ctrlKey: true });
        terminal.input.value.should.equal('draft'); terminal.out.text().should.equal('');
    });
    it('should leave ordinary typing alone', () => {
        terminal.input.value = 'draft'; terminal.key('c'); terminal.input.value.should.equal('draft');
    });
    it('should preserve the current line when completion finds nothing', () => {
        terminal.input.value = 'zzzzz'; terminal.key('Tab'); terminal.input.value.should.equal('zzzzz');
    });
    it('should not go past the ends of the history', async () => {
        await terminal.exec('whoami'); terminal.input.value = 'draft';
        terminal.key('ArrowUp'); terminal.key('ArrowUp'); terminal.input.value.should.equal('whoami');
        terminal.key('ArrowDown'); terminal.key('ArrowDown'); terminal.input.value.should.equal('draft');
    });
    it('should not store empty commands or consecutive duplicates', async () => {
        await terminal.exec('whoami'); await terminal.exec('whoami'); await terminal.exec('   ');
        (await terminal.exec('history')).should.equal('ada@stream:~$ history   1  whoami   2  history');
    });
    it('should report failed clipboard writes', async () => {
        vi.mocked(copyText).mockResolvedValue(false);
        (await terminal.exec('contact --copy')).should.contain('copy failed; select the address above');
        (await terminal.exec('brew install loom')).should.contain('(select the line above to copy it)');
    });
    it('should apply the chosen theme', async () => {
        await terminal.exec('theme dark'); vi.mocked(setTheme).mock.calls[0]![0].should.equal('dark');
    });
    it('should open the configured profile link', async () => {
        await terminal.exec('open github');
        vi.mocked(openExternal).mock.calls[0]![0].should.equal('https://github.com/ada');
    });
    for (const section of ['', '~', '/', 'top', 'about/']) {
        it(`should navigate to section ${section}`, async () => {
            await terminal.exec(`cd ${section}`);
            vi.mocked(goSection).mock.calls[0]![0].should.equal(section === 'about/' ? 'about' : 'top');
            terminal.dialog.open.should.be.false;
        });
    }
    for (const command of ['cv', 'cd cv']) {
        it(`should open the CV with ${command}`, async () => {
            await terminal.exec(command); vi.mocked(go).mock.calls[0]![0].should.equal('/cv');
            terminal.dialog.open.should.be.false;
        });
    }
    it('should start the replay after closing', async () => {
        await terminal.exec('replay'); terminal.dialog.open.should.be.false;
        vi.mocked(startReplay).mock.calls.length.should.equal(1);
    });
    it('should use live totals and distinguish an empty live feed', async () => {
        vi.mocked(getLiveMerged).mockReturnValue({ total: 123, latest: [] });
        const output = await terminal.exec('stream tail');
        output.should.contain('tail Cratis · live · 123 merged in total');
        output.should.contain('EventNotFound: the live feed has no merged pull requests.');
    });
    const requests = [1, 2, 3].map(number => ({ number, repository: 'Cratis/Cast', title: `Change ${number}`, url: `https://github.com/Cratis/Cast/pull/${number}`, mergedAt: '2026-01-01' }));
    for (const [argument, count] of [['', 3], ['-n 2', 2], ['-n -2', 1], ['-n 0', 3], ['-n nope', 3], ['-n 99', 3], ['-n', 3], ['-x 1', 3]] as const) {
        it(`should retain stream limit handling for ${argument}`, async () => {
            vi.mocked(getLiveMerged).mockReturnValue({ total: 123, latest: requests });
            const output = await terminal.exec(`stream tail ${argument}`);
            output.split('PullRequestMerged ').length.should.equal(count + 1);
            output.should.contain('HEAD    PullRequestMerged Cratis/Cast#1 Change 1');
        });
    }
    it('should trap focus at either dialog boundary', () => {
        terminal.input.focus.mockClear();
        Object.assign(document, { activeElement: terminal.close });
        terminal.dialog.listeners.get('keydown')!({ key: 'Tab', shiftKey: false, preventDefault() {} });
        terminal.input.focus.mock.calls.length.should.equal(1);
        Object.assign(document, { activeElement: terminal.input });
        terminal.dialog.listeners.get('keydown')!({ key: 'Tab', shiftKey: true, preventDefault() {} });
        terminal.close.focus.mock.calls.length.should.equal(1);
    });
    it('should keep prompt Tab handling separate from dialog focus cycling', () => {
        Object.assign(document, { activeElement: terminal.input });
        terminal.dialog.listeners.get('keydown')!({ key: 'Tab', target: terminal.input, shiftKey: true, preventDefault() {} });
        terminal.close.focus.mock.calls.length.should.equal(0);
    });
    it('should restore focus to the opener', () => {
        terminal.dialog.close();
        const opener = new ElementStub();
        Object.assign(document, { activeElement: opener });
        openTerminal(); terminal.dialog.close();
        opener.focus.mock.calls.length.should.equal(1);
        document.documentElement.style.overflow.should.equal('');
    });
    it('should blur a closed dialog when its opener is unavailable', () => {
        Object.assign(document, { activeElement: terminal.input });
        terminal.dialog.close(); terminal.input.blur.mock.calls.length.should.equal(1);
    });
    it('should not focus the prompt while selecting output or following a link', () => {
        terminal.input.focus.mockClear();
        terminal.out.listeners.get('click')!({ target: { closest: () => new ElementStub() } });
        terminal.browser.getSelection.mockReturnValue('selection');
        terminal.out.listeners.get('click')!({ target: { closest: () => null } });
        terminal.input.focus.mock.calls.length.should.equal(0);
        terminal.browser.getSelection.mockReturnValue('');
        terminal.out.listeners.get('click')!({ target: { closest: () => null } });
        terminal.input.focus.mock.calls.length.should.equal(1);
    });
});
