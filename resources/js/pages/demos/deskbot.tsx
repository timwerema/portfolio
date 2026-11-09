import '@fontsource/press-start-2p/400';
import '@fontsource/space-grotesk/400';
import '@fontsource/space-grotesk/500';
import '@fontsource/space-grotesk/700';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pause, Play, Square } from 'lucide-react';
import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

/*
 * DEMO of an "AI agent" (task bot) for a fictional small business, Pecan Street Plumbing.
 * The robot walks between office stations (inbox, calendar, spreadsheet, files, email, owner's desk)
 * and narrates each step. Everything is scripted in the browser: no AI calls, nothing is really sent.
 * A production version would let an AI model plan the steps and call real tools (Gmail, Google Calendar, Sheets...).
 */

// Dark by default; a light look when the visitor's device is in light mode.
const C = {
    bg: 'var(--db-bg)',
    panel: 'var(--db-panel)',
    line: 'var(--db-line)',
    text: 'var(--db-text)',
    soft: 'var(--db-soft)',
    accent: 'var(--db-accent)',
    hot: 'var(--db-hot)',
    gold: 'var(--db-gold)',
    floorA: 'var(--db-floor-a)',
    floorB: 'var(--db-floor-b)',
    wood: 'var(--db-wood)',
    woodDark: 'var(--db-wood-dark)',
};
const THEME = `:root:has(.db){color-scheme:dark;--db-bg:#0d0b1a;--db-panel:#161328;--db-line:#2c2749;--db-text:#ece8ff;--db-soft:#a7a1c8;--db-accent:#7cf29c;--db-hot:#ff6b8b;--db-gold:#ffd166;--db-floor-a:#1c1838;--db-floor-b:#211c42;--db-wood:#6b4f3a;--db-wood-dark:#46331f}
@media (prefers-color-scheme: light){:root:has(.db){color-scheme:light;--db-bg:#f6f3ea;--db-panel:#ffffff;--db-line:#ddd5c2;--db-text:#1d1a2e;--db-soft:#5d5874;--db-accent:#0f8a57;--db-hot:#d23a5a;--db-gold:#a86b12;--db-floor-a:#efe6d2;--db-floor-b:#e6dbc2;--db-wood:#b98a5e;--db-wood-dark:#8a6440}}
@keyframes db-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
.db-bob{animation:db-bob 1.2s steps(2) infinite}
@keyframes db-glow{0%,100%{opacity:1}50%{opacity:.45}}
.db-glow{animation:db-glow .6s steps(2) infinite}
@media (prefers-reduced-motion: reduce){.db-bob,.db-glow{animation:none}}`;
const pixel: CSSProperties = { fontFamily: "'Press Start 2P', ui-monospace, monospace", lineHeight: 1.5 };

/* ---------------------------------------------------------------- office map */

const COLS = 16;
const ROWS = 10;
const T = 32;

type StationId = 'inbox' | 'calendar' | 'sheet' | 'files' | 'email' | 'owner' | 'dock';
type Station = { label: string; desk: [number, number, number, number]; stand: [number, number] };
const STATIONS: Record<StationId, Station> = {
    inbox: { label: 'Inbox', desk: [1, 1, 3, 1], stand: [2, 2] },
    calendar: { label: 'Calendar', desk: [6, 1, 3, 1], stand: [7, 2] },
    sheet: { label: 'Spreadsheet', desk: [11, 1, 3, 1], stand: [12, 2] },
    files: { label: 'Files', desk: [14, 4, 1, 3], stand: [13, 5] },
    email: { label: 'Email', desk: [1, 8, 3, 1], stand: [2, 7] },
    owner: { label: 'Owner', desk: [11, 8, 3, 1], stand: [12, 7] },
    dock: { label: 'Charger', desk: [7, 8, 2, 1], stand: [7, 7] },
};
const PLANTS: [number, number][] = [
    [4, 4],
    [11, 4],
    [0, 5],
];
const TABLE: [number, number, number, number] = [6, 4, 4, 2];

const BLOCKED = new Set<string>();
for (const [x, y, w, h] of [
    ...Object.values(STATIONS).map((s) => s.desk),
    TABLE,
    ...PLANTS.map(([x, y]) => [x, y, 1, 1] as [number, number, number, number]),
])
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) BLOCKED.add(`${x + dx},${y + dy}`);

/** Shortest walk on the office grid (breadth-first search). Returns the tiles after `from`, ending at `to`. */
function route(from: [number, number], to: [number, number]): [number, number][] {
    const key = (p: [number, number]) => `${p[0]},${p[1]}`;
    const prev = new Map<string, string | null>([[key(from), null]]);
    const queue: [number, number][] = [from];
    while (queue.length) {
        const cur = queue.shift()!;
        if (cur[0] === to[0] && cur[1] === to[1]) break;
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            const n: [number, number] = [cur[0] + dx, cur[1] + dy];
            if (n[0] < 0 || n[1] < 0 || n[0] >= COLS || n[1] >= ROWS || BLOCKED.has(key(n)) || prev.has(key(n))) continue;
            prev.set(key(n), key(cur));
            queue.push(n);
        }
    }
    const out: [number, number][] = [];
    let k: string | null | undefined = key(to);
    while (k && k !== key(from)) {
        const [x, y] = k.split(',').map(Number);
        out.unshift([x, y]);
        k = prev.get(k);
    }
    return out;
}

/* ---------------------------------------------------------------- robot sprite */

const BODY = [
    '       aa       ',
    '       kk       ',
    '  kkkkkkkkkkkk  ',
    ' kwwwwwwwwwwwwk ',
    ' kwkkkkkkkkkkwk ',
    ' kwkssssssssKwk ',
    ' kwkssceesscKwk ',
    ' kwkssssssssKwk ',
    ' kwksssmmsssKwk ',
    ' kwkkkkkkkkkkwk ',
    ' kwwwwwwwwwwwwk ',
    '  kkkkkkkkkkkk  ',
    '   kgwwggwwgk   ',
    '  kgwwwppwwwgk  ',
    '   kkkkkkkkkk   ',
];
const LEGS = ['    kk    kk    ', '     kk  kk     '];
const PALETTE: Record<string, string> = {
    a: '#ffd166',
    k: '#17142a',
    K: '#17142a',
    w: '#ece9f7',
    s: '#10202c',
    c: '#7cf29c',
    e: '#10202c',
    m: '#7cf29c',
    g: '#9a95b4',
    p: '#ff6b8b',
};

