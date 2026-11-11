import '@fontsource-variable/fraunces/opsz';
import '@fontsource-variable/fraunces/opsz-italic';
import '@fontsource/space-grotesk/400';
import '@fontsource/space-grotesk/500';
import '@fontsource/space-grotesk/700';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarPlus, ExternalLink, LoaderCircle, LocateFixed, Music2, Ticket, X } from 'lucide-react';
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

/*
 * Encore Live: real R&B shows near you, based on what you actually play on Spotify.
 * Spotify login (PKCE) and listening history stay in the browser. Only artist names and a
 * location go to /live/shows, which searches Ticketmaster with a server-side key.
 */

// Dark by default; a light look when the visitor's device is in light mode.
const C = {
    bg: 'var(--el-bg)',
    panel: 'var(--el-panel)',
    line: 'var(--el-line)',
    text: 'var(--el-text)',
    soft: 'var(--el-soft)',
    wine: 'var(--el-wine)',
    gold: 'var(--el-gold)',
};
const THEME = `:root:has(.el){color-scheme:dark;--el-bg:#120a0e;--el-panel:#1c1016;--el-line:#3a2430;--el-text:#f7ece9;--el-soft:#c9adb4;--el-wine:#d94a7a;--el-gold:#e8b04b}
@media (prefers-color-scheme: light){:root:has(.el){color-scheme:light;--el-bg:#fbf5f1;--el-panel:#ffffff;--el-line:#ecd9d6;--el-text:#22121a;--el-soft:#6b4f58;--el-wine:#a3214f;--el-gold:#94640f}}
@keyframes el-spin{to{transform:rotate(360deg)}}
.el-spin{animation:el-spin 6s linear infinite;transform-origin:50% 50%}
@media (prefers-reduced-motion: reduce){.el-spin{animation:none}}`;
const serif: CSSProperties = { fontFamily: "'Fraunces Variable', Georgia, serif" };

type Props = { spotifyClientId: string | null; redirectUri: string; showsConfigured: boolean };
type Artist = { id?: string; name: string; score: number; plays: number; genres: string[]; rnb: boolean; on: boolean };
type Show = {
    id: string;
    name: string;
    performers: string[];
    date: string;
    time: string | null;
    venue: string | null;
    city: string;
    distance: number | null;
    url: string | null;
    image: string | null;
    price: { min: number | null; max: number | null; currency: string } | null;
    matched?: string;
};
type Where = { lat: number; lng: number; label: string } | { zip: string; label: string } | null;

const RNB = /r&b|rnb|soul|quiet storm|new jack|slow jam/i;
const SCOPES = 'user-read-recently-played user-top-read';
const MAX_ARTISTS = 15;

/* ---------------------------------------------------------------- Spotify (PKCE, all in the browser) */

const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

