import '@fontsource-variable/archivo/wght';
import '@fontsource/big-shoulders-display/800';

import { useReveal } from '@/components/motion';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, ExternalLink, RefreshCw } from 'lucide-react';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

/*
 * Rundown: game analysis for the NFL, NBA, college football and men's college basketball.
 *
 * This demo is NOT fictional. Games, lines, injuries and headlines are live, read on the server from
 * ESPN's public feeds (app/Support/Rundown/EspnFeed.php). The leans come from fixed rules in
 * app/Support/Rundown/PredictionModel.php, and the "How this works" text is built from the same numbers.
 * Nothing on this page is made up: when a feed is down the page says so instead of filling in.
 * Analysis only: no sportsbook links, no "best bets", no affiliate anything.
 */

// Dark by default; a light look when the visitor's device is in light mode.
const C = {
    bg: 'var(--rd-bg)',
    panel: 'var(--rd-panel)',
    panel2: 'var(--rd-panel2)',
    line: 'var(--rd-line)',
    text: 'var(--rd-text)',
    soft: 'var(--rd-soft)',
    hot: 'var(--rd-hot)',
    teal: 'var(--rd-teal)',
};
const THEME = `:root:has(.rd){color-scheme:dark;--rd-bg:#0b0d10;--rd-panel:#12161b;--rd-panel2:#1a2027;--rd-line:#2a333e;--rd-text:#eef2f6;--rd-soft:#a3aebb;--rd-hot:#ff8a3d;--rd-on-hot:#0b0d10;--rd-teal:#3ddbc6;--rd-live:#ff6b6b}
@media (prefers-color-scheme: light){:root:has(.rd){color-scheme:light;--rd-bg:#f4f5f7;--rd-panel:#ffffff;--rd-panel2:#e9ecf0;--rd-line:#d3d8df;--rd-text:#0e1116;--rd-soft:#4d5763;--rd-hot:#a23e06;--rd-on-hot:#ffffff;--rd-teal:#086459;--rd-live:#b3261e}}
.rd :focus-visible{outline:2px solid var(--rd-hot);outline-offset:2px;border-radius:4px}
.rd .rd-skel{animation:rd-pulse 1.4s ease-in-out infinite}
@keyframes rd-pulse{50%{opacity:.45}}
@media (prefers-reduced-motion: reduce){.rd *{animation:none!important;transition:none!important}}`;
const display: CSSProperties = {
    fontFamily: "'Big Shoulders Display', Impact, sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    lineHeight: 0.95,
};

/* ---------------------------------------------------------------- types (the server's compact shapes) */

type Team = {
    id: string;
    abbr: string;
    name: string;
    short: string;
    color: string | null;
    record: string | null;
    homeRecord: string | null;
    roadRecord: string | null;
    rank: number | null;
    score: number | null;
    winner: boolean;
};
type Odds = {
    provider: string;
    spreadHome: number | null;
    openSpreadHome: number | null;
    total: number | null;
    openTotal: number | null;
    moneyHome: string | null;
    moneyAway: string | null;
};
type Factor = { key: string; label: string; value: number; status: 'used' | 'neutral' | 'no_data'; note: string; favors: string | null };
type Confidence = 'low' | 'medium' | 'high';
type Prediction = {
    lean: { side: 'home' | 'away'; team: string; line: number } | null;
    confidence: Confidence | null;
    adjustment: number | null;
    modelLine: number | null;
    factors: Factor[];
    summary: string | null;
};
type Injury = { name: string; pos: string; status: string; comment: string; date: string | null };
type Headline = { headline: string; description: string; published: string | null; url: string | null; teamIds: string[] };
type Game = {
    id: string;
    league: string;
    start: string;
    state: 'pre' | 'in' | 'post';
    final: boolean;
    statusText: string;
    neutral: boolean;
    venue: string;
    tv: string;
    note: string;
    home: Team;
    away: Team;
    odds: Odds | null;
    prediction: Prediction;
    injuries: { home: Injury[] | null; away: Injury[] | null };
    headlines: Headline[];
};
type Graded = {
    league: string;
    matchup: string;
    lean: string;
    confidence: string;
    score: string;
    result: 'win' | 'loss' | 'push';
    savedAt: string | null;
};
type RecordSummary = { wins: number; losses: number; pushes: number; pending: number; since: string | null; recent: Graded[] };
type Board = {
    league: string;
    ok: boolean;
    updatedAt: string | null;
    lastGoodAt: string | null;
    games: Game[];
    headlines: Headline[];
    injuries: { status: 'ok' | 'not_covered' | 'unavailable'; updatedAt: string | null };
    notes: string[];
    slateNote: string;
    record: RecordSummary;
};
type League = { key: string; label: string; name: string };
type Slot = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; board: Board };
type Rule = { name: string; rule: string; max: string };