function Robot({ frame, facing, blink }: { frame: number; facing: 1 | -1; blink: boolean }) {
    const rows = [...BODY, LEGS[frame % 2]];
    return (
        <g transform={facing === -1 ? 'translate(32 0) scale(-2 2)' : 'scale(2)'} shapeRendering="crispEdges">
            {rows.flatMap((row, y) =>
                [...row].map((ch, x) => {
                    if (ch === ' ') return null;
                    const fill = blink && ch === 'c' ? PALETTE.s : ch === 'e' ? PALETTE.s : PALETTE[ch];
                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
                }),
            )}
        </g>
    );
}

/* ---------------------------------------------------------------- business data (fictional) */

const DAY = 86400000;
const today = new Date();
const dateIn = (days: number) =>
    new Date(today.getTime() + days * DAY).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const money = (n: number) => `$${n.toLocaleString()}`;

const INVOICES = [
    { no: '#1039', client: 'Riverside Apartments', amount: 2350, due: -20, paid: true },
    { no: '#1041', client: 'Hernandez residence', amount: 420, due: -12, paid: false },
    { no: '#1044', client: 'Oak Lawn Dental', amount: 1180, due: -5, paid: false },
    { no: '#1046', client: 'Kim family', amount: 260, due: 3, paid: false },
    { no: '#1047', client: 'Patel residence', amount: 610, due: -19, paid: false },
];
const OVERDUE = INVOICES.filter((i) => !i.paid && i.due < 0);

type Tone = 'hot' | 'ok' | 'muted' | undefined;
type Screen = { title: string; rows: { text: string; tone?: Tone }[] };
type Output = { kind: 'Email' | 'Calendar' | 'Note' | 'Sheet'; title: string; body: string };
type Step =
    | { kind: 'think'; text: string }
    | { kind: 'go'; to: StationId }
    | { kind: 'tool'; at: StationId; action: string; result: string; screen: Screen }
    | { kind: 'approve'; question: string; yes: string; no: string; onYes: Step[]; onNo: Step[] }
    | { kind: 'output'; item: Output }
    | { kind: 'done'; text: string };

type TaskId = 'invoices' | 'booking' | 'summary' | 'questions' | 'supplies' | 'reviews' | 'reschedule';
const TASKS: { id: TaskId; label: string; prompt: string }[] = [
    { id: 'invoices', label: 'Chase overdue invoices', prompt: 'Find overdue invoices and send friendly reminders.' },
    { id: 'booking', label: 'Book new job requests', prompt: "Book this week's new service requests." },
    { id: 'summary', label: 'Weekly summary', prompt: 'Write my weekly summary.' },
    { id: 'questions', label: 'Answer customer emails', prompt: 'Answer the customer questions in the inbox.' },
    { id: 'supplies', label: 'Order supplies', prompt: "Reorder whatever parts we're running low on." },
    { id: 'reviews', label: 'Ask for reviews', prompt: "Ask this week's happy customers to leave us a review." },
    { id: 'reschedule', label: 'Tech called in sick', prompt: "Marco called in sick. Sort out today's jobs." },
];

