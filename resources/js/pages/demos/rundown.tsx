import '@fontsource-variable/archivo/wght';
import '@fontsource/big-shoulders-display/800';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Download, Search, Trophy } from 'lucide-react';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';

/*
 * DEMO for a fictional adult rec basketball league ("Trinity Run League") and its stats site ("Rundown").
 * Every team, player and game is made up and generated from a fixed seed, so the numbers are the same on every visit.
 * A real version would read scores entered by league staff (or a scorekeeping app) from a database.
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
    court: 'var(--rd-court)',
};
const THEME = `:root:has(.rd){color-scheme:dark;--rd-bg:#0b0d10;--rd-panel:#12161b;--rd-panel2:#1a2027;--rd-line:#262e38;--rd-text:#eef2f6;--rd-soft:#9aa6b2;--rd-hot:#ff7a1a;--rd-teal:#2dd4bf;--rd-court:#151b22}
@media (prefers-color-scheme: light){:root:has(.rd){color-scheme:light;--rd-bg:#f4f5f7;--rd-panel:#ffffff;--rd-panel2:#eef0f3;--rd-line:#dce0e6;--rd-text:#0e1116;--rd-soft:#56606c;--rd-hot:#d4570a;--rd-teal:#0d8a7d;--rd-court:#f7efe2}}`;
const display: CSSProperties = {
    fontFamily: "'Big Shoulders Display', Impact, sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    lineHeight: 0.95,
};

/* ---------------------------------------------------------------- data */

function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const binom = (n: number, p: number, r: () => number) => {
    let k = 0;
    for (let i = 0; i < n; i++) if (r() < p) k++;
    return k;
};

type Team = { id: string; name: string; short: string; color: string; boost: number };
const TEAMS: Team[] = [
    { id: 'DEN', name: 'Deep Ellum Night Owls', short: 'Night Owls', color: '#8b5cf6', boost: 1.04 },
    { id: 'BAB', name: 'Bishop Arts Bandits', short: 'Bandits', color: '#ef4444', boost: 1.03 },
    { id: 'OCO', name: 'Oak Cliff Overtime', short: 'Overtime', color: '#f59e0b', boost: 1.0 },
    { id: 'TRG', name: 'Trinity Groove', short: 'Groove', color: '#14b8a6', boost: 1.04 },
    { id: 'LKW', name: 'Lakewood Lanterns', short: 'Lanterns', color: '#eab308', boost: 0.97 },
    { id: 'CED', name: 'Cedars Cyclones', short: 'Cyclones', color: '#3b82f6', boost: 0.99 },
    { id: 'UPT', name: 'Uptown Alley-Oops', short: 'Alley-Oops', color: '#ec4899', boost: 0.97 },
    { id: 'DDD', name: 'Design District Drafters', short: 'Drafters', color: '#22c55e', boost: 1.01 },
];
const teamById = Object.fromEntries(TEAMS.map((t) => [t.id, t])) as Record<string, Team>;

const FIRST = [
    'Marcus',
    'Andre',
    'Jalen',
    'Tyrese',
    'Diego',
    'Kofi',
    'Ethan',
    'Malik',
    'Omar',
    'Caleb',
    'Darius',
    'Luis',
    'Isaiah',
    'Trey',
    'Nate',
    'Jordan',
    'Xavier',
    'Ray',
    'Devon',
    'Mateo',
    'Chris',
    'Kendall',
    'Sam',
    'Theo',
];
const LAST = [
    'Okafor',
    'Delgado',
    'Brooks',
    'Nguyen',
    'Haynes',
    'Whitfield',
    'Ramos',
    'Adeyemi',
    'Carter',
    'Pham',
    'Ellison',
    'Moreno',
    'Grant',
    'Osei',
    'Vance',
    'Lowery',
    'Ibarra',
    'Mensah',
    'Duarte',
    'Sutton',
    'Kimura',
    'Fairley',
    'Barnes',
    'Quinlan',
];
const POS = ['G', 'G', 'F', 'F', 'C', 'G', 'F'];

type Player = {
    id: string;
    name: string;
    team: string;
    pos: string;
    num: number;
    usage: number;
    p2: number;
    p3: number;
    threeRate: number;
    reb: number;
    ast: number;
    def: number;
};

type Line = {
    pid: string;
    fgm: number;
    fga: number;
    tpm: number;
    tpa: number;
    ftm: number;
    fta: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    pts: number;
};
type Game = { id: string; week: number; date: string; home: string; away: string; hs: number; as: number; lines: Record<string, Line[]> };

