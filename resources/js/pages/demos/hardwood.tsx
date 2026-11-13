import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/share-tech-mono/400.css';

import { CountUp, Marquee, Typewriter, useParallax, useReveal, useScrollProgress } from '@/components/motion';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Menu, X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useRef, useState } from 'react';

/*
 * DEMO: "Hardwood Performance Lab", a fictional basketball training facility in Dallas.
 * This is the original look of Timasi's portfolio (maple court, navy, royal blue, LED scoreboard),
 * kept as a demo for sports and fitness clients. Everything here is made up.
 */

// Dark "court at night" by default; the maple-court look when the visitor's device is in light mode.
const THEME = `:root:has(.hw){color-scheme:dark;--hw-maple:#0b0f17;--hw-maple-light:#131a26;--hw-line:#2a3548;--hw-ink:#eef1f6;--hw-soft:#c5ccd8;--hw-muted:#8f9aab;--hw-navy:#10284a;--hw-navy-deep:#0a1b33;--hw-navy-line:#2b4a75;--hw-royal:#3d8bff;--hw-royal-dark:#2a74e6;--hw-silver:#c4ccd3;--hw-led:#6cb8ff;--hw-rule:#3a5683;--hw-strong:#e6edf7;--hw-on-navy:#fbf4e6}
@media (prefers-color-scheme: light){:root:has(.hw){color-scheme:light;--hw-maple:#f1e4cc;--hw-maple-light:#fbf4e6;--hw-line:#c9b999;--hw-ink:#17130e;--hw-soft:#3d3328;--hw-muted:#6b5d4c;--hw-navy:#0b2545;--hw-navy-deep:#071a33;--hw-navy-line:#26426b;--hw-royal:#0b5fcf;--hw-royal-dark:#084aa3;--hw-silver:#c4ccd3;--hw-led:#6cb8ff;--hw-rule:#0b2545;--hw-strong:#0b2545;--hw-on-navy:#fbf4e6}}
.hw{--font-display:'Anton','Impact',sans-serif;--font-cond:'Barlow Condensed','Arial Narrow',sans-serif;--font-body:'Barlow',system-ui,sans-serif;--font-led:'Share Tech Mono',ui-monospace,monospace}
.hw .display{font-family:var(--font-display);text-transform:uppercase;line-height:.92}
.hw .cond{font-family:var(--font-cond);text-transform:uppercase;letter-spacing:.1em;font-weight:700}
.hw .led{font-family:var(--font-led)}
.hw .pill{display:inline-flex;min-height:54px;align-items:center;gap:.5rem;border-radius:999px;padding:0 1.75rem;font-family:var(--font-cond);font-weight:700;font-size:1.25rem;letter-spacing:.06em;text-transform:uppercase;transition:background .15s,color .15s}
.hw .pill-solid{background:var(--hw-royal);color:#fff}.hw .pill-solid:hover{background:var(--hw-royal-dark)}
.hw .pill-outline{border:2px solid var(--hw-rule);color:var(--hw-strong)}.hw .pill-outline:hover{background:var(--hw-navy);color:var(--hw-on-navy)}
.hw .pill-light{border:2px solid var(--hw-silver);color:var(--hw-on-navy)}.hw .pill-light:hover{background:var(--hw-on-navy);color:var(--hw-navy)}
.hw .sheen{color:var(--hw-royal);background:linear-gradient(100deg,var(--hw-royal),var(--hw-led) 55%,var(--hw-royal));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:hw-sheen 6s ease-in-out infinite}
@keyframes hw-sheen{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@media (prefers-reduced-motion: reduce){.hw .sheen{animation:none}}`;