/* ---------------------------------------------------------------- formatting */

const num = (n: number) => String(Math.round(Math.abs(n) * 100) / 100);
/** A spread from one team's side: -6.5, +3, or PK. */
const line = (n: number) => (n === 0 ? 'PK' : `${n > 0 ? '+' : '-'}${num(n)}`);
/** The usual way to write a spread: favourite first ("DAL -6.5"). */
const spreadLabel = (g: Game, homeLine: number) =>
    homeLine === 0 ? "Pick'em" : homeLine < 0 ? `${g.home.abbr} ${line(homeLine)}` : `${g.away.abbr} ${line(-homeLine)}`;

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const stampFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
function dayLabel(d: Date) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const yesterday = new Date(today.getTime() - 86400000);
    const prefix =
        dayKey(d) === dayKey(today)
            ? 'Today · '
            : dayKey(d) === dayKey(tomorrow)
              ? 'Tomorrow · '
              : dayKey(d) === dayKey(yesterday)
                ? 'Yesterday · '
                : '';
    return prefix + dayFmt.format(d);
}
const stamp = (iso: string | null) => (iso ? stampFmt.format(new Date(iso)) : null);

/* ---------------------------------------------------------------- small pieces */

function Swatch({ team }: { team: Team }) {
    // A plain colour chip from the feed's team colour. No logos: those are trademarks.
    return (
        <span
            aria-hidden
            className="inline-block size-3 shrink-0 rounded-[3px] border"
            style={{ background: team.color ?? C.panel2, borderColor: C.line }}
        />
    );
}

function ConfidenceMeter({ level }: { level: Confidence }) {
    const filled = { low: 1, medium: 2, high: 3 }[level];
    return (
        <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-flex items-end gap-[2px]">
                {[1, 2, 3].map((i) => (
                    <span key={i} className="w-[4px] rounded-[1px]" style={{ height: 4 + i * 3, background: i <= filled ? C.teal : C.line }} />
                ))}
            </span>
            <span className="capitalize">{level}</span>
        </span>
    );
}

function Kicker({ children }: { children: ReactNode }) {
    return (
        <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.hot }}>
            {children}
        </p>
    );
}