function buildLeague() {
    const r = rng(2026);
    const players: Player[] = [];
    const usedNames = new Set<string>();
    TEAMS.forEach((t, ti) => {
        const usages = Array.from({ length: 7 }, (_, i) => (i < 2 ? 1.6 : i < 5 ? 1 : 0.6) * (0.8 + r() * 0.4));
        const total = usages.reduce((a, b) => a + b, 0);
        for (let i = 0; i < 7; i++) {
            let name = '';
            do name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
            while (usedNames.has(name));
            usedNames.add(name);
            const pos = POS[i];
            players.push({
                id: `${t.id}-${i}`,
                name,
                team: t.id,
                pos,
                num: [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 15, 20, 21, 22, 23, 24, 30, 32, 33, 34, 44][Math.floor(r() * 21)] + (ti % 2),
                usage: usages[i] / total,
                p2: (pos === 'C' ? 0.52 : 0.45) + r() * 0.1,
                p3: pos === 'C' ? 0.22 + r() * 0.1 : 0.29 + r() * 0.13,
                threeRate: pos === 'C' ? 0.05 + r() * 0.1 : pos === 'G' ? 0.35 + r() * 0.2 : 0.2 + r() * 0.2,
                reb: pos === 'C' ? 1.8 : pos === 'F' ? 1.3 : 0.7,
                ast: pos === 'G' ? 1.7 : pos === 'F' ? 0.9 : 0.6,
                def: pos === 'C' ? 1.6 : 0.8,
            });
        }
    });

    // Round robin (circle method): 7 weeks, 4 games a week, Sundays from Sept 13, 2026.
    const ids = TEAMS.map((t) => t.id);
    const games: Game[] = [];
    for (let w = 0; w < 7; w++) {
        const rot = [ids[0], ...ids.slice(1).map((_, i) => ids[1 + ((i + w) % 7)])];
        const day = new Date(Date.UTC(2026, 8, 13 + w * 7));
        const date = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
        for (let g = 0; g < 4; g++) {
            const [a, b] = w % 2 ? [rot[g], rot[7 - g]] : [rot[7 - g], rot[g]];
            const lines: Record<string, Line[]> = {};
            const score: Record<string, number> = {};
            // Both teams play at the same pace, which keeps most games within ~15 points.
            const teamFga = 56 + Math.floor(r() * 8);
            for (const tid of [a, b]) {
                const boost = teamById[tid].boost;
                lines[tid] = players
                    .filter((p) => p.team === tid)
                    .map((p) => {
                        const fga = Math.max(0, Math.round(p.usage * teamFga * (0.82 + r() * 0.36)));
                        const tpa = Math.round(fga * p.threeRate);
                        const tpm = binom(tpa, p.p3 * boost, r);
                        const twm = binom(fga - tpa, Math.min(0.75, p.p2 * boost), r);
                        const fta = Math.round(fga * (0.1 + r() * 0.3));
                        const ftm = binom(fta, 0.68 + r() * 0.12, r);
                        return {
                            pid: p.id,
                            fga,
                            fgm: twm + tpm,
                            tpa,
                            tpm,
                            fta,
                            ftm,
                            reb: Math.round(p.reb * (1.5 + r() * 5)),
                            ast: Math.round(p.ast * (0.5 + r() * 4)),
                            stl: Math.round(r() * 2.3),
                            blk: Math.round(r() * p.def * 1.6),
                            tov: Math.round(r() * 3),
                            pts: twm * 2 + tpm * 3 + ftm,
                        };
                    });
                score[tid] = lines[tid].reduce((s, l) => s + l.pts, 0);
            }
            if (score[a] === score[b]) {
                // No ties: one more free throw for the home team's leading scorer.
                const top = [...lines[a]].sort((x, y) => y.pts - x.pts)[0];
                top.fta++;
                top.ftm++;
                top.pts++;
                score[a]++;
            }
            games.push({ id: `W${w + 1}G${g + 1}`, week: w + 1, date, home: a, away: b, hs: score[a], as: score[b], lines });
        }
    }
    return { players, games };
}

const { players: PLAYERS, games: GAMES } = buildLeague();
const playerById = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<string, Player>;
const WEEKS = Math.max(...GAMES.map((g) => g.week));

type Avg = {
    p: Player;
    gp: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    tpm: number;
    fgp: number;
    tpp: number;
    ftp: number;
    log: { game: Game; line: Line }[];
};

const AVERAGES: Avg[] = PLAYERS.map((p) => {
    const log = GAMES.flatMap((g) => (g.lines[p.team] ?? []).filter((l) => l.pid === p.id).map((line) => ({ game: g, line })));
    const sum = (k: keyof Omit<Line, 'pid'>) => log.reduce((s, x) => s + x.line[k], 0);
    const gp = log.length || 1;
    const pct = (m: number, a: number) => (a ? m / a : 0);
    return {
        p,
        gp: log.length,
        pts: sum('pts') / gp,
        reb: sum('reb') / gp,
        ast: sum('ast') / gp,
        stl: sum('stl') / gp,
        blk: sum('blk') / gp,
        tov: sum('tov') / gp,
        tpm: sum('tpm') / gp,
        fgp: pct(sum('fgm'), sum('fga')),
        tpp: pct(sum('tpm'), sum('tpa')),
        ftp: pct(sum('ftm'), sum('fta')),
        log,
    };
});
const avgById = Object.fromEntries(AVERAGES.map((a) => [a.p.id, a])) as Record<string, Avg>;

type Standing = { team: Team; w: number; l: number; pf: number; pa: number; streak: string; last: ('W' | 'L')[] };
const STANDINGS: Standing[] = TEAMS.map((team) => {
    const results = GAMES.filter((g) => g.home === team.id || g.away === team.id).map((g) => {
        const mine = g.home === team.id ? g.hs : g.as;
        const theirs = g.home === team.id ? g.as : g.hs;
        return { win: mine > theirs, mine, theirs };
    });
    let streakN = 0;
    const lastWin = results[results.length - 1]?.win;
    for (let i = results.length - 1; i >= 0 && results[i].win === lastWin; i--) streakN++;
    return {
        team,
        w: results.filter((x) => x.win).length,
        l: results.filter((x) => !x.win).length,
        pf: results.reduce((s, x) => s + x.mine, 0) / results.length,
        pa: results.reduce((s, x) => s + x.theirs, 0) / results.length,
        streak: `${lastWin ? 'W' : 'L'}${streakN}`,
        last: results.slice(-5).map((x) => (x.win ? 'W' : 'L')),
    };
}).sort((a, b) => b.w - a.w || b.pf - b.pa - (a.pf - a.pa));

/* ---------------------------------------------------------------- helpers */