const C = {
    maple: 'var(--hw-maple)',
    mapleLight: 'var(--hw-maple-light)',
    line: 'var(--hw-line)',
    ink: 'var(--hw-ink)',
    soft: 'var(--hw-soft)',
    muted: 'var(--hw-muted)',
    navy: 'var(--hw-navy)',
    navyDeep: 'var(--hw-navy-deep)',
    navyLine: 'var(--hw-navy-line)',
    royal: 'var(--hw-royal)',
    silver: 'var(--hw-silver)',
    led: 'var(--hw-led)',
    rule: 'var(--hw-rule)',
    strong: 'var(--hw-strong)',
    onNavy: 'var(--hw-on-navy)',
};

/* ---------------------------------------------------------------- fictional content */

const STATS = [
    { value: '12', label: 'Courts & rooms', note: 'Full court · 4 half courts' },
    { value: '38', label: 'Coaches on staff', note: 'Former college & pro' },
    { value: '94%', label: 'Return rate', note: 'Athletes who re-enroll' },
    { value: '06', label: 'AM', note: 'Doors open, 7 days' },
];

const PROGRAMS = [
    {
        n: '01',
        eyebrow: 'Ages 8-13 · Fall session',
        title: 'Youth Academy',
        text: 'Fundamentals twice a week: footwork, handles, shooting form and how to be a good teammate. Max 10 per coach.',
        tags: ['2 sessions/wk', 'Small groups', 'Progress reports'],
    },
    {
        n: '02',
        eyebrow: 'High school · Off-season',
        title: 'Varsity Prep',
        text: 'Position-specific skill work, strength and conditioning, and film sessions so players arrive at tryouts ready.',
        tags: ['Skill + strength', 'Film room', 'Combine day'],
    },
    {
        n: '03',
        eyebrow: 'Adults · Mornings & evenings',
        title: 'Open Run & Skills',
        text: 'Pickup runs with refs, plus 45-minute skill clinics for the grown-ups who still want to get better.',
        tags: ["Ref'd runs", 'Clinics', 'Leagues'],
    },
];

const PLAYS: { icon: 'websites' | 'software' | 'growth' | 'agents'; title: string; text: string }[] = [
    {
        icon: 'websites',
        title: 'Shooting lab',
        text: 'Shot tracking on every rim. See your arc, your depth and your make rate by zone after each session.',
    },
    {
        icon: 'software',
        title: 'Strength floor',
        text: 'Basketball-specific lifting: vertical, first step, landing mechanics. Programmed by our S&C staff.',
    },
    {
        icon: 'growth',
        title: 'Film room',
        text: 'Clip your own games, tag plays and review with a coach. Learn to see the floor before you step on it.',
    },
    { icon: 'agents', title: 'Recovery', text: 'Cold plunge, compression boots and mobility sessions so you can train tomorrow too.' },
];

const PLAN = [
    ['Free evaluation', 'A 45-minute session with a coach: shooting, movement and a short game. You get a written plan.', 'Free'],
    ['Pick a program', 'Youth Academy, Varsity Prep or adult skills. Monthly, no long contracts.', 'From $149/mo'],
    ['Train & track', 'Every session is logged. Parents and players see progress on the app.', 'Included'],
    ['Game time', 'In-house leagues and showcase days every season, with film for college coaches.', 'Seasonal'],
] as const;

const PACKAGES = [
    { name: 'Academy', price: '$149', per: '/month', summary: 'Two coached sessions a week, progress reports, open gym access.', featured: false },
    { name: 'Varsity', price: '$249', per: '/month', summary: 'Three sessions a week, strength floor, film room, combine day.', featured: true },
    {
        name: 'Elite',
        price: '$449',
        per: '/month',
        summary: 'Daily access, 1-on-1 coaching hour each week, recovery suite, showcase film.',
        featured: false,
    },
];

const COACHES = [
    { name: 'Dre Mitchell', role: 'Head of player development', bio: 'Former college point guard. Built the Academy curriculum.' },
    { name: 'Maya Okafor', role: 'Strength & conditioning', bio: "CSCS. Eight seasons with a pro women's team." },
    { name: 'Luis Herrera', role: 'Shooting coach', bio: 'Rebuilt 400+ jump shots. Lives in the shooting lab.' },
];

