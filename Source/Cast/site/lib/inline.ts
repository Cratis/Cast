// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Renders the inline markup cast.yaml text may use, escaping everything else:
 * `*emphasis*` (the italic serif accent), `**strong**`, `` `code` `` and `[links](https://…)`.
 */
export function renderInline(text: string, emphasisClass = 'serif'): string {
    let html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*|#[^)\s]*|mailto:[^)\s]+)\)/g, (_, label: string, href: string) =>
        `<a href="${href}" class="text-fg underline decoration-line-strong hover:decoration-fg"${href.startsWith('http') ? ' rel="noopener"' : ''}>${label}</a>`);
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-fg font-semibold">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, `<em class="${emphasisClass}">$1</em>`);
    return html;
}

/** Removes inline markup, for meta tags, JSON and plain-text outputs. */
export const plainText = (text: string): string =>
    text.replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