function script(id: TaskId): Step[] {
    if (id === 'invoices') {
        const [handled, ...chase] = [...OVERDUE].sort((a) => (a.client.startsWith('Hernandez') ? -1 : 1));
        const total = OVERDUE.reduce((s, i) => s + i.amount, 0);
        const reminders: Step[] = chase.map((i) => ({
            kind: 'output',
            item: {
                kind: 'Email',
                title: `To ${i.client}: Invoice ${i.no} reminder`,
                body: `Hi! Just a friendly reminder that invoice ${i.no} for ${money(i.amount)} was due ${-i.due} days ago. You can pay securely here: [pay link]. Thanks for choosing Pecan Street Plumbing!`,
            },
        }));
        return [
            { kind: 'think', text: 'Goal: find unpaid invoices that are past due, then nudge those customers politely.' },
            { kind: 'go', to: 'sheet' },
            {
                kind: 'tool',
                at: 'sheet',
                action: 'Open invoices sheet · filter unpaid + past due',
                result: `${OVERDUE.length} overdue invoices · ${money(total)} total`,
                screen: {
                    title: 'invoices.xlsx',
                    rows: INVOICES.map((i) => ({
                        text: `${i.no}  ${i.client.padEnd(21)} ${money(i.amount).padStart(7)}  ${i.paid ? 'paid' : i.due < 0 ? `${-i.due}d late` : `due ${dateIn(i.due)}`}`,
                        tone: i.paid ? 'muted' : i.due < 0 ? 'hot' : undefined,
                    })),
                },
            },
            { kind: 'think', text: 'Before emailing anyone, check whether they already replied about paying.' },
            { kind: 'go', to: 'inbox' },
            {
                kind: 'tool',
                at: 'inbox',
                action: `Search inbox for ${OVERDUE.map((i) => i.no).join(', ')}`,
                result: `${handled.client} already replied: check mailed Monday. Skip them.`,
                screen: {
                    title: 'Inbox · search results',
                    rows: [
                        { text: `RE: Invoice ${handled.no}: "Mailed a check Monday!"`, tone: 'ok' },
                        { text: `No replies about ${chase.map((i) => i.no).join(' or ')}`, tone: 'hot' },
                    ],
                },
            },
            { kind: 'go', to: 'email' },
            {
                kind: 'tool',
                at: 'email',
                action: `Draft ${chase.length} friendly reminders with a pay link`,
                result: `${chase.length} drafts ready`,
                screen: { title: 'Drafts', rows: chase.map((i) => ({ text: `To: ${i.client} · ${i.no} · ${money(i.amount)}` })) },
            },
            {
                kind: 'approve',
                question: `Send ${chase.length} reminder emails now?`,
                yes: 'Send them',
                no: 'Keep as drafts',
                onYes: [...reminders, { kind: 'think', text: `Sent ${chase.length} reminders.` }],
                onNo: [{ kind: 'think', text: 'Okay, leaving them in Drafts for you to review.' }],
            },
            { kind: 'go', to: 'calendar' },
            {
                kind: 'tool',
                at: 'calendar',
                action: 'Add a follow-up reminder',
                result: `Follow-up set for ${dateIn(7)}`,
                screen: { title: 'Calendar', rows: [{ text: `${dateIn(7)} 9:00  Check overdue payments`, tone: 'ok' }] },
            },
            { kind: 'output', item: { kind: 'Calendar', title: `${dateIn(7)}, 9:00 AM`, body: 'Check whether overdue invoices were paid.' } },
            { kind: 'go', to: 'dock' },
            {
                kind: 'done',
                text: `Done: ${money(total)} overdue across ${OVERDUE.length} invoices; ${chase.length} reminders handled, 1 customer already paying, follow-up booked.`,
            },
        ];
    }
    if (id === 'booking') {
        const reqs = [
            { who: 'Alvarez', what: 'Water heater leaking', urgent: true, slot: `${dateIn(1)} 8-10 AM` },
            { who: 'Brooks', what: 'New kitchen faucet install', urgent: false, slot: `${dateIn(2)} 1-3 PM` },
            { who: 'Nguyen', what: 'Annual plumbing inspection', urgent: false, slot: `${dateIn(4)} 10-12 PM` },
        ];
        return [
            { kind: 'think', text: 'Goal: turn new service requests into booked jobs. Urgent problems go first.' },
            { kind: 'go', to: 'inbox' },
            {
                kind: 'tool',
                at: 'inbox',
                action: 'Read new service requests',
                result: `${reqs.length} requests · 1 urgent leak`,
                screen: {
                    title: 'Inbox · new requests',
                    rows: reqs.map((r) => ({ text: `${r.who}: ${r.what}${r.urgent ? '  URGENT' : ''}`, tone: r.urgent ? 'hot' : undefined })),
                },
            },
            { kind: 'go', to: 'calendar' },
            {
                kind: 'tool',
                at: 'calendar',
                action: 'Find open 2-hour slots this week',
                result: 'Found a slot for each; the leak gets the earliest one.',
                screen: { title: 'Calendar · open slots', rows: reqs.map((r) => ({ text: `${r.slot}  ${r.who}`, tone: r.urgent ? 'hot' : 'ok' })) },
            },
            {
                kind: 'approve',
                question: `Book these ${reqs.length} jobs and email the customers?`,
                yes: 'Book them',
                no: 'Not yet',
                onYes: [
                    { kind: 'go', to: 'email' },
                    {
                        kind: 'tool',
                        at: 'email',
                        action: `Send ${reqs.length} confirmations with arrival windows`,
                        result: 'Confirmations sent',
                        screen: { title: 'Sent', rows: reqs.map((r) => ({ text: `To ${r.who}: see you ${r.slot}`, tone: 'ok' })) },
                    },
                    ...reqs.map((r): Step => ({ kind: 'output', item: { kind: 'Calendar', title: r.slot, body: `${r.who}: ${r.what}` } })),
                    { kind: 'go', to: 'sheet' },
                    {
                        kind: 'tool',
                        at: 'sheet',
                        action: 'Log the jobs in the jobs sheet',
                        result: `${reqs.length} rows added`,
                        screen: { title: 'jobs.xlsx', rows: reqs.map((r) => ({ text: `${r.slot}  ${r.who}  ${r.what}` })) },
                    },
                    { kind: 'output', item: { kind: 'Sheet', title: 'jobs.xlsx', body: `${reqs.length} new jobs logged.` } },
                ],
                onNo: [{ kind: 'think', text: 'Holding the slots for an hour so nobody else takes them. Nothing was booked.' }],
            },
            { kind: 'go', to: 'dock' },
            { kind: 'done', text: 'Done: requests sorted by urgency, matched to open slots, and confirmed (if you approved).' },
        ];
    }
    if (id === 'supplies') {
        const low = [
            { part: '1/2" copper elbows', have: 6, min: 25, order: 50, a: 1.1, b: 0.95 },
            { part: 'Wax toilet rings', have: 2, min: 10, order: 20, a: 3.4, b: 3.9 },
            { part: '40-gal water heater', have: 0, min: 1, order: 2, a: 589, b: 612 },
        ];
        const pick = low.map((l) => ({ ...l, supplier: l.a <= l.b ? 'Trinity Supply' : 'Metro Plumbing Parts', price: Math.min(l.a, l.b) }));
        const total = pick.reduce((s, l) => s + l.price * l.order, 0);
        const usd = (n: number) => `$${n.toFixed(2)}`;
        return [
            { kind: 'think', text: 'Goal: restock anything below its minimum, at the best price, without overspending.' },
            { kind: 'go', to: 'sheet' },
            {
                kind: 'tool',
                at: 'sheet',
                action: 'Check the inventory sheet against minimums',
                result: `${low.length} items below minimum`,
                screen: {
                    title: 'inventory.xlsx',
                    rows: [
                        ...low.map((l) => ({ text: `${l.part.padEnd(22)} have ${String(l.have).padStart(2)} / min ${l.min}`, tone: 'hot' as Tone })),
                        { text: `${'PEX tubing, 100 ft'.padEnd(22)} have 12 / min 4`, tone: 'muted' },
                    ],
                },
            },
            { kind: 'go', to: 'files' },
            {
                kind: 'tool',
                at: 'files',
                action: 'Compare prices from our two suppliers',
                result: `Cheapest picked per item · ${usd(total)} total`,
                screen: {
                    title: 'supplier-prices.pdf',
                    rows: pick.map((l) => ({
                        text: `${l.part.padEnd(22)} ${usd(l.a).padStart(8)} vs ${usd(l.b).padStart(8)}  → ${l.supplier}`,
                        tone: 'ok' as Tone,
                    })),
                },
            },
            { kind: 'think', text: `Total is ${usd(total)}. Anything over $500 needs the owner's OK, so I'll ask first.` },
            {
                kind: 'approve',
                question: `Place orders for ${usd(total)}?`,
                yes: 'Place orders',
                no: 'Hold off',
                onYes: [
                    { kind: 'go', to: 'email' },
                    {
                        kind: 'tool',
                        at: 'email',
                        action: 'Email purchase orders to each supplier',
                        result: '2 purchase orders sent',
                        screen: { title: 'Sent', rows: pick.map((l) => ({ text: `PO → ${l.supplier}: ${l.order} × ${l.part}`, tone: 'ok' })) },
                    },
                    ...['Trinity Supply', 'Metro Plumbing Parts'].map(
                        (sup): Step => ({
                            kind: 'output',
                            item: {
                                kind: 'Email',
                                title: `Purchase order to ${sup}`,
                                body: pick
                                    .filter((l) => l.supplier === sup)
                                    .map((l) => `${l.order} × ${l.part} @ ${usd(l.price)}`)
                                    .join('; '),
                            },
                        }),
                    ),
                    { kind: 'go', to: 'calendar' },
                    {
                        kind: 'tool',
                        at: 'calendar',
                        action: 'Add the expected delivery',
                        result: `Delivery expected ${dateIn(3)}`,
                        screen: { title: 'Calendar', rows: [{ text: `${dateIn(3)}  Parts delivery (2 boxes)`, tone: 'ok' }] },
                    },
                    {
                        kind: 'output',
                        item: { kind: 'Calendar', title: dateIn(3), body: 'Parts delivery from Trinity Supply and Metro Plumbing Parts.' },
                    },
                ],
                onNo: [{ kind: 'think', text: 'No orders placed. I saved the list so you can review it.' }],
            },
            { kind: 'go', to: 'dock' },
            { kind: 'done', text: 'Done: low stock found, cheapest supplier picked for each part, orders placed only with your OK.' },
        ];
    }
    if (id === 'reviews') {
        const jobs = [
            { who: 'Alvarez', note: 'Replied "Thank you, fast work!"', happy: true },
            { who: 'Brooks', note: 'Paid, no issues', happy: true },
            { who: 'Okafor', note: 'Complained about a late arrival', happy: false },
            { who: 'Nguyen', note: 'Paid, no issues', happy: true },
        ];
        const happy = jobs.filter((j) => j.happy);
        return [
            { kind: 'think', text: "Goal: ask this week's satisfied customers for an honest review. Never ask someone with an open complaint." },
            { kind: 'go', to: 'calendar' },
            {
                kind: 'tool',
                at: 'calendar',
                action: 'List jobs finished this week',
                result: `${jobs.length} finished jobs`,
                screen: { title: 'Calendar · completed', rows: jobs.map((j) => ({ text: `${j.who}: job complete` })) },
            },
            { kind: 'go', to: 'inbox' },
            {
                kind: 'tool',
                at: 'inbox',
                action: 'Check each customer for complaints',
                result: `${happy.length} happy · 1 open complaint (Okafor)`,
                screen: { title: 'Inbox · by customer', rows: jobs.map((j) => ({ text: `${j.who}: ${j.note}`, tone: j.happy ? 'ok' : 'hot' })) },
            },
            { kind: 'think', text: 'Skip Okafor. Fix the complaint first: I will flag it for the owner instead.' },
            { kind: 'go', to: 'email' },
            {
                kind: 'tool',
                at: 'email',
                action: `Draft ${happy.length} short review requests`,
                result: `${happy.length} drafts ready`,
                screen: { title: 'Drafts', rows: happy.map((j) => ({ text: `To ${j.who}: "Mind sharing a quick review?"` })) },
            },
            {
                kind: 'approve',
                question: `Send ${happy.length} review requests?`,
                yes: 'Send',
                no: 'Keep as drafts',
                onYes: happy.map(
                    (j): Step => ({
                        kind: 'output',
                        item: {
                            kind: 'Email',
                            title: `To ${j.who}: How did we do?`,
                            body: 'Thanks for choosing Pecan Street Plumbing! If you have a minute, an honest review helps other neighbors find us: [review link]. Any problems? Just reply and we will make it right.',
                        },
                    }),
                ),
                onNo: [{ kind: 'think', text: 'Okay, the requests stay in Drafts.' }],
            },
            { kind: 'go', to: 'owner' },
            {
                kind: 'tool',
                at: 'owner',
                action: 'Flag the Okafor complaint',
                result: "Complaint is on the owner's desk",
                screen: { title: 'Needs you', rows: [{ text: 'Okafor: late arrival. Call to apologize?', tone: 'hot' }] },
            },
            {
                kind: 'output',
                item: {
                    kind: 'Note',
                    title: 'Follow up: Okafor',
                    body: 'Customer was unhappy about a late arrival. A quick call or a small discount would help.',
                },
            },
            { kind: 'go', to: 'dock' },
            { kind: 'done', text: 'Done: review requests only went to happy customers; the complaint went to a human.' },
        ];
    }
    if (id === 'reschedule') {
        const today2 = [
            { time: '9-11 AM', who: 'Garcia', what: 'Clogged drain', urgent: false },
            { time: '12-2 PM', who: 'Lee', what: 'Burst pipe under sink', urgent: true },
            { time: '3-5 PM', who: 'Shah', what: 'Install dishwasher line', urgent: false },
        ];
        return [
            { kind: 'think', text: "Goal: cover Marco's jobs today. Emergencies stay today; routine jobs can move." },
            { kind: 'go', to: 'calendar' },
            {
                kind: 'tool',
                at: 'calendar',
                action: "Open Marco's schedule and Dee's open time",
                result: '3 jobs for Marco · Dee is free 12-2 PM',
                screen: {
                    title: 'Calendar · today',
                    rows: [
                        ...today2.map((j) => ({ text: `Marco ${j.time}  ${j.who}: ${j.what}`, tone: (j.urgent ? 'hot' : undefined) as Tone })),
                        { text: 'Dee   12-2 PM  open', tone: 'ok' },
                    ],
                },
            },
            { kind: 'think', text: "Lee's burst pipe can't wait: give it to Dee at noon. Move Garcia and Shah to tomorrow." },
            {
                kind: 'approve',
                question: 'Give Lee to Dee today, and move Garcia + Shah to tomorrow?',
                yes: 'Do it',
                no: 'I will handle it',
                onYes: [
                    {
                        kind: 'tool',
                        at: 'calendar',
                        action: 'Update the schedule',
                        result: 'Schedule updated',
                        screen: {
                            title: 'Calendar · updated',
                            rows: [
                                { text: 'Dee   today 12-2 PM  Lee: Burst pipe', tone: 'hot' },
                                { text: `Marco ${dateIn(1)} 9-11 AM  Garcia`, tone: 'ok' },
                                { text: `Marco ${dateIn(1)} 3-5 PM  Shah`, tone: 'ok' },
                            ],
                        },
                    },
                    { kind: 'go', to: 'email' },
                    {
                        kind: 'tool',
                        at: 'email',
                        action: 'Text and email the 3 customers',
                        result: '3 customers told',
                        screen: {
                            title: 'Sent',
                            rows: [
                                { text: 'Lee: "Dee is on the way, noon to 2."', tone: 'ok' },
                                { text: `Garcia: "Moved to ${dateIn(1)}, 9-11. Sorry!"`, tone: 'ok' },
                                { text: `Shah: "Moved to ${dateIn(1)}, 3-5. Sorry!"`, tone: 'ok' },
                            ],
                        },
                    },
                    ...[...today2]
                        .sort((x, y) => Number(y.urgent) - Number(x.urgent))
                        .map(
                            (j): Step => ({
                                kind: 'output',
                                item: j.urgent
                                    ? { kind: 'Calendar', title: 'Today, 12-2 PM (Dee)', body: `${j.who}: ${j.what}` }
                                    : {
                                          kind: 'Calendar',
                                          title: `${dateIn(1)}, ${j.time} (Marco)`,
                                          body: `${j.who}: ${j.what} (moved, customer told)`,
                                      },
                            }),
                        ),
                ],
                onNo: [{ kind: 'think', text: 'Okay, I left the schedule as it is.' }],
            },
            { kind: 'go', to: 'owner' },
            {
                kind: 'output',
                item: {
                    kind: 'Note',
                    title: 'Marco out sick',
                    body: 'Emergency covered by Dee today; 2 routine jobs moved to tomorrow and customers notified.',
                },
            },
            { kind: 'go', to: 'dock' },
            { kind: 'done', text: 'Done: the emergency is still covered today and nobody is left waiting without a heads-up.' },
        ];
    }
    if (id === 'summary') {
        const paid = INVOICES.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0) + 3870;
        return [
            { kind: 'think', text: 'Goal: a short weekly summary the owner can read in one minute.' },
            { kind: 'go', to: 'sheet' },
            {
                kind: 'tool',
                at: 'sheet',
                action: 'Add up payments and open invoices',
                result: `${money(paid)} collected · ${money(OVERDUE.reduce((s, i) => s + i.amount, 0))} overdue`,
                screen: {
                    title: 'invoices.xlsx · this week',
                    rows: [
                        { text: `Collected       ${money(paid)}`, tone: 'ok' },
                        { text: `Overdue         ${money(OVERDUE.reduce((s, i) => s + i.amount, 0))}`, tone: 'hot' },
                    ],
                },
            },
            { kind: 'go', to: 'calendar' },
            {
                kind: 'tool',
                at: 'calendar',
                action: 'Count jobs done and booked',
                result: '11 jobs done · 9 booked next week',
                screen: {
                    title: 'Calendar',
                    rows: [
                        { text: 'Completed this week  11', tone: 'ok' },
                        { text: 'Booked next week      9' },
                        { text: 'Open slots next week  6', tone: 'muted' },
                    ],
                },
            },
            { kind: 'go', to: 'inbox' },
            {
                kind: 'tool',
                at: 'inbox',
                action: 'Scan the inbox for anything needing the owner',
                result: '4 new requests · 1 billing question to answer',
                screen: {
                    title: 'Inbox · needs attention',
                    rows: [{ text: '4 new service requests' }, { text: '1 billing question (Oak Lawn Dental)', tone: 'hot' }],
                },
            },
            { kind: 'go', to: 'files' },
            {
                kind: 'tool',
                at: 'files',
                action: 'Write the summary',
                result: 'weekly-summary.pdf saved',
                screen: { title: 'Files', rows: [{ text: 'weekly-summary.pdf', tone: 'ok' }] },
            },
            { kind: 'go', to: 'owner' },
            {
                kind: 'output',
                item: {
                    kind: 'Note',
                    title: 'Weekly summary',
                    body: `Collected ${money(paid)}. 11 jobs done, 9 booked next week (6 open slots, worth a promo?). ${OVERDUE.length} invoices overdue. 4 new requests and 1 billing question waiting.`,
                },
            },
            { kind: 'go', to: 'dock' },
            { kind: 'done', text: "Done: summary is on the owner's desk." },
        ];
    }
    return [
        { kind: 'think', text: 'Goal: answer simple customer questions from our FAQ, and hand anything risky to a human.' },
        { kind: 'go', to: 'inbox' },
        {
            kind: 'tool',
            at: 'inbox',
            action: 'Read unanswered customer emails',
            result: '3 questions · 1 sounds like a safety issue',
            screen: {
                title: 'Inbox · unanswered',
                rows: [
                    { text: 'Do you charge for estimates?' },
                    { text: 'Do you work on Saturdays?' },
                    { text: 'I smell gas near my water heater', tone: 'hot' },
                ],
            },
        },
        { kind: 'go', to: 'files' },
        {
            kind: 'tool',
            at: 'files',
            action: 'Look up the FAQ and price list',
            result: 'Estimates: free · Saturdays: 8 AM to 2 PM',
            screen: {
                title: 'faq.docx',
                rows: [
                    { text: 'Estimates are free in our service area', tone: 'ok' },
                    { text: 'Hours: Mon-Fri 7-6, Sat 8-2', tone: 'ok' },
                ],
            },
        },
        { kind: 'think', text: 'A gas smell is an emergency. I will not handle that alone: flag it for the owner right away.' },
        { kind: 'go', to: 'email' },
        {
            kind: 'tool',
            at: 'email',
            action: 'Draft 2 replies from the FAQ',
            result: '2 drafts ready',
            screen: { title: 'Drafts', rows: [{ text: 'RE: estimates: "Yes, free!"' }, { text: 'RE: Saturdays: "8 AM to 2 PM"' }] },
        },
        {
            kind: 'approve',
            question: 'Send the 2 FAQ replies?',
            yes: 'Send',
            no: 'Keep as drafts',
            onYes: [
                {
                    kind: 'output',
                    item: {
                        kind: 'Email',
                        title: 'RE: Do you charge for estimates?',
                        body: 'Good news: estimates are free anywhere in our service area. Want us to book one?',
                    },
                },
                {
                    kind: 'output',
                    item: {
                        kind: 'Email',
                        title: 'RE: Do you work on Saturdays?',
                        body: 'Yes, Saturdays from 8 AM to 2 PM. Reply with a time that works and we will hold it for you.',
                    },
                },
            ],
            onNo: [{ kind: 'think', text: 'Okay, leaving both replies in Drafts.' }],
        },
        { kind: 'go', to: 'owner' },
        {
            kind: 'tool',
            at: 'owner',
            action: 'Flag the gas-smell email as URGENT',
            result: "On the owner's desk and texted to their phone",
            screen: { title: 'Urgent', rows: [{ text: 'Customer reports gas smell: call them now', tone: 'hot' }] },
        },
        {
            kind: 'output',
            item: { kind: 'Note', title: 'URGENT: gas smell reported', body: 'A customer smells gas near their water heater. Call them back now.' },
        },
        { kind: 'go', to: 'dock' },
        { kind: 'done', text: 'Done: 2 easy questions answered, 1 safety issue sent straight to a human.' },
    ];
}

