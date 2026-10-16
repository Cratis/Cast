// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Public, unauthenticated home-page refresh. Snapshot rendering never depends on it.
import { onPageLoad } from '../lib/lifecycle';
import { relativeTime } from '../lib/reltime';
import type { PullRequest } from '../lib/github';
import { readClientCast } from '../profile/clientCast';

type SearchItem = { repository_url?: string; pull_request?: { merged_at?: string }; title?: unknown; number?: unknown; html_url?: string };
type SearchResponse = { total_count?: unknown; incomplete_results?: boolean; items?: unknown };
type PublicEvent = { type?: string; repo?: { name?: string }; created_at?: string; payload?: { action?: string; ref_type?: string; pull_request?: { merged?: boolean } } };

const orgPatternFor = (orgs: string[]) =>
    new RegExp(`^https://api\\.github\\.com/repos/(${orgs.map(org => org.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/([^/]+)$`, 'i');

const TTL = 5 * 60_000;
type Merged = { total: number; latest: PullRequest[] };
type Activity = { type: string; repo: string; at: string };
// Per login: the directory renders many profiles on one origin.
const merged = new Map<string, { at: number; data: Merged }>();
const pending = new Map<string, Promise<unknown>>();

/** The live merged pull requests of the profile on the page, while fresh. */
export const getLiveMerged = (): Merged | undefined => {
    const login = readClientCast()?.login.toLowerCase();
    const entry = login ? merged.get(login) : undefined;
    return entry && Date.now() - entry.at < TTL ? entry.data : undefined;
};

async function cached<T>(key: string, path: string, parse: (data: unknown) => T): Promise<T> {
    try {
        const entry = JSON.parse(sessionStorage.getItem(`github:${key}`) ?? 'null');
        if (entry && Date.now() - entry.at >= 0 && Date.now() - entry.at < TTL) return parse(entry.data);
    } catch { /* Storage may be disabled; the snapshot still works. */ }
    const existing = pending.get(key);
    if (existing) return existing as Promise<T>;
    const request = (async () => {
        const res = await fetch(`https://api.github.com${path}`, { signal: AbortSignal.timeout(8000) });
        if (res.status !== 200) throw new Error('GitHub unavailable');
        const data: unknown = await res.json();
        const parsed = parse(data);
        try { sessionStorage.setItem(`github:${key}`, JSON.stringify({ at: Date.now(), data })); } catch { /* Optional cache. */ }
        return parsed;
    })();
    pending.set(key, request);
    try { return await request; } finally { pending.delete(key); }
}

function parseMerged(raw: unknown, orgPattern: RegExp): Merged {
    const data = raw as SearchResponse | null;
    const total = data?.total_count;
    if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0 || data?.incomplete_results || !Array.isArray(data?.items)) throw new Error('Invalid search');
    const latest: PullRequest[] = (data.items as SearchItem[]).flatMap((item) => {
        const match = orgPattern.exec(item?.repository_url ?? '');
        const at = item?.pull_request?.merged_at ?? '';
        if (!match || !Number.isFinite(Date.parse(at)) || typeof item.title !== 'string' || typeof item.number !== 'number' || !Number.isSafeInteger(item.number)) return [];
        const repository = `${match[1]}/${match[2]}`;
        if (item.html_url?.toLowerCase() !== `https://github.com/${repository}/pull/${item.number}`.toLowerCase()) return [];
        return [{ title: item.title, repository, number: item.number, url: item.html_url, mergedAt: at }];
    }).sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
    return { total, latest };
}

function parseEvents(raw: unknown): Activity[] {
    if (!Array.isArray(raw)) throw new Error('Invalid events');
    return (raw as PublicEvent[]).flatMap((event) => {
        if (!event?.repo?.name || !event.created_at || !Number.isFinite(Date.parse(event.created_at))) return [];
        const p = event.payload ?? {};
        let type: string | undefined;
        switch (event.type) {
            case 'PushEvent': type = 'CommitsPushed'; break;
            case 'PullRequestEvent': if (p.action === 'closed' && p.pull_request?.merged) type = 'PullRequestMerged'; break;
            case 'CreateEvent': type = p.ref_type === 'branch' ? 'BranchCreated' : p.ref_type === 'tag' ? 'TagCreated' : undefined; break;
            case 'ReleaseEvent': if (p.action === 'published') type = 'ReleasePublished'; break;
            case 'IssuesEvent': type = p.action === 'opened' ? 'IssueOpened' : p.action === 'closed' ? 'IssueClosed' : undefined; break;
            case 'IssueCommentEvent': if (p.action === 'created') type = 'CommentAdded'; break;
            case 'PullRequestReviewEvent': if (p.action === 'submitted') type = 'ReviewSubmitted'; break;
        }
        return type ? [{ type, repo: event.repo.name, at: event.created_at }] : [];
    }).sort((a: Activity, b: Activity) => b.at.localeCompare(a.at));
}