/* ---------------------------------------------------------------- pieces (from the original portfolio) */

/** Faint half-court lines behind the hero (drift slower than the page as you scroll). */
function CourtLines() {
    const ref = useParallax<SVGSVGElement>(0.25);
    return (
        <svg
            ref={ref}
            aria-hidden="true"
            viewBox="0 0 600 600"
            preserveAspectRatio="xMaxYMid slice"
            className="pointer-events-none absolute top-0 -right-32 hidden h-full w-[720px] opacity-40 md:block"
            style={{ color: C.strong }}
        >
            <g fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="200" y="160" width="400" height="280" />
                <circle cx="200" cy="300" r="90" />
                <path d="M 600 40 L 520 40 A 260 260 0 0 0 520 560 L 600 560" />
                <circle cx="540" cy="300" r="14" />
            </g>
        </svg>
    );
}

/** A small basketball play diagram, one per program, drawn in line art. */
function PlayDiagram({ icon, className = '' }: { icon: (typeof PLAYS)[number]['icon']; className?: string }) {
    const run = C.led;
    return (
        <svg aria-hidden="true" viewBox="0 0 120 80" className={className}>
            <rect x="2" y="2" width="116" height="76" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
            {icon === 'websites' && (
                <>
                    <circle cx="24" cy="58" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M30 52 Q 60 20 92 30" fill="none" stroke={run} strokeWidth="2.5" strokeDasharray="5 4" />
                    <path d="M86 24 l8 6 -9 3" fill="none" stroke={run} strokeWidth="2.5" />
                    <path d="M100 20 l8 8 M108 20 l-8 8" stroke="currentColor" strokeWidth="2" />
                </>
            )}
            {icon === 'software' && (
                <>
                    <circle cx="30" cy="40" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="70" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="70" cy="58" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M37 37 L63 25 M37 43 L63 55 M77 25 L98 40 M77 55 L98 40" stroke={run} strokeWidth="2.5" />
                </>
            )}
            {icon === 'growth' && (
                <>
                    <path d="M16 64 L44 48 L68 54 L104 18" fill="none" stroke={run} strokeWidth="2.5" />
                    <path d="M96 18 l8 0 0 8" fill="none" stroke={run} strokeWidth="2.5" />
                    <circle cx="16" cy="64" r="5" fill="currentColor" />
                </>
            )}
            {icon === 'agents' && (
                <>
                    <path d="M20 40 C 40 10, 60 70, 80 40 S 100 20, 104 40" fill="none" stroke={run} strokeWidth="2.5" />
                    <circle cx="20" cy="40" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="104" cy="40" r="6" fill="currentColor" />
                </>
            )}
        </svg>
    );
}

function Heading({ eyebrow, title, dark = false, className = 'mb-12' }: { eyebrow: string; title: string; dark?: boolean; className?: string }) {
    return (
        <div className={className}>
            <p data-reveal className="cond mb-2 text-base" style={{ color: dark ? C.led : C.royal }}>
                {eyebrow}
            </p>
            <h2 data-reveal="mask" className="display text-5xl sm:text-7xl lg:text-[88px]">
                {title}
            </h2>
        </div>
    );
}

