import '@fontsource/big-shoulders-display/700';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-display/900';
import '@fontsource/space-grotesk/400';
import '@fontsource/space-grotesk/500';
import '@fontsource/space-grotesk/700';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CreditCard, List, LogOut, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

/*
 * CONCEPT REDESIGN of the Galacticals SC website by Timasi Werema (who built the original).
 * Not the official club site. Sign-in, registration and payments are simulated in the browser:
 * no accounts are created, nothing is stored or sent, and no money changes hands.
 */

// --- Club identity (from the original site) --------------------------------------------
const C = {
    space: '#080d1e',
    panel: '#0f1631',
    panel2: '#141d3f',
    line: '#24305c',
    text: '#f0ede4',
    muted: '#a3abc4',
    gold: '#d4af37',
    orbit: '#6f9bff',
};
const display = { fontFamily: "'Big Shoulders Display', Oswald, sans-serif" };

type EventType = 'training' | 'match' | 'dropin' | 'camp' | 'social';
const TYPES: Record<EventType, { label: string; color: string }> = {
    training: { label: 'Training', color: '#6f9bff' },
    match: { label: 'Match', color: '#ff6b5e' },
    dropin: { label: 'Drop-in', color: '#ffb020' },
    camp: { label: 'Camp', color: '#d4af37' },
    social: { label: 'Social', color: '#b98cff' },
};

type ClubEvent = { id: string; date: Date; time: string; title: string; type: EventType; group: string; price: number; spots: number };

const PROGRAMS = [
    ['Future Stars Academy', 'Ages 3–7', 'First touches, coordination and a love for the game, built through play.'],
    ['Youth Development Academy', 'Ages 8–11', 'Technical mastery and tactical understanding to prepare for club soccer.'],
    ['Competitive Teams', 'Ages 9–14', 'Advanced training, match play and academy tryout preparation.'],
    ['Private Training', 'All ages', 'One-on-one sessions built around a single player’s goals.'],
];

const PLANS = {
    memberships: [
        {
            id: 'm1',
            name: '1× per week',
            price: 160,
            unit: '/month',
            points: ['One training session a week', 'Any program for your age group', 'Cancel anytime'],
        },
        {
            id: 'm2',
            name: '2× per week',
            price: 300,
            unit: '/month',
            points: ['Two training sessions a week', 'Priority on camp spots', 'Cancel anytime'],
            featured: true,
        },
        { id: 'm3', name: '3× per week', price: 420, unit: '/month', points: ['Three sessions a week', 'Monthly progress report', 'Cancel anytime'] },
    ],
    sessions: [
        { id: 's1', name: 'Drop-in session', price: 50, unit: '/session', points: ['Any open session', 'Pay as you go'] },
        {
            id: 's2',
            name: 'Unlimited drop-ins',
            price: 400,
            unit: '/month',
            points: ['Every open session this month', 'Best value for busy players'],
        },
        { id: 's3', name: 'Private lesson', price: 110, unit: '/hour', points: ['1-on-1 with a coach', 'Indoor turf field'] },
    ],
};

const FAQS = [
    ['What ages do you train?', 'Players ages 3 through 14, grouped by age and level so everyone is challenged at the right pace.'],
    [
        'How do registration and payment work?',
        'Sign in with Apple, Google or email, pick a session or plan, and pay in a couple of taps with Apple Pay, Google Pay or a card.',
    ],
    ['What should my player bring?', 'Cleats or turf shoes, shin guards, a size-appropriate ball and a water bottle.'],
    ['Can I cancel a membership?', 'Yes. Memberships are month to month and can be cancelled from your account at any time.'],
];

