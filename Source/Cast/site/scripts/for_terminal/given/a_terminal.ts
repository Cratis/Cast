// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import type { ClientCast } from '../../../profile/clientCast';

export const cast: ClientCast = {
    base: '/', verificationUrl: '/badge', rel: 'noopener', login: 'ada', orgs: ['Cratis'], feedOrg: 'Cratis',
    person: { name: 'Ada Lovelace', handle: 'ada', title: 'Engineer', location: 'London', tagline: 'Builds *things*.', email: 'ada@example.test' },
    firstName: 'Ada', now: { role: 'Engineer', since: '2020-01', tools: ['TypeScript', 'C#'] },
    careerEvents: [{ seq: 1, date: '2020-01', type: 'EmploymentStarted', title: 'Joined', org: 'Acme', summary: 'Started work.' }],
    skills: { languages: ['TypeScript'] }, talks: [{ date: '2025-01', title: 'Events', host: 'Meetup', url: 'https://example.test/talk' }],
    profileLinks: [{ key: 'GitHub', label: 'GitHub', url: 'https://github.com/ada' }],
    sections: ['about', 'projects'], projects: [{ name: 'loom', url: 'https://example.test/loom', pitch: 'Weaves.', version: '1.0', category: 'CLI', features: ['Fast'], stack: ['TypeScript'], install: 'brew install loom' }],
    pullRequests: [], mergedPrTotal: 42, mergedPrSelfReported: true, snapshotDate: '2026-01-01',
    posts: [{ headline: 'Overview', url: 'https://example.test/post', themes: ['events'] }],
    themes: [{ id: 'events', label: 'Events', tags: [] }], blogHost: 'example.test',
};

export class ElementStub {
    textContent = '';
    className = '';
    value = '';
    open = false;
    isConnected = true;
    selectionStart = 0;
    selectionEnd = 0;
    scrollTop = 0;
    scrollHeight = 0;
    children: (string | ElementStub)[] = [];
    listeners = new Map<string, (event: unknown) => unknown>();
    focus = vi.fn();
    blur = vi.fn();
    contains = (node: unknown): boolean => node === this || this.children.includes(node as ElementStub);
    setSelectionRange = vi.fn();
    addEventListener(type: string, listener: (event: unknown) => unknown): void { this.listeners.set(type, listener); }
    append(...children: (string | ElementStub)[]): void { this.children.push(...children); }
    replaceChildren(): void { this.children = []; }
    showModal(): void { this.open = true; }
    close(): void { this.open = false; this.listeners.get('close')?.({}); }
    querySelector(): null { return null; }
    text(): string { return this.textContent + this.children.map(child => typeof child === 'string' ? child : child.text()).join(''); }
}

export function terminalElements() {
    const dialog = new ElementStub();
    const out = new ElementStub();
    const input = new ElementStub();
    const form = new ElementStub();
    const close = new ElementStub();
    const chips = new ElementStub();
    const page = { documentElement: { style: { overflow: '' } }, activeElement: null as ElementStub | null, body: new ElementStub() };
    const browser = { getSelection: vi.fn(() => ''), setTimeout: vi.fn((callback: () => void) => callback()) };
    const elements: Record<string, ElementStub> = {
        '[data-terminal-out]': out, '[data-terminal-input]': input, '[data-terminal-form]': form,
        '[data-terminal-close]': close, '[data-terminal-chips]': chips,
    };
    dialog.children = [out, input, form, close, chips];
    Object.assign(dialog, {
        querySelector: (selector: string) => elements[selector] ?? null,
        querySelectorAll: () => [input, close],
    });
    vi.stubGlobal('HTMLElement', ElementStub);
    vi.stubGlobal('document', {
        querySelector: () => dialog, createElement: () => new ElementStub(),
        ...page,
    });
    vi.stubGlobal('window', browser);
    vi.stubGlobal('location', { pathname: '/ada/' });
    vi.stubGlobal('sessionStorage', { getItem: () => '[]', setItem: vi.fn() });
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => callback());
    return {
        dialog, out, input, close, chips, browser,
        async exec(command: string): Promise<string> {
            out.replaceChildren();
            input.value = command;
            form.listeners.get('submit')!({ preventDefault() {} });
            await Promise.resolve();
            await Promise.resolve();
            return out.text();
        },
        key(key: string, modifiers = {}): void {
            input.listeners.get('keydown')!({ key, preventDefault() {}, ...modifiers });
        },
    };
}
