// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// <handle>@stream:~$ — an interactive terminal over the same data the page renders.
// Lazy-loaded by Terminal.astro on first open.
import { readClientCast, type ClientCast } from '../profile/clientCast';
import { getLiveMerged } from './live';
import { relativeTime } from '../lib/reltime';
import { copyText } from '../lib/clipboard';
import { formatMonth } from '../lib/career';
import { plainText } from '../lib/inline';
import { go, goSection, openExternal, profilePath, startReplay } from '../lib/nav';
import { currentTheme, setTheme } from '../lib/theme';

type Part = string | Node;
type Command = {
    desc: string;
    usage?: string;
    hidden?: boolean;
    run: (args: string[], raw: string) => void | Promise<void>;
    complete?: (args: string[]) => string[];
};

const ALL_SECTIONS = [
    ['top', 'hero'],
    ['about', 'now & about'],
    ['career', 'career replay'],
    ['model', 'event model'],
    ['cratis', 'open source'],
    ['activity', 'contributions'],
    ['agentic', 'agentic engineering'],
    ['projects', 'things I build'],
    ['writing', 'blog posts'],
    ['talks', 'talks & writing'],
    ['skills', 'toolbox'],
    ['contact', 'contact'],
] as const;

// --- tiny DOM helpers --------------------------------------------------------------
const styledText = ({ className }: { className: string }) => (text: string): HTMLSpanElement => {
    const element = document.createElement('span');
    element.className = className;
    element.textContent = text;
    return element;
};
const c = {
    ev: styledText({ className: 'text-event' }),
    cmd: styledText({ className: 'text-command' }),
    view: styledText({ className: 'text-view' }),
    muted: styledText({ className: 'text-fg-muted' }),
    faint: styledText({ className: 'text-fg-faint' }),
    fg: styledText({ className: 'text-fg' }),
};
let linkRel = 'noopener';
const link = ({ href, text = href.replace(/^https?:\/\/(www\.)?/, '') }: { href: string; text?: string }): HTMLAnchorElement => {
    const a = document.createElement('a');
    a.href = /^(https?:|mailto:)/i.test(href) ? href : '#';
    a.textContent = text;
    a.target = '_blank';
    a.rel = linkRel;
    a.className = 'text-command-soft';
    return a;
};
const pad = ({ text, width }: { text: string; width: number }) => text + ' '.repeat(Math.max(1, width - text.length));

/** Levenshtein distance, for "did you mean" suggestions. */
function distance({ a, b }: { a: string; b: string }): number {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = row[0]!;
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = row[j]!;
            row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return row[b.length]!;
}

class Terminal {
    private history: string[] = [];
    private cursor = 0;
    private draft = '';
    private returnFocus: HTMLElement | null = null;
    private greeted = false;
    private readonly commands: Record<string, Command>;
    private readonly prompt: string;

    constructor(
        private readonly cast: ClientCast,
        private readonly dialog: HTMLDialogElement,
        private readonly out: HTMLElement,
        private readonly input: HTMLInputElement,
    ) {
        this.prompt = `${cast.person.handle}@stream`;
        try {
            this.history = JSON.parse(sessionStorage.getItem('cast:term-history') ?? '[]') as string[];
        } catch {
            this.history = [];
        }
        this.cursor = this.history.length;
        this.commands = this.buildCommands();
        this.bind();
    }

    // --- output ------------------------------------------------------------------
    print(...parts: Part[]): void {
        const line = document.createElement('div');
        line.className = 'ln text-fg-muted';
        line.append(...parts);
        this.out.append(line);
        this.out.scrollTop = this.out.scrollHeight;
    }
    blank(): void {
        this.print(' ');
    }
    private echo({ raw }: { raw: string }): void {
        this.print(c.view(this.prompt), c.faint(':'), c.cmd('~'), c.faint('$ '), c.fg(raw));
    }
    clear(): void {
        this.out.replaceChildren();
    }

