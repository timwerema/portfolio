import '@fontsource-variable/unbounded/wght';
import '@fontsource/space-grotesk/400';
import '@fontsource/space-grotesk/500';
import '@fontsource/space-grotesk/700';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Bell, BellRing, CalendarPlus, Check, Headphones, MapPin, Plus, Ticket, X } from 'lucide-react';
import { useMemo, useState } from 'react';

/*
 * DEMO APP for a fictional concert finder ("Encore", Dallas-Fort Worth).
 * Every artist, venue and show here is made up (sample data); listening history
 * is simulated. A real version would connect to a music service and a ticketing API.
 * "Add to calendar" works for real (downloads an .ics file); tickets/alerts are simulated.
 */

const C = {
    bg: '#140a1f',
    panel: '#1d1130',
    panel2: '#26173d',
    line: 'rgba(255,255,255,0.1)',
    text: '#f6eefb',
    muted: '#b9a9c9',
    coral: '#ff6b5e',
    gold: '#ffc857',
};
const display = { fontFamily: "'Unbounded Variable', system-ui, sans-serif" };

type Artist = { id: string; name: string; genre: string; plays: number };
const ARTISTS: Artist[] = [
    { id: 'velvet-hours', name: 'Velvet Hours', genre: 'R&B', plays: 142 },
    { id: 'kairo-lane', name: 'Kairo Lane', genre: 'Hip-hop', plays: 118 },
    { id: 'the-amber-room', name: 'The Amber Room', genre: 'Neo-soul', plays: 96 },
    { id: 'nova-ashe', name: 'Nova Ashe', genre: 'R&B', plays: 81 },
    { id: 'lagos-sunday', name: 'Lagos Sunday', genre: 'Afrobeats', plays: 64 },
    { id: 'deep-ellum-brass', name: 'Third Street Brass', genre: 'Jazz', plays: 40 },
    { id: 'midnight-transit', name: 'Midnight Transit', genre: 'House', plays: 33 },
    { id: 'paper-satellites', name: 'Paper Satellites', genre: 'Indie', plays: 21 },
    { id: 'ty-monroe', name: 'Ty Monroe', genre: 'Hip-hop', plays: 0 },
    { id: 'sola-grey', name: 'Sola Grey', genre: 'Neo-soul', plays: 0 },
];
const GENRES = ['R&B', 'Hip-hop', 'Neo-soul', 'Afrobeats', 'Jazz', 'House', 'Indie'];

type Venue = { id: string; name: string; area: string; miles: number; x: number; y: number };
const VENUES: Venue[] = [
    { id: 'lantern', name: 'The Lantern Room', area: 'Deep Ellum', miles: 2, x: 52, y: 55 },
    { id: 'glasshouse', name: 'Glasshouse Hall', area: 'Downtown Dallas', miles: 1, x: 48, y: 52 },
    { id: 'tinroof', name: 'Tin Roof Yard', area: 'Bishop Arts', miles: 4, x: 44, y: 62 },
    { id: 'northline', name: 'Northline Pavilion', area: 'Plano', miles: 19, x: 58, y: 18 },
    { id: 'riverside', name: 'Riverside Stage', area: 'Fort Worth', miles: 32, x: 12, y: 58 },
    { id: 'starlight', name: 'Starlight Lounge', area: 'Frisco', miles: 27, x: 52, y: 8 },
    { id: 'eastgate', name: 'Eastgate Theater', area: 'Garland', miles: 14, x: 74, y: 40 },
];

type Show = { id: string; artist: Artist; support?: string; venue: Venue; date: Date; doors: string; price: [number, number] };