/** "Game plan" steps with a rail that fills as you scroll. */
function GamePlan() {
    const list = useRef<HTMLOListElement>(null);
    const [p, setP] = useState(0);
    useScrollProgress(list, setP);
    return (
        <ol ref={list} className="relative border-y-[3px] pl-6 sm:pl-10" style={{ borderColor: C.rule }}>
            <span aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: C.line }} />
            <span aria-hidden="true" className="absolute top-0 left-0 w-[3px]" style={{ background: C.royal, height: `${p * 100}%` }} />
            {PLAN.map(([title, text, note], i) => (
                <li
                    key={title}
                    className="flex flex-wrap items-baseline gap-x-10 gap-y-2 border-t py-7 transition-opacity duration-500 first:border-t-0"
                    style={{ borderColor: C.line, opacity: p >= i / PLAN.length ? 1 : 0.35 }}
                >
                    <span aria-hidden="true" className="display w-16 text-5xl" style={{ color: C.royal }}>
                        {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="display flex-[1_1_220px] text-3xl">{title}</h3>
                    <p className="flex-[999_1_380px]" style={{ color: C.soft }}>
                        {text}
                    </p>
                    <span className="cond text-lg" style={{ color: C.royal }}>
                        {note}
                    </span>
                </li>
            ))}
        </ol>
    );
}

function Section({ id, children, style, className = '' }: { id?: string; children: ReactNode; style?: CSSProperties; className?: string }) {
    return (
        <section id={id} className={`scroll-mt-20 ${className}`} style={style}>
            <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">{children}</div>
        </section>
    );
}

/* ---------------------------------------------------------------- page */

const NAV = [
    ['programs', 'Programs'],
    ['facility', 'Facility'],
    ['pricing', 'Pricing'],
    ['coaches', 'Coaches'],
] as const;