function SectionHead({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
    return (
        <div data-reveal="left" className="mb-6">
            <Kicker>{kicker}</Kicker>
            <h2 id={id} className="mt-2 text-4xl sm:text-5xl" style={display}>
                {title}
            </h2>
            {children}
        </div>
    );
}

function TeamLine({ team, game, home }: { team: Team; game: Game; home: boolean }) {
    const showScore = game.state !== 'pre' && team.score !== null;
    const dim = game.final && !team.winner;
    return (
        <span className="flex min-w-0 items-center gap-2">
            <Swatch team={team} />
            <span className="min-w-0 truncate font-semibold" style={{ color: dim ? C.soft : C.text }}>
                {team.rank ? (
                    <span className="mr-1 text-xs font-bold tabular-nums" style={{ color: C.soft }}>
                        #{team.rank}
                    </span>
                ) : null}
                <span className="sm:hidden">{team.abbr}</span>
                <span className="hidden sm:inline">{team.name}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums" style={{ color: C.soft }}>
                {team.record ?? ''}
                <span className="sr-only">{home ? ' (home)' : ' (away)'}</span>
            </span>
            {showScore && <span className="ml-auto pl-2 text-lg font-bold tabular-nums">{team.score}</span>}
        </span>
    );
}

function LeanCell({ game }: { game: Game }) {
    const p = game.prediction;
    if (game.state === 'in')
        return (
            <span className="font-bold" style={{ color: 'var(--rd-live)' }}>
                Live · {game.statusText}
            </span>
        );
    if (game.state === 'post') return <span style={{ color: C.soft }}>{game.final ? 'Final' : game.statusText}</span>;
    if (game.odds?.spreadHome == null) return <span style={{ color: C.soft }}>No line posted yet</span>;
    if (!p.lean || !p.confidence) return <span style={{ color: C.soft }}>No lean</span>;
    return (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="font-bold" style={{ color: C.teal }}>
                Lean {p.lean.team} {line(p.lean.line)}
            </span>
            <span className="text-xs" style={{ color: C.soft }}>
                <ConfidenceMeter level={p.confidence} />
            </span>
        </span>
    );
}

function InjuryList({ team, list }: { team: Team; list: Injury[] }) {
    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-bold">
                <Swatch team={team} /> {team.name}
            </h4>
            {list.length === 0 ? (
                <p className="mt-2 text-sm" style={{ color: C.soft }}>
                    No players listed by the feed.
                </p>
            ) : (
                <ul className="mt-2 divide-y text-sm" style={{ borderColor: C.line }}>
                    {list.map((p, i) => (
                        <li key={i} className="py-2" style={{ borderColor: C.line }}>
                            <p className="flex flex-wrap items-baseline gap-x-2">
                                <span className="font-semibold">{p.name}</span>
                                {p.pos && (
                                    <span className="text-xs" style={{ color: C.soft }}>
                                        {p.pos}
                                    </span>
                                )}
                                <span
                                    className="ml-auto text-xs font-bold tracking-wide uppercase"
                                    style={{ color: p.status === 'Out' || p.status === 'Doubtful' ? C.hot : C.soft }}
                                >
                                    {p.status}
                                </span>
                            </p>
                            {p.comment && (
                                <p className="mt-0.5" style={{ color: C.soft }}>
                                    {p.comment}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function HeadlineRows({ items }: { items: Headline[] }) {
    return (
        <ul className="divide-y border-y" style={{ borderColor: C.line }}>
            {items.map((h, i) => (
                <li key={i} className="py-3" style={{ borderColor: C.line }}>
                    {h.url ? (
                        <a href={h.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-2 font-semibold">
                            <span className="underline-offset-4 group-hover:underline">{h.headline}</span>
                            <ExternalLink aria-hidden className="mt-1 size-3.5 shrink-0" style={{ color: C.soft }} />
                            <span className="sr-only">(opens espn.com in a new tab)</span>
                        </a>
                    ) : (
                        <p className="font-semibold">{h.headline}</p>
                    )}
                    {h.description && (
                        <p className="mt-1 text-sm" style={{ color: C.soft }}>
                            {h.description}
                        </p>
                    )}
                    {h.published && (
                        <p className="mt-1 text-xs" style={{ color: C.soft }}>
                            {stamp(h.published)}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}

function Detail({ game, injuryStatus, threshold }: { game: Game; injuryStatus: Board['injuries']['status']; threshold: number }) {
    const p = game.prediction;
    const o = game.odds;
    const label = 'text-xs font-bold tracking-wider uppercase';
    return (
        <div className="grid gap-8 px-3 pt-2 pb-8 sm:px-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div>
                {game.state === 'pre' ? (
                    <>
                        <h3 className={label} style={{ color: C.soft }}>
                            The model's read
                        </h3>
                        <p className="mt-2 text-lg font-semibold">{p.summary}</p>

                        {o && (
                            <dl
                                className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-y py-4 text-sm sm:grid-cols-4"
                                style={{ borderColor: C.line }}
                            >
                                {[
                                    ['Spread', o.spreadHome != null ? spreadLabel(game, o.spreadHome) : 'Not posted'],
                                    ['Opened', o.openSpreadHome != null ? spreadLabel(game, o.openSpreadHome) : 'Not in feed'],
                                    ['Total', o.total != null ? num(o.total) : 'Not posted'],
                                    ['Model line', p.modelLine != null ? spreadLabel(game, p.modelLine) : 'None'],
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <dt className={label} style={{ color: C.soft }}>
                                            {k}
                                        </dt>
                                        <dd className="mt-1 font-bold tabular-nums">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {o && (o.moneyHome || o.moneyAway) && (
                            <p className="mt-3 text-sm tabular-nums" style={{ color: C.soft }}>
                                Moneyline: {game.away.abbr} {o.moneyAway ?? 'off'} · {game.home.abbr} {o.moneyHome ?? 'off'}
                                {o.provider ? ` · Lines: ${o.provider}, as listed by ESPN` : ''}
                            </p>
                        )}

                        {p.factors.length > 0 && (
                            <>
                                <h3 className={`${label} mt-6`} style={{ color: C.soft }}>
                                    Every factor, in points
                                </h3>
                                <ul className="mt-2 divide-y border-y" style={{ borderColor: C.line }}>
                                    {p.factors.map((f) => (
                                        <li key={f.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3" style={{ borderColor: C.line }}>
                                            <span className="font-semibold">{f.label}</span>
                                            <span
                                                className="text-right font-bold tabular-nums"
                                                style={{ color: f.status === 'used' ? C.text : C.soft }}
                                            >
                                                {f.status === 'no_data' ? 'Not counted' : f.favors ? `${f.favors} +${num(f.value)}` : 'Even'}
                                            </span>
                                            <span className="col-span-2 mt-0.5 text-sm" style={{ color: C.soft }}>
                                                {f.note}
                                            </span>
                                        </li>
                                    ))}
                                    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3" style={{ borderColor: C.line }}>
                                        <span className="font-bold">Net adjustment</span>
                                        <span className="text-right font-bold tabular-nums" style={{ color: p.lean ? C.teal : C.text }}>
                                            {p.adjustment ? `${p.adjustment > 0 ? game.home.abbr : game.away.abbr} +${num(p.adjustment)}` : 'Even'}
                                        </span>
                                        <span className="col-span-2 mt-0.5 text-sm" style={{ color: C.soft }}>
                                            {p.lean
                                                ? `At or over the ${num(threshold)}-point bar, so the model leans ${p.lean.team} ${line(p.lean.line)}.`
                                                : `Under the ${num(threshold)}-point bar, so no lean.`}{' '}
                                            Not betting advice.
                                        </span>
                                    </li>
                                </ul>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <h3 className={label} style={{ color: C.soft }}>
                            {game.state === 'in' ? 'In progress' : 'Final score'}
                        </h3>
                        <p className="mt-2 text-lg font-semibold tabular-nums">
                            {game.away.name} {game.away.score ?? '–'}, {game.home.name} {game.home.score ?? '–'}
                            <span style={{ color: C.soft }}> · {game.statusText}</span>
                        </p>
                        <p className="mt-2 text-sm" style={{ color: C.soft }}>
                            The model only reads games that have not started. Once a game is live there is no lean, and the feed stops listing the
                            pre-game line.
                        </p>
                    </>
                )}
                <p className="mt-4 text-sm" style={{ color: C.soft }}>
                    {[game.venue && `${game.venue}${game.neutral ? ' (neutral site)' : ''}`, game.tv && `TV: ${game.tv}`, game.note]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>

            <div className="space-y-8">
                <section>
                    <h3 className={label} style={{ color: C.soft }}>
                        Injury report
                    </h3>
                    {game.injuries.home && game.injuries.away ? (
                        <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <InjuryList team={game.away} list={game.injuries.away} />
                            <InjuryList team={game.home} list={game.injuries.home} />
                        </div>
                    ) : (
                        <p className="mt-2 text-sm" style={{ color: C.soft }}>
                            {injuryStatus === 'unavailable'
                                ? 'The injury feed could not be loaded right now, so no injuries are listed or counted.'
                                : "ESPN's public injury feed has almost nothing for this league, so no injuries are listed or counted here. That does not mean everyone is healthy."}
                        </p>
                    )}
                </section>
                <section>
                    <h3 className={label} style={{ color: C.soft }}>
                        Headlines tagged to these teams
                    </h3>
                    {game.headlines.length ? (
                        <div className="mt-3">
                            <HeadlineRows items={game.headlines} />
                        </div>
                    ) : (
                        <p className="mt-2 text-sm" style={{ color: C.soft }}>
                            Nothing in the current feed is tagged to either team.
                        </p>
                    )}
                    <p className="mt-2 text-xs" style={{ color: C.soft }}>
                        Context only. The model does not read headlines or guess at their mood.
                    </p>
                </section>
            </div>
        </div>
    );
}

const FILTERS = [
    ['all', 'All'],
    ['upcoming', 'Upcoming'],
    ['leans', 'Model leans'],
    ['live', 'Live'],
    ['final', 'Final'],
] as const;
type FilterKey = (typeof FILTERS)[number][0];
const matches = (g: Game, f: FilterKey) =>
    f === 'all' ||
    (f === 'upcoming' && g.state === 'pre') ||
    (f === 'leans' && g.state === 'pre' && !!g.prediction.lean) ||
    (f === 'live' && g.state === 'in') ||
    (f === 'final' && g.state === 'post');

/* ---------------------------------------------------------------- page */

export default function Rundown({
    leagues,
    rules,
    threshold,
    record,
}: {
    leagues: League[];
    rules: Rule[];
    threshold: number;
    record: RecordSummary;
}) {
    useReveal();
    const [slots, setSlots] = useState<Record<string, Slot>>(() => Object.fromEntries(leagues.map((l) => [l.key, { status: 'loading' } as Slot])));
    const [league, setLeague] = useState(leagues[0].key);
    const [filter, setFilter] = useState<FilterKey>('all');
    const [openId, setOpenId] = useState<string | null>(null);

    const load = useCallback(async (key: string) => {
        setSlots((s) => ({ ...s, [key]: { status: 'loading' } }));
        try {
            const res = await fetch(`/demos/rundown/board/${key}`, { headers: { Accept: 'application/json' } });
            if (!res.ok)
                throw new Error(res.status === 429 ? 'Too many refreshes in a row. Give it a minute.' : `The server answered ${res.status}.`);
            const board = (await res.json()) as Board;
            setSlots((s) => ({ ...s, [key]: { status: 'ready', board } }));
        } catch (e) {
            setSlots((s) => ({ ...s, [key]: { status: 'error', message: e instanceof Error ? e.message : 'Could not reach the server.' } }));
        }
    }, []);

    useEffect(() => {
        // Open on the league in the address (?league=nba), then load all four so the tabs can show counts.
        const wanted = new URLSearchParams(window.location.search).get('league');
        if (wanted && leagues.some((l) => l.key === wanted)) setLeague(wanted);
        leagues.forEach((l) => void load(l.key));
    }, [leagues, load]);

    const pick = (key: string) => {
        setLeague(key);
        setFilter('all');
        setOpenId(null);
        window.history.replaceState(window.history.state, '', `?league=${key}#board`);
    };

    const current = leagues.find((l) => l.key === league)!;
    const slot = slots[league];
    const board = slot.status === 'ready' ? slot.board : null;
    const games = useMemo(() => board?.games ?? [], [board]);
    const shown = useMemo(() => games.filter((g) => matches(g, filter)), [games, filter]);
    const days = useMemo(() => {
        const groups: { key: string; label: string; games: Game[] }[] = [];
        for (const g of shown) {
            const d = new Date(g.start);
            const key = dayKey(d);
            const last = groups[groups.length - 1];
            if (last?.key === key) last.games.push(g);
            else groups.push({ key, label: dayLabel(d), games: [g] });
        }
        return groups;
    }, [shown]);

    const graded = record.wins + record.losses + record.pushes;
    const chip = (on: boolean): CSSProperties =>
        on ? { background: C.hot, color: 'var(--rd-on-hot)', borderColor: 'transparent' } : { borderColor: C.line, color: C.soft };
    const cols = 'lg:grid-cols-[88px_minmax(0,1fr)_120px_70px_230px_24px]';

    return (
        <>
            <Head title="Rundown: game analysis (demo)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div className="rd min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Archivo Variable', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div style={{ background: C.panel2 }}>
                    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm sm:px-8">
                        <p>Portfolio demo by Timasi Werema. Live data from ESPN's public feeds. Analysis only, not betting advice.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <header
                    className="sticky top-0 z-30 border-b backdrop-blur"
                    style={{ borderColor: C.line, background: `color-mix(in srgb, ${C.bg} 88%, transparent)` }}
                >
                    <nav
                        aria-label="Sections"
                        className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-8"
                    >
                        <a href="#top" className="flex items-center gap-2 text-3xl" style={display}>
                            <span aria-hidden className="flex h-8 items-end gap-[3px] rounded px-1.5 pb-1.5" style={{ background: C.hot }}>
                                {[8, 14, 20].map((h) => (
                                    <span key={h} className="w-[4px]" style={{ height: h, background: 'var(--rd-on-hot)' }} />
                                ))}
                            </span>
                            Rundown
                        </a>
                        <div className="-mx-2 flex gap-1 overflow-x-auto text-sm font-semibold" style={{ color: C.soft }}>
                            {[
                                ['board', 'Board'],
                                ['headlines', 'Headlines'],
                                ['record', 'Track record'],
                                ['how', 'How it works'],
                            ].map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="inline-flex min-h-11 shrink-0 items-center px-2 hover:underline">
                                    {label}
                                </a>
                            ))}
                        </div>
                    </nav>
                </header>

                <main id="top" className="mx-auto max-w-[1180px] px-5 sm:px-8">
                    {/* Hero */}
                    <section className="py-10 sm:py-14">
                        <div data-reveal="left">
                            <Kicker>NFL · NBA · College football · Men's college basketball</Kicker>
                            <h1 className="mt-3 max-w-4xl text-6xl sm:text-8xl" style={display}>
                                The line, <span style={{ color: C.hot }}>then the reasons.</span>
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg" style={{ color: C.soft }}>
                                Rundown starts from the posted point spread, then shows every adjustment a small, fixed set of rules makes for
                                injuries, rest, form and line movement. You see the lean and the working. Often the honest answer is "no lean".
                            </p>
                            <p className="mt-4 max-w-2xl text-sm" style={{ color: C.soft }}>
                                For adults 21+. This is analysis, not betting advice, and nothing here is a promise about any result. If gambling is a
                                problem for you or someone you know, call{' '}
                                <a href="tel:18004262537" className="font-bold underline underline-offset-4" style={{ color: C.text }}>
                                    1-800-GAMBLER
                                </a>
                                .
                            </p>
                        </div>
                    </section>

                    {/* Board */}
                    <section aria-labelledby="board" className="scroll-mt-20 pb-12">
                        <h2 id="board" className="sr-only">
                            Game board
                        </h2>
                        <div role="tablist" aria-label="League" className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: C.line }}>
                            {leagues.map((l) => {
                                const s = slots[l.key];
                                const on = l.key === league;
                                return (
                                    <button
                                        key={l.key}
                                        role="tab"
                                        id={`tab-${l.key}`}
                                        aria-selected={on}
                                        aria-controls="board-panel"
                                        onClick={() => pick(l.key)}
                                        className="-mb-px inline-flex min-h-12 shrink-0 items-baseline gap-2 border-b-[3px] px-3 text-2xl sm:px-5 sm:text-3xl"
                                        style={{ ...display, borderColor: on ? C.hot : 'transparent', color: on ? C.text : C.soft }}
                                    >
                                        {l.label}
                                        <span
                                            className="text-xs font-bold tabular-nums"
                                            style={{ fontFamily: "'Archivo Variable', system-ui, sans-serif", color: C.soft }}
                                        >
                                            {s.status === 'ready' ? (s.board.ok ? s.board.games.length : '!') : s.status === 'error' ? '!' : '…'}
                                            <span className="sr-only">
                                                {s.status === 'ready' && s.board.ok
                                                    ? ' games'
                                                    : s.status === 'loading'
                                                      ? ' loading'
                                                      : ' data unavailable'}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            id="board-panel"
                            role="tabpanel"
                            aria-labelledby={`tab-${league}`}
                            aria-busy={slot.status === 'loading'}
                            className="pt-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                                <div role="group" aria-label="Show" className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 py-1">
                                    {FILTERS.map(([key, label]) => {
                                        const n = games.filter((g) => matches(g, key)).length;
                                        return (
                                            <button
                                                key={key}
                                                aria-pressed={filter === key}
                                                onClick={() => setFilter(key)}
                                                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold"
                                                style={chip(filter === key)}
                                            >
                                                {label} <span className="tabular-nums opacity-80">{n}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3 text-sm" style={{ color: C.soft }}>
                                    <p aria-live="polite">
                                        {slot.status === 'loading' ? 'Loading…' : board?.ok ? `Updated ${stamp(board.updatedAt)}` : 'No current data'}
                                    </p>
                                    <button
                                        onClick={() => void load(league)}
                                        disabled={slot.status === 'loading'}
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-bold disabled:opacity-50"
                                        style={{ borderColor: C.line, color: C.text }}
                                    >
                                        <RefreshCw aria-hidden className="size-4" /> Refresh
                                    </button>
                                </div>
                            </div>

                            {board?.ok && (
                                <p className="mt-2 text-sm" style={{ color: C.soft }}>
                                    {board.slateNote} Times are in your time zone. {board.notes.join(' ')}
                                </p>
                            )}

                            {slot.status === 'loading' && (
                                <div className="mt-6 space-y-3" aria-hidden>
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="rd-skel h-16 rounded" style={{ background: C.panel }} />
                                    ))}
                                </div>
                            )}

                            {(slot.status === 'error' || (board && !board.ok)) && (
                                <div className="mt-6 border-l-4 py-5 pr-4 pl-5" style={{ borderColor: C.hot, background: C.panel }} role="status">
                                    <p className="text-2xl" style={display}>
                                        {current.label} data unavailable
                                    </p>
                                    <p className="mt-2 max-w-2xl" style={{ color: C.soft }}>
                                        {slot.status === 'error'
                                            ? `This page could not load the board. ${slot.message}`
                                            : `ESPN's public feed for ${current.name} did not answer, or sent something this page does not recognise. Nothing is shown rather than guessing.`}{' '}
                                        {board?.lastGoodAt
                                            ? `Last good update: ${stamp(board.lastGoodAt)}.`
                                            : slot.status === 'ready'
                                              ? 'No good update has been recorded yet.'
                                              : ''}
                                    </p>
                                    <button
                                        onClick={() => void load(league)}
                                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold"
                                        style={{ background: C.hot, color: 'var(--rd-on-hot)' }}
                                    >
                                        <RefreshCw aria-hidden className="size-4" /> Try again
                                    </button>
                                </div>
                            )}

                            {board?.ok && games.length === 0 && (
                                <p className="mt-6 border-y py-8 text-lg" style={{ borderColor: C.line, color: C.soft }}>
                                    No {current.name} games on the feed right now. It may be an off day or the off-season.
                                </p>
                            )}
                            {board?.ok && games.length > 0 && shown.length === 0 && (
                                <div className="mt-6 border-y py-8" style={{ borderColor: C.line }}>
                                    <p className="text-lg" style={{ color: C.soft }}>
                                        No games match "{FILTERS.find(([k]) => k === filter)![1]}" right now.
                                    </p>
                                    <button onClick={() => setFilter('all')} className="mt-2 min-h-11 font-bold underline underline-offset-4">
                                        Show all {games.length} games
                                    </button>
                                </div>
                            )}

                            {board?.ok &&
                                days.map((day) => (
                                    <div key={day.key} className="mt-8">
                                        <h3 className="text-2xl" style={display}>
                                            {day.label}
                                        </h3>
                                        <div
                                            aria-hidden
                                            className={`mt-2 hidden gap-x-4 border-b px-3 pb-2 text-xs font-bold tracking-wider uppercase lg:grid ${cols}`}
                                            style={{ borderColor: C.line, color: C.soft }}
                                        >
                                            <span>Time</span>
                                            <span>Away / home</span>
                                            <span>Spread</span>
                                            <span>Total</span>
                                            <span>Model</span>
                                            <span />
                                        </div>
                                        <ul className="border-t lg:border-t-0" style={{ borderColor: C.line }}>
                                            {day.games.map((g) => {
                                                const open = openId === g.id;
                                                const o = g.odds;
                                                return (
                                                    <li
                                                        key={g.id}
                                                        className="border-b"
                                                        style={{ borderColor: C.line, background: open ? C.panel : undefined }}
                                                    >
                                                        <button
                                                            aria-expanded={open}
                                                            aria-controls={`game-${g.id}`}
                                                            onClick={() => setOpenId(open ? null : g.id)}
                                                            className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-3.5 text-left ${cols}`}
                                                        >
                                                            <span
                                                                className="col-span-2 text-sm font-bold tabular-nums lg:col-span-1"
                                                                style={{ color: C.soft }}
                                                            >
                                                                {g.state === 'pre'
                                                                    ? timeFmt.format(new Date(g.start))
                                                                    : g.state === 'in'
                                                                      ? 'Live'
                                                                      : 'Final'}
                                                            </span>
                                                            <span className="col-span-2 grid gap-1.5 lg:col-span-1">
                                                                <TeamLine team={g.away} game={g} home={false} />
                                                                <TeamLine team={g.home} game={g} home />
                                                            </span>
                                                            <span className="text-sm tabular-nums lg:text-base">
                                                                <span className="lg:hidden" style={{ color: C.soft }}>
                                                                    Spread{' '}
                                                                </span>
                                                                <span className="font-semibold">
                                                                    {o?.spreadHome != null ? spreadLabel(g, o.spreadHome) : '–'}
                                                                </span>
                                                                <span className="lg:hidden">
                                                                    <span style={{ color: C.soft }}> · Total </span>
                                                                    <span className="font-semibold">{o?.total != null ? num(o.total) : '–'}</span>
                                                                </span>
                                                            </span>
                                                            <span className="hidden font-semibold tabular-nums lg:block">
                                                                {o?.total != null ? num(o.total) : '–'}
                                                            </span>
                                                            <span className="order-last col-span-1 text-sm lg:order-none lg:text-base">
                                                                <LeanCell game={g} />
                                                            </span>
                                                            <ChevronDown
                                                                aria-hidden
                                                                className="size-5 justify-self-end transition-transform"
                                                                style={{ color: C.soft, transform: open ? 'rotate(180deg)' : undefined }}
                                                            />
                                                            <span className="sr-only">{open ? 'Hide' : 'Show'} the breakdown</span>
                                                        </button>
                                                        {open && (
                                                            <div id={`game-${g.id}`}>
                                                                <Detail game={g} injuryStatus={board.injuries.status} threshold={threshold} />
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                        </div>
                    </section>

                    {/* Headlines */}
                    <section aria-labelledby="headlines" className="scroll-mt-20 border-t py-12" style={{ borderColor: C.line }}>
                        <SectionHead id="headlines" kicker={`${current.name} · from the feed`} title="Headlines" />
                        {board?.ok && board.headlines.length > 0 ? (
                            <div className="max-w-3xl">
                                <HeadlineRows items={board.headlines} />
                                <p className="mt-3 text-sm" style={{ color: C.soft }}>
                                    Headlines are ESPN's, shown as context. No rule in the model reads them. Injuries reach the model only through the
                                    injury report.
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: C.soft }}>
                                {slot.status === 'loading' ? 'Loading…' : `No ${current.name} headlines could be loaded right now.`}
                            </p>
                        )}
                    </section>

                    {/* Track record */}
                    <section aria-labelledby="record" className="scroll-mt-20 border-t py-12" style={{ borderColor: C.line }}>
                        <SectionHead id="record" kicker="Graded against the spread" title="Track record" />
                        <div className="max-w-3xl">
                            {graded === 0 ? (
                                <p className="text-lg">
                                    No graded leans yet, so there is no record to show.{' '}
                                    <span style={{ color: C.soft }}>
                                        {record.pending > 0
                                            ? `${record.pending} lean${record.pending === 1 ? ' is' : 's are'} saved and waiting on a final score.`
                                            : 'Nothing has been saved yet either.'}
                                    </span>
                                </p>
                            ) : (
                                <>
                                    <p className="text-5xl tabular-nums sm:text-6xl" style={display}>
                                        {record.wins}-{record.losses}-{record.pushes}
                                    </p>
                                    <p className="mt-2" style={{ color: C.soft }}>
                                        Wins, losses and pushes against the spread across {graded} graded lean{graded === 1 ? '' : 's'}
                                        {record.since ? ` since ${shortDate.format(new Date(record.since))}` : ''}. {record.pending} more waiting on a
                                        final score. A sample this small proves nothing either way.
                                    </p>
                                </>
                            )}
                            <p className="mt-4 text-sm" style={{ color: C.soft }}>
                                How it is kept: the first lean the model publishes for a game is saved with a timestamp before the game starts and
                                never edited. It is graded only after the feed reports a final score. Games with no lean are not counted. Past results
                                say nothing about future ones.
                            </p>
                            {record.recent.length > 0 && (
                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full min-w-[520px] text-sm tabular-nums">
                                        <caption className="sr-only">Most recently graded leans</caption>
                                        <thead style={{ color: C.soft }}>
                                            <tr className="border-b text-left text-xs tracking-wider uppercase" style={{ borderColor: C.line }}>
                                                {['League', 'Game', 'Lean', 'Confidence', 'Final', 'Result'].map((h) => (
                                                    <th key={h} scope="col" className="px-2 py-2">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {record.recent.map((r, i) => (
                                                <tr key={i} className="border-b" style={{ borderColor: C.line }}>
                                                    <td className="px-2 py-2 uppercase">{r.league}</td>
                                                    <td className="px-2">{r.matchup}</td>
                                                    <td className="px-2 font-semibold">{r.lean}</td>
                                                    <td className="px-2 capitalize">{r.confidence}</td>
                                                    <td className="px-2">{r.score}</td>
                                                    <td className="px-2 font-bold capitalize" style={{ color: r.result === 'win' ? C.teal : C.text }}>
                                                        {r.result}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* How this works */}
                    <section aria-labelledby="how" className="scroll-mt-20 border-t py-12" style={{ borderColor: C.line }}>
                        <SectionHead id="how" kicker="No black box" title="How this works" />
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                            <div>
                                <p className="max-w-2xl" style={{ color: C.soft }}>
                                    The market's point spread is the starting point: it already reflects far more information than this page has. Each
                                    rule below adds or removes a small number of points for one team. If the rules add up to {num(threshold)} point or
                                    more, the model leans to that side of the spread. Otherwise: no lean.
                                </p>
                                <dl className="mt-6 border-t" style={{ borderColor: C.line }}>
                                    {rules.map((r) => (
                                        <div
                                            key={r.name}
                                            className="grid gap-x-6 gap-y-1 border-b py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
                                            style={{ borderColor: C.line }}
                                        >
                                            <dt className="font-bold">
                                                {r.name}
                                                <span className="block text-xs font-normal" style={{ color: C.soft }}>
                                                    Up to {r.max}
                                                </span>
                                            </dt>
                                            <dd className="text-sm" style={{ color: C.soft }}>
                                                {r.rule}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-4 text-sm" style={{ color: C.soft }}>
                                    Home and road form, season record and ranking all describe team quality, which the spread already reflects. Their
                                    caps add up to less than the bar on purpose: form alone never produces a lean. Confidence is only a measure of
                                    agreement between four groups (injuries, rest, form, line movement). High: 2.5+ points with three or more groups
                                    on the same side and 80% of all movement pointing that way. Medium: 1.5+ points, two or more groups, 60%.
                                    Everything else is low. It is not a probability of anything.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-2xl" style={display}>
                                    Limits, plainly
                                </h3>
                                <ul className="mt-3 space-y-3 text-sm" style={{ color: C.soft }}>
                                    {[
                                        'The weights are judgement calls written by hand. They were not fitted to past results.',
                                        'One line from one book, as ESPN lists it. No line shopping, and lines move after this page reads them.',
                                        'Sharp markets usually price in injuries and rest already. A lean means "public factors stack on this side", not "the line is wrong".',
                                        'The feed does not say who starts. A "leader" is whoever ESPN lists as the team\'s leader in passing, rushing, receiving, points, rebounds or assists.',
                                        "College injury reports are nearly empty in ESPN's public feed, so college leans use fewer factors.",
                                        'Weather, travel, matchups, coaching and motivation are not modelled.',
                                        "ESPN's public feeds are unofficial. They can change or stop, and this page will say so when they do.",
                                    ].map((t) => (
                                        <li key={t} className="border-l-2 pl-3" style={{ borderColor: C.line }}>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div className="mx-auto max-w-[1180px] space-y-4 px-5 py-8 text-sm sm:px-8" style={{ color: C.soft }}>
                        <p className="max-w-3xl">
                            Rundown is a portfolio demo designed and built by Timasi Werema. Scores, lines, injuries and headlines come live from
                            ESPN's public feeds. Not affiliated with or endorsed by ESPN, any sportsbook, the NFL, the NBA, the NCAA or any team. Team
                            names belong to their owners.
                        </p>
                        <p className="max-w-3xl">
                            Analysis only, not betting advice. No outcome is promised. 21+. Gambling problem? Call{' '}
                            <a href="tel:18004262537" className="font-bold underline underline-offset-4" style={{ color: C.text }}>
                                1-800-GAMBLER
                            </a>
                            .
                        </p>
                        <Link
                            href="/start"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            style={{ color: C.text }}
                        >
                            Want a live-data site like this for your business? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