    private greet(): void {
        this.greeted = true;
        const { careerEvents, feedOrg, snapshotDate } = this.cast;
        this.print(c.ev(this.prompt), c.faint(` · stream position ${careerEvents.length} · ${this.mergedTotal()} PRs merged in ${feedOrg}`));
        this.print(c.faint(`GitHub snapshot taken ${snapshotDate}. Everything here is real data.`));
        this.print('Type ', c.fg('help'), ' to see what you can do, or tap a suggestion below.');
        this.blank();
    }

    /** The merged pull request total: live once the browser has it, else the snapshot, marked when self-reported. */
    private mergedTotal(): string {
        const live = getLiveMerged();
        const total = (live?.total ?? this.cast.mergedPrTotal).toLocaleString('en-US');
        return !live && this.cast.mergedPrSelfReported ? `${total} (self-reported)` : total;
    }

    // --- lifecycle ----------------------------------------------------------------
    open(): void {
        linkRel = this.cast.rel;
        if (this.dialog.open) return;
        this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!this.greeted) this.greet();
        this.dialog.showModal();
        document.documentElement.style.overflow = 'hidden';
        this.input.focus();
    }
    close(restoreFocus = true): void {
        if (!restoreFocus) this.returnFocus = null;
        if (this.dialog.open) this.dialog.close();
    }

    private bind(): void {
        const { dialog, input, out } = this;
        dialog.addEventListener('close', () => {
            this.restoreFocus();
        });
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) this.close();
        });
        dialog.querySelector('[data-terminal-close]')?.addEventListener('click', () => this.close());
        dialog.querySelector('[data-terminal-form]')?.addEventListener('submit', (e) => {
            e.preventDefault();
            void this.exec(input.value);
        });
        dialog.querySelector('[data-terminal-chips]')?.addEventListener('click', (e) => {
            const chip = (e.target as Element).closest<HTMLButtonElement>('[data-cmd]');
            if (!chip) return;
            void this.exec(chip.dataset['cmd'] ?? '');
            input.focus();
        });
        // Clicking the output focuses the prompt, unless the visitor is selecting text or a link.
        out.addEventListener('click', (e) => {
            if (this.shouldFocusPrompt(e)) input.focus();
        });
        input.addEventListener('keydown', (e) => this.onKey(e));
        // Keep Tab completion inside the prompt and Shift+Tab cycling within the dialog.
        dialog.addEventListener('keydown', (e) => this.cycleFocus(e));
    }

    private shouldFocusPrompt(event: MouseEvent): boolean {
        if ((event.target as Element).closest('a')) return false;
        return !window.getSelection()?.toString();
    }

    private restoreFocus(): void {
        document.documentElement.style.overflow = '';
        const target = this.returnFocus;
        const canRestore = target && target !== document.body && target.isConnected;
        if (canRestore) target.focus({ preventScroll: true });
        // Nothing to return to: drop focus from the closed dialog once the browser is done closing it.
        else window.setTimeout(() => this.blurClosedDialog(), 0);
    }

    private blurClosedDialog(): void {
        if (this.dialog.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    }

    private cycleFocus(e: KeyboardEvent): void {
        if (e.key !== 'Tab') return;
        if (e.target === this.input) return;
        const stops = [...this.dialog.querySelectorAll<HTMLElement>('input, button, a[href]')];
        const first = stops[0];
        const last = stops[stops.length - 1];
        const boundary = e.shiftKey ? first : last;
        if (document.activeElement !== boundary) return;
        e.preventDefault();
        const destination = e.shiftKey ? last : first;
        destination?.focus();
    }

    private onKey(e: KeyboardEvent): void {
        const { input } = this;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.cursor === this.history.length) this.draft = input.value;
            this.cursor = Math.max(0, this.cursor - 1);
            input.value = this.history[this.cursor] ?? this.draft;
            requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.cursor = Math.min(this.history.length, this.cursor + 1);
            input.value = this.cursor === this.history.length ? this.draft : (this.history[this.cursor] ?? '');
        } else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            this.complete();
        } else {
            this.controlKey(e);
        }
    }

    private controlKey(e: KeyboardEvent): void {
        if (!e.ctrlKey) return;
        if (e.key.toLowerCase() === 'l') {
            e.preventDefault();
            this.clear();
        } else if (e.key.toLowerCase() === 'c' && this.input.selectionStart === this.input.selectionEnd) {
            // Ctrl+C with no selection cancels the line, like a shell.
            e.preventDefault();
            this.echo({ raw: `${this.input.value}^C` });
            this.input.value = '';
        }
    }

    private complete(): void {
        const { input } = this;
        const value = input.value;
        const parts = value.split(/\s+/);
        let candidates: string[];
        let prefix: string;
        if (parts.length <= 1) {
            prefix = parts[0] ?? '';
            candidates = Object.entries(this.commands).filter(([, cmd]) => !cmd.hidden).map(([name]) => name);
        } else {
            prefix = parts[parts.length - 1] ?? '';
            candidates = this.commands[parts[0] ?? '']?.complete?.(parts.slice(1, -1)) ?? [];
        }
        const matches = candidates.filter((x) => x.startsWith(prefix));
        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0]!;
            input.value = `${parts.join(' ')} `;
        } else if (matches.length > 1) {
            // Extend to the longest common prefix, then list the options.
            const common = this.commonPrefix(matches);
            if (common.length > prefix.length) {
                parts[parts.length - 1] = common;
                input.value = parts.join(' ');
            } else {
                this.echo({ raw: value });
                this.print(...matches.flatMap((m) => [c.fg(m), '  ']));
            }
        }
    }

    private commonPrefix(matches: string[]): string {
        let common = matches[0]!;
        for (const match of matches) while (!match.startsWith(common)) common = common.slice(0, -1);
        return common;
    }

    async exec(raw: string): Promise<void> {
        const line = raw.trim();
        this.input.value = '';
        this.echo({ raw: line });
        if (!line) return;
        this.remember({ line });

        if (/^sudo\b/.test(line)) return this.print(c.ev('Permission denied:'), ' event streams are append-only.');
        if (/^rm\b/.test(line)) return this.print(c.ev('Events are immutable.'), ' Try appending a compensating event.');

        const [name = '', ...args] = line.split(/\s+/);
        const cmd = this.commands[name.toLowerCase()];
        if (!cmd) return this.unknownCommand({ name });
        await cmd.run(args, line);
    }

    private remember({ line }: { line: string }): void {
        if (this.history[this.history.length - 1] !== line) this.history.push(line);
        this.history = this.history.slice(-50);
        this.cursor = this.history.length;
        this.draft = '';
        try {
            sessionStorage.setItem('cast:term-history', JSON.stringify(this.history));
        } catch {
            /* ignore */
        }
    }

    private unknownCommand({ name }: { name: string }): void {
        const names = Object.entries(this.commands).filter(([, x]) => !x.hidden).map(([n]) => n);
        const near = names
            .map((n) => ({ n, d: distance({ a: name.toLowerCase(), b: n }) }))
            .filter((x) => x.d <= 2 || x.n.startsWith(name.toLowerCase()))
            .sort((a, b) => a.d - b.d)
            .slice(0, 3)
            .map((x) => x.n);
        this.print(c.ev('command not found: '), c.fg(name));
        if (near.length) this.print('Did you mean ', ...near.flatMap((n, i) => [c.fg(n), i < near.length - 1 ? ', ' : '']), '? Or type ', c.fg('help'), '.');
        else this.print('Type ', c.fg('help'), ' for the list of commands.');
    }

    // --- commands -------------------------------------------------------------------
    private buildCommands(): Record<string, Command> {
        return {
            help: this.helpCommand(),
            whoami: this.identityCommand(),
            now: this.nowCommand(),
            ls: this.listCommand(),
            cd: this.sectionCommand(),
            cat: this.projectCommand(),
            git: this.careerCommand(),
            stream: this.streamCommand(),
            replay: { desc: 'replay my career on the page', run: () => { this.close(false); startReplay(); } },
            cv: { desc: 'open the printable CV', run: () => this.navigate({ href: profilePath('cv') }) },
            skills: this.skillsCommand(),
            contact: this.contactCommand(),
            open: this.openCommand(),
            brew: this.brewCommand(),
            theme: this.themeCommand(),
            blog: this.blogCommand(),
            talks: this.talksCommand(),
            cratis: this.cratisCommand(),
            ...this.shellCommands(),
        };
    }

    private sections() {
        return ALL_SECTIONS.filter(([id]) => id === 'top' || this.cast.sections.includes(id));
    }

    private links(): Record<string, string> {
        const { profileLinks, cratis } = this.cast;
        return {
            ...Object.fromEntries(profileLinks.map((profile) => [profile.key.toLowerCase(), profile.url])),
            ...(cratis ? { cratis: Object.values(cratis.links)[0] ?? 'https://cratis.io' } : {}),
        };
    }

    private helpCommand(): Command {
        return {
            desc: 'list commands',
            run: () => {
                this.print(c.faint('Commands are projections over the same event stream as the page.'));
                for (const [name, cmd] of Object.entries(this.commands)) {
                    if (cmd.hidden) continue;
                    this.print(c.cmd(pad({ text: cmd.usage ?? name, width: 26 })), cmd.desc);
                }
                this.print(c.faint('Keys: ↑/↓ history · Tab complete · Ctrl+L clear · Esc close'));
            },
        };
    }

    private identityCommand(): Command {
        const { person } = this.cast;
        return {
            desc: 'who is behind this stream',
            run: () => {
                this.print(c.fg(person.name), c.faint(` (${person.handle})`));
                this.print(person.title, ...(person.location ? [c.faint(' · '), person.location] : []));
                this.print(c.ev(plainText(person.tagline)));
            },
        };
    }

    private nowCommand(): Command {
        const { firstName, careerEvents, now } = this.cast;
        return {
            desc: `the ${firstName}.Now read model`,
            run: () => {
                this.print(c.faint('Projection: '), c.view(`${firstName}.Now`), c.faint(` · projected from ${careerEvents.length} events`));
                const rows: [string, string][] = Object.entries(now).map(([key, value]) => [
                    key,
                    Array.isArray(value) ? value.join(', ') : /^\d{4}-\d{2}$/.test(value) ? formatMonth(value) : plainText(value),
                ]);
                for (const [k, v] of rows) this.print(c.faint(pad({ text: k, width: 12 })), c.fg(v));
            },
        };
    }

    private listCommand(): Command {
        const { projects } = this.cast;
        const SECTIONS = this.sections();
        return {
            desc: 'list sections, projects or blog posts',
            usage: 'ls [projects|blog]',
            complete: () => ['projects', 'blog'],
            run: ([what]) => {
                if (what === 'blog') return this.commands['blog']!.run([], 'blog');
                if (what === 'projects') {
                    for (const p of projects) this.print(c.view(pad({ text: p.name, width: 12 })), c.faint(pad({ text: p.version ?? '', width: 9 })), c.faint(pad({ text: p.category, width: 8 })), p.pitch);
                    this.print(c.faint('cat <project> for details'));
                    return;
                }
                if (what) return this.print(c.ev('ls: '), `cannot access '${what}': try `, c.fg('ls'), ' or ', c.fg('ls projects'));
                this.print(...SECTIONS.flatMap(([id]) => [c.cmd(`${id}/`), '  ']));
                this.print(c.faint('cd <section> to jump there'));
            },
        };
    }

    private sectionCommand(): Command {
        const SECTIONS = this.sections();
        return {
            desc: 'jump to a section',
            usage: 'cd <section>',
            complete: () => SECTIONS.map(([id]) => id),
            run: ([to]) => {
                const id = (to ?? '').replace(/\/$/, '');
                if (['', '~', '/'].includes(id)) return this.navigateSection({ id: 'top' });
                if (id === 'cv') return this.navigate({ href: profilePath('cv') });
                if (!SECTIONS.some(([s]) => s === id)) return this.print(c.ev('cd: '), `no such section: ${id}`);
                this.navigateSection({ id });
            },
        };
    }

    private projectCommand(): Command {
        const { projects } = this.cast;
        const findProject = (q = '') => projects.find((p) => p.name.toLowerCase() === q.toLowerCase());
        const projectNames = () => projects.map((p) => p.name);
        return {
            desc: 'show a project',
            usage: 'cat <project>',
            complete: projectNames,
            run: ([name]) => {
                const p = findProject(name);
                if (!p) {
                    this.print(c.ev('cat: '), name ? `${name}: no such project` : 'missing project name');
                    return this.print('Try one of: ', ...projectNames().flatMap((n, i, a) => [c.fg(n), i < a.length - 1 ? ', ' : '']));
                }
                this.print(c.view(p.name), p.version ? c.faint(` ${p.version}`) : '', c.faint(` · ${p.category}`));
                this.print(c.fg(p.pitch));
                for (const f of p.features) this.print(c.ev('  • '), f);
                this.print(c.faint('stack   '), p.stack.join(', '));
                if (p.install) this.print(c.faint('install '), c.cmd(p.install));
                this.print(c.faint('source  '), link({ href: p.url }));
            },
        };
    }

    private careerCommand(): Command {
        const { careerEvents } = this.cast;
        return {
            desc: 'career events, newest first',
            usage: 'git log [--oneline]',
            complete: (args) => (args.length ? ['--oneline'] : ['log']),
            run: ([sub, flag]) => {
                if (sub !== 'log') return this.print(c.ev('git: '), `'${sub ?? ''}' is not supported here. Try `, c.fg('git log'), ' or ', c.fg('git log --oneline'));
                const events = [...careerEvents].reverse();
                events.forEach((e, i) => {
                    const head = i === 0 ? [c.faint(' ('), c.cmd('HEAD -> '), c.view('stream'), c.faint(')')] : [];
                    if (flag === '--oneline') {
                        this.print(c.ev(`#${String(e.seq).padStart(2, '0')}`), ...head, ' ', c.faint(e.date), ' ', c.ev(e.type), ' ', c.fg(e.title), e.org ? c.faint(` · ${e.org}`) : '');
                        return;
                    }
                    this.print(c.ev(`event #${e.seq}`), ...head);
                    this.print(c.faint('Type:  '), c.ev(e.type));
                    this.print(c.faint('Date:  '), formatMonth(e.date));
                    if (e.org) this.print(c.faint('Org:   '), e.org);
                    this.blank();
                    this.print('    ', c.fg(e.title));
                    this.print('    ', e.summary);
                    this.blank();
                });
            },
        };
    }

    private streamCommand(): Command {
        const { feedOrg, snapshotDate } = this.cast;
        return {
            desc: 'latest merged PRs from GitHub',
            usage: 'stream tail [-n N]',
            complete: (args) => (args.length ? ['-n'] : ['tail']),
            run: ([sub, flag, n]) => {
                if (sub !== 'tail') return this.print(c.ev('stream: '), 'try ', c.fg('stream tail'));
                const live = getLiveMerged();
                const prs = live?.latest ?? this.cast.pullRequests;
                const count = this.tailCount({ flag, n, length: prs.length });
                this.print(c.faint(`tail ${feedOrg} · ${live ? 'live' : `snapshot taken ${snapshotDate}`} · ${this.mergedTotal()} merged in total`));
                prs.slice(0, count).forEach((pr, i) => {
                    this.print(
                        c.faint(pad({ text: i === 0 ? 'HEAD' : `HEAD~${i}`, width: 8 })),
                        c.ev('PullRequestMerged '),
                        c.cmd(`${pr.repository}#${pr.number} `),
                        link({ href: pr.url, text: pr.title }),
                        c.faint(` · ${relativeTime(pr.mergedAt)}`),
                    );
                });
                if (!prs.length) this.print(c.faint(live ? 'EventNotFound: the live feed has no merged pull requests.' : 'EventNotFound: the snapshot has no merged pull requests.'));
            },
        };
    }

    private tailCount({ flag, n, length }: { flag: string | undefined; n: string | undefined; length: number }): number {
        return flag === '-n' ? Math.max(1, Math.min(length, Number(n) || length)) : length;
    }

    private skillsCommand(): Command {
        const { skills } = this.cast;
        return {
            desc: 'the toolbox, grouped',
            run: () => {
                for (const [group, list] of Object.entries(skills)) {
                    this.print(c.view(group));
                    this.print('  ', list.join(' · '));
                }
            },
        };
    }

    private contactCommand(): Command {
        const { person, profileLinks } = this.cast;
        return {
            desc: 'how to reach me',
            usage: 'contact [--copy]',
            complete: () => ['--copy'],
            run: async ([flag]) => {
                if (person.email) this.print(c.faint(pad({ text: 'email', width: 10 })), link({ href: `mailto:${person.email}`, text: person.email }));
                for (const profile of profileLinks) this.print(c.faint(pad({ text: profile.key, width: 10 })), link({ href: profile.url }));
                if (!person.email) return;
                if (flag === '--copy') this.print((await copyText(person.email)) ? c.view(`✓ copied ${person.email}`) : c.ev('copy failed; select the address above'));
                else this.print(c.faint('contact --copy copies the email address'));
            },
        };
    }

    private openCommand(): Command {
        const LINKS = this.links();
        return {
            desc: 'open a profile in a new tab',
            usage: `open ${Object.keys(LINKS).join('|')}`,
            complete: () => Object.keys(LINKS),
            run: ([target]) => {
                const url = LINKS[target ?? ''];
                if (!url) return this.print(c.ev('open: '), 'choose one of ', ...Object.keys(LINKS).flatMap((k, i, a) => [c.fg(k), i < a.length - 1 ? ', ' : '']));
                this.print(c.faint('opening '), link({ href: url }));
                openExternal(url);
            },
        };
    }

    private brewCommand(): Command {
        const brewable = this.cast.projects.filter((p) => p.install?.startsWith('brew'));
        return {
            desc: 'install one of my CLI tools',
            usage: 'brew install <tool>',
            complete: (args) => (args.length ? brewable.map((p) => p.name) : ['install']),
            run: async ([sub, name]) => {
                if (sub !== 'install' || !name) return this.print('Usage: ', c.fg('brew install <tool>'), c.faint(` (${brewable.map((p) => p.name).join(', ')})`));
                const p = brewable.find((x) => x.name === name.toLowerCase());
                if (!p?.install) return this.print(c.ev('Error: '), `No available formula with the name "${name}". Try: ${brewable.map((x) => x.name).join(', ')}`);
                this.print(c.cmd('==> '), c.fg(`${p.name} ${p.version ?? ''}`.trim()), c.faint(` · ${p.pitch}`));
                this.print(c.faint('Run this in your own terminal:'));
                this.print('  ', c.cmd(p.install));
                this.print((await copyText(p.install)) ? c.view('✓ copied to the clipboard') : c.faint('(select the line above to copy it)'));
            },
        };
    }

    private themeCommand(): Command {
        return {
            desc: 'switch the color theme',
            usage: 'theme light|dark',
            complete: () => ['light', 'dark'],
            run: ([t]) => {
                if (t !== 'light' && t !== 'dark') return this.print('theme is ', c.fg(currentTheme()), c.faint('; use theme light or theme dark'));
                setTheme(t);
                this.print(c.view('✓ '), `theme set to ${t}`);
            },
        };
    }

    private blogCommand(): Command {
        const { themes: blogThemes, posts: blogPosts, blogHost } = this.cast;
        return {
            desc: blogHost ? `my posts on ${blogHost}` : 'my posts',
            usage: 'blog [theme]',
            complete: () => blogThemes.map((t) => t.id),
            run: ([theme]) => {
                const t = blogThemes.find((x) => x.id === theme);
                if (theme && !t) return this.print(c.ev('blog: '), 'themes are ', ...blogThemes.flatMap((x, i, a) => [c.fg(x.id), i < a.length - 1 ? ', ' : '']));
                const list = t ? blogPosts.filter((p) => p.themes.includes(t.id)) : blogPosts;
                this.print(c.faint(`${list.length} post${list.length === 1 ? '' : 's'}${t ? ` about ${t.label}` : ''}${blogHost ? ` on ${blogHost}` : ''}`));
                for (const p of list) this.printPost(p);
            },
        };
    }

    private printPost(post: ClientCast['posts'][number]): void {
        const part = post.part !== undefined ? `Part ${String(post.part).padStart(2, '0')}` : 'Overview';
        this.print(c.ev(pad({ text: part, width: 9 })), link({ href: post.url, text: post.headline }), c.faint(post.minutes ? ` · ${post.minutes} min` : ''));
    }

    private talksCommand(): Command {
        const { talks } = this.cast;
        return {
            desc: 'talks & writing',
            run: () => {
                for (const t of talks) {
                    this.print(c.ev(t.date.slice(0, 4)), ' ', c.fg(t.title), c.faint(` · ${t.host}`));
                    if (t.url) this.print('  ', link({ href: t.url, text: 'watch' }));
                }
            },
        };
    }

    private cratisCommand(): Command {
        const { cratis } = this.cast;
        const LINKS = this.links();
        return {
            desc: 'what Cratis is',
            run: () => {
                if (!cratis) return this.print(c.faint('Cratis makes event sourcing practical. '), link({ href: 'https://cratis.io' }));
                if (cratis.pitch) this.print(c.fg(plainText(cratis.pitch)));
                this.print(c.faint(`${this.mergedTotal()} merged PRs · `), link({ href: LINKS['cratis'] ?? 'https://cratis.io' }));
                for (const r of cratis.repos) this.print(c.cmd(pad({ text: r.name, width: 21 })), c.faint(pad({ text: r.role, width: 16 })), r.url ? link({ href: r.url, text: r.desc }) : r.desc);
            },
        };
    }

    private shellCommands(): Record<string, Command> {
        return {
            clear: { desc: 'clear the screen (Ctrl+L)', run: () => this.clear() },
            exit: { desc: 'close the terminal (Esc)', run: () => this.close() },
            // Hidden aliases.
            history: {
                desc: 'command history',
                hidden: true,
                run: () => this.history.forEach((h, i) => this.print(c.faint(String(i + 1).padStart(4)), '  ', h)),
            },
            pwd: { desc: '', hidden: true, run: () => this.print(location.pathname) },
            echo: { desc: '', hidden: true, run: (_, raw) => this.print(raw.replace(/^echo\s?/, '')) },
            man: { desc: '', hidden: true, run: () => this.commands['help']!.run([], 'help') },
            vim: { desc: '', hidden: true, run: () => this.print('You are now trapped. Just kidding: press ', c.fg('Esc'), '.') },
        };
    }

    private navigateSection({ id }: { id: string }): void {
        this.close(false);
        goSection(id);
    }
    private navigate({ href }: { href: string }): void {
        this.print(c.faint(`navigating to ${href}…`));
        this.close(false);
        void go(href);
    }
}

// One Terminal per dialog element: the view-transition router replaces the DOM on navigation.
const instances = new WeakMap<HTMLDialogElement, Terminal>();

export function openTerminal(): void {
    const dialog = document.querySelector<HTMLDialogElement>('[data-terminal]');
    const out = dialog?.querySelector<HTMLElement>('[data-terminal-out]');
    const input = dialog?.querySelector<HTMLInputElement>('[data-terminal-input]');
    const cast = readClientCast();
    if (!dialog || !cast) return;
    if (!out || !input) return;
    let term = instances.get(dialog);
    if (!term) {
        term = new Terminal(cast, dialog, out, input);
        instances.set(dialog, term);
    }
    term.open();
}