function matchTask(text: string): TaskId | null {
    const s = text.toLowerCase();
    if (/invoice|overdue|unpaid|owe|payment|collect/.test(s)) return 'invoices';
    if (/sick|resched|call(ed)? (in|out)|cover|cancel/.test(s)) return 'reschedule';
    if (/suppl|stock|inventory|parts|reorder|order /.test(s)) return 'supplies';
    if (/review|rating|testimonial/.test(s)) return 'reviews';
    if (/book|schedul|appointment|request|job/.test(s)) return 'booking';
    if (/summar|report|week|numbers|how.*(doing|going)/.test(s)) return 'summary';
    if (/question|repl|answer|customer|faq|email/.test(s)) return 'questions';
    return null;
}

/* ---------------------------------------------------------------- page */

class Cancelled extends Error {}
type LogEntry = { id: number; kind: 'you' | 'think' | 'tool' | 'result' | 'ask' | 'done'; text: string };
const TILE_MS = 170;
const HOME = STATIONS.dock.stand;

export default function Deskbot() {
    const [pos, setPos] = useState<[number, number]>(HOME);
    const [facing, setFacing] = useState<1 | -1>(1);
    const [walking, setWalking] = useState(false);
    const [blink, setBlink] = useState(false);
    const [bubble, setBubble] = useState('Hi! Pick a task and watch me work.');
    const [active, setActive] = useState<StationId | null>(null);
    const [screen, setScreen] = useState<(Screen & { loading?: boolean }) | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [outputs, setOutputs] = useState<Output[]>([]);
    const [pending, setPending] = useState<{ question: string; yes: string; no: string } | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [custom, setCustom] = useState('');

    const runRef = useRef(0);
    const pausedRef = useRef(false);
    const speedRef = useRef(1);
    const posRef = useRef<[number, number]>(HOME);
    const answerRef = useRef<((yes: boolean) => void) | null>(null);
    const logId = useRef(0);
    const logEnd = useRef<HTMLOListElement>(null);

    useEffect(() => {
        const t = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 160);
        }, 3200);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const el = logEnd.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [log, pending]);

    const add = (kind: LogEntry['kind'], text: string) => setLog((l) => [...l, { id: ++logId.current, kind, text }]);

    const wait = async (ms: number, id: number) => {
        let left = ms;
        while (left > 0) {
            if (runRef.current !== id) throw new Cancelled();
            if (pausedRef.current) {
                await new Promise((r) => setTimeout(r, 100));
                continue;
            }
            const d = Math.min(50, left);
            await new Promise((r) => setTimeout(r, d / speedRef.current));
            left -= d;
        }
        if (runRef.current !== id) throw new Cancelled();
    };

    const walkTo = async (to: StationId, id: number) => {
        const path = route(posRef.current, STATIONS[to].stand);
        setActive(null);
        setWalking(true);
        for (const p of path) {
            if (p[0] !== posRef.current[0]) setFacing(p[0] > posRef.current[0] ? 1 : -1);
            posRef.current = p;
            setPos(p);
            await wait(TILE_MS, id);
        }
        setWalking(false);
    };

    const execute = async (steps: Step[], id: number): Promise<void> => {
        for (const s of steps) {
            if (s.kind === 'think') {
                add('think', s.text);
                setBubble(s.text);
                await wait(1500, id);
            } else if (s.kind === 'go') {
                setBubble(`Heading to ${STATIONS[s.to].label}...`);
                await walkTo(s.to, id);
            } else if (s.kind === 'tool') {
                setActive(s.at);
                add('tool', `${STATIONS[s.at].label} → ${s.action}`);
                setBubble(s.action);
                setScreen({ ...s.screen, loading: true });
                await wait(900, id);
                setScreen(s.screen);
                add('result', s.result);
                await wait(1300, id);
            } else if (s.kind === 'approve') {
                add('ask', s.question);
                setBubble(s.question);
                setPending({ question: s.question, yes: s.yes, no: s.no });
                const yes = await new Promise<boolean>((resolve) => (answerRef.current = resolve));
                answerRef.current = null;
                setPending(null);
                if (runRef.current !== id) throw new Cancelled();
                add('you', yes ? s.yes : s.no);
                await execute(yes ? s.onYes : s.onNo, id);
            } else if (s.kind === 'output') {
                setOutputs((o) => [...o, s.item]);
            } else {
                setActive(null);
                add('done', s.text);
                setBubble('All done! Want another task?');
                setStatus('done');
            }
        }
    };

    const start = async (taskId: TaskId | null, said: string) => {
        const id = ++runRef.current;
        answerRef.current?.(false);
        pausedRef.current = false;
        setPaused(false);
        setPending(null);
        setOutputs([]);
        setScreen(null);
        setLog([{ id: ++logId.current, kind: 'you', text: said }]);
        setStatus('running');
        try {
            if (!taskId) {
                add(
                    'think',
                    "I'm a demo bot, so I only know a few jobs so far. Try one of the buttons, or ask about invoices, bookings, supplies, reviews, a sick tech, a summary or customer emails.",
                );
                setBubble('I only know a few jobs in this demo. Try a button!');
                setStatus('done');
                return;
            }
            await execute(script(taskId), id);
        } catch (e) {
            if (!(e instanceof Cancelled)) throw e;
        }
    };

    const stop = () => {
        runRef.current++;
        answerRef.current?.(false);
        setPending(null);
        setWalking(false);
        setActive(null);
        setStatus('idle');
        setBubble('Stopped. Pick a task when you are ready.');
        add('done', 'Stopped by you.');
    };

    const togglePause = () => {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
    };

    const submitCustom = (e: FormEvent) => {
        e.preventDefault();
        const q = custom.trim();
        if (!q) return;
        setCustom('');
        void start(matchTask(q), q);
    };

    const tone = (t: Tone) => (t === 'hot' ? C.hot : t === 'ok' ? C.accent : t === 'muted' ? C.soft : C.text);
    const logColor: Record<LogEntry['kind'], string> = { you: C.gold, think: C.text, tool: C.accent, result: C.soft, ask: C.hot, done: C.accent };
    const logLabel: Record<LogEntry['kind'], string> = { you: 'YOU', think: 'THINK', tool: 'DO', result: 'GOT', ask: 'ASK', done: 'DONE' };
    const running = status === 'running';
    const btn =
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-2 px-4 text-sm font-bold transition-colors disabled:opacity-40';

    return (
        <>
            <Head title="Deskbot (demo)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div className="db min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div className="border-b" style={{ borderColor: C.line, background: C.panel }}>
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm sm:px-8">
                        <p>Demo AI agent for a fictional business, designed &amp; built by Timasi Werema. Scripted; nothing is really sent.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12">
                    <p className="text-[11px] tracking-wider" style={{ ...pixel, color: C.accent }}>
                        PECAN STREET PLUMBING · BACK OFFICE
                    </p>
                    <h1 className="mt-3 text-2xl sm:text-4xl" style={pixel}>
                        Meet Deskbot.
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg" style={{ color: C.soft }}>
                        An office helper that does the busywork: chasing invoices, booking jobs, answering easy emails. Watch it plan, walk to each
                        tool, and check with you before anything goes out.
                    </p>

                    {/* Task picker */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        {TASKS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => void start(t.id, t.prompt)}
                                className={btn}
                                style={{ borderColor: C.line, background: C.panel, color: C.text }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={submitCustom} className="mt-3 flex max-w-xl gap-2">
                        <label className="min-w-0 flex-1">
                            <span className="sr-only">Ask Deskbot to do something</span>
                            <input
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                placeholder="Or type a task, e.g. who still owes us money?"
                                className="min-h-11 w-full rounded-md border-2 px-3 text-base outline-none focus-visible:ring-2"
                                style={{ borderColor: C.line, background: C.panel, color: C.text }}
                            />
                        </label>
                        <button type="submit" className={btn} style={{ borderColor: 'transparent', background: C.accent, color: '#0d0b1a' }}>
                            Go
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                        {/* Office map */}
                        <div className="min-w-0 lg:flex-[3]">
                            <div className="relative overflow-hidden rounded-lg border-2" style={{ borderColor: C.line }}>
                                <svg
                                    viewBox={`0 0 ${COLS * T} ${ROWS * T}`}
                                    className="block w-full"
                                    shapeRendering="crispEdges"
                                    role="img"
                                    aria-label={`Office map. Deskbot is ${active ? `at the ${STATIONS[active].label}` : walking ? 'walking' : 'standing by'}.`}
                                >
                                    {Array.from({ length: COLS * ROWS }, (_, i) => (
                                        <rect
                                            key={i}
                                            x={(i % COLS) * T}
                                            y={Math.floor(i / COLS) * T}
                                            width={T}
                                            height={T}
                                            style={{ fill: (i % COLS) % 2 === Math.floor(i / COLS) % 2 ? C.floorA : C.floorB }}
                                        />
                                    ))}
                                    {/* meeting table + plants */}
                                    <rect
                                        x={TABLE[0] * T + 4}
                                        y={TABLE[1] * T + 6}
                                        width={TABLE[2] * T - 8}
                                        height={TABLE[3] * T - 12}
                                        style={{ fill: C.wood }}
                                    />
                                    <rect
                                        x={TABLE[0] * T + 4}
                                        y={(TABLE[1] + TABLE[3]) * T - 12}
                                        width={TABLE[2] * T - 8}
                                        height="6"
                                        style={{ fill: C.woodDark }}
                                    />
                                    {PLANTS.map(([x, y]) => (
                                        <g key={`${x}-${y}`}>
                                            <rect x={x * T + 10} y={y * T + 18} width="12" height="10" fill="#b5652b" />
                                            <rect x={x * T + 6} y={y * T + 6} width="20" height="12" fill="#3fa34d" />
                                            <rect x={x * T + 10} y={y * T + 2} width="12" height="6" fill="#5cc96a" />
                                        </g>
                                    ))}
                                    {/* desks with monitors */}
                                    {(Object.entries(STATIONS) as [StationId, Station][]).map(([sid, s]) => {
                                        const [x, y, w, h] = s.desk;
                                        const on = active === sid;
                                        return (
                                            <g key={sid}>
                                                <rect
                                                    x={x * T + 2}
                                                    y={y * T + 4}
                                                    width={w * T - 4}
                                                    height={h * T - 6}
                                                    style={{ fill: sid === 'dock' ? C.line : C.wood }}
                                                />
                                                <rect
                                                    x={x * T + 2}
                                                    y={(y + h) * T - 8}
                                                    width={w * T - 4}
                                                    height="6"
                                                    style={{ fill: sid === 'dock' ? C.soft : C.woodDark }}
                                                />
                                                {sid === 'dock' ? (
                                                    <path d={`M${x * T + 34} ${y * T + 8} l-8 10 h6 l-4 9 l10 -12 h-6 z`} style={{ fill: C.gold }} />
                                                ) : sid === 'files' ? (
                                                    [0, 1, 2].map((i) => (
                                                        <rect
                                                            key={i}
                                                            x={x * T + 6}
                                                            y={(y + i) * T + 10}
                                                            width={T - 12}
                                                            height="4"
                                                            style={{ fill: C.woodDark }}
                                                        />
                                                    ))
                                                ) : (
                                                    <g className={on ? 'db-glow' : undefined}>
                                                        <rect x={(x + w / 2) * T - 14} y={y * T + 2} width="28" height="18" fill="#17142a" />
                                                        <rect
                                                            x={(x + w / 2) * T - 11}
                                                            y={y * T + 5}
                                                            width="22"
                                                            height="12"
                                                            style={{ fill: on ? C.accent : '#2d3a4a' }}
                                                        />
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })}
                                    {/* robot */}
                                    <g
                                        style={{
                                            transform: `translate(${pos[0] * T}px, ${pos[1] * T}px)`,
                                            transition: `transform ${TILE_MS / speed}ms linear`,
                                        }}
                                    >
                                        <g className={walking ? undefined : 'db-bob'}>
                                            <Robot frame={walking ? (pos[0] + pos[1]) % 2 : 0} facing={facing} blink={blink} />
                                        </g>
                                    </g>
                                </svg>

                                {/* station labels */}
                                {(Object.entries(STATIONS) as [StationId, Station][]).map(([sid, s]) => {
                                    const [x, y, w, h] = s.desk;
                                    // Labels sit on the far side of each desk, away from where the robot stands.
                                    const above = y < ROWS / 2;
                                    return (
                                        <span
                                            key={sid}
                                            className={`pointer-events-none absolute rounded px-1 text-[9px] whitespace-nowrap sm:text-[10px] ${sid === 'files' ? '' : '-translate-x-1/2'}`}
                                            style={{
                                                ...pixel,
                                                ...(sid === 'files'
                                                    ? { right: `${(0.25 / COLS) * 100}%`, bottom: `${((ROWS - y) / ROWS) * 100}%` }
                                                    : above
                                                      ? { left: `${((x + w / 2) / COLS) * 100}%`, bottom: `${((ROWS - y) / ROWS) * 100}%` }
                                                      : { left: `${((x + w / 2) / COLS) * 100}%`, top: `${((y + h) / ROWS) * 100}%` }),
                                                background: active === sid ? C.accent : C.bg,
                                                color: active === sid ? '#0d0b1a' : C.soft,
                                                opacity: 0.92,
                                            }}
                                        >
                                            {s.label}
                                        </span>
                                    );
                                })}

                                {/* speech bubble */}
                                <div
                                    className="pointer-events-none absolute z-10 w-max max-w-[min(260px,62%)] rounded-md border-2 px-2.5 py-1.5 text-xs leading-snug font-medium sm:text-sm"
                                    style={{
                                        // Anchor the bubble so it never runs off the map: left-leaning near the left wall, right-leaning near the right.
                                        left: `${((pos[0] + 0.5) / COLS) * 100}%`,
                                        transform: `translate(${pos[0] < 5 ? -12 : pos[0] > 10 ? -88 : -50}%, -100%)`,
                                        top: `${Math.max(22, (pos[1] / ROWS) * 100)}%`,
                                        transition: `left ${TILE_MS / speed}ms linear, top ${TILE_MS / speed}ms linear`,
                                        background: C.panel,
                                        borderColor: C.text,
                                        color: C.text,
                                    }}
                                    aria-hidden="true"
                                >
                                    {bubble}
                                </div>
                            </div>

                            {pending && (
                                <div className="mt-3 rounded-lg border-2 p-4 lg:hidden" style={{ borderColor: C.hot }}>
                                    <p className="font-bold">{pending.question}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => answerRef.current?.(true)}
                                            className={btn}
                                            style={{ borderColor: 'transparent', background: C.accent, color: '#0d0b1a' }}
                                        >
                                            {pending.yes}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => answerRef.current?.(false)}
                                            className={btn}
                                            style={{ borderColor: C.line, color: C.text }}
                                        >
                                            {pending.no}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* run controls */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={togglePause}
                                    disabled={!running}
                                    className={btn}
                                    style={{ borderColor: C.line, color: C.text }}
                                >
                                    {paused ? <Play className="size-4" /> : <Pause className="size-4" />} {paused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                    type="button"
                                    onClick={stop}
                                    disabled={!running}
                                    className={btn}
                                    style={{ borderColor: C.line, color: C.text }}
                                >
                                    <Square className="size-4" /> Stop
                                </button>
                                <div role="radiogroup" aria-label="Speed" className="ml-auto flex gap-1">
                                    {[1, 2, 4].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            role="radio"
                                            aria-checked={speed === s}
                                            onClick={() => {
                                                speedRef.current = s;
                                                setSpeed(s);
                                            }}
                                            className="min-h-11 min-w-11 rounded-md border-2 px-2 text-xs"
                                            style={{ ...pixel, borderColor: speed === s ? C.accent : C.line, color: speed === s ? C.accent : C.soft }}
                                        >
                                            {s}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Screen + log */}
                        <div className="flex min-w-0 flex-col gap-4 lg:flex-[2]">
                            <section
                                aria-label="What Deskbot is looking at"
                                className="rounded-lg border-2 p-4"
                                style={{ borderColor: C.line, background: C.panel }}
                            >
                                <p className="text-[10px]" style={{ ...pixel, color: C.soft }}>
                                    SCREEN {active ? `· ${STATIONS[active].label.toUpperCase()}` : ''}
                                </p>
                                {screen ? (
                                    <div className="mt-2">
                                        <p className="font-bold">{screen.title}</p>
                                        {screen.loading ? (
                                            <p className="mt-2 text-sm" style={{ color: C.soft }}>
                                                Loading...
                                            </p>
                                        ) : (
                                            <ul className="mt-2 space-y-1 overflow-x-auto font-mono text-xs whitespace-pre sm:text-[13px]">
                                                {screen.rows.map((r, i) => (
                                                    <li key={i} style={{ color: tone(r.tone) }}>
                                                        {r.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm" style={{ color: C.soft }}>
                                        Nothing open yet.
                                    </p>
                                )}
                            </section>

                            <section
                                aria-label="Deskbot's work log"
                                className="flex min-h-0 flex-col rounded-lg border-2"
                                style={{ borderColor: C.line, background: C.panel }}
                            >
                                <p className="border-b-2 px-4 py-2 text-[10px]" style={{ ...pixel, color: C.soft, borderColor: C.line }}>
                                    WORK LOG
                                </p>
                                <ol ref={logEnd} aria-live="polite" className="max-h-80 space-y-2 overflow-y-auto px-4 py-3 text-sm">
                                    {log.length === 0 && <li style={{ color: C.soft }}>Pick a task above to start.</li>}
                                    {log.map((l) => (
                                        <li key={l.id} className="flex gap-2">
                                            <span className="w-12 shrink-0 pt-0.5 text-[9px]" style={{ ...pixel, color: logColor[l.kind] }}>
                                                {logLabel[l.kind]}
                                            </span>
                                            <span style={{ color: l.kind === 'result' ? C.soft : C.text }}>{l.text}</span>
                                        </li>
                                    ))}
                                </ol>
                                {pending && (
                                    <div className="hidden border-t-2 p-4 lg:block" style={{ borderColor: C.hot }}>
                                        <p className="font-bold">{pending.question}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => answerRef.current?.(true)}
                                                className={btn}
                                                style={{ borderColor: 'transparent', background: C.accent, color: '#0d0b1a' }}
                                            >
                                                {pending.yes}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => answerRef.current?.(false)}
                                                className={btn}
                                                style={{ borderColor: C.line, color: C.text }}
                                            >
                                                {pending.no}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Results */}
                    <section aria-labelledby="results" className="mt-10">
                        <h2 id="results" className="text-sm sm:text-base" style={pixel}>
                            WHAT DESKBOT MADE
                        </h2>
                        {outputs.length === 0 ? (
                            <p className="mt-3" style={{ color: C.soft }}>
                                Emails, calendar events and notes show up here as Deskbot finishes them.
                            </p>
                        ) : (
                            <ul className="mt-4 border-t-2" style={{ borderColor: C.line }}>
                                {outputs.map((o, i) => (
                                    <li key={i} className="flex flex-wrap gap-x-6 gap-y-1 border-b-2 py-3" style={{ borderColor: C.line }}>
                                        <span className="w-20 shrink-0 pt-1 text-[9px]" style={{ ...pixel, color: C.accent }}>
                                            {o.kind.toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-[1_1_300px]">
                                            <span className="block font-bold">{o.title}</span>
                                            <span className="block" style={{ color: C.soft }}>
                                                {o.body}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* How a real one works */}
                    <section className="mt-12 grid gap-8 border-t-2 pt-8 md:grid-cols-2" style={{ borderColor: C.line }}>
                        <div>
                            <h2 className="text-sm sm:text-base" style={pixel}>
                                HOW THE REAL ONE WORKS
                            </h2>
                            <ol className="mt-4 list-decimal space-y-2 pl-5" style={{ color: C.soft }}>
                                <li>You ask in plain English, by text, email or a button.</li>
                                <li>An AI model plans the steps and picks the right tools.</li>
                                <li>It connects to what you already use: Gmail or Outlook, Google Calendar, Sheets, QuickBooks, Square.</li>
                                <li>Anything that sends money or messages waits for your OK.</li>
                                <li>Every step is logged, so you can see exactly what it did.</li>
                            </ol>
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base" style={pixel}>
                                GOOD FIRST JOBS
                            </h2>
                            <ul className="mt-4 space-y-2" style={{ color: C.soft }}>
                                <li>Invoice reminders and payment follow-ups</li>
                                <li>Booking requests into your calendar</li>
                                <li>Answering the same five customer questions</li>
                                <li>A Monday-morning summary of your numbers</li>
                                <li>Reordering parts before you run out</li>
                                <li>Review requests, sent only to happy customers</li>
                            </ul>
                            <Link
                                href="/services/ai-agents"
                                className="mt-5 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                                style={{ color: C.text }}
                            >
                                Want a bot like this for your business? Let's talk →
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="border-t-2" style={{ borderColor: C.line }}>
                    <div className="mx-auto max-w-[1200px] px-5 py-8 text-sm sm:px-8" style={{ color: C.soft }}>
                        Pecan Street Plumbing and Deskbot are fictional. This is a portfolio demo: scripted steps, sample data, nothing is sent.
                    </div>
                </footer>
            </div>
        </>
    );
}
