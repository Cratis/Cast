// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { castDirectoryUrl } from './constants';
import { cratisMarkPaths } from './cratisMark';
import { Tier } from './Tier';

/** How a tier looks on a badge. */
export type TierStyle = {
    label: string;
    description: string;
    /** Gradient stops, left to right. */
    from: string;
    to: string;
    /** Text on the tier segment. */
    ink: string;
};

export const tierStyles: Record<Tier, TierStyle> = {
    [Tier.Core]: { label: 'Core', description: 'Founder or maintainer of Cratis', from: '#a78bfa', to: '#5eead4', ink: '#140b2e' },
    [Tier.Partner]: { label: 'Partner', description: 'Vouched for by Cratis', from: '#2dd4bf', to: '#99f6e4', ink: '#042f2b' },
    [Tier.Contributor]: { label: 'Contributor', description: 'Merged work in the Cratis organization', from: '#f2994a', to: '#fcd34d', ink: '#2d1503' },
};

const unverified: TierStyle = { label: 'not verified', description: 'Not in the Cast registry and no merged Cratis pull requests yet', from: '#3a3a4a', to: '#4a4a5c', ink: '#e8e6f0' };

const fontStack = "Inter, 'Inter Variable', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const serifStack = "Fraunces, 'Fraunces Variable', Georgia, 'Times New Roman', serif";
const monoStack = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const narrow = new Set('fijlrtI.,:;\'!|() '.split(''));
const wide = new Set('mwMWO@%'.split(''));

/** Approximate rendered width of a string at a font size. `textLength` makes the final rendering exact. */
export function measureText(text: string, fontSize: number): number {
    let units = 0;
    for (const character of text) {
        if (narrow.has(character)) units += 0.32;
        else if (wide.has(character)) units += 0.86;
        else if (character >= 'A' && character <= 'Z') units += 0.66;
        else units += 0.56;
    }
    return Math.ceil(units * fontSize);
}

const escapeXml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const mark = (x: number, y: number, size: number, fill: string): string =>
    `<g transform="translate(${x} ${y}) scale(${(size / 328).toFixed(5)})"><g transform="translate(0 328) scale(.1 -.1)" fill="${fill}">${cratisMarkPaths.map(path => `<path d="${path}"/>`).join('')}</g></g>`;

/**
 * The inline badge: 20px high, shields-like, with the Cratis mark. Works on light and dark backgrounds
 * because it carries its own ground.
 */
export function badgeSvg(tier: Tier | undefined): string {
    const style = tier ? tierStyles[tier] : unverified;
    const height = 20;
    const leftText = 'Cast';
    const leftTextWidth = measureText(leftText, 11);
    const leftWidth = 6 + 12 + 5 + leftTextWidth + 7;
    const rightTextWidth = measureText(style.label, 11);
    const rightWidth = rightTextWidth + 16;
    const width = leftWidth + rightWidth;
    const title = tier ? `Cratis Cast: ${style.label}` : 'Cratis Cast: not verified';
    const id = `cast-${tier ?? 'none'}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<defs>
<linearGradient id="${id}-tier" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${style.from}"/><stop offset="1" stop-color="${style.to}"/></linearGradient>
<linearGradient id="${id}-gloss" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${id}-round"><rect width="${width}" height="${height}" rx="5"/></clipPath>
</defs>
<g clip-path="url(#${id}-round)">
<rect width="${leftWidth}" height="${height}" fill="#0c0c15"/>
<rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="url(#${id}-tier)"/>
<rect width="${width}" height="${height}" fill="url(#${id}-gloss)"/>
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".12"/>
</g>
${mark(4, 4, 12, '#f5f3f0')}
<g font-family="${fontStack}" font-size="11" font-weight="600" text-rendering="geometricPrecision">
<text x="${6 + 12 + 5}" y="14" fill="#f5f3f0" textLength="${leftTextWidth}" lengthAdjust="spacingAndGlyphs">${leftText}</text>
<text x="${leftWidth + 8}" y="14" fill="${style.ink}" textLength="${rightTextWidth}" lengthAdjust="spacingAndGlyphs">${escapeXml(style.label)}</text>
</g>
</svg>
`;
}

/** Options for the large badge card. */
export type BadgeCardOptions = {
    handle: string;
    name?: string;
    since?: string;
};

/**
 * The large badge card (480 × 168): a dark card with a tier-colored edge, the Cratis mark, the tier in
 * the italic serif and the verification address. Meant for READMEs, slides and profile pages.
 */
export function badgeCardSvg(tier: Tier | undefined, options: BadgeCardOptions): string {
    const style = tier ? tierStyles[tier] : unverified;
    const width = 480;
    const height = 168;
    const id = `cast-card-${tier ?? 'none'}`;
    const handle = options.handle.toLowerCase();
    const address = `${castDirectoryUrl.replace(/^https:\/\//, '')}/${handle}`;
    const who = options.name ? `${options.name} · @${options.handle}` : `@${options.handle}`;
    const sinceText = options.since ? ` · since ${options.since}` : '';
    const title = tier ? `${who}: Cratis Cast ${style.label}` : `${who}: not verified in the Cratis Cast`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<defs>
<linearGradient id="${id}-edge" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${style.from}"/><stop offset="1" stop-color="${style.to}"/></linearGradient>
<radialGradient id="${id}-glow" cx="1" cy="0" r="1"><stop offset="0" stop-color="${style.from}" stop-opacity=".28"/><stop offset=".6" stop-color="${style.from}" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-ground" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#12121d"/><stop offset="1" stop-color="#08080e"/></linearGradient>
<pattern id="${id}-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#fff" stroke-opacity=".035"/></pattern>
</defs>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="url(#${id}-ground)"/>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="url(#${id}-grid)"/>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="url(#${id}-glow)"/>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="url(#${id}-edge)" stroke-width="2"/>
<rect x="24" y="24" width="56" height="56" rx="14" fill="url(#${id}-edge)"/>
${mark(30, 30, 44, style.ink)}
<g font-family="${monoStack}" font-size="11" letter-spacing="1.4" fill="#9b9aa8">
<text x="98" y="38">CRATIS CAST${tier ? ' · VERIFIED' : ''}</text>
</g>
<text x="96" y="78" font-family="${serifStack}" font-style="italic" font-weight="600" font-size="38" fill="${style.from}">${escapeXml(style.label)}</text>
<g font-family="${fontStack}" fill="#f5f3f0">
<text x="24" y="118" font-size="16" font-weight="600">${escapeXml(who)}</text>
<text x="24" y="140" font-size="12.5" fill="#9b9aa8">${escapeXml(style.description + sinceText)}</text>
</g>
<text x="${width - 24}" y="140" text-anchor="end" font-family="${monoStack}" font-size="11" fill="#6c6b7a">${escapeXml(address)}</text>
</svg>
`;
}