const f1 = (n: number) => n.toFixed(1);
const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`;

function TeamDot({ id, size = 10 }: { id: string; size?: number }) {
    return (
        <span
            aria-hidden="true"
            className="inline-block shrink-0 rounded-full"
            style={{ width: size, height: size, background: teamById[id].color }}
        />
    );
}

function SortHead<K extends string>({
    label,
    k,
    sort,
    setSort,
    title,
    left = false,
}: {
    label: string;
    k: K;
    sort: { key: K; dir: 1 | -1 };
    setSort: (s: { key: K; dir: 1 | -1 }) => void;
    title?: string;
    left?: boolean;
}) {
    const active = sort.key === k;
    return (
        <th
            scope="col"
            aria-sort={active ? (sort.dir === -1 ? 'descending' : 'ascending') : 'none'}
            className={`px-2 py-0 ${left ? 'text-left' : 'text-right'}`}
        >
            <button
                type="button"
                title={title}
                onClick={() => setSort({ key: k, dir: active ? (sort.dir === -1 ? 1 : -1) : -1 })}
                className={`inline-flex min-h-10 items-center gap-0.5 text-xs font-bold tracking-wider uppercase ${left ? '' : 'flex-row-reverse'}`}
                style={{ color: active ? C.hot : C.soft }}
            >
                {label}
                {active ? sort.dir === -1 ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" /> : <span className="w-3.5" />}
            </button>
        </th>
    );
}

function SectionTitle({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.hot }}>
                    {kicker}
                </p>
                <h2 id={id} className="mt-1 text-5xl sm:text-6xl" style={display}>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

/* ---------------------------------------------------------------- shot chart */

type Shot = { x: number; y: number; made: boolean; zone: 'Rim' | 'Mid-range' | 'Three' };

function shotsFor(a: Avg): Shot[] {
    const r = rng(a.p.id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7));
    const shots: Shot[] = [];
    const place = (kind: 'three' | 'two', made: boolean) => {
        if (kind === 'three') {
            if (r() < 0.22) {
                const left = r() < 0.5;
                shots.push({ x: left ? 12 + r() * 14 : 474 + r() * 14, y: 20 + r() * 110, made, zone: 'Three' });
                return;
            }
            const th = (r() * 2 - 1) * 1.15;
            const d = 245 + r() * 40;
            shots.push({ x: 250 + d * Math.sin(th), y: 52 + d * Math.cos(th), made, zone: 'Three' });
            return;
        }
        const rim = r() < (a.p.pos === 'C' ? 0.75 : 0.5);
        const th = (r() * 2 - 1) * 1.45;
        const d = rim ? r() * 55 : 70 + r() * 150;
        shots.push({ x: 250 + d * Math.sin(th), y: Math.max(14, 52 + d * Math.cos(th)), made, zone: rim ? 'Rim' : 'Mid-range' });
    };
    for (const { line } of a.log) {
        for (let i = 0; i < line.tpa; i++) place('three', i < line.tpm);
        for (let i = 0; i < line.fga - line.tpa; i++) place('two', i < line.fgm - line.tpm);
    }
    return shots;
}

function ShotChart({ a }: { a: Avg }) {
    const shots = useMemo(() => shotsFor(a), [a]);
    const zones = (['Rim', 'Mid-range', 'Three'] as const).map((z) => {
        const s = shots.filter((x) => x.zone === z);
        return { z, made: s.filter((x) => x.made).length, att: s.length };
    });
    return (
        <figure>
            <svg
                viewBox="0 0 500 470"
                className="w-full rounded-xl border"
                style={{ background: C.court, borderColor: C.line }}
                role="img"
                aria-label={`Shot chart for ${a.p.name}: ${zones.map((z) => `${z.z} ${z.made} of ${z.att}`).join(', ')}`}
            >
                <g fill="none" stroke={'currentColor'} strokeWidth="2" style={{ color: C.soft }} opacity=".55">
                    <rect x="2" y="2" width="496" height="466" />
                    <rect x="170" y="2" width="160" height="190" />
                    <circle cx="250" cy="192" r="60" />
                    <path d="M210 52 a40 40 0 0 0 80 0" />
                    <path d="M30 2 V140 A237.5 237.5 0 0 0 470 140 V2" />
                    <path d="M220 42 h60" strokeWidth="3" />
                    <path d="M190 468 a60 60 0 0 1 120 0" />
                </g>
                <circle cx="250" cy="52" r="8" fill="none" stroke={C.hot} strokeWidth="3" />
                {shots.map((s, i) =>
                    s.made ? (
                        <circle key={i} cx={s.x} cy={s.y} r="6" style={{ fill: C.teal }} opacity=".85" />
                    ) : (
                        <path
                            key={i}
                            d={`M${s.x - 5} ${s.y - 5} l10 10 M${s.x + 5} ${s.y - 5} l-10 10`}
                            style={{ stroke: C.hot }}
                            strokeWidth="2.5"
                            opacity=".7"
                        />
                    ),
                )}
            </svg>
            <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: C.soft }}>
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: C.teal }} /> Made
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span style={{ color: C.hot }}>✕</span> Missed
                </span>
                {zones.map((z) => (
                    <span key={z.z} className="tabular-nums">
                        <b style={{ color: C.text }}>{z.z}</b> {z.made}/{z.att} {z.att ? `(${Math.round((z.made / z.att) * 100)}%)` : ''}
                    </span>
                ))}
            </figcaption>
        </figure>
    );
}

/* ---------------------------------------------------------------- playoffs */

function headToHead(x: string, y: string) {
    const g = GAMES.find((q) => (q.home === x && q.away === y) || (q.home === y && q.away === x));
    if (!g) return null;
    const xs = g.home === x ? g.hs : g.as;
    const ys = g.home === x ? g.as : g.hs;
    return { game: g, winner: xs > ys ? x : y, score: `${Math.max(xs, ys)}-${Math.min(xs, ys)}` };
}

function recordOf(id: string) {
    const s = STANDINGS.find((x) => x.team.id === id)!;
    return `${s.w}-${s.l}`;
}

function Slot({ id, seed, picked, onPick, label }: { id: string | null; seed?: number; picked: boolean; onPick?: () => void; label: string }) {
    return (
        <button
            type="button"
            disabled={!id || !onPick}
            onClick={onPick}
            aria-pressed={picked}
            aria-label={id ? `${label}: pick ${teamById[id].name}` : `${label}: to be decided`}
            className="flex min-h-12 w-full items-center gap-2.5 rounded-lg border px-3 text-left font-semibold transition-colors disabled:cursor-default"
            style={{
                borderColor: picked ? C.hot : C.line,
                background: picked ? `color-mix(in srgb, ${C.hot} 14%, ${C.panel})` : C.panel,
                opacity: id ? 1 : 0.55,
            }}
        >
            {seed && (
                <span className="w-4 text-xs" style={{ color: C.soft }}>
                    {seed}
                </span>
            )}
            {id ? <TeamDot id={id} /> : <span className="size-2.5 rounded-full border" style={{ borderColor: C.soft }} />}
            <span className="min-w-0 flex-1 truncate">{id ? teamById[id].name : 'TBD'}</span>
            {id && (
                <span className="text-xs tabular-nums" style={{ color: C.soft }}>
                    {recordOf(id)}
                </span>
            )}
        </button>
    );
}

function Bracket({ onBox }: { onBox: (id: string) => void }) {
    const seeds = STANDINGS.slice(0, 4).map((s) => s.team.id);
    const [semi1, setSemi1] = useState<string | null>(null);
    const [semi2, setSemi2] = useState<string | null>(null);
    const [champ, setChamp] = useState<string | null>(null);

    const pick = (slot: 1 | 2, id: string) => {
        (slot === 1 ? setSemi1 : setSemi2)(id);
        setChamp(null);
    };

    const semi = (slot: 1 | 2, hi: number, lo: number, value: string | null) => {
        const h2h = headToHead(seeds[hi - 1], seeds[lo - 1]);
        return (
            <div className="min-w-0 space-y-1.5">
                <p className="text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                    Semifinal {slot} · Sun, Nov 1
                </p>
                <Slot
                    id={seeds[hi - 1]}
                    seed={hi}
                    picked={value === seeds[hi - 1]}
                    onPick={() => pick(slot, seeds[hi - 1])}
                    label={`Semifinal ${slot}`}
                />
                <Slot
                    id={seeds[lo - 1]}
                    seed={lo}
                    picked={value === seeds[lo - 1]}
                    onPick={() => pick(slot, seeds[lo - 1])}
                    label={`Semifinal ${slot}`}
                />
                {h2h && (
                    <button
                        type="button"
                        onClick={() => onBox(h2h.game.id)}
                        className="min-h-8 text-left text-xs underline-offset-2 hover:underline"
                        style={{ color: C.soft }}
                    >
                        Season meeting: {teamById[h2h.winner].short} won {h2h.score} (week {h2h.game.week}) →
                    </button>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="min-w-0 flex-1 space-y-8">
                    {semi(1, 1, 4, semi1)}
                    {semi(2, 2, 3, semi2)}
                </div>
                <svg aria-hidden="true" viewBox="0 0 40 200" className="hidden h-56 w-10 shrink-0 md:block" preserveAspectRatio="none">
                    <path
                        d="M0 50 H20 V150 H0 M20 100 H40"
                        fill="none"
                        style={{ stroke: C.line }}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                        Final · Sun, Nov 8
                    </p>
                    <Slot id={semi1} picked={!!semi1 && champ === semi1} onPick={semi1 && semi2 ? () => setChamp(semi1) : undefined} label="Final" />
                    <Slot id={semi2} picked={!!semi2 && champ === semi2} onPick={semi1 && semi2 ? () => setChamp(semi2) : undefined} label="Final" />
                </div>
                <div className="min-w-0 flex-1 md:pl-4">
                    <p className="text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                        Champion
                    </p>
                    <p className="mt-2 flex items-center gap-3 text-4xl" style={{ ...display, color: champ ? C.hot : C.soft }} aria-live="polite">
                        <Trophy className="size-8 shrink-0" />
                        {champ ? teamById[champ].short : 'Your pick'}
                    </p>
                </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm" style={{ color: C.soft }}>
                <p>Tap a team to pick the winner of each game. Just for fun: picks are not saved.</p>
                {(semi1 || semi2) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSemi1(null);
                            setSemi2(null);
                            setChamp(null);
                        }}
                        className="min-h-10 font-bold underline underline-offset-4"
                        style={{ color: C.text }}
                    >
                        Reset bracket
                    </button>
                )}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------- page */

type PKey = 'name' | 'team' | 'gp' | 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tpm' | 'fgp' | 'tpp' | 'ftp';
type SKey = 'rank' | 'w' | 'pct' | 'pf' | 'pa' | 'diff';

const LEADER_STATS = [
    { key: 'pts', label: 'Points', fmt: f1 },
    { key: 'reb', label: 'Rebounds', fmt: f1 },
    { key: 'ast', label: 'Assists', fmt: f1 },
    { key: 'tpm', label: '3-pointers', fmt: f1 },
    { key: 'fgp', label: 'FG%', fmt: pctFmt },
] as const;

export default function Rundown() {
    const [week, setWeek] = useState(WEEKS);
    const [boxId, setBoxId] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [leaderKey, setLeaderKey] = useState<(typeof LEADER_STATS)[number]['key']>('pts');
    const [teamFilter, setTeamFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [psort, setPsort] = useState<{ key: PKey; dir: 1 | -1 }>({ key: 'pts', dir: -1 });
    const [ssort, setSsort] = useState<{ key: SKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 });
    const byPts = useMemo(() => [...AVERAGES].sort((a, b) => b.pts - a.pts), []);
    const [cmpA, setCmpA] = useState(byPts[0].p.id);
    const [cmpB, setCmpB] = useState(byPts[1].p.id);

    const box = GAMES.find((g) => g.id === boxId) ?? null;
    const profile = profileId ? avgById[profileId] : null;
    const weekGames = GAMES.filter((g) => g.week === week);

    const standings = useMemo(() => {
        const val = (s: Standing, i: number) => ({ rank: i, w: s.w, pct: s.w / (s.w + s.l), pf: s.pf, pa: s.pa, diff: s.pf - s.pa })[ssort.key];
        return STANDINGS.map((s, i) => ({ s, i })).sort((x, y) => (val(x.s, x.i) - val(y.s, y.i)) * ssort.dir);
    }, [ssort]);

    const leaderStat = LEADER_STATS.find((s) => s.key === leaderKey)!;
    const leaders = useMemo(
        () =>
            [...AVERAGES]
                .filter((a) => leaderKey !== 'fgp' || a.log.reduce((s, x) => s + x.line.fga, 0) >= 30)
                .sort((a, b) => b[leaderKey] - a[leaderKey])
                .slice(0, 5),
        [leaderKey],
    );

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return AVERAGES.filter((a) => (teamFilter === 'all' || a.p.team === teamFilter) && (!q || a.p.name.toLowerCase().includes(q))).sort(
            (a, b) => {
                if (psort.key === 'name') return a.p.name.localeCompare(b.p.name) * -psort.dir;
                if (psort.key === 'team') return a.p.team.localeCompare(b.p.team) * -psort.dir;
                return (a[psort.key] - b[psort.key]) * psort.dir;
            },
        );
    }, [query, teamFilter, psort]);

    const exportCsv = () => {
        const head = ['Player', 'Team', 'Pos', 'GP', 'PTS', 'REB', 'AST', 'STL', 'BLK', '3PM', 'FG%', '3P%', 'FT%'];
        const body = rows.map((a) =>
            [
                a.p.name,
                teamById[a.p.team].name,
                a.p.pos,
                a.gp,
                f1(a.pts),
                f1(a.reb),
                f1(a.ast),
                f1(a.stl),
                f1(a.blk),
                f1(a.tpm),
                pctFmt(a.fgp),
                pctFmt(a.tpp),
                pctFmt(a.ftp),
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(','),
        );
        const url = URL.createObjectURL(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trinity-run-league-player-stats.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const pill = (on: boolean): CSSProperties =>
        on ? { background: C.hot, color: '#0b0d10', borderColor: 'transparent' } : { borderColor: C.line, color: C.soft };
    const input = 'min-h-11 rounded-lg border px-3 text-base outline-none focus-visible:ring-2';
    const a = avgById[cmpA];
    const b = avgById[cmpB];
    const compareRows = [
        { label: 'Points', a: a.pts, b: b.pts, fmt: f1 },
        { label: 'Rebounds', a: a.reb, b: b.reb, fmt: f1 },
        { label: 'Assists', a: a.ast, b: b.ast, fmt: f1 },
        { label: 'Steals', a: a.stl, b: b.stl, fmt: f1 },
        { label: 'Blocks', a: a.blk, b: b.blk, fmt: f1 },
        { label: 'FG%', a: a.fgp, b: b.fgp, fmt: pctFmt },
        { label: '3P%', a: a.tpp, b: b.tpp, fmt: pctFmt },
    ];

    return (
        <>
            <Head title="Rundown (demo app)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div className="rd min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Archivo Variable', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div style={{ background: C.panel2 }}>
                    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm sm:px-8">
                        <p>Demo app for a fictional league, designed &amp; built by Timasi Werema. Teams, players and stats are made up.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <header
                    className="sticky top-0 z-30 border-b backdrop-blur"
                    style={{ borderColor: C.line, background: `color-mix(in srgb, ${C.bg} 88%, transparent)` }}
                >
                    <nav className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-8">
                        <a href="#top" className="flex items-center gap-2 text-3xl" style={display}>
                            <span className="flex size-9 items-center justify-center rounded-full" style={{ background: C.hot, color: '#0b0d10' }}>
                                <Trophy className="size-5" />
                            </span>
                            Rundown
                        </a>
                        <div className="-mx-2 flex gap-1 overflow-x-auto text-sm font-semibold" style={{ color: C.soft }}>
                            {[
                                ['scores', 'Scores'],
                                ['standings', 'Standings'],
                                ['playoffs', 'Playoffs'],
                                ['leaders', 'Leaders'],
                                ['players', 'Players'],
                                ['compare', 'Compare'],
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
                    <section className="py-12 sm:py-16">
                        <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.hot }}>
                            Trinity Run League · Fall 2026 · Week {WEEKS} of {WEEKS}
                        </p>
                        <h1 className="mt-3 max-w-4xl text-6xl sm:text-8xl" style={display}>
                            Every bucket, <span style={{ color: C.hot }}>on the record.</span>
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg" style={{ color: C.soft }}>
                            Live standings, box scores, league leaders and a page for every player, with shot charts. Scorekeepers enter a game once
                            and the whole site updates.
                        </p>
                        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t pt-6" style={{ borderColor: C.line }}>
                            {[
                                ['Teams', TEAMS.length],
                                ['Players', PLAYERS.length],
                                ['Games played', GAMES.length],
                                ['Points scored', GAMES.reduce((s, g) => s + g.hs + g.as, 0).toLocaleString()],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                                        {k}
                                    </dt>
                                    <dd className="mt-1 text-4xl tabular-nums" style={display}>
                                        {v}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Scores */}
                    <section aria-labelledby="scores" className="scroll-mt-20 py-10">
                        <SectionTitle id="scores" kicker="Results" title="Scores">
                            <div role="radiogroup" aria-label="Week" className="flex max-w-full gap-1 overflow-x-auto pb-1">
                                {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        role="radio"
                                        aria-checked={week === w}
                                        onClick={() => setWeek(w)}
                                        className="min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold"
                                        style={pill(week === w)}
                                    >
                                        Wk {w}
                                    </button>
                                ))}
                            </div>
                        </SectionTitle>
                        <ul className="border-t" style={{ borderColor: C.line }}>
                            {weekGames.map((g) => {
                                const homeWon = g.hs > g.as;
                                return (
                                    <li key={g.id} className="border-b" style={{ borderColor: C.line }}>
                                        <button
                                            type="button"
                                            onClick={() => setBoxId(g.id)}
                                            className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-1 py-4 text-left transition-colors hover:opacity-90"
                                        >
                                            <span className="w-24 text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                                                {g.date} · Final
                                            </span>
                                            <span className="flex min-w-0 flex-[1_1_420px] flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                                                {[
                                                    [g.away, g.as, !homeWon],
                                                    [g.home, g.hs, homeWon],
                                                ].map(([tid, pts, won], i) => (
                                                    <span
                                                        key={String(tid)}
                                                        className="flex min-w-0 flex-1 items-center gap-2"
                                                        style={{ opacity: won ? 1 : 0.6 }}
                                                    >
                                                        <TeamDot id={String(tid)} />
                                                        <span className="truncate font-semibold">{teamById[String(tid)].name}</span>
                                                        <span className="ml-auto text-3xl tabular-nums sm:ml-2" style={display}>
                                                            {String(pts)}
                                                        </span>
                                                        {i === 0 && (
                                                            <span className="hidden text-sm sm:inline" style={{ color: C.soft }}>
                                                                @
                                                            </span>
                                                        )}
                                                    </span>
                                                ))}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: C.hot }}>
                                                Box score <ArrowRight className="size-4" />
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Standings */}
                    <section aria-labelledby="standings" className="scroll-mt-20 py-10">
                        <SectionTitle id="standings" kicker="Top 4 make the playoffs" title="Standings" />
                        <div className="relative overflow-x-auto rounded-xl border" style={{ borderColor: C.line, background: C.panel }}>
                            <table className="w-full min-w-[640px] text-sm tabular-nums">
                                <thead className="border-b" style={{ borderColor: C.line }}>
                                    <tr>
                                        <SortHead label="Team" k="rank" sort={ssort} setSort={setSsort} left title="League rank" />
                                        <SortHead label="W-L" k="w" sort={ssort} setSort={setSsort} />
                                        <SortHead label="Pct" k="pct" sort={ssort} setSort={setSsort} />
                                        <SortHead label="PF" k="pf" sort={ssort} setSort={setSsort} title="Points for per game" />
                                        <SortHead label="PA" k="pa" sort={ssort} setSort={setSsort} title="Points against per game" />
                                        <SortHead label="Diff" k="diff" sort={ssort} setSort={setSsort} />
                                        <th
                                            scope="col"
                                            className="px-2 text-right text-xs font-bold tracking-wider uppercase"
                                            style={{ color: C.soft }}
                                        >
                                            Strk
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 text-right text-xs font-bold tracking-wider uppercase"
                                            style={{ color: C.soft }}
                                        >
                                            Last 5
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map(({ s, i }) => {
                                        const diff = s.pf - s.pa;
                                        return (
                                            <tr
                                                key={s.team.id}
                                                className="border-b last:border-b-0"
                                                style={{
                                                    borderColor: C.line,
                                                    boxShadow:
                                                        ssort.key === 'rank' && ssort.dir === 1 && i === 3 ? `inset 0 -2px 0 ${C.hot}` : undefined,
                                                }}
                                            >
                                                <th scope="row" className="px-2 py-2 text-left font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTeamFilter(s.team.id);
                                                            document.getElementById('players')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className="flex min-h-10 items-center gap-2.5 text-left hover:underline"
                                                    >
                                                        <span className="w-4 text-right text-xs" style={{ color: C.soft }}>
                                                            {i + 1}
                                                        </span>
                                                        <TeamDot id={s.team.id} />
                                                        {s.team.name}
                                                    </button>
                                                </th>
                                                <td className="px-2 text-right font-bold">
                                                    {s.w}-{s.l}
                                                </td>
                                                <td className="px-2 text-right">{(s.w / (s.w + s.l)).toFixed(3).replace(/^0/, '')}</td>
                                                <td className="px-2 text-right">{f1(s.pf)}</td>
                                                <td className="px-2 text-right">{f1(s.pa)}</td>
                                                <td className="px-2 text-right font-semibold" style={{ color: diff >= 0 ? C.teal : C.hot }}>
                                                    {diff >= 0 ? '+' : ''}
                                                    {f1(diff)}
                                                </td>
                                                <td className="px-2 text-right">{s.streak}</td>
                                                <td className="px-3">
                                                    <span className="flex justify-end gap-1" aria-label={`Last five: ${s.last.join(' ')}`}>
                                                        {s.last.map((r, j) => (
                                                            <span
                                                                key={j}
                                                                className="size-2.5 rounded-full"
                                                                style={{ background: r === 'W' ? C.teal : C.line }}
                                                            />
                                                        ))}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-sm" style={{ color: C.soft }}>
                            Tap a team to see its roster stats. The orange line marks the playoff cut; ties are broken by point differential.
                        </p>
                    </section>

                    {/* Playoffs */}
                    <section aria-labelledby="playoffs" className="scroll-mt-20 py-10">
                        <SectionTitle id="playoffs" kicker="Make your picks" title="Playoffs" />
                        <Bracket onBox={setBoxId} />
                    </section>

                    {/* Leaders */}
                    <section aria-labelledby="leaders" className="scroll-mt-20 py-10">
                        <SectionTitle id="leaders" kicker="Per game" title="League leaders">
                            <div role="radiogroup" aria-label="Stat" className="flex max-w-full flex-wrap gap-1">
                                {LEADER_STATS.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        role="radio"
                                        aria-checked={leaderKey === s.key}
                                        onClick={() => setLeaderKey(s.key)}
                                        className="min-h-10 rounded-full border px-3.5 text-sm font-bold"
                                        style={pill(leaderKey === s.key)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </SectionTitle>
                        <ol className="border-t" style={{ borderColor: C.line }}>
                            {leaders.map((l, i) => (
                                <li key={l.p.id} className="border-b" style={{ borderColor: C.line }}>
                                    <button
                                        type="button"
                                        onClick={() => setProfileId(l.p.id)}
                                        className="flex w-full items-center gap-4 py-3 text-left"
                                    >
                                        <span className="w-8 text-4xl" style={{ ...display, color: i === 0 ? C.hot : C.soft }}>
                                            {i + 1}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold">{l.p.name}</span>
                                            <span className="flex items-center gap-1.5 text-sm" style={{ color: C.soft }}>
                                                <TeamDot id={l.p.team} size={8} /> {teamById[l.p.team].short} · {l.p.pos}
                                            </span>
                                            <span className="mt-2 block h-1.5 rounded-full" style={{ background: C.line }} aria-hidden="true">
                                                <span
                                                    className="block h-full rounded-full"
                                                    style={{
                                                        width: `${(l[leaderKey] / leaders[0][leaderKey]) * 100}%`,
                                                        background: i === 0 ? C.hot : C.soft,
                                                    }}
                                                />
                                            </span>
                                        </span>
                                        <span className="w-20 text-right text-4xl tabular-nums" style={display}>
                                            {leaderStat.fmt(l[leaderKey])}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                        {leaderKey === 'fgp' && (
                            <p className="mt-3 text-sm" style={{ color: C.soft }}>
                                Minimum 30 shot attempts.
                            </p>
                        )}
                    </section>

                    {/* Players */}
                    <section aria-labelledby="players" className="scroll-mt-20 py-10">
                        <SectionTitle id="players" kicker="Season averages" title="Player stats">
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold"
                                style={{ borderColor: C.line }}
                            >
                                <Download className="size-4" /> Export CSV
                            </button>
                        </SectionTitle>
                        <div className="mb-4 flex flex-wrap gap-3">
                            <label className="relative min-w-0 flex-[1_1_240px]">
                                <span className="sr-only">Search players</span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" style={{ color: C.soft }} />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search players"
                                    className={`${input} w-full pl-9`}
                                    style={{ background: C.panel, borderColor: C.line, color: C.text }}
                                />
                            </label>
                            <label className="min-w-0 flex-[1_1_200px]">
                                <span className="sr-only">Team</span>
                                <select
                                    value={teamFilter}
                                    onChange={(e) => setTeamFilter(e.target.value)}
                                    className={`${input} w-full`}
                                    style={{ background: C.panel, borderColor: C.line, color: C.text }}
                                >
                                    <option value="all">All teams</option>
                                    {TEAMS.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="relative overflow-x-auto rounded-xl border" style={{ borderColor: C.line, background: C.panel }}>
                            <table className="w-full min-w-[860px] text-sm tabular-nums">
                                <thead className="border-b" style={{ borderColor: C.line }}>
                                    <tr>
                                        <SortHead label="Player" k="name" sort={psort} setSort={setPsort} left />
                                        <SortHead label="Team" k="team" sort={psort} setSort={setPsort} left />
                                        <SortHead label="GP" k="gp" sort={psort} setSort={setPsort} title="Games played" />
                                        <SortHead label="PTS" k="pts" sort={psort} setSort={setPsort} />
                                        <SortHead label="REB" k="reb" sort={psort} setSort={setPsort} />
                                        <SortHead label="AST" k="ast" sort={psort} setSort={setPsort} />
                                        <SortHead label="STL" k="stl" sort={psort} setSort={setPsort} />
                                        <SortHead label="BLK" k="blk" sort={psort} setSort={setPsort} />
                                        <SortHead label="3PM" k="tpm" sort={psort} setSort={setPsort} />
                                        <SortHead label="FG%" k="fgp" sort={psort} setSort={setPsort} />
                                        <SortHead label="3P%" k="tpp" sort={psort} setSort={setPsort} />
                                        <SortHead label="FT%" k="ftp" sort={psort} setSort={setPsort} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.p.id} className="border-b last:border-b-0" style={{ borderColor: C.line }}>
                                            <th scope="row" className="sticky left-0 px-2 text-left font-semibold" style={{ background: C.panel }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setProfileId(r.p.id)}
                                                    className="min-h-10 text-left hover:underline"
                                                >
                                                    {r.p.name}
                                                </button>
                                            </th>
                                            <td className="px-2">
                                                <span className="flex items-center gap-1.5" style={{ color: C.soft }}>
                                                    <TeamDot id={r.p.team} size={8} /> {r.p.team}
                                                </span>
                                            </td>
                                            <td className="px-2 text-right">{r.gp}</td>
                                            {(['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'] as const).map((k) => (
                                                <td key={k} className={`px-2 text-right ${psort.key === k ? 'font-bold' : ''}`}>
                                                    {f1(r[k])}
                                                </td>
                                            ))}
                                            {(['fgp', 'tpp', 'ftp'] as const).map((k) => (
                                                <td key={k} className={`px-2 text-right ${psort.key === k ? 'font-bold' : ''}`}>
                                                    {pctFmt(r[k])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={12} className="px-3 py-8 text-center" style={{ color: C.soft }}>
                                                No players match that search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-sm" style={{ color: C.soft }}>
                            {rows.length} players · tap a column to sort, tap a name for the player page and shot chart.
                        </p>
                    </section>

                    {/* Compare */}
                    <section aria-labelledby="compare" className="scroll-mt-20 py-10">
                        <SectionTitle id="compare" kicker="Head to head" title="Compare players" />
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                            {[
                                [cmpA, setCmpA, C.hot],
                                [cmpB, setCmpB, C.teal],
                            ].map(([val, set, color], i) => (
                                <label key={i} className="flex min-w-0 flex-[1_1_260px] items-center gap-2">
                                    <span className="size-3 shrink-0 rounded-full" style={{ background: color as string }} />
                                    <span className="sr-only">Player {i + 1}</span>
                                    <select
                                        value={val as string}
                                        onChange={(e) => (set as (v: string) => void)(e.target.value)}
                                        className={`${input} w-full`}
                                        style={{ background: C.panel, borderColor: C.line, color: C.text }}
                                    >
                                        {TEAMS.map((t) => (
                                            <optgroup key={t.id} label={t.name}>
                                                {PLAYERS.filter((p) => p.team === t.id).map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </div>
                        <dl className="border-t" style={{ borderColor: C.line }}>
                            {compareRows.map((row) => {
                                const max = Math.max(row.a, row.b) || 1;
                                return (
                                    <div
                                        key={row.label}
                                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b py-3"
                                        style={{ borderColor: C.line }}
                                    >
                                        <dd className="flex items-center justify-end gap-2">
                                            <span className={`tabular-nums ${row.a > row.b ? 'font-bold' : ''}`}>{row.fmt(row.a)}</span>
                                            <span
                                                className="h-2.5 rounded-l-full"
                                                style={{ width: `${(row.a / max) * 70}%`, background: C.hot, opacity: row.a >= row.b ? 1 : 0.45 }}
                                            />
                                        </dd>
                                        <dt className="w-20 text-center text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                                            {row.label}
                                        </dt>
                                        <dd className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 rounded-r-full"
                                                style={{ width: `${(row.b / max) * 70}%`, background: C.teal, opacity: row.b >= row.a ? 1 : 0.45 }}
                                            />
                                            <span className={`tabular-nums ${row.b > row.a ? 'font-bold' : ''}`}>{row.fmt(row.b)}</span>
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </section>

                    {/* What a real version adds */}
                    <section className="my-10 rounded-2xl border p-6 sm:p-8" style={{ borderColor: C.line, background: C.panel }}>
                        <h2 className="text-4xl" style={display}>
                            What the full version adds
                        </h2>
                        <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2" style={{ color: C.soft }}>
                            {[
                                'A phone-friendly scorekeeper screen for the table at each game',
                                'Team and player logins, with photos and bios',
                                'Playoff bracket that fills itself in from the standings',
                                'Game recaps and highlight clips',
                                'Registration and league fees through Square or Stripe',
                                'Text or email alerts when a final score is posted',
                            ].map((f) => (
                                <li key={f} className="flex gap-2">
                                    <span style={{ color: C.hot }}>●</span> {f}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div
                        className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.soft }}
                    >
                        <p>Rundown and the Trinity Run League are fictional. This is a portfolio demo; all stats are generated.</p>
                        <Link
                            href="/start"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            style={{ color: C.text }}
                        >
                            Want a stats site for your league? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Box score */}
            <Dialog open={!!box} onOpenChange={(o) => !o && setBoxId(null)}>
                <DialogContent
                    className="max-h-[92dvh] max-w-3xl overflow-y-auto rounded-2xl border p-5 sm:p-7"
                    style={{ background: C.panel, color: C.text, borderColor: C.line }}
                >
                    {box && (
                        <>
                            <div>
                                <DialogDescription className="text-xs font-bold tracking-wider uppercase" style={{ color: C.soft }}>
                                    Week {box.week} · {box.date} · Final
                                </DialogDescription>
                                <DialogTitle className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-3xl" style={display}>
                                    <span>
                                        {teamById[box.away].short} {box.as}
                                    </span>
                                    <span style={{ color: C.soft }}>@</span>
                                    <span>
                                        {teamById[box.home].short} {box.hs}
                                    </span>
                                </DialogTitle>
                            </div>
                            {[box.away, box.home].map((tid) => (
                                <div key={tid} className="mt-5 min-w-0">
                                    <h3 className="mb-2 flex items-center gap-2 font-bold">
                                        <TeamDot id={tid} /> {teamById[tid].name}
                                    </h3>
                                    <div className="relative overflow-x-auto rounded-lg border" style={{ borderColor: C.line }}>
                                        <table className="w-full min-w-[520px] text-sm tabular-nums">
                                            <thead style={{ color: C.soft }}>
                                                <tr className="border-b text-xs tracking-wider uppercase" style={{ borderColor: C.line }}>
                                                    {['Player', 'PTS', 'REB', 'AST', 'FG', '3P', 'FT', 'STL', 'BLK'].map((h, i) => (
                                                        <th key={h} scope="col" className={`px-2 py-2 ${i ? 'text-right' : 'text-left'}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...box.lines[tid]]
                                                    .sort((x, y) => y.pts - x.pts)
                                                    .map((l) => (
                                                        <tr key={l.pid} className="border-b last:border-b-0" style={{ borderColor: C.line }}>
                                                            <th scope="row" className="px-2 py-1.5 text-left font-semibold">
                                                                <button
                                                                    type="button"
                                                                    className="min-h-8 text-left hover:underline"
                                                                    onClick={() => {
                                                                        setBoxId(null);
                                                                        setProfileId(l.pid);
                                                                    }}
                                                                >
                                                                    {playerById[l.pid].name}
                                                                </button>
                                                            </th>
                                                            <td className="px-2 text-right font-bold">{l.pts}</td>
                                                            <td className="px-2 text-right">{l.reb}</td>
                                                            <td className="px-2 text-right">{l.ast}</td>
                                                            <td className="px-2 text-right">
                                                                {l.fgm}-{l.fga}
                                                            </td>
                                                            <td className="px-2 text-right">
                                                                {l.tpm}-{l.tpa}
                                                            </td>
                                                            <td className="px-2 text-right">
                                                                {l.ftm}-{l.fta}
                                                            </td>
                                                            <td className="px-2 text-right">{l.stl}</td>
                                                            <td className="px-2 text-right">{l.blk}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Player page */}
            <Sheet open={!!profile} onOpenChange={(o) => !o && setProfileId(null)}>
                <SheetContent
                    side="right"
                    className="w-full overflow-y-auto border-l p-0 sm:max-w-xl"
                    style={{ background: C.bg, color: C.text, borderColor: C.line }}
                >
                    {profile && (
                        <div className="p-5 sm:p-7">
                            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.soft }}>
                                <TeamDot id={profile.p.team} /> {teamById[profile.p.team].name} · #{profile.p.num} · {profile.p.pos}
                            </p>
                            <SheetTitle className="mt-2 text-5xl" style={{ ...display, color: C.text }}>
                                {profile.p.name}
                            </SheetTitle>
                            <SheetDescription className="sr-only">Season averages, shot chart and game log</SheetDescription>
                            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y py-4" style={{ borderColor: C.line }}>
                                {[
                                    ['PTS', f1(profile.pts)],
                                    ['REB', f1(profile.reb)],
                                    ['AST', f1(profile.ast)],
                                    ['FG%', pctFmt(profile.fgp)],
                                    ['3P%', pctFmt(profile.tpp)],
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="text-xs font-bold tracking-wider" style={{ color: C.soft }}>
                                            {k}
                                        </dt>
                                        <dd className="text-3xl tabular-nums" style={display}>
                                            {v}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <h3 className="mt-6 mb-3 text-2xl" style={display}>
                                Shot chart
                            </h3>
                            <ShotChart a={profile} />

                            <h3 className="mt-8 mb-3 text-2xl" style={display}>
                                Points by game
                            </h3>
                            <svg
                                viewBox="0 0 300 80"
                                className="w-full"
                                role="img"
                                aria-label={`Points by game: ${profile.log.map((x) => x.line.pts).join(', ')}`}
                            >
                                {(() => {
                                    const pts = profile.log.map((x) => x.line.pts);
                                    const max = Math.max(...pts, 10);
                                    const xy = pts.map((p, i) => [10 + (i * 280) / Math.max(1, pts.length - 1), 70 - (p / max) * 60]);
                                    return (
                                        <>
                                            <path
                                                d={`M${xy.map((q) => q.join(' ')).join(' L')}`}
                                                fill="none"
                                                style={{ stroke: C.hot }}
                                                strokeWidth="2.5"
                                            />
                                            {xy.map(([x, y], i) => (
                                                <g key={i}>
                                                    <circle cx={x} cy={y} r="3.5" style={{ fill: C.hot }} />
                                                    <text x={x} y={y - 8} textAnchor="middle" fontSize="10" style={{ fill: C.soft }}>
                                                        {pts[i]}
                                                    </text>
                                                </g>
                                            ))}
                                        </>
                                    );
                                })()}
                            </svg>

                            <h3 className="mt-6 mb-3 text-2xl" style={display}>
                                Game log
                            </h3>
                            <div className="relative overflow-x-auto rounded-lg border" style={{ borderColor: C.line }}>
                                <table className="w-full min-w-[440px] text-sm tabular-nums">
                                    <thead style={{ color: C.soft }}>
                                        <tr className="border-b text-xs tracking-wider uppercase" style={{ borderColor: C.line }}>
                                            {['Wk', 'Opp', 'Result', 'PTS', 'REB', 'AST', 'FG'].map((h, i) => (
                                                <th key={h} scope="col" className={`px-2 py-2 ${i < 3 ? 'text-left' : 'text-right'}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.log.map(({ game, line }) => {
                                            const home = game.home === profile.p.team;
                                            const opp = home ? game.away : game.home;
                                            const mine = home ? game.hs : game.as;
                                            const theirs = home ? game.as : game.hs;
                                            return (
                                                <tr key={game.id} className="border-b last:border-b-0" style={{ borderColor: C.line }}>
                                                    <td className="px-2 py-2">{game.week}</td>
                                                    <td className="px-2">
                                                        {home ? 'vs' : '@'} {opp}
                                                    </td>
                                                    <td className="px-2" style={{ color: mine > theirs ? C.teal : C.hot }}>
                                                        {mine > theirs ? 'W' : 'L'} {mine}-{theirs}
                                                    </td>
                                                    <td className="px-2 text-right font-bold">{line.pts}</td>
                                                    <td className="px-2 text-right">{line.reb}</td>
                                                    <td className="px-2 text-right">{line.ast}</td>
                                                    <td className="px-2 text-right">
                                                        {line.fgm}-{line.fga}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
