// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type Rgb = [number, number, number];

const darkGround: Rgb = [8, 8, 14];
const lightGround: Rgb = [250, 249, 246];

const parse = (hex: string): Rgb => {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const format = (color: Rgb): string => `#${color.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance. */
export const luminance = (color: Rgb): number => 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);

/** WCAG contrast ratio between two colors. */
export const contrast = (first: Rgb, second: Rgb): number => {
    const [high, low] = [luminance(first), luminance(second)].sort((left, right) => right - left) as [number, number];
    return (high + 0.05) / (low + 0.05);
};

const mix = (color: Rgb, target: Rgb, amount: number): Rgb =>
    color.map((channel, index) => channel + (target[index]! - channel) * amount) as Rgb;

/** Moves `color` toward `target` in small steps until it reaches `ratio` against `ground`. */
const reach = (color: Rgb, target: Rgb, ground: Rgb, ratio: number): Rgb => {
    let current = color;
    for (let step = 0; step < 40 && contrast(current, ground) < ratio; step++) current = mix(current, target, 0.05);
    return current;
};

/** Accent tokens for both themes, each at least AA (4.5:1) for text on its ground. */
export type AccentTokens = { dark: string; darkSoft: string; light: string; lightSoft: string; ink: string };

/** Derives the person's accent tokens from one hex color. */
export function accentTokens(hex: string): AccentTokens {
    const base = parse(hex);
    const dark = reach(base, [255, 255, 255], darkGround, 4.5);
    const darkSoft = reach(mix(dark, [255, 255, 255], 0.35), [255, 255, 255], darkGround, 7);
    const light = reach(base, [0, 0, 0], lightGround, 4.5);
    const lightSoft = reach(mix(light, [0, 0, 0], 0.2), [0, 0, 0], lightGround, 7);
    const ink = contrast(base, [255, 255, 255]) >= contrast(base, darkGround) ? '#ffffff' : '#0b0a12';
    return { dark: format(dark), darkSoft: format(darkSoft), light: format(light), lightSoft: format(lightSoft), ink };
}