function randomString(n: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function startSpotifyLogin(clientId: string, redirectUri: string) {
    const verifier = randomString(64);
    const state = randomString(16);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    sessionStorage.setItem('el_pkce', JSON.stringify({ verifier, state }));
    const q = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: SCOPES,
        state,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${q}`;
}

class SpotifyError extends Error {
    constructor(public status: number) {
        super(`Spotify ${status}`);
    }
}

async function spotify<T>(token: string, path: string): Promise<T> {
    const r = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new SpotifyError(r.status);
    return r.json() as Promise<T>;
}

/** Remove ?code=... from the address bar, through Inertia so its own copy of the URL changes too.
 *  Waits until Inertia has recorded the page in history (calling it earlier throws). */
function cleanAddress() {
    if (!(window.history.state as { page?: unknown } | null)?.page) return void setTimeout(cleanAddress, 50);
    router.replace({ url: '/live', preserveState: true });
}

/** The in-flight Spotify sign-in, shared across re-mounts of the page. */
let spotifyReturn: Promise<{ token: string } | { error: string }> | null = null;

async function exchangeCode(
    code: string,
    state: string | null,
    redirectUri: string,
    clientId: string | null,
): Promise<{ token: string } | { error: string }> {
    const pkce = JSON.parse(sessionStorage.getItem('el_pkce') ?? 'null') as { verifier: string; state: string } | null;
    sessionStorage.removeItem('el_pkce');
    if (!clientId || !pkce || pkce.state !== state) return { error: 'That Spotify sign-in link was stale. Connect again.' };
    try {
        const r = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                code_verifier: pkce.verifier,
            }),
        });
        if (!r.ok) return { error: 'Spotify sign-in did not finish. Try connecting again.' };
        const j = (await r.json()) as { access_token: string; expires_in: number };
        sessionStorage.setItem('el_token', JSON.stringify({ access: j.access_token, exp: Date.now() + j.expires_in * 1000 - 60000 }));
        return { token: j.access_token };
    } catch {
        return { error: 'Could not reach Spotify. Try again, or type your artists below.' };
    }
}

type SpArtist = { id: string; name: string; genres?: string[] };

/** Rank artists by what you play now (recent + last 4 weeks) and lately (last 6 months), and flag R&B ones. */
async function loadListening(token: string): Promise<Artist[]> {
    const [recent, short, medium] = await Promise.all([
        spotify<{ items: { track: { artists: SpArtist[] } }[] }>(token, '/me/player/recently-played?limit=50'),
        spotify<{ items: SpArtist[] }>(token, '/me/top/artists?time_range=short_term&limit=50'),
        spotify<{ items: SpArtist[] }>(token, '/me/top/artists?time_range=medium_term&limit=50'),
    ]);
    const map = new Map<string, Artist>();
    const get = (a: SpArtist) => {
        if (!map.has(a.id)) map.set(a.id, { id: a.id, name: a.name, score: 0, plays: 0, genres: a.genres ?? [], rnb: false, on: false });
        const x = map.get(a.id)!;
        if (a.genres?.length) x.genres = a.genres;
        return x;
    };
    short.items.forEach((a, i) => (get(a).score += (50 - i) * 2));
    medium.items.forEach((a, i) => (get(a).score += 50 - i));
    recent.items.forEach((it) =>
        it.track.artists.forEach((a) => {
            const x = get(a);
            x.plays += 1;
            x.score += 4;
        }),
    );

    // Recently played tracks don't include genres: look those artists up (50 per request).
    const missing = [...map.values()].filter((a) => a.genres.length === 0 && a.id).map((a) => a.id!);
    for (let i = 0; i < missing.length; i += 50) {
        const res = await spotify<{ artists: SpArtist[] }>(token, `/artists?ids=${missing.slice(i, i + 50).join(',')}`).catch(() => ({
            artists: [],
        }));
        res.artists.forEach((a) => a && get(a));
    }

    const list = [...map.values()].map((a) => ({ ...a, rnb: a.genres.some((g) => RNB.test(g)) })).sort((a, b) => b.score - a.score);
    let picked = 0;
    return list.map((a) => ({ ...a, on: a.rnb && picked++ < MAX_ARTISTS }));
}

/* ---------------------------------------------------------------- helpers */

function showDate(s: Show) {
    const d = new Date(`${s.date}T${s.time ?? '20:00:00'}`);
    return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        mon: d.toLocaleDateString('en-US', { month: 'short' }),
        time: s.time ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Time TBA',
    };
}

function downloadIcs(s: Show) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const start = new Date(`${s.date}T${s.time ?? '20:00:00'}`);
    const end = new Date(start.getTime() + 3 * 3600000);
    const esc = (t: string) => t.replace(/[\\,;]/g, (c) => `\\${c}`);
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Encore Live//EN',
        'BEGIN:VEVENT',
        `UID:${s.id}@encore-live`,
        `DTSTAMP:${new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '')}`,
        `DTSTART:${local(start)}`,
        `DTEND:${local(end)}`,
        `SUMMARY:${esc(s.name)}`,
        `LOCATION:${esc([s.venue, s.city].filter(Boolean).join(', '))}`,
        `DESCRIPTION:${esc(s.url ? `Tickets: ${s.url}` : 'Found with Encore Live')}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

const money = (n: number | null) => (n == null ? '' : `$${Math.round(n)}`);

function Vinyl() {
    return (
        <svg viewBox="0 0 200 200" className="el-spin size-40 shrink-0 sm:size-56" aria-hidden="true">
            <circle cx="100" cy="100" r="98" fill="#0b0608" />
            {[86, 74, 62, 50].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#2a1820" strokeWidth="1.5" />
            ))}
            <circle cx="100" cy="100" r="32" style={{ fill: C.wine }} />
            <path d="M100 68 A32 32 0 0 1 132 100 L100 100 Z" style={{ fill: C.gold }} opacity=".9" />
            <circle cx="100" cy="100" r="4" fill="#0b0608" />
        </svg>
    );
}