/** Sample schedule for the current month (concept data). */
function buildSchedule(year: number, month: number): ClubEvent[] {
    const events: ClubEvent[] = [];
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
        const date = new Date(year, month, d);
        const dow = date.getDay();
        const key = `${month}-${d}`;
        if (dow === 2 || dow === 4) {
            events.push({
                id: `${key}-a`,
                date,
                time: '5:30 PM',
                title: 'Future Stars training',
                type: 'training',
                group: 'Ages 3–7',
                price: 0,
                spots: 6,
            });
            events.push({
                id: `${key}-b`,
                date,
                time: '6:45 PM',
                title: 'Youth Development training',
                type: 'training',
                group: 'Ages 8–11',
                price: 0,
                spots: 4,
            });
        }
        if (dow === 3)
            events.push({
                id: `${key}-c`,
                date,
                time: '6:00 PM',
                title: 'Competitive team practice',
                type: 'training',
                group: 'Ages 9–14',
                price: 0,
                spots: 2,
            });
        if (dow === 6)
            events.push({
                id: `${key}-d`,
                date,
                time: '9:00 AM',
                title: 'Saturday drop-in',
                type: 'dropin',
                group: 'All ages',
                price: 50,
                spots: 12,
            });
        if (dow === 0 && d % 2 === 0)
            events.push({
                id: `${key}-e`,
                date,
                time: '1:00 PM',
                title: 'League match vs. North Texas FC',
                type: 'match',
                group: 'Competitive',
                price: 0,
                spots: 0,
            });
    }
    const campStart = Math.min(22, days - 3);
    for (let i = 0; i < 3; i++) {
        events.push({
            id: `${month}-camp-${i}`,
            date: new Date(year, month, campStart + i),
            time: '9:00 AM',
            title: `Skills camp · day ${i + 1}`,
            type: 'camp',
            group: 'Ages 6–12',
            price: 150,
            spots: 8,
        });
    }
    events.push({
        id: `${month}-social`,
        date: new Date(year, month, Math.min(28, days)),
        time: '4:00 PM',
        title: 'End-of-month family cookout',
        type: 'social',
        group: 'Everyone',
        price: 0,
        spots: 40,
    });
    return events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

// --- Small pieces --------------------------------------------------------------------------
function ClubMark({ size = 40 }: { size?: number }) {
    return (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="21" fill={C.panel2} stroke={C.gold} strokeWidth="2" />
            <ellipse cx="24" cy="24" rx="19" ry="7" fill="none" stroke={C.orbit} strokeWidth="1.6" transform="rotate(-24 24 24)" />
            <path d="M24 13l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6z" fill={C.gold} />
        </svg>
    );
}

const AppleLogo = () => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.54 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.33-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.3-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.2z" />
    </svg>
);

const GoogleLogo = () => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.9 3.25-4.71 3.25-8.09z" />
        <path
            fill="#34A853"
            d="M12 23c2.96 0 5.45-.98 7.26-2.65l-3.54-2.75c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.15-4.53H2.2v2.84A11 11 0 0 0 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.85 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.35-2.12V7.04H2.2A11 11 0 0 0 1 12c0 1.78.43 3.46 1.2 4.96l3.65-2.84z"
        />
        <path
            fill="#EA4335"
            d="M12 5.35c1.61 0 3.06.55 4.2 1.64l3.14-3.14C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.2 7.04l3.65 2.84C6.71 7.28 9.14 5.35 12 5.35z"
        />
    </svg>
);

const btnGold = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 font-bold transition-colors';

// --- Page ----------------------------------------------------------------------------------
type Tab = 'calendar' | 'upcoming' | 'payments';
type CheckoutItem = { title: string; price: number; detail: string; eventId?: string };

