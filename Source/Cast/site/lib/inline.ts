// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** One piece of inline text: plain text, or markup with its own pieces inside. */
export type InlineToken =
    | { kind: 'text'; text: string }
    | { kind: 'code'; text: string }
    | { kind: 'em' | 'strong'; children: InlineToken[] }
    | { kind: 'link'; href: string; children: InlineToken[] };

type Pattern = { kind: 'code' | 'link' | 'strong' | 'em'; expression: RegExp };

/** In order of precedence when two start at the same position. */
const patterns: Pattern[] = [
    { kind: 'code', expression: /`([^`]+)`/g },
    { kind: 'link', expression: /\[([^\]]+)\]\(([^)\s]+)\)/g },
    { kind: 'strong', expression: /\*\*([^*]+)\*\*/g },
    { kind: 'em', expression: /\*([^*]+)\*/g },
];

/** Link targets inline text may use: http(s), mailto, a path or an anchor. Anything else stays plain text. */
const allowedHref = /^(https?:\/\/[^\s]+|mailto:[^\s]+|\/[^\s]*|#[^\s]*)$/i;

/**
 * Parses the inline markup cast.yaml text may use into tokens: `*emphasis*` (the italic serif accent),
 * `**strong**`, `` `code` `` and `[links](https://…)`. Tokens are rendered as elements with escaped text,
 * never as HTML, so markup in member text cannot inject anything. Links to other schemes stay plain text.
 */
export function parseInline(text: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    let position = 0;
    while (position < text.length) {
        let best: { pattern: Pattern; match: RegExpExecArray } | undefined;
        for (const pattern of patterns) {
            pattern.expression.lastIndex = position;
            const match = pattern.expression.exec(text);
            if (match && (!best || match.index < best.match.index)) best = { pattern, match };
        }
        if (!best) break;
        const { pattern, match } = best;
        if (match.index > position) tokens.push({ kind: 'text', text: text.slice(position, match.index) });
        const inner = match[1]!;
        if (pattern.kind === 'code') tokens.push({ kind: 'code', text: inner });
        else if (pattern.kind === 'link') {
            const href = match[2]!;
            if (allowedHref.test(href)) tokens.push({ kind: 'link', href, children: parseInline(inner) });
            else tokens.push({ kind: 'text', text: match[0] });
        } else tokens.push({ kind: pattern.kind, children: parseInline(inner) });
        position = match.index + match[0].length;
    }
    if (position < text.length) tokens.push({ kind: 'text', text: text.slice(position) });
    return tokens;
}

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const linkClass = 'text-fg underline decoration-line-strong hover:decoration-fg';

/**
 * Renders inline markup to an HTML string with everything escaped, for outputs that are not Astro components.
 * Components render `Inline.astro`, which builds elements from the same tokens.
 */
export function renderInline(text: string, emphasisClass = 'serif'): string {
    const render = (tokens: InlineToken[]): string => tokens.map(token => {
        switch (token.kind) {
            case 'text': return escapeHtml(token.text);
            case 'code': return `<code class="inline-code">${escapeHtml(token.text)}</code>`;
            case 'strong': return `<strong class="text-fg font-semibold">${render(token.children)}</strong>`;
            case 'em': return `<em class="${escapeHtml(emphasisClass)}">${render(token.children)}</em>`;
            case 'link': return `<a href="${escapeHtml(token.href)}" class="${linkClass}"${/^https?:/i.test(token.href) ? ' rel="noopener"' : ''}>${render(token.children)}</a>`;
        }
    }).join('');
    return render(parseInline(text));
}

/** Removes inline markup, for meta tags, JSON and plain-text outputs. */
export const plainText = (text: string): string =>
    text.replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