const btn =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition-opacity hover:opacity-90 disabled:opacity-40';

function ShowRow({ s }: { s: Show }) {
    const d = showDate(s);
    return (
        <li className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b py-5" style={{ borderColor: C.line }}>
            <div className="w-16 shrink-0 text-center" aria-label={`${d.day} ${d.mon} ${d.num}`}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gold }}>
                    {d.day}
                </p>
                <p className="text-4xl leading-none" style={serif}>
                    {d.num}
                </p>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.soft }}>
                    {d.mon}
                </p>
            </div>
            <div className="min-w-0 flex-[1_1_260px]">
                <p className="text-xl leading-snug font-semibold" style={serif}>
                    {s.name}
                </p>
                <p className="mt-1 text-sm" style={{ color: C.soft }}>
                    {[s.venue, s.city, s.distance != null ? `${s.distance} mi` : null, d.time].filter(Boolean).join(' · ')}
                </p>
                {s.matched && (
                    <p className="mt-1 text-sm font-semibold" style={{ color: C.wine }}>
                        Because you play {s.matched}
                    </p>
                )}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                {s.price?.min != null && (
                    <span className="mr-2 text-sm" style={{ color: C.soft }}>
                        From <b style={{ color: C.text }}>{money(s.price.min)}</b>
                    </span>
                )}
                {s.url && (
                    <a
                        href={s.url}
                        target="_blank"
                        rel="noopener"
                        className={`${btn} min-h-11 px-5 text-sm`}
                        style={{ background: C.wine, color: '#fff' }}
                    >
                        <Ticket className="size-4" /> Tickets
                    </a>
                )}
                <button
                    type="button"
                    onClick={() => downloadIcs(s)}
                    className={`${btn} min-h-11 border-2 px-4 text-sm`}
                    style={{ borderColor: C.line }}
                    aria-label={`Add ${s.name} to calendar`}
                >
                    <CalendarPlus className="size-4" />
                </button>
            </div>
        </li>
    );
}

/* ---------------------------------------------------------------- page */