function renderMerged(data: Merged): void {
    const fmt = new Intl.NumberFormat('en-US');
    document.querySelectorAll<HTMLElement>('[data-merged-prs]').forEach((el) => {
        const kind = el.dataset['mergedPrs'];
        el.dataset['live'] = 'true'; // Supersede any snapshot count-up animation.
        el.textContent = fmt.format(kind === 'exact' || data.total < 100 ? data.total : Math.floor(data.total / 100) * 100) + (kind === 'floor' && data.total >= 100 ? '+' : '');
    });
    document.querySelectorAll('[data-pr-status]').forEach((el) => { el.textContent = 'live'; });
    const list = document.querySelector('[data-pr-feed]');
    const template = document.querySelector<HTMLTemplateElement>('[data-pr-template]');
    if (!list || !template || !data.latest.length) return;
    const rows = data.latest.slice(0, 8).map((pr, i) => {
        const row = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
        row.style.setProperty('--i', String(i));
        const set = (selector: string, text: string) => { row.querySelector(selector)!.textContent = text; };
        row.querySelector('a')!.href = pr.url;
        set('[data-pr-head]', i === 0 ? 'HEAD' : `HEAD~${i}`);
        set('[data-pr-repo]', pr.repository);
        set('[data-pr-number]', `#${pr.number}`);
        set('[data-pr-title]', pr.title);
        const time = row.querySelector('time')!;
        time.dateTime = pr.mergedAt;
        time.textContent = relativeTime(pr.mergedAt);
        return row;
    });
    list.replaceChildren(...rows);
}

onPageLoad(() => {
    const cast = readClientCast();
    if (!document.querySelector('[data-hero]') || !cast) return;
    const login = encodeURIComponent(cast.login);
    const key = cast.login.toLowerCase();
    const orgs = cast.orgs;
    const orgPattern = orgPatternFor(orgs);
    let active = true;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
        if (!active || document.visibilityState !== 'visible') return;
        void cached(`${key}:merged`, `/search/issues?q=author:${login}+${orgs.map(org => `org:${encodeURIComponent(org)}`).join('+')}+is:public+is:pr+is:merged&sort=updated&order=desc&per_page=12`, (raw) => parseMerged(raw, orgPattern))
            .then((data) => {
                merged.set(key, { at: Date.now(), data });
                if (active && document.visibilityState === 'visible') renderMerged(data);
            }).catch(() => { /* Quietly keep the build-time snapshot. */ });
        void cached(`${key}:events`, `/users/${login}/events/public?per_page=30`, parseEvents)
            .then((events) => {
                if (!active || document.visibilityState !== 'visible' || !events.length) return;
                const event = events[0]!;
                const el = document.querySelector('[data-public-event]');
                if (el) {
                    el.textContent = `last event ${relativeTime(event.at)}`;
                    el.setAttribute('title', `${event.type} · ${event.repo} · ${event.at}`);
                }
                const status = document.querySelector('[data-event-status]');
                if (status) status.textContent = 'live';
            }).catch(() => { /* Quietly keep the career-stream position. */ });
    };
    const schedule = () => {
        if (document.visibilityState !== 'visible' || idle !== undefined || timer !== undefined) return;
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { idle = undefined; refresh(); });
        else timer = setTimeout(() => { timer = undefined; refresh(); }, 0);
    };
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
        active = false;
        document.removeEventListener('visibilitychange', schedule);
        if (idle !== undefined) window.cancelIdleCallback(idle);
        if (timer !== undefined) clearTimeout(timer);
    };
});