export default function GalacticalsConcept() {
    const today = new Date();
    const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const events = useMemo(() => buildSchedule(view.year, view.month), [view]);

    const [tab, setTab] = useState<Tab>('calendar');
    const [filters, setFilters] = useState<EventType[]>(Object.keys(TYPES) as EventType[]);
    const [selected, setSelected] = useState<Date>(today);
    const [planGroup, setPlanGroup] = useState<'memberships' | 'sessions'>('memberships');

    const [user, setUser] = useState<{ name: string; via: string } | null>(null);
    const [authOpen, setAuthOpen] = useState<null | 'signin' | 'signup'>(null);
    const [pendingAction, setPendingAction] = useState<CheckoutItem | null>(null);
    const [checkout, setCheckout] = useState<CheckoutItem | null>(null);
    const [paidStep, setPaidStep] = useState<null | string>(null);
    const [registered, setRegistered] = useState<string[]>([]);
    const [plan, setPlan] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    const visible = events.filter((e) => filters.includes(e.type));
    const dayEvents = visible.filter((e) => sameDay(e.date, selected));
    const upcoming = visible.filter((e) => e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));

    const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const firstDow = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (Date | null)[] = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1)),
    ];

    const shiftMonth = (delta: number) => {
        const d = new Date(view.year, view.month + delta, 1);
        setView({ year: d.getFullYear(), month: d.getMonth() });
        setSelected(d);
    };

    const toggleFilter = (t: EventType) => setFilters((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]));

    /** Anything that needs an account goes through here: sign in first, then continue. */
    const start = (item: CheckoutItem) => {
        if (!user) {
            setPendingAction(item);
            setAuthOpen('signin');
            return;
        }
        proceed(item);
    };

    const proceed = (item: CheckoutItem) => {
        if (item.price === 0 && item.eventId) {
            setRegistered((r) => [...r, item.eventId!]);
            return;
        }
        setPaidStep(null);
        setCheckout(item);
    };

    const signIn = (via: string) => {
        setUser({ name: via === 'Email' && email ? email.split('@')[0] : 'Demo Parent', via });
        setAuthOpen(null);
        if (pendingAction) {
            const next = pendingAction;
            setPendingAction(null);
            setTimeout(() => proceed(next), 0);
        }
    };

    const pay = (method: string) => {
        setPaidStep(method);
        if (checkout?.eventId) setRegistered((r) => [...r, checkout.eventId!]);
        if (checkout && !checkout.eventId) setPlan(checkout.title);
    };

    const registerButton = (e: ClubEvent) => {
        const done = registered.includes(e.id);
        if (e.type === 'match')
            return (
                <span className="text-sm" style={{ color: C.muted }}>
                    Team members only
                </span>
            );
        if (done)
            return (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#4ade80' }}>
                    <CircleCheck className="size-4" /> Registered
                </span>
            );
        return (
            <button
                type="button"
                onClick={() => start({ title: e.title, price: e.price, detail: `${fmtDay(e.date)} · ${e.time} · ${e.group}`, eventId: e.id })}
                className={`${btnGold} min-h-10 px-4 text-sm`}
                style={{ background: C.gold, color: C.space }}
            >
                {e.price > 0 ? `Register · $${e.price}` : 'Register'}
            </button>
        );
    };

    const EventRow = ({ e, showDate }: { e: ClubEvent; showDate?: boolean }) => (
        <li className="flex flex-wrap items-center justify-between gap-3 border-t py-4 first:border-t-0" style={{ borderColor: C.line }}>
            <div className="flex min-w-0 items-start gap-3">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: TYPES[e.type].color }} />
                <div className="min-w-0">
                    <p className="font-bold">{e.title}</p>
                    <p className="text-sm" style={{ color: C.muted }}>
                        {showDate && `${fmtDay(e.date)} · `}
                        {e.time} · {e.group} · {TYPES[e.type].label}
                        {e.spots > 0 && e.type !== 'match' && ` · ${e.spots} spots left`}
                    </p>
                </div>
            </div>
            {registerButton(e)}
        </li>
    );

    const tabBtn = (id: Tab, label: string, Icon: typeof List) => (
        <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-bold transition-colors"
            style={tab === id ? { background: C.text, color: C.space } : { color: C.muted }}
        >
            <Icon className="size-4" /> {label}
        </button>
    );

    const dialogStyle = { background: C.panel, color: C.text, borderColor: C.line, fontFamily: "'Space Grotesk', sans-serif" };

    return (
        <>
            <Head title="Galacticals SC · concept redesign">
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content="Concept redesign of a youth soccer academy website by Timasi Werema." />
            </Head>

            <div className="min-h-screen" style={{ background: C.space, color: C.text, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                {/* Concept banner */}
                <div style={{ background: C.gold, color: C.space }}>
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-bold sm:px-8">
                        <p>Concept redesign by Timasi Werema — not the official Galacticals SC site. Sign-in and payments are simulated.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: C.line, background: 'rgba(8,13,30,0.88)' }}>
                    <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
                        <a href="#top" className="flex items-center gap-3">
                            <ClubMark />
                            <span className="text-2xl font-black tracking-wide uppercase" style={display}>
                                Galacticals <span style={{ color: C.gold }}>SC</span>
                            </span>
                        </a>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
                            <a href="#programs" className="hidden py-2 hover:underline sm:inline" style={{ color: C.muted }}>
                                Programs
                            </a>
                            <a href="#hub" className="hidden py-2 hover:underline sm:inline" style={{ color: C.muted }}>
                                Schedule &amp; payments
                            </a>
                            <a href="#faq" className="hidden py-2 hover:underline sm:inline" style={{ color: C.muted }}>
                                FAQ
                            </a>
                            {user ? (
                                <span className="flex items-center gap-2">
                                    <span
                                        className="flex size-9 items-center justify-center rounded-full font-black"
                                        style={{ background: C.orbit, color: C.space }}
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden sm:inline">Hi, {user.name}</span>
                                    <button
                                        type="button"
                                        aria-label="Sign out"
                                        onClick={() => setUser(null)}
                                        className="flex size-11 items-center justify-center"
                                        style={{ color: C.muted }}
                                    >
                                        <LogOut className="size-4" />
                                    </button>
                                </span>
                            ) : (
                                <>
                                    <button type="button" onClick={() => setAuthOpen('signin')} className="min-h-11 px-2">
                                        Sign in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthOpen('signup')}
                                        className={btnGold}
                                        style={{ background: C.gold, color: C.space }}
                                    >
                                        Join the club
                                    </button>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main id="top">
                    {/* Hero */}
                    <section className="relative overflow-hidden">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 1200 520"
                            preserveAspectRatio="xMidYMid slice"
                            className="pointer-events-none absolute inset-0 h-full w-full"
                        >
                            <g fill="none" stroke={C.line} strokeWidth="2">
                                <ellipse cx="900" cy="260" rx="420" ry="140" transform="rotate(-18 900 260)" />
                                <ellipse cx="900" cy="260" rx="300" ry="96" transform="rotate(-18 900 260)" />
                                <circle cx="900" cy="260" r="70" />
                            </g>
                            {[
                                [760, 60],
                                [1100, 440],
                                [1040, 90],
                                [820, 470],
                                [1160, 230],
                            ].map(([x, y]) => (
                                <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={C.gold} />
                            ))}
                        </svg>
                        <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
                            <p className="text-sm font-bold tracking-[0.18em] uppercase" style={{ color: C.gold }}>
                                Frisco, Texas · Youth soccer academy
                            </p>
                            <h1 className="mt-4 text-[56px] leading-[0.9] font-black uppercase sm:text-8xl lg:text-[124px]" style={display}>
                                Reach beyond
                                <br />
                                <span style={{ color: C.gold }}>the stars.</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-lg" style={{ color: C.muted }}>
                                Developing confident players, intelligent athletes and future leaders through elite soccer training and competition.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href="#hub" className={btnGold} style={{ background: C.gold, color: C.space }}>
                                    See the schedule
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setAuthOpen('signup')}
                                    className={`${btnGold} border-2`}
                                    style={{ borderColor: C.text }}
                                >
                                    Join Galacticals
                                </button>
                            </div>
                            <p className="mt-10 text-2xl font-extrabold tracking-[0.2em] uppercase" style={{ ...display, color: C.orbit }}>
                                Elite · United · Limitless
                            </p>
                        </div>
                    </section>

                    {/* Programs */}
                    <section id="programs" className="scroll-mt-20 border-y" style={{ borderColor: C.line, background: C.panel }}>
                        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                            <h2 className="text-5xl font-black uppercase sm:text-6xl" style={display}>
                                Programs for every player
                            </h2>
                            <ol className="mt-10">
                                {PROGRAMS.map(([name, age, desc], i) => (
                                    <li
                                        key={name}
                                        className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t py-6"
                                        style={{ borderColor: C.line }}
                                    >
                                        <span className="w-12 text-3xl font-black" style={{ ...display, color: C.gold }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="flex-[1_1_260px] text-3xl font-extrabold uppercase" style={display}>
                                            {name}
                                        </h3>
                                        <span
                                            className="rounded-full border px-3 py-1 text-sm font-bold"
                                            style={{ borderColor: C.orbit, color: C.orbit }}
                                        >
                                            {age}
                                        </span>
                                        <p className="flex-[999_1_320px]" style={{ color: C.muted }}>
                                            {desc}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* Schedule & payments hub */}
                    <section id="hub" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-20 sm:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <h2 className="text-5xl font-black uppercase sm:text-6xl" style={display}>
                                    Schedule &amp; payments
                                </h2>
                                <p className="mt-2" style={{ color: C.muted }}>
                                    Find a session, register in one tap, and manage your plan — all in one place.
                                </p>
                            </div>
                            <div
                                role="tablist"
                                aria-label="Schedule views"
                                className="flex flex-wrap gap-1 rounded-full border p-1"
                                style={{ borderColor: C.line, background: C.panel }}
                            >
                                {tabBtn('calendar', 'Calendar', CalendarDays)}
                                {tabBtn('upcoming', 'Upcoming', List)}
                                {tabBtn('payments', 'Plans & payments', Wallet)}
                            </div>
                        </div>

                        {tab !== 'payments' && (
                            <fieldset className="mt-6 flex flex-wrap items-center gap-2">
                                <legend className="sr-only">Filter by event type</legend>
                                {(Object.keys(TYPES) as EventType[]).map((t) => {
                                    const on = filters.includes(t);
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => toggleFilter(t)}
                                            className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold"
                                            style={{ borderColor: on ? TYPES[t].color : C.line, color: on ? C.text : C.muted, opacity: on ? 1 : 0.7 }}
                                        >
                                            <span className="size-2.5 rounded-full" style={{ background: TYPES[t].color }} /> {TYPES[t].label}
                                        </button>
                                    );
                                })}
                            </fieldset>
                        )}

                        {/* Calendar */}
                        {tab === 'calendar' && (
                            <div id="panel-calendar" role="tabpanel" aria-labelledby="tab-calendar" className="mt-6 flex flex-wrap gap-6">
                                <div
                                    className="min-w-0 flex-[999_1_560px] rounded-2xl border p-4 sm:p-6"
                                    style={{ borderColor: C.line, background: C.panel }}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <button
                                            type="button"
                                            aria-label="Previous month"
                                            onClick={() => shiftMonth(-1)}
                                            className="flex size-11 items-center justify-center rounded-full border"
                                            style={{ borderColor: C.line }}
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <p className="text-2xl font-extrabold uppercase" style={display}>
                                            {monthLabel}
                                        </p>
                                        <button
                                            type="button"
                                            aria-label="Next month"
                                            onClick={() => shiftMonth(1)}
                                            className="flex size-11 items-center justify-center rounded-full border"
                                            style={{ borderColor: C.line }}
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    </div>
                                    <div
                                        className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase"
                                        style={{ color: C.muted }}
                                        aria-hidden="true"
                                    >
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                            <span key={d} className="py-2">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {cells.map((d, i) => {
                                            if (!d) return <span key={`blank-${i}`} />;
                                            const evs = visible.filter((e) => sameDay(e.date, d));
                                            const isSel = sameDay(d, selected);
                                            const isToday = sameDay(d, today);
                                            return (
                                                <button
                                                    key={d.toISOString()}
                                                    type="button"
                                                    onClick={() => setSelected(d)}
                                                    aria-pressed={isSel}
                                                    aria-label={`${fmtDay(d)}, ${evs.length} event${evs.length === 1 ? '' : 's'}`}
                                                    className="flex aspect-square min-h-11 flex-col items-center justify-start gap-1 rounded-lg p-1 text-sm font-bold sm:aspect-[1.15]"
                                                    style={{
                                                        background: isSel ? C.text : evs.length ? C.panel2 : 'transparent',
                                                        color: isSel ? C.space : C.text,
                                                        outline: isToday && !isSel ? `2px solid ${C.gold}` : 'none',
                                                        outlineOffset: '-2px',
                                                    }}
                                                >
                                                    {d.getDate()}
                                                    <span className="flex flex-wrap justify-center gap-0.5">
                                                        {evs.slice(0, 4).map((e) => (
                                                            <span
                                                                key={e.id}
                                                                className="size-1.5 rounded-full"
                                                                style={{ background: TYPES[e.type].color }}
                                                            />
                                                        ))}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-[1_1_320px] rounded-2xl border p-6" style={{ borderColor: C.line, background: C.panel }}>
                                    <p className="text-sm font-bold tracking-[0.12em] uppercase" style={{ color: C.gold }}>
                                        {fmtDay(selected)}
                                    </p>
                                    {dayEvents.length ? (
                                        <ul className="mt-2">
                                            {dayEvents.map((e) => (
                                                <EventRow key={e.id} e={e} />
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-4" style={{ color: C.muted }}>
                                            No sessions this day. Pick a day with dots, or check the Upcoming tab.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        {tab === 'upcoming' && (
                            <div
                                id="panel-upcoming"
                                role="tabpanel"
                                aria-labelledby="tab-upcoming"
                                className="mt-6 rounded-2xl border px-6 py-2"
                                style={{ borderColor: C.line, background: C.panel }}
                            >
                                {upcoming.length ? (
                                    <ul>
                                        {upcoming.map((e) => (
                                            <EventRow key={e.id} e={e} showDate />
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="py-6" style={{ color: C.muted }}>
                                        Nothing left this month — use the calendar to look ahead.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Plans & payments */}
                        {tab === 'payments' && (
                            <div id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" className="mt-6">
                                {plan && (
                                    <p
                                        role="status"
                                        className="mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 font-bold"
                                        style={{ borderColor: '#4ade80', color: '#4ade80' }}
                                    >
                                        <CircleCheck className="size-5" /> Active plan: {plan}
                                    </p>
                                )}
                                <div
                                    role="radiogroup"
                                    aria-label="Plan type"
                                    className="mb-6 inline-flex gap-1 rounded-full border p-1"
                                    style={{ borderColor: C.line }}
                                >
                                    {(
                                        [
                                            ['memberships', 'Monthly memberships'],
                                            ['sessions', 'Drop-ins & privates'],
                                        ] as const
                                    ).map(([id, label]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            role="radio"
                                            aria-checked={planGroup === id}
                                            onClick={() => setPlanGroup(id)}
                                            className="min-h-10 rounded-full px-4 text-sm font-bold"
                                            style={planGroup === id ? { background: C.gold, color: C.space } : { color: C.muted }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <ul className="space-y-4">
                                    {PLANS[planGroup].map((p) => (
                                        <li
                                            key={p.id}
                                            className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border p-6"
                                            style={{ borderColor: 'featured' in p && p.featured ? C.gold : C.line, background: C.panel }}
                                        >
                                            <div className="min-w-[180px] flex-1">
                                                <h3 className="text-3xl font-extrabold uppercase" style={display}>
                                                    {p.name}
                                                    {'featured' in p && p.featured && (
                                                        <span
                                                            className="ml-3 rounded-full px-2.5 py-0.5 align-middle text-xs font-bold"
                                                            style={{ background: C.gold, color: C.space, fontFamily: 'inherit' }}
                                                        >
                                                            Most popular
                                                        </span>
                                                    )}
                                                </h3>
                                                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: C.muted }}>
                                                    {p.points.map((pt) => (
                                                        <li key={pt} className="flex items-center gap-1.5">
                                                            <Check className="size-4" style={{ color: C.gold }} /> {pt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <p className="text-4xl font-black" style={display}>
                                                ${p.price}
                                                <span className="text-base font-bold" style={{ color: C.muted }}>
                                                    {p.unit}
                                                </span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    start({
                                                        title: p.name,
                                                        price: p.price,
                                                        detail: `${p.unit === '/month' ? 'Billed monthly' : 'One-time'} · cancel anytime`,
                                                    })
                                                }
                                                className={btnGold}
                                                style={{ background: C.text, color: C.space }}
                                            >
                                                {plan === p.name ? 'Current plan' : 'Choose'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-sm" style={{ color: C.muted }}>
                                    Prices shown are sample data for this concept.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="scroll-mt-20 border-t" style={{ borderColor: C.line }}>
                        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                            <h2 className="text-5xl font-black uppercase sm:text-6xl" style={display}>
                                Questions
                            </h2>
                            <div className="mt-8 border-y" style={{ borderColor: C.line }}>
                                {FAQS.map(([q, a]) => (
                                    <details
                                        key={q}
                                        className="group border-t first:border-t-0 [&_summary::-webkit-details-marker]:hidden"
                                        style={{ borderColor: C.line }}
                                    >
                                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold">
                                            {q}
                                            <ChevronDown
                                                className="size-5 shrink-0 transition-transform group-open:rotate-180"
                                                style={{ color: C.gold }}
                                            />
                                        </summary>
                                        <p className="pb-5" style={{ color: C.muted }}>
                                            {a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div
                        className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.muted }}
                    >
                        <p>
                            Concept redesign by Timasi Werema, who built the original Galacticals SC site. Not affiliated with or endorsed by the
                            club.
                        </p>
                        <Link
                            href="/#contact"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            style={{ color: C.text }}
                        >
                            Want a site like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Sign in / sign up (simulated) */}
            <Dialog open={!!authOpen} onOpenChange={(o) => !o && (setAuthOpen(null), setPendingAction(null))}>
                <DialogContent className="max-w-md border" style={dialogStyle}>
                    <div className="flex flex-col items-center text-center">
                        <ClubMark size={52} />
                        <DialogTitle className="mt-3 text-3xl font-black uppercase" style={display}>
                            {authOpen === 'signup' ? 'Join Galacticals' : 'Welcome back'}
                        </DialogTitle>
                        <DialogDescription style={{ color: C.muted }}>
                            {pendingAction
                                ? `Sign in to continue with “${pendingAction.title}”.`
                                : 'One tap with Apple or Google. No new password to remember.'}
                        </DialogDescription>
                    </div>
                    <div className="mt-2 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => signIn('Apple')}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-black font-bold text-white"
                        >
                            <AppleLogo /> {authOpen === 'signup' ? 'Sign up' : 'Sign in'} with Apple
                        </button>
                        <button
                            type="button"
                            onClick={() => signIn('Google')}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#1f1f1f]"
                        >
                            <GoogleLogo /> {authOpen === 'signup' ? 'Sign up' : 'Sign in'} with Google
                        </button>
                        <div className="my-1 flex items-center gap-3 text-xs uppercase" style={{ color: C.muted }}>
                            <span className="h-px flex-1" style={{ background: C.line }} /> or{' '}
                            <span className="h-px flex-1" style={{ background: C.line }} />
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                signIn('Email');
                            }}
                            className="flex flex-col gap-3"
                        >
                            <label className="flex flex-col gap-1.5 text-left text-sm font-bold">
                                Email
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="parent@example.com"
                                    className="min-h-12 rounded-xl border bg-transparent px-4 text-base font-normal"
                                    style={{ borderColor: C.line }}
                                />
                            </label>
                            <button type="submit" className={btnGold} style={{ background: C.gold, color: C.space }}>
                                Email me a sign-in link
                            </button>
                        </form>
                        <p className="text-center text-xs" style={{ color: C.muted }}>
                            Demo only — no account is created and nothing is sent.
                        </p>
                        <button
                            type="button"
                            onClick={() => setAuthOpen(authOpen === 'signup' ? 'signin' : 'signup')}
                            className="min-h-11 text-sm font-bold underline underline-offset-4"
                        >
                            {authOpen === 'signup' ? 'Already a member? Sign in' : 'New here? Join the club'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout (simulated) */}
            <Dialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)}>
                <DialogContent className="max-w-md border" style={dialogStyle}>
                    {paidStep ? (
                        <div className="flex flex-col items-center py-4 text-center" role="status">
                            <CircleCheck className="size-14" style={{ color: '#4ade80' }} />
                            <DialogTitle className="mt-3 text-3xl font-black uppercase" style={display}>
                                You're in!
                            </DialogTitle>
                            <DialogDescription style={{ color: C.muted }}>
                                {checkout?.title} is confirmed. On the real site a receipt would go to your email. (Demo — paid with {paidStep},
                                nothing was charged.)
                            </DialogDescription>
                            <button
                                type="button"
                                onClick={() => setCheckout(null)}
                                className={`${btnGold} mt-6`}
                                style={{ background: C.gold, color: C.space }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        checkout && (
                            <>
                                <DialogTitle className="text-3xl font-black uppercase" style={display}>
                                    Checkout
                                </DialogTitle>
                                <DialogDescription style={{ color: C.muted }}>Simulated payment — no card details are collected.</DialogDescription>
                                <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.panel2 }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-bold">{checkout.title}</p>
                                            <p className="text-sm" style={{ color: C.muted }}>
                                                {checkout.detail}
                                            </p>
                                        </div>
                                        <p className="text-2xl font-black" style={display}>
                                            ${checkout.price}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => pay('Apple Pay')}
                                        className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-black font-bold text-white"
                                    >
                                        <AppleLogo /> Pay
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => pay('Google Pay')}
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#1f1f1f]"
                                    >
                                        <GoogleLogo /> Pay
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => pay('card')}
                                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border font-bold"
                                        style={{ borderColor: C.line }}
                                    >
                                        <CreditCard className="size-5" /> Pay with card
                                    </button>
                                </div>
                            </>
                        )
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