export default function Live({ spotifyClientId, redirectUri, showsConfigured }: Props) {
    const [token, setToken] = useState<string | null>(null);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [source, setSource] = useState<'spotify' | 'typed' | null>(null);
    const [typed, setTyped] = useState('');
    const [where, setWhere] = useState<Where>(null);
    const [zip, setZip] = useState('');
    const [radius, setRadius] = useState(75);
    const [busy, setBusy] = useState<'' | 'spotify' | 'shows' | 'locate'>('');
    const [error, setError] = useState('');
    const [results, setResults] = useState<{ yours: Show[]; more: Show[] } | null>(null);

    const spotifyError = (e: unknown) =>
        e instanceof SpotifyError && e.status === 403
            ? "Spotify didn't let this account in. While the app is in Spotify's development mode, only accounts added in the Spotify dashboard can connect. Type your artists below instead."
            : e instanceof SpotifyError && e.status === 401
              ? 'Your Spotify session expired. Connect again.'
              : 'Could not reach Spotify. Try again, or type your artists below.';

    const loadFromToken = async (t: string) => {
        setBusy('spotify');
        setError('');
        try {
            const list = await loadListening(t);
            setArtists(list);
            setSource('spotify');
        } catch (e) {
            setError(spotifyError(e));
            if (e instanceof SpotifyError && e.status === 401) sessionStorage.removeItem('el_token');
        } finally {
            setBusy('');
        }
    };

    // Coming back from Spotify: swap the one-time code for a token (kept in this tab only), clean the address bar,
    // then read the listening history. The exchange lives outside the component, so a re-mount can't lose it.
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const code = q.get('code');
        const denied = q.get('error');
        if ((code || denied) && !spotifyReturn) {
            spotifyReturn = denied
                ? Promise.resolve({ error: 'Spotify connection was cancelled.' })
                : exchangeCode(code!, q.get('state'), redirectUri, spotifyClientId);
            setTimeout(cleanAddress, 0);
        }
        if (spotifyReturn) {
            setBusy('spotify');
            void spotifyReturn.then((r) => {
                spotifyReturn = null;
                if ('error' in r) {
                    setBusy('');
                    setError(r.error);
                } else {
                    setToken(r.token);
                    void loadFromToken(r.token);
                }
            });
            return;
        }
        // Already connected in this tab (e.g. after a reload): reuse the token.
        const saved = sessionStorage.getItem('el_token');
        if (saved) {
            const { access, exp } = JSON.parse(saved) as { access: string; exp: number };
            if (exp > Date.now()) {
                setToken(access);
                void loadFromToken(access);
                return;
            }
            sessionStorage.removeItem('el_token');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const disconnect = () => {
        sessionStorage.removeItem('el_token');
        setToken(null);
        setArtists([]);
        setSource(null);
        setResults(null);
    };

    const applyTyped = (e: FormEvent) => {
        e.preventDefault();
        const names = typed
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (!names.length) return;
        setArtists(names.slice(0, MAX_ARTISTS).map((name) => ({ name, score: 0, plays: 0, genres: [], rnb: true, on: true })));
        setSource('typed');
        setResults(null);
    };

    const locate = () => {
        if (!navigator.geolocation) return setError('Your browser cannot share location. Enter a ZIP code instead.');
        setBusy('locate');
        navigator.geolocation.getCurrentPosition(
            (p) => {
                setWhere({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Near you' });
                setBusy('');
            },
            () => {
                setBusy('');
                setError('Location was not shared. Enter a ZIP code instead.');
            },
            { timeout: 10000, maximumAge: 600000 },
        );
    };

    const toggle = (i: number) =>
        setArtists((list) => {
            const on = list.filter((a) => a.on).length;
            return list.map((a, j) => (j === i ? { ...a, on: a.on ? false : on < MAX_ARTISTS } : a));
        });

    const chosen = artists.filter((a) => a.on);

    const findShows = async () => {
        setError('');
        setBusy('shows');
        const q = new URLSearchParams();
        chosen.forEach((a) => q.append('artists[]', a.name));
        if (where && 'lat' in where) {
            q.set('lat', String(where.lat));
            q.set('lng', String(where.lng));
        } else if (/^\d{5}$/.test(zip)) q.set('zip', zip);
        q.set('radius', String(radius));
        try {
            const r = await fetch(`/live/shows?${q}`, { headers: { Accept: 'application/json' } });
            if (r.status === 503) throw new Error('Show search is not connected yet (the site owner needs to add a Ticketmaster key).');
            if (r.status === 429) throw new Error('Too many searches. Wait a minute and try again.');
            if (!r.ok) throw new Error('Something went wrong searching for shows. Try again.');
            setResults(await r.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong.');
        } finally {
            setBusy('');
        }
    };

    const field = 'min-h-12 rounded-xl border-2 px-4 text-base outline-none focus-visible:ring-2';
    const fieldStyle = { background: C.panel, borderColor: C.line, color: C.text };
    const whereLabel = where?.label ?? (/^\d{5}$/.test(zip) ? `ZIP ${zip}` : 'Dallas (default)');

    return (
        <>
            <Head title="Encore Live: R&B shows near you">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div className="el min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                <div className="border-b text-sm" style={{ borderColor: C.line }}>
                    <div
                        className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 sm:px-8"
                        style={{ color: C.soft }}
                    >
                        <p>A Timasi Werema project. Real shows from Ticketmaster; your Spotify data stays in your browser.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <main className="mx-auto max-w-[1100px] px-5 sm:px-8">
                    {/* Hero */}
                    <section className="flex flex-col items-start gap-8 py-12 sm:flex-row sm:items-center sm:py-16">
                        <div className="flex-1">
                            <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.gold }}>
                                Encore Live · R&amp;B
                            </p>
                            <h1 className="mt-3 text-5xl leading-[1.02] sm:text-7xl" style={serif}>
                                The artists on your rotation, <em style={{ color: C.wine }}>live near you.</em>
                            </h1>
                            <p className="mt-5 max-w-xl text-lg" style={{ color: C.soft }}>
                                Connect Spotify and Encore pulls the R&amp;B and soul you have been playing lately, then finds their upcoming shows
                                nearby, plus more R&amp;B nights worth a ticket.
                            </p>
                        </div>
                        <Vinyl />
                    </section>

                    {/* Step 1: artists */}
                    <section aria-labelledby="step1" className="border-t py-10" style={{ borderColor: C.line }}>
                        <h2 id="step1" className="text-3xl" style={serif}>
                            1. Your artists
                        </h2>

                        {source !== 'spotify' && (
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                {spotifyClientId ? (
                                    <button
                                        type="button"
                                        onClick={() => void startSpotifyLogin(spotifyClientId, redirectUri)}
                                        disabled={busy === 'spotify'}
                                        className={btn}
                                        style={{ background: '#1db954', color: '#0b0608' }}
                                    >
                                        {busy === 'spotify' ? <LoaderCircle className="size-5 animate-spin" /> : <Music2 className="size-5" />}
                                        {busy === 'spotify' ? 'Reading your listening...' : 'Connect Spotify'}
                                    </button>
                                ) : (
                                    <p className="rounded-xl border-2 px-4 py-3 text-sm" style={{ borderColor: C.line, color: C.soft }}>
                                        Spotify connect isn't switched on yet. Type your artists instead.
                                    </p>
                                )}
                                <span className="text-sm" style={{ color: C.soft }}>
                                    or type them:
                                </span>
                            </div>
                        )}

                        {source !== 'spotify' && (
                            <form onSubmit={applyTyped} className="mt-3 flex max-w-2xl flex-wrap gap-2">
                                <label className="min-w-0 flex-[1_1_280px]">
                                    <span className="sr-only">Artists, separated by commas</span>
                                    <input
                                        value={typed}
                                        onChange={(e) => setTyped(e.target.value)}
                                        placeholder="e.g. SZA, Brent Faiyaz, Victoria Monét"
                                        className={`${field} w-full`}
                                        style={fieldStyle}
                                    />
                                </label>
                                <button type="submit" className={`${btn} border-2`} style={{ borderColor: C.text }}>
                                    Use these
                                </button>
                            </form>
                        )}

                        {source === 'spotify' && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm" style={{ color: C.soft }}>
                                <span>
                                    From your Spotify: recent plays + top artists.{' '}
                                    {artists.some((a) => a.rnb)
                                        ? 'R&B and soul are picked for you; tap to change.'
                                        : "Spotify didn't tag any of these as R&B, so pick the ones you want."}
                                </span>
                                <button
                                    type="button"
                                    onClick={disconnect}
                                    className="inline-flex min-h-10 items-center gap-1 font-bold underline underline-offset-4"
                                    style={{ color: C.text }}
                                >
                                    <X className="size-4" /> Disconnect
                                </button>
                            </div>
                        )}

                        {artists.length > 0 && (
                            <>
                                <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Artists (${chosen.length} of ${MAX_ARTISTS} picked)`}>
                                    {artists.slice(0, source === 'spotify' ? 30 : MAX_ARTISTS).map((a, i) => (
                                        <li key={a.id ?? a.name}>
                                            <button
                                                type="button"
                                                aria-pressed={a.on}
                                                onClick={() => toggle(i)}
                                                className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold"
                                                style={
                                                    a.on
                                                        ? { background: C.wine, borderColor: C.wine, color: '#fff' }
                                                        : { borderColor: C.line, color: C.soft }
                                                }
                                                title={a.genres.slice(0, 3).join(', ') || undefined}
                                            >
                                                {a.name}
                                                {a.plays > 0 && <span className="text-xs opacity-80">{a.plays}×</span>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-3 text-sm" style={{ color: C.soft }}>
                                    {chosen.length} of {MAX_ARTISTS} picked
                                    {source === 'spotify' && token && ' · artist data from Spotify'}
                                </p>
                            </>
                        )}
                    </section>

                    {/* Step 2: where */}
                    <section aria-labelledby="step2" className="border-t py-10" style={{ borderColor: C.line }}>
                        <h2 id="step2" className="text-3xl" style={serif}>
                            2. Where
                        </h2>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={locate}
                                disabled={busy === 'locate'}
                                className={`${btn} border-2`}
                                style={{ borderColor: C.line }}
                            >
                                {busy === 'locate' ? <LoaderCircle className="size-5 animate-spin" /> : <LocateFixed className="size-5" />} Use my
                                location
                            </button>
                            <label>
                                <span className="sr-only">ZIP code</span>
                                <input
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={zip}
                                    onChange={(e) => {
                                        setZip(e.target.value.replace(/\D/g, ''));
                                        setWhere(null);
                                    }}
                                    placeholder="ZIP code"
                                    className={`${field} w-36`}
                                    style={fieldStyle}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm" style={{ color: C.soft }}>
                                Within
                                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={field} style={fieldStyle}>
                                    {[25, 50, 75, 150, 250].map((r) => (
                                        <option key={r} value={r}>
                                            {r} miles
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <p className="mt-3 text-sm" style={{ color: C.soft }}>
                            Searching: <b style={{ color: C.text }}>{whereLabel}</b>
                        </p>
                    </section>

                    {/* Step 3: shows */}
                    <section aria-labelledby="step3" className="border-t py-10" style={{ borderColor: C.line }}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 id="step3" className="text-3xl" style={serif}>
                                3. Shows
                            </h2>
                            <button
                                type="button"
                                onClick={() => void findShows()}
                                disabled={busy === 'shows'}
                                className={btn}
                                style={{ background: C.gold, color: '#120a0e' }}
                            >
                                {busy === 'shows' ? <LoaderCircle className="size-5 animate-spin" /> : <Ticket className="size-5" />}
                                {chosen.length ? `Find shows for ${chosen.length} artist${chosen.length > 1 ? 's' : ''}` : 'Find R&B shows near me'}
                            </button>
                        </div>
                        {!showsConfigured && (
                            <p className="mt-3 text-sm" style={{ color: C.soft }}>
                                Note: show search is not connected yet on this site.
                            </p>
                        )}

                        {error && (
                            <p role="alert" className="mt-5 rounded-xl border-2 px-4 py-3" style={{ borderColor: C.wine }}>
                                {error}
                            </p>
                        )}

                        {results && (
                            <div aria-live="polite">
                                {chosen.length > 0 && (
                                    <>
                                        <h3 className="mt-8 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.gold }}>
                                            Your artists in concert
                                        </h3>
                                        {results.yours.length ? (
                                            <ul className="border-t" style={{ borderColor: C.line }}>
                                                {results.yours.map((s) => (
                                                    <ShowRow key={s.id} s={s} />
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-3" style={{ color: C.soft }}>
                                                None of your picks have shows within {radius} miles right now. Try a bigger radius, or check the
                                                R&amp;B nights below.
                                            </p>
                                        )}
                                    </>
                                )}
                                <h3 className="mt-10 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.gold }}>
                                    More R&amp;B near you
                                </h3>
                                {results.more.length ? (
                                    <ul className="border-t" style={{ borderColor: C.line }}>
                                        {results.more.map((s) => (
                                            <ShowRow key={s.id} s={s} />
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-3" style={{ color: C.soft }}>
                                        No other R&amp;B shows listed nearby right now.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div className="mx-auto flex max-w-[1100px] flex-wrap justify-between gap-4 px-5 py-8 text-sm sm:px-8" style={{ color: C.soft }}>
                        <p>
                            Show listings and tickets from{' '}
                            <a
                                href="https://www.ticketmaster.com"
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center gap-1 underline"
                            >
                                Ticketmaster <ExternalLink className="size-3" />
                            </a>
                            . Listening data from Spotify is read in your browser and never stored.
                        </p>
                        <Link href="/privacy" className="underline">
                            Privacy
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
