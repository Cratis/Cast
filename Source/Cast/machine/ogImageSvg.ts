// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { tierStyles } from '../badges/badgeSvg';
import { cratisMarkPaths } from '../badges/cratisMark';
import type { Tier } from '../badges/Tier';
import { plainText } from '../site/lib/inline';

/** Inputs for the social preview card. */
export type OgImageInput = {
    name: string;
    title: string;
    tagline: string;
    host: string;
    accent: string;
    tier?: Tier;
};

const escapeXml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word wrap by an approximate character budget. */
export function wrap(text: string, maximumCharacters: number, maximumLines: number): string[] {
    const lines: string[] = [];
    let current = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
        if ((current ? `${current} ${word}` : word).length > maximumCharacters && current) {
            lines.push(current);
            current = word;
        } else {
            current = current ? `${current} ${word}` : word;
        }
    }
    if (current) lines.push(current);
    if (lines.length > maximumLines) {
        const kept = lines.slice(0, maximumLines);
        kept[maximumLines - 1] = `${kept[maximumLines - 1]!.replace(/[.,;:]?$/, '')}…`;
        return kept;
    }
    return lines;
}

const sans = "Inter, 'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif";
const serif = "Fraunces, Georgia, 'DejaVu Serif', serif";
const mono = "'JetBrains Mono', Menlo, 'DejaVu Sans Mono', monospace";

/** The 1200 × 630 social preview card, rendered to PNG at build time. */
export function ogImageSvg(input: OgImageInput): string {
    const style = input.tier ? tierStyles[input.tier] : undefined;
    const tagline = wrap(plainText(input.tagline), 34, 2);
    const title = wrap(input.title, 64, 2);
    const mark = `<g transform="translate(80 72) scale(${(40 / 328).toFixed(5)})"><g transform="translate(0 328) scale(.1 -.1)" fill="#f5f3f0">${cratisMarkPaths.map(path => `<path d="${path}"/>`).join('')}</g></g>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
<radialGradient id="a" cx="0.92" cy="0.05" r="0.75"><stop offset="0" stop-color="${input.accent}" stop-opacity=".42"/><stop offset="1" stop-color="${input.accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="b" cx="0.1" cy="1.05" r="0.6"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".18"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient>
<pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity=".04"/></pattern>
${style ? `<linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="${style.from}"/><stop offset="1" stop-color="${style.to}"/></linearGradient>` : ''}
</defs>
<rect width="1200" height="630" fill="#08080e"/>
<rect width="1200" height="630" fill="url(#g)"/>
<rect width="1200" height="630" fill="url(#a)"/>
<rect width="1200" height="630" fill="url(#b)"/>
${mark}
<text x="136" y="101" font-family="${mono}" font-size="20" letter-spacing="3" fill="#a09fad">CRATIS CAST</text>
${style ? `<g><rect x="${1120 - 52 - style.label.length * 15}" y="66" width="${52 + style.label.length * 15}" height="44" rx="12" fill="url(#t)"/><text x="${1120 - 26}" y="96" text-anchor="end" font-family="${sans}" font-weight="700" font-size="22" fill="${style.ink}">${escapeXml(style.label)}</text></g>` : ''}
<text x="80" y="250" font-family="${sans}" font-weight="800" font-size="84" letter-spacing="-3" fill="#f5f3f0">${escapeXml(input.name)}</text>
${title.map((line, index) => `<text x="82" y="${306 + index * 36}" font-family="${sans}" font-size="28" fill="#a09fad">${escapeXml(line)}</text>`).join('\n')}
${tagline.map((line, index) => `<text x="80" y="${440 + index * 62}" font-family="${serif}" font-style="italic" font-weight="600" font-size="54" fill="${input.accent}">${escapeXml(line)}</text>`).join('\n')}
<text x="80" y="582" font-family="${mono}" font-size="22" fill="#7c7b8b">${escapeXml(input.host)}</text>
<rect x="0" y="626" width="1200" height="4" fill="${input.accent}"/>
</svg>`;
}

/** The favicon: the person's initial in the italic serif on their accent. */
export function faviconSvg(initial: string, accent: string, ink: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${accent}"/><text x="32" y="45" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" font-size="40" fill="${ink}">${escapeXml(initial)}</text></svg>`;
}
