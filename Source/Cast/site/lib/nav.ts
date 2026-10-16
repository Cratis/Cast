// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readClientCast } from '../profile/clientCast';
import { motionReduced } from './motion';

/** Path of the profile's home page: '/' on a Cast site, '/<login>/' in the directory. */
export const homePath = (): string => readClientCast()?.base ?? '/';

/** A path under the profile's home page. */
export const profilePath = (path = ''): string => `${homePath()}${path.replace(/^\//, '')}`;

export const onHome = (): boolean => {
    const base = homePath();
    const path = location.pathname;
    return path === base || path === `${base}index.html` || `${path}/` === base;
};

/** Navigates to another page, through the view-transition router when it is active. */
export async function go(href: string): Promise<void> {
    if (document.querySelector('meta[name="astro-view-transitions-enabled"]')) {
        const { navigate } = await import('astro:transitions/client');
        await navigate(href);
    } else {
        location.href = href;
    }
}

/** Scrolls to a home-page section and moves focus to its heading. */
export function goSection(id: string): void {
    const el = document.getElementById(id);
    if (onHome() && el) {
        el.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(history.state, '', `#${id}`);
        const focusTarget = el.querySelector<HTMLElement>('h2') ?? el;
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
    } else {
        void go(profilePath(`#${id}`));
    }
}

/** Scrolls to the career section and starts the replay, from any page. */
export function startReplay(): void {
    if (onHome() && document.querySelector('[data-replay]')) document.dispatchEvent(new CustomEvent('replay:start'));
    else void go(profilePath('?replay#career'));
}

export const openExternal = (url: string): void => void window.open(url, '_blank', 'noopener');