/** Sample shows over the next ~6 weeks, generated from today's date. */
function buildShows(): Show[] {
    const plan: [string, string | undefined, string, number, string, [number, number]][] = [
        ['velvet-hours', 'Nova Ashe', 'glasshouse', 3, '7:00 PM', [45, 120]],
        ['kairo-lane', undefined, 'lantern', 5, '8:00 PM', [30, 55]],
        ['the-amber-room', 'Sola Grey', 'tinroof', 9, '7:30 PM', [25, 40]],
        ['lagos-sunday', undefined, 'riverside', 12, '6:30 PM', [35, 70]],
        ['midnight-transit', undefined, 'lantern', 13, '10:00 PM', [20, 30]],
        ['nova-ashe', undefined, 'starlight', 16, '8:00 PM', [40, 85]],
        ['ty-monroe', undefined, 'eastgate', 19, '8:00 PM', [28, 48]],
        ['deep-ellum-brass', undefined, 'tinroof', 21, '7:00 PM', [15, 25]],
        ['paper-satellites', undefined, 'lantern', 24, '8:30 PM', [18, 25]],
        ['kairo-lane', 'Ty Monroe', 'northline', 30, '7:00 PM', [55, 150]],
        ['sola-grey', undefined, 'glasshouse', 34, '8:00 PM', [30, 60]],
        ['velvet-hours', undefined, 'riverside', 38, '7:30 PM', [50, 110]],
    ];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plan.map(([a, support, v, inDays, doors, price], i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + inDays);
        return { id: `show-${i}`, artist: ARTISTS.find((x) => x.id === a)!, support, venue: VENUES.find((x) => x.id === v)!, date, doors, price };
    });
}

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const weekLabel = (d: Date) => {
    const days = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return days < 7
        ? 'This week'
        : days < 14
          ? 'Next week'
          : `Week of ${new Date(d.getTime() - d.getDay() * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

/** Build and download a real .ics calendar file for a show. */
function downloadIcs(show: Show) {
    const [h, rest] = show.doors.split(':');
    const [m, ampm] = rest.split(' ');
    const start = new Date(show.date);
    start.setHours((Number(h) % 12) + (ampm === 'PM' ? 12 : 0), Number(m), 0, 0);
    const end = new Date(start.getTime() + 3 * 3600000);
    const stamp = (d: Date) =>
        d
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '');
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Encore demo//EN',
        'BEGIN:VEVENT',
        `UID:${show.id}@encore-demo`,
        `DTSTAMP:${stamp(new Date())}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${show.artist.name}${show.support ? ` + ${show.support}` : ''} (demo)`,
        `LOCATION:${show.venue.name}\\, ${show.venue.area}`,
        'DESCRIPTION:Sample event from the Encore demo app. Not a real show.',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${show.artist.id}-${show.date.toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function EncoreDemo() {
    const shows = useMemo(buildShows, []);
    const [following, setFollowing] = useState<string[]>(['velvet-hours', 'kairo-lane', 'the-amber-room']);
    const [genres, setGenres] = useState<string[]>(['R&B', 'Neo-soul']);
    const [maxMiles, setMaxMiles] = useState(35);
    const [maxPrice, setMaxPrice] = useState(150);
    const [onlyFollowing, setOnlyFollowing] = useState(false);
    const [venue, setVenue] = useState<string | null>(null);
    const [open, setOpen] = useState<Show | null>(null);
    const [alerts, setAlerts] = useState<string[]>([]);
    const [ticketed, setTicketed] = useState<string | null>(null);

    const maxPlays = Math.max(...ARTISTS.map((a) => a.plays));
    const match = (s: Show) => {
        const followed = following.includes(s.artist.id) ? 55 : 0;
        const genre = genres.includes(s.artist.genre) ? 25 : 0;
        const plays = Math.round((s.artist.plays / maxPlays) * 20);
        return Math.min(99, followed + genre + plays);
    };

    const filtered = shows
        .filter((s) => s.venue.miles <= maxMiles && s.price[0] <= maxPrice)
        .filter((s) => !onlyFollowing || following.includes(s.artist.id))
        .filter((s) => !venue || s.venue.id === venue);
    const groups = filtered.reduce<Record<string, Show[]>>((acc, s) => {
        (acc[weekLabel(s.date)] ??= []).push(s);
        return acc;
    }, {});
    const topPick = [...filtered].sort((a, b) => match(b) - match(a))[0];

    const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    const chip = (on: boolean) =>
        `inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${on ? 'border-transparent text-[#140a1f]' : 'border-white/15 text-[#b9a9c9] hover:border-white/40'}`;
    const matchColor = (n: number) => (n >= 70 ? C.coral : n >= 40 ? C.gold : C.muted);

    return (
        <>
            <Head title="Encore (demo app)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div className="border-b text-sm" style={{ borderColor: C.line, background: '#0d0616', color: C.muted }}>
                    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 sm:px-8">
                        <p>Demo app by Timasi Werema. All artists, venues and shows are made up.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 text-white underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <header className="border-b" style={{ borderColor: C.line }}>
                    <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 sm:px-8">
                        <span className="text-2xl font-bold" style={display}>
                            encore<span style={{ color: C.coral }}>.</span>
                        </span>
                        <span
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                            style={{ borderColor: C.line, color: C.muted }}
                        >
                            <Headphones className="size-4" style={{ color: C.coral }} /> Listening connected (demo)
                        </span>
                    </nav>
                </header>

                <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
                    <h1 className="max-w-4xl text-4xl leading-tight font-bold sm:text-6xl" style={display}>
                        The artists you play, <span style={{ color: C.coral }}>live near you.</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg" style={{ color: C.muted }}>
                        Encore reads what you've been listening to and finds upcoming shows around Dallas–Fort Worth, ranked by how well they match
                        your taste.
                    </p>

                    {topPick && (
                        <button
                            type="button"
                            onClick={() => setOpen(topPick)}
                            className="mt-8 flex w-full flex-wrap items-center gap-x-8 gap-y-3 rounded-3xl p-6 text-left sm:p-8"
                            style={{ background: `linear-gradient(120deg, ${C.panel2}, ${C.panel})`, border: `1px solid ${C.line}` }}
                        >
                            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: C.coral }}>
                                Top pick for you
                            </span>
                            <span className="min-w-0 flex-[1_1_300px]">
                                <span className="block text-3xl font-bold sm:text-4xl" style={display}>
                                    {topPick.artist.name}
                                </span>
                                <span style={{ color: C.muted }}>
                                    {fmtDate(topPick.date)} · {topPick.venue.name}, {topPick.venue.area}
                                </span>
                            </span>
                            <span className="text-5xl font-bold" style={{ ...display, color: matchColor(match(topPick)) }}>
                                {match(topPick)}%
                            </span>
                        </button>
                    )}

                    <div className="mt-10 flex flex-wrap gap-8">
                        {/* Sidebar: listening + filters */}
                        <aside className="min-w-0 flex-[1_1_300px] space-y-8">
                            <section aria-labelledby="recent">
                                <h2 id="recent" className="text-lg font-bold" style={display}>
                                    Recently played
                                </h2>
                                <ul className="mt-3 divide-y" style={{ borderColor: C.line }}>
                                    {ARTISTS.filter((a) => a.plays > 0).map((a) => {
                                        const on = following.includes(a.id);
                                        return (
                                            <li key={a.id} className="flex items-center gap-3 py-2.5" style={{ borderColor: C.line }}>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block font-medium">{a.name}</span>
                                                    <span className="text-xs" style={{ color: C.muted }}>
                                                        {a.genre} · {a.plays} plays
                                                    </span>
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-pressed={on}
                                                    aria-label={`${on ? 'Unfollow' : 'Follow'} ${a.name}`}
                                                    onClick={() => toggle(following, setFollowing, a.id)}
                                                    className="flex size-10 items-center justify-center rounded-full border"
                                                    style={on ? { background: C.coral, borderColor: C.coral, color: C.bg } : { borderColor: C.line }}
                                                >
                                                    {on ? <Check className="size-4" /> : <Plus className="size-4" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                            <fieldset>
                                <legend className="text-lg font-bold" style={display}>
                                    Genres you like
                                </legend>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {GENRES.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            aria-pressed={genres.includes(g)}
                                            onClick={() => toggle(genres, setGenres, g)}
                                            className={chip(genres.includes(g))}
                                            style={genres.includes(g) ? { background: C.gold } : undefined}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                            <div className="space-y-5">
                                <label className="block">
                                    <span className="flex justify-between text-sm font-medium">
                                        Distance from downtown Dallas <span style={{ color: C.coral }}>{maxMiles} mi</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={5}
                                        max={35}
                                        step={5}
                                        value={maxMiles}
                                        onChange={(e) => setMaxMiles(Number(e.target.value))}
                                        className="mt-2 w-full accent-[#ff6b5e]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="flex justify-between text-sm font-medium">
                                        Tickets from up to <span style={{ color: C.coral }}>${maxPrice}</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={20}
                                        max={150}
                                        step={10}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="mt-2 w-full accent-[#ff6b5e]"
                                    />
                                </label>
                                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={onlyFollowing}
                                        onChange={(e) => setOnlyFollowing(e.target.checked)}
                                        className="size-5 accent-[#ff6b5e]"
                                    />
                                    Only artists I follow
                                </label>
                            </div>

                            {/* Stylized map */}
                            <section aria-labelledby="map-title">
                                <div className="flex items-center justify-between">
                                    <h2 id="map-title" className="text-lg font-bold" style={display}>
                                        Venues
                                    </h2>
                                    {venue && (
                                        <button
                                            type="button"
                                            onClick={() => setVenue(null)}
                                            className="inline-flex min-h-9 items-center gap-1 text-sm"
                                            style={{ color: C.coral }}
                                        >
                                            <X className="size-4" /> Show all
                                        </button>
                                    )}
                                </div>
                                <div
                                    className="relative mt-3 aspect-[4/3] overflow-hidden rounded-2xl border"
                                    style={{ borderColor: C.line, background: C.panel }}
                                >
                                    <svg aria-hidden="true" viewBox="0 0 100 75" className="absolute inset-0 size-full" preserveAspectRatio="none">
                                        <path d="M0 52 C 20 50, 30 56, 50 54 S 80 46, 100 44" stroke="#3a2a55" strokeWidth="1.2" fill="none" />
                                        <path d="M50 0 L 50 75 M 0 30 L 100 34" stroke="#2f2147" strokeWidth=".8" />
                                        <circle cx="49" cy="54" r="6" fill="none" stroke="#3a2a55" strokeWidth=".6" />
                                    </svg>
                                    {VENUES.map((v) => {
                                        const active = venue === v.id;
                                        const has = shows.some((s) => s.venue.id === v.id);
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                aria-pressed={active}
                                                aria-label={`${v.name}, ${v.area}, ${v.miles} miles`}
                                                disabled={!has}
                                                onClick={() => setVenue(active ? null : v.id)}
                                                className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                                                style={{ left: `${v.x}%`, top: `${(v.y / 75) * 100}%` }}
                                            >
                                                <MapPin
                                                    className="size-6 drop-shadow"
                                                    style={{ color: active ? C.gold : v.miles <= maxMiles ? C.coral : '#6b5a80' }}
                                                    fill={active ? C.gold : 'transparent'}
                                                />
                                            </button>
                                        );
                                    })}
                                    <span className="absolute bottom-2 left-3 text-[11px]" style={{ color: C.muted }}>
                                        Stylized map · sample venues
                                    </span>
                                </div>
                            </section>
                        </aside>

                        {/* Shows */}
                        <section aria-labelledby="shows" className="min-w-0 flex-[999_1_520px]">
                            <div className="flex items-baseline justify-between">
                                <h2 id="shows" className="text-2xl font-bold" style={display}>
                                    Upcoming shows
                                </h2>
                                <span className="text-sm" style={{ color: C.muted }} aria-live="polite">
                                    {filtered.length} show{filtered.length === 1 ? '' : 's'}
                                </span>
                            </div>
                            {filtered.length === 0 && (
                                <p className="mt-6 rounded-2xl border p-8 text-center" style={{ borderColor: C.line, color: C.muted }}>
                                    No shows match. Try a bigger distance or price.
                                </p>
                            )}
                            {Object.entries(groups).map(([label, list]) => (
                                <div key={label} className="mt-6">
                                    <h3 className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: C.muted }}>
                                        {label}
                                    </h3>
                                    <ul className="mt-2 divide-y border-y" style={{ borderColor: C.line }}>
                                        {list.map((s) => {
                                            const m = match(s);
                                            return (
                                                <li key={s.id} style={{ borderColor: C.line }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpen(s)}
                                                        className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 py-4 text-left hover:bg-white/[0.03]"
                                                    >
                                                        <span className="w-24 shrink-0 text-sm font-bold" style={{ color: C.gold }}>
                                                            {fmtDate(s.date)}
                                                        </span>
                                                        <span className="min-w-0 flex-[1_1_220px]">
                                                            <span className="block text-lg font-semibold">
                                                                {s.artist.name}
                                                                {s.support && <span style={{ color: C.muted }}> + {s.support}</span>}
                                                                {following.includes(s.artist.id) && (
                                                                    <span
                                                                        className="ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-bold"
                                                                        style={{ background: C.coral, color: C.bg }}
                                                                    >
                                                                        Following
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="text-sm" style={{ color: C.muted }}>
                                                                {s.venue.name} · {s.venue.area} · {s.venue.miles} mi · from ${s.price[0]}
                                                            </span>
                                                        </span>
                                                        <span className="text-right">
                                                            <span className="block text-2xl font-bold" style={{ ...display, color: matchColor(m) }}>
                                                                {m}%
                                                            </span>
                                                            <span className="text-[11px] tracking-wider uppercase" style={{ color: C.muted }}>
                                                                match
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    </div>

                    <section className="mt-16 border-t pt-10" style={{ borderColor: C.line }}>
                        <h2 className="text-xl font-bold" style={display}>
                            What the full version connects to
                        </h2>
                        <p className="mt-2 max-w-3xl" style={{ color: C.muted }}>
                            A production Encore would sign in with a music service to read real listening history, pull live event listings from a
                            ticketing API, and send a text the moment a favourite artist announces a Dallas date. This demo uses made-up sample data
                            so it runs anywhere.
                        </p>
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div
                        className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.muted }}
                    >
                        <p>Encore is a demo app. Artists, venues and shows are fictional.</p>
                        <Link href="/start" className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-4">
                            Want an app like this? Start a project →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Show detail */}
            <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
                <DialogContent
                    className="max-h-[92dvh] max-w-lg overflow-y-auto rounded-3xl border p-6 sm:p-8"
                    style={{ background: C.panel, color: C.text, borderColor: C.line }}
                >
                    {open && (
                        <>
                            <div>
                                <p className="text-sm font-bold" style={{ color: C.gold }}>
                                    {fmtDate(open.date)} · Doors {open.doors}
                                </p>
                                <DialogTitle className="mt-1 text-3xl font-bold" style={display}>
                                    {open.artist.name}
                                </DialogTitle>
                                <DialogDescription style={{ color: C.muted }}>
                                    {open.support ? `with ${open.support}` : 'Headline show'}
                                </DialogDescription>
                            </div>
                            <dl className="mt-6 space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt style={{ color: C.muted }}>Venue</dt>
                                    <dd className="text-right">
                                        {open.venue.name}, {open.venue.area}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt style={{ color: C.muted }}>Distance</dt>
                                    <dd>{open.venue.miles} miles from downtown</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt style={{ color: C.muted }}>Tickets</dt>
                                    <dd>
                                        ${open.price[0]}–${open.price[1]}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt style={{ color: C.muted }}>Why it matches</dt>
                                    <dd className="text-right">
                                        {[
                                            following.includes(open.artist.id) && 'You follow them',
                                            genres.includes(open.artist.genre) && `You like ${open.artist.genre}`,
                                            open.artist.plays > 0 && `${open.artist.plays} plays`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ') || 'New for you'}
                                    </dd>
                                </div>
                            </dl>
                            {ticketed === open.id && (
                                <p role="status" className="mt-5 rounded-xl p-3 text-sm" style={{ background: C.panel2 }}>
                                    Demo: a real app would open the ticket seller's checkout here.
                                </p>
                            )}
                            <div className="mt-6 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTicketed(open.id)}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full font-bold"
                                    style={{ background: C.coral, color: C.bg }}
                                >
                                    <Ticket className="size-5" /> Get tickets
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => downloadIcs(open)}
                                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border font-semibold"
                                        style={{ borderColor: C.line }}
                                    >
                                        <CalendarPlus className="size-5" /> Add to calendar
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={alerts.includes(open.artist.id)}
                                        onClick={() => toggle(alerts, setAlerts, open.artist.id)}
                                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border font-semibold"
                                        style={alerts.includes(open.artist.id) ? { borderColor: C.gold, color: C.gold } : { borderColor: C.line }}
                                    >
                                        {alerts.includes(open.artist.id) ? <BellRing className="size-5" /> : <Bell className="size-5" />}
                                        {alerts.includes(open.artist.id) ? 'Alerts on' : 'Alert me'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