export default function HardwoodDemo() {
    useReveal();
    const [menuOpen, setMenuOpen] = useState(false);
    const [sent, setSent] = useState(false);
    const stagger = (i: number) => ({ '--d': i }) as CSSProperties;

    return (
        <>
            <Head title="Hardwood Performance Lab (demo site)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div
                className="hw min-h-screen text-[17px] leading-relaxed"
                style={{ background: C.maple, color: C.ink, fontFamily: 'var(--font-body)' }}
            >
                {/* Demo banner */}
                <div className="text-sm" style={{ background: C.navyDeep, color: C.silver }}>
                    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 sm:px-10 lg:px-16">
                        <p>Demo site for a fictional business, designed &amp; built by Timasi Werema.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <header className="sticky top-0 z-40" style={{ background: C.navy, color: C.onNavy }}>
                    <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-3 sm:px-10 lg:px-16">
                        <a href="#top" className="flex items-center gap-3">
                            <span
                                className="display flex size-11 items-center justify-center rounded-full text-lg text-white"
                                style={{ background: C.royal }}
                            >
                                HP
                            </span>
                            <span className="cond text-xl">Hardwood Performance Lab</span>
                        </a>
                        <div className="hidden items-center gap-7 md:flex">
                            {NAV.map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="cond py-3 text-lg font-semibold hover:text-white" style={{ color: C.silver }}>
                                    {label}
                                </a>
                            ))}
                            <a href="#book" className="cond border-b-2 py-2 text-lg text-white" style={{ borderColor: C.led }}>
                                Book a free eval
                            </a>
                        </div>
                        <button
                            type="button"
                            className="flex size-11 items-center justify-center rounded-md text-white md:hidden"
                            aria-label="Menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((o) => !o)}
                        >
                            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                        </button>
                    </nav>
                    {menuOpen && (
                        <div className="border-t px-5 pb-4 md:hidden" style={{ borderColor: C.navyLine }}>
                            {[...NAV, ['book', 'Book a free eval'] as const].map(([id, label]) => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="cond block py-3 text-lg"
                                    style={{ color: C.silver }}
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    )}
                </header>

                <main id="top">
                    {/* Hero */}
                    <section className="relative overflow-hidden border-b-[3px]" style={{ borderColor: C.rule }}>
                        <CourtLines />
                        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end gap-12 px-5 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">
                            <div className="min-w-0 flex-[999_1_540px]">
                                <p className="cond mb-4 flex items-center gap-2 text-lg" style={{ color: C.royal }}>
                                    <span className="relative flex size-2.5">
                                        <span
                                            className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                                            style={{ background: C.royal }}
                                        />
                                        <span className="relative inline-flex size-2.5 rounded-full" style={{ background: C.royal }} />
                                    </span>
                                    Fall session enrolling · Dallas, TX
                                </p>
                                <h1 className="display text-[56px] sm:text-8xl lg:text-[132px]">
                                    Built to
                                    <br />
                                    win your next
                                    <br />
                                    <span className="sheen">season.</span>
                                </h1>
                                <p className="cond mt-6 min-h-[1.4em] text-2xl sm:text-3xl" style={{ color: C.royal }}>
                                    <span style={{ color: C.muted }}>We coach </span>
                                    <Typewriter
                                        phrases={[
                                            'jump shots that hold up in the 4th',
                                            'first steps that beat the defender',
                                            'kids who love the game',
                                            'adults who still want to get better',
                                        ]}
                                    />
                                </p>
                                <p className="mt-5 max-w-xl text-xl" style={{ color: C.soft }}>
                                    Twelve courts, real coaches and shot tracking on every rim. Start with a free evaluation and a written plan.
                                </p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <a href="#book" className="pill pill-solid">
                                        Book a free eval
                                    </a>
                                    <a href="#programs" className="pill pill-outline">
                                        See programs
                                    </a>
                                </div>
                            </div>

                            {/* Player card */}
                            <div
                                className="w-full max-w-[360px] flex-[1_1_300px] rounded-md p-7"
                                style={{
                                    background: `linear-gradient(135deg, ${C.navy}, ${C.navyDeep})`,
                                    color: C.onNavy,
                                    boxShadow: `10px 10px 0 ${C.royal}`,
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <span className="cond text-[15px]" style={{ color: C.silver }}>
                                        Player card
                                    </span>
                                    <span className="display text-6xl leading-[0.8]" style={{ color: C.led }}>
                                        23
                                    </span>
                                </div>
                                <p className="display mt-2 mb-5 text-[34px] leading-none">Jordan Reyes</p>
                                <dl className="text-base">
                                    {[
                                        ['Position', 'Guard · Varsity Prep'],
                                        ['3PT make rate', '31% → 44%'],
                                        ['Vertical', '+4.5 in'],
                                        ['Sessions', '62 this season'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex justify-between gap-3 border-t py-2.5" style={{ borderColor: C.navyLine }}>
                                            <dt style={{ color: C.silver }}>{label}</dt>
                                            <dd className="text-right font-semibold">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-4 text-xs" style={{ color: C.silver }}>
                                    Sample athlete, sample numbers.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Scoreboard */}
                    <section
                        aria-label="Facility stats"
                        style={{
                            background: `radial-gradient(900px 300px at 15% 0%, color-mix(in srgb, ${C.royal} 28%, transparent), transparent 70%), linear-gradient(90deg, ${C.navyDeep}, ${C.navy})`,
                            color: C.onNavy,
                        }}
                    >
                        <dl className="mx-auto flex max-w-[1240px] flex-wrap gap-y-8 px-5 py-10 sm:px-10 lg:px-16">
                            {STATS.map((s) => (
                                <div key={s.label} className="flex-[1_1_220px] border-l-2 px-6" style={{ borderColor: C.navyLine }}>
                                    <dt className="cond text-[15px] font-semibold" style={{ color: C.silver }}>
                                        {s.label}
                                    </dt>
                                    <dd className="led mt-1.5 text-6xl leading-none" style={{ color: C.led }}>
                                        <CountUp value={s.value} />
                                    </dd>
                                    <dd className="mt-1.5 text-sm" style={{ color: C.silver }}>
                                        {s.note}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Ticker */}
                    <div className="display border-b-[3px] py-5 text-5xl sm:text-7xl" style={{ borderColor: C.rule, color: C.strong }}>
                        <Marquee
                            items={['Youth Academy', 'Varsity Prep', 'Open Run', 'Shooting lab', 'Film room', 'Dallas, TX', 'Free evaluation']}
                        />
                    </div>

                    {/* Programs */}
                    <Section id="programs">
                        <Heading eyebrow="Programs" title="Season highlights" />
                        <div className="border-y-[3px]" style={{ borderColor: C.rule }}>
                            {PROGRAMS.map((p) => (
                                <article
                                    key={p.title}
                                    data-reveal="left"
                                    className="flex flex-wrap items-center gap-x-10 gap-y-2 border-t py-8 first:border-t-0"
                                    style={{ borderColor: C.line }}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="display flex-[0_0_140px] text-[112px] leading-[0.85] text-transparent"
                                        style={{ WebkitTextStroke: `2px ${C.strong}` }}
                                    >
                                        {p.n}
                                    </span>
                                    <div className="min-w-0 flex-[999_1_420px]">
                                        <p className="cond text-[15px]" style={{ color: C.royal }}>
                                            {p.eyebrow}
                                        </p>
                                        <h3 className="display mt-1 mb-2 text-[38px] leading-[1.05]">{p.title}</h3>
                                        <p style={{ color: C.soft }}>{p.text}</p>
                                        <p className="cond mt-3 text-base" style={{ color: C.muted, letterSpacing: '.06em' }}>
                                            {p.tags.join(' · ')}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </Section>

                    {/* Facility */}
                    <Section id="facility" style={{ background: C.navy, color: C.onNavy }}>
                        <Heading eyebrow="The facility" title="The playbook" dark className="mb-4" />
                        <p className="mb-12 max-w-xl text-lg" style={{ color: C.silver }}>
                            Four spaces, one goal: get better every time you walk in.
                        </p>
                        <div className="border-y" style={{ borderColor: C.navyLine }}>
                            {PLAYS.map((s, i) => (
                                <div
                                    key={s.title}
                                    data-reveal="left"
                                    style={{ ...stagger(i), borderColor: C.navyLine }}
                                    className="-mx-4 flex flex-wrap items-center gap-x-10 gap-y-4 rounded-sm border-t px-4 py-7 first:border-t-0"
                                >
                                    <PlayDiagram icon={s.icon} className="h-20 w-[120px] flex-none" />
                                    <h3 className="display flex-[1_1_200px] text-4xl">{s.title}</h3>
                                    <p className="flex-[999_1_380px]" style={{ color: C.silver }}>
                                        {s.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Game plan */}
                    <section id="process" className="scroll-mt-20 border-b-[3px]" style={{ background: C.mapleLight, borderColor: C.rule }}>
                        <div className="mx-auto grid max-w-[1240px] gap-x-16 gap-y-10 px-5 py-20 sm:px-10 lg:grid-cols-[5fr_7fr] lg:px-16 lg:py-28">
                            <div className="lg:sticky lg:top-28 lg:self-start">
                                <Heading eyebrow="How it works" title="Game plan" className="mb-4" />
                                <p className="mb-8 max-w-xl text-lg" style={{ color: C.soft }}>
                                    No tryout, no pressure. A free evaluation, then a program that fits.
                                </p>
                                <a href="#book" className="pill pill-solid">
                                    Book a free eval
                                </a>
                            </div>
                            <GamePlan />
                        </div>
                    </section>

                    {/* Pricing */}
                    <Section id="pricing">
                        <Heading eyebrow="Memberships" title="Sign the deal" className="mb-4" />
                        <p className="mb-12 max-w-xl text-lg" style={{ color: C.soft }}>
                            Monthly, cancel anytime. Family discount for a second athlete.
                        </p>
                        <div className="flex flex-col gap-5">
                            {PACKAGES.map((pkg, i) => (
                                <div
                                    key={pkg.name}
                                    data-reveal="left"
                                    style={{
                                        ...stagger(i),
                                        borderColor: C.rule,
                                        ...(pkg.featured
                                            ? { background: C.navy, color: C.onNavy, boxShadow: `8px 8px 0 ${C.royal}` }
                                            : { background: C.mapleLight }),
                                    }}
                                    className="flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-md border-2 px-6 py-7 sm:px-8"
                                >
                                    <h3 className="display flex-[1_1_200px] text-4xl">
                                        {pkg.name}
                                        {pkg.featured && (
                                            <span
                                                className="cond ml-3 inline-block rounded-full px-2.5 py-1 align-middle text-xs text-white"
                                                style={{ background: C.royal }}
                                            >
                                                Most popular
                                            </span>
                                        )}
                                    </h3>
                                    <p className="flex-[999_1_380px]" style={{ color: pkg.featured ? C.silver : C.soft }}>
                                        {pkg.summary}
                                    </p>
                                    <p className="display text-5xl" style={{ color: pkg.featured ? C.led : C.royal }}>
                                        {pkg.price}
                                        <span className="cond ml-1 text-base" style={{ color: pkg.featured ? C.silver : C.muted }}>
                                            {pkg.per}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Coaches */}
                    <Section id="coaches" className="border-y-[3px]" style={{ background: C.mapleLight, borderColor: C.rule }}>
                        <Heading eyebrow="Coaches" title="Scouting report" />
                        <ul className="border-t-[3px]" style={{ borderColor: C.rule }}>
                            {COACHES.map((c) => (
                                <li
                                    key={c.name}
                                    data-reveal
                                    className="flex flex-wrap items-baseline gap-x-10 gap-y-1 border-b py-6"
                                    style={{ borderColor: C.line }}
                                >
                                    <h3 className="display flex-[1_1_220px] text-3xl">{c.name}</h3>
                                    <p className="cond flex-[1_1_200px] text-base" style={{ color: C.royal }}>
                                        {c.role}
                                    </p>
                                    <p className="flex-[999_1_320px]" style={{ color: C.soft }}>
                                        {c.bio}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* Book */}
                    <Section id="book">
                        <div className="flex flex-wrap gap-12">
                            <div className="min-w-0 flex-[1_1_320px]">
                                <Heading eyebrow="Free evaluation" title="Get in the game" className="mb-4" />
                                <p className="max-w-xl text-lg" style={{ color: C.soft }}>
                                    45 minutes with a coach, a written plan, no commitment. Dallas Design District, free parking.
                                </p>
                            </div>
                            <form
                                className="min-w-0 flex-[999_1_480px] rounded-xl border-2 p-6 sm:p-8"
                                style={{ background: C.mapleLight, borderColor: C.rule }}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setSent(true);
                                }}
                            >
                                {sent ? (
                                    <p role="status" className="display text-3xl">
                                        Got it. This is a demo, so nothing was sent.
                                    </p>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            ['Athlete name', 'text'],
                                            ['Age', 'number'],
                                            ['Parent / your email', 'email'],
                                            ['Phone', 'tel'],
                                        ].map(([label, type]) => (
                                            <label key={label} className="cond text-sm" style={{ color: C.muted }}>
                                                {label}
                                                <input
                                                    type={type}
                                                    required
                                                    className="mt-1 min-h-12 w-full rounded-md border-2 px-3 text-base tracking-normal normal-case"
                                                    style={{ borderColor: C.rule, background: C.maple, color: C.ink, fontFamily: 'var(--font-body)' }}
                                                />
                                            </label>
                                        ))}
                                        <button type="submit" className="pill pill-solid sm:col-span-2 sm:justify-self-start">
                                            Request my free eval <ArrowUpRight className="size-5" />
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </Section>
                </main>

                <footer style={{ background: C.navy, color: C.silver }}>
                    <div className="cond mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-5 py-6 text-base sm:flex-row sm:px-10 lg:px-16">
                        <p>Hardwood Performance Lab is fictional. This site is a portfolio demo.</p>
                        <Link href="/start" className="py-2 text-white underline underline-offset-4">
                            Want a site like this? Let&apos;s talk
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
