import '@fontsource-variable/outfit/wght';
import '@fontsource/cormorant-garamond/500';
import '@fontsource/cormorant-garamond/500-italic';
import '@fontsource/cormorant-garamond/600';
import '@fontsource/cormorant-garamond/700';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleCheck, ClipboardList, MapPin, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';

/*
 * DEMO SITE for a fictional business ("Clearcoat", ceramic / PPF / wraps, Dallas-Fort Worth).
 * Chrome-luxury design: layered blacks, chrome wordmark, serif + sans.
 * Wrap visualizer, filterable work log and a quote list. The quote form is
 * simulated: nothing is sent. No real reviews, photos or customers.
 */

const C = {
    black: '#050507',
    dark: '#0b0b0f',
    dark2: '#111116',
    dark3: '#18181e',
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
    text: '#ececf0',
    muted: '#a4a4ae',
    gold: '#d4a838',
};
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const CSS = `
.cc-chrome{background:linear-gradient(110deg,#8c8c95 0%,#f4f4f7 22%,#9b9ba4 38%,#ffffff 50%,#8f8f98 62%,#e9e9ee 80%,#8c8c95 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:cc-sweep 6s linear infinite}
@keyframes cc-sweep{0%{background-position:100% 0}100%{background-position:-150% 0}}
.cc-sheen{animation:cc-sheen 5s ease-in-out infinite}
@keyframes cc-sheen{0%,60%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(220%) skewX(-20deg)}}
@media (prefers-reduced-motion:reduce){.cc-chrome,.cc-sheen{animation:none}}
`;

// ---------------------------------------------------------------- services & pricing
type Size = 'Sedan / coupe' | 'SUV' | 'Truck' | 'Exotic';
const SIZE_FACTOR: Record<Size, number> = { 'Sedan / coupe': 1, SUV: 1.2, Truck: 1.25, Exotic: 1.4 };

const SERVICES = [
    {
        id: 'ceramic',
        name: 'Ceramic coating',
        tag: '01',
        blurb: 'A hard, glassy layer bonded to your paint. Water beads off, dirt rinses away and the gloss lasts for years.',
        options: [
            { id: 'ceramic-2', label: '2-year coating + one-step polish', price: 699, time: '1 day' },
            { id: 'ceramic-5', label: '5-year coating + paint correction', price: 1199, time: '2 days' },
        ],
    },
    {
        id: 'ppf',
        name: 'Paint protection film',
        tag: '02',
        blurb: 'Clear, self-healing film that takes the rock chips and scratches so your paint does not. Nearly invisible.',
        options: [
            { id: 'ppf-front', label: 'Front end: bumper, hood, fenders, mirrors', price: 1499, time: '1–2 days' },
            { id: 'ppf-full', label: 'Full body', price: 5500, time: '4–5 days' },
        ],
    },
    {
        id: 'wrap',
        name: 'Colour wraps',
        tag: '03',
        blurb: 'Change the colour and finish without touching the paint, and peel it off when you want a change. Try it below.',
        options: [
            { id: 'wrap-roof', label: 'Roof wrap', price: 450, time: '½ day' },
            { id: 'wrap-chrome-delete', label: 'Chrome delete (trim and badges)', price: 650, time: '1 day' },
            { id: 'wrap-full', label: 'Full colour change', price: 3200, time: '4–5 days' },
        ],
    },
    {
        id: 'detail',
        name: 'Detailing',
        tag: '04',
        blurb: 'Hand wash, decontamination, interior deep clean. The right prep before any coating, or a reset on its own.',
        options: [
            { id: 'detail-signature', label: 'Signature detail (inside & out)', price: 179, time: '3 hrs' },
            { id: 'detail-interior', label: 'Interior deep clean & steam', price: 149, time: '3 hrs' },
        ],
    },
];

// ---------------------------------------------------------------- wrap visualizer
type Finish = 'Gloss' | 'Satin' | 'Matte' | 'Chrome';
const WRAP_COLOURS = [
    { name: 'Satin Black', hex: '#1b1b1f' },
    { name: 'Nardo Grey', hex: '#7c7f84' },
    { name: 'Midnight Purple', hex: '#3b2257' },
    { name: 'Racing Green', hex: '#1f4a36' },
    { name: 'Deep Blue', hex: '#183a7a' },
    { name: 'Candy Red', hex: '#9b1424' },
    { name: 'Desert Sand', hex: '#b59a74' },
    { name: 'Gold', hex: '#b8892c' },
];
const COVERAGE = [
    { id: 'full', label: 'Full wrap', price: 3200 },
    { id: 'roof', label: 'Roof only', price: 450 },
    { id: 'accents', label: 'Accents (mirrors, roof, trim)', price: 900 },
] as const;
type Coverage = (typeof COVERAGE)[number]['id'];

const shade = (hex: string, amt: number) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    return `#${[c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** Side-profile sports car. Body colour/finish apply to the wrapped panels per coverage. */
function Car({
    colour,
    finish,
    coverage = 'full',
    base = '#2a2a31',
    sheen = true,
}: {
    colour: string;
    finish: Finish;
    coverage?: Coverage;
    base?: string;
    sheen?: boolean;
}) {
    const id = useId().replace(/:/g, '');
    const bodyFill = coverage === 'full' ? `url(#body-${id})` : base;
    const roofFill = coverage === 'full' || coverage === 'roof' || coverage === 'accents' ? `url(#body-${id})` : base;
    const accent = coverage === 'accents' ? `url(#body-${id})` : '#0d0d10';
    const stops =
        finish === 'Chrome'
            ? [shade(colour, 0.45), shade(colour, -0.15), shade(colour, 0.55), shade(colour, -0.25), shade(colour, 0.3)]
            : finish === 'Gloss'
              ? [shade(colour, 0.22), colour, colour, shade(colour, -0.12), shade(colour, -0.2)]
              : finish === 'Satin'
                ? [shade(colour, 0.1), colour, colour, colour, shade(colour, -0.1)]
                : [colour, colour, colour, colour, shade(colour, -0.05)];
    return (
        <svg viewBox="0 0 640 230" className="h-auto w-full" role="img" aria-label={`Car with ${finish.toLowerCase()} wrap`}>
            <defs>
                <linearGradient id={`body-${id}`} x1="0" y1="0" x2="0" y2="1">
                    {stops.map((s, i) => (
                        <stop key={i} offset={`${i * 25}%`} stopColor={s} />
                    ))}
                </linearGradient>
                <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3a3f4a" />
                    <stop offset="100%" stopColor="#0e1015" />
                </linearGradient>
                <clipPath id={`clip-${id}`}>
                    <path d="M36 168 C 54 164, 82 146, 132 136 L 236 92 C 268 80, 330 74, 388 76 C 440 78, 478 96, 516 122 L 588 136 C 608 140, 618 152, 614 168 L 608 180 L 36 180 Z" />
                </clipPath>
            </defs>
            <ellipse cx="322" cy="198" rx="300" ry="14" fill="#000" opacity=".55" />
            {/* body */}
            <path
                d="M36 168 C 54 164, 82 146, 132 136 L 236 92 C 268 80, 330 74, 388 76 C 440 78, 478 96, 516 122 L 588 136 C 608 140, 618 152, 614 168 L 608 180 L 36 180 Z"
                fill={bodyFill}
            />
            {/* roof + pillars */}
            <path d="M246 96 C 276 84, 330 79, 384 80 C 426 82, 456 96, 486 116 L 258 118 Z" fill={roofFill} />
            {/* glass */}
            <path d="M262 100 L 302 88 C 340 82, 378 84, 404 90 L 452 116 L 270 118 Z" fill={`url(#glass-${id})`} />
            <path d="M356 84 L 362 118" stroke={roofFill} strokeWidth="6" />
            {/* side line, door, mirror, accents */}
            <path d="M120 150 C 260 132, 430 128, 590 146" fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="3" />
            <path d="M300 120 L 296 176 M 430 120 L 438 172" stroke="#000" strokeOpacity=".25" strokeWidth="2" />
            <path d="M462 116 l 18 -4 l 2 10 z" fill={accent} />
            <path d="M40 166 h 36 M 586 150 h 24" stroke={accent} strokeWidth="6" strokeLinecap="round" />
            {/* sheen */}
            {sheen && finish !== 'Matte' && (
                <g clipPath={`url(#clip-${id})`}>
                    <rect
                        className="cc-sheen"
                        x="0"
                        y="60"
                        width="90"
                        height="140"
                        fill="#fff"
                        opacity={finish === 'Chrome' ? 0.35 : finish === 'Gloss' ? 0.18 : 0.08}
                    />
                </g>
            )}
            {/* wheels */}
            {[160, 500].map((x) => (
                <g key={x}>
                    <circle cx={x} cy="178" r="36" fill="#060608" />
                    <circle cx={x} cy="178" r="24" fill="#2c2c33" stroke="#9a9aa3" strokeWidth="2" />
                    {[0, 72, 144, 216, 288].map((a) => (
                        <path
                            key={a}
                            d={`M${x} 178 L ${x + 22 * Math.cos((a * Math.PI) / 180)} ${178 + 22 * Math.sin((a * Math.PI) / 180)}`}
                            stroke="#b7b7c0"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    ))}
                    <circle cx={x} cy="178" r="5" fill="#d0d0d6" />
                </g>
            ))}
        </svg>
    );
}

// ---------------------------------------------------------------- work log (sample jobs, fictional)
const JOBS = [
    {
        car: '2023 Tesla Model Y',
        type: 'SUV',
        service: 'PPF',
        detail: 'Front-end PPF + ceramic on wheels',
        colour: '#d9d9de',
        finish: 'Gloss' as Finish,
        city: 'Frisco',
    },
    {
        car: '2021 BMW M4',
        type: 'Exotic',
        service: 'Wrap',
        detail: 'Full wrap, Satin Nardo Grey',
        colour: '#7c7f84',
        finish: 'Satin' as Finish,
        city: 'Dallas',
    },
    {
        car: '2022 Ford F-150',
        type: 'Truck',
        service: 'Ceramic',
        detail: '5-year ceramic + paint correction',
        colour: '#152a4d',
        finish: 'Gloss' as Finish,
        city: 'Plano',
    },
    {
        car: '2020 Porsche 911',
        type: 'Exotic',
        service: 'PPF',
        detail: 'Full-body PPF, matte finish film',
        colour: '#c9c9cd',
        finish: 'Matte' as Finish,
        city: 'Highland Park',
    },
    {
        car: '2024 Honda Accord',
        type: 'Sedan',
        service: 'Detail',
        detail: 'Signature detail + interior steam',
        colour: '#5b0f19',
        finish: 'Gloss' as Finish,
        city: 'Irving',
    },
    {
        car: '2019 Dodge Challenger',
        type: 'Sedan',
        service: 'Wrap',
        detail: 'Full wrap, Gloss Midnight Purple',
        colour: '#3b2257',
        finish: 'Gloss' as Finish,
        city: 'Arlington',
    },
    {
        car: '2023 Range Rover Sport',
        type: 'SUV',
        service: 'Wrap',
        detail: 'Chrome delete + roof in gloss black',
        colour: '#e7e7ea',
        finish: 'Gloss' as Finish,
        city: 'Southlake',
    },
    {
        car: '2022 Toyota Tacoma',
        type: 'Truck',
        service: 'Detail',
        detail: 'Interior deep clean after a lake weekend',
        colour: '#4a4f45',
        finish: 'Satin' as Finish,
        city: 'Fort Worth',
    },
    {
        car: '2024 Mercedes-AMG C63',
        type: 'Sedan',
        service: 'Ceramic',
        detail: '2-year ceramic + one-step polish',
        colour: '#1b1b1f',
        finish: 'Gloss' as Finish,
        city: 'Dallas',
    },
    {
        car: '2021 Chevrolet Corvette',
        type: 'Exotic',
        service: 'Wrap',
        detail: 'Full wrap, Gold chrome',
        colour: '#b8892c',
        finish: 'Chrome' as Finish,
        city: 'Plano',
    },
];
const JOB_SERVICES = ['All', 'Ceramic', 'PPF', 'Wrap', 'Detail'];
const JOB_TYPES = ['All', 'Sedan', 'SUV', 'Truck', 'Exotic'];

const POLICIES = [
    ['Deposit', '20% to book. It comes off your final bill.'],
    ['Prep', 'Cars arrive washed for PPF and wraps; we handle the decontamination.'],
    ['Weather', 'Mobile jobs move for free if rain is forecast. We text you the day before.'],
    ['Changes', 'Reschedule or cancel free up to 48 hours before your slot.'],
    ['Warranty', 'Films and coatings are covered by the manufacturer warranty; we register it for you.'],
    ['Aftercare', 'Every job comes with a care guide and a free check-up after 30 days.'],
];
const CITIES = ['Dallas', 'Plano', 'Frisco', 'Irving', 'Arlington', 'Fort Worth', 'Southlake', 'Highland Park'];

type QuoteItem = { id: string; label: string; price: number };

export default function ClearcoatDemo() {
    // visualizer
    const [wrapColour, setWrapColour] = useState(WRAP_COLOURS[2]);
    const [finish, setFinish] = useState<Finish>('Satin');
    const [coverage, setCoverage] = useState<Coverage>('full');
    // work log
    const [svc, setSvc] = useState('All');
    const [vtype, setVtype] = useState('All');
    const [query, setQuery] = useState('');
    const [showAll, setShowAll] = useState(false);
    // quote
    const [quote, setQuote] = useState<QuoteItem[]>([]);
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [size, setSize] = useState<Size>('Sedan / coupe');
    const [sent, setSent] = useState(false);
    const [vehicle, setVehicle] = useState('');

    const coverageInfo = COVERAGE.find((c) => c.id === coverage)!;
    const wrapPrice = coverageInfo.price + (finish === 'Chrome' ? (coverage === 'full' ? 2400 : 300) : 0);

    const inQuote = (id: string) => quote.some((q) => q.id === id);
    const toggle = (item: QuoteItem) => setQuote((q) => (q.some((x) => x.id === item.id) ? q.filter((x) => x.id !== item.id) : [...q, item]));
    const addWrap = () => {
        const item = {
            id: `wrap-vis-${wrapColour.name}-${finish}-${coverage}`,
            label: `${coverageInfo.label}: ${finish} ${wrapColour.name}`,
            price: wrapPrice,
        };
        setQuote((q) => [...q.filter((x) => !x.id.startsWith('wrap-vis-')), item]);
        setSent(false);
        setQuoteOpen(true);
    };

    const factor = SIZE_FACTOR[size];
    const estimate = Math.round(quote.reduce((s, q) => s + q.price, 0) * factor);

    const jobs = useMemo(() => {
        const q = query.trim().toLowerCase();
        return JOBS.filter(
            (j) =>
                (svc === 'All' || j.service === svc) &&
                (vtype === 'All' || j.type === vtype) &&
                (!q || `${j.car} ${j.detail} ${j.city}`.toLowerCase().includes(q)),
        );
    }, [svc, vtype, query]);
    const visible = showAll ? jobs : jobs.slice(0, 5);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    const chip = (active: boolean) =>
        `inline-flex min-h-10 items-center rounded-full border px-4 text-sm tracking-wide transition-colors ${active ? 'border-white bg-white text-black' : 'border-white/15 text-[#a4a4ae] hover:border-white/40 hover:text-white'}`;
    const btnLight =
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold tracking-[0.12em] text-black uppercase transition hover:bg-[#d8d8de]';
    const btnGhost =
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-7 text-sm font-semibold tracking-[0.12em] uppercase transition hover:border-white';
    const eyebrow = 'text-xs font-medium tracking-[0.35em] uppercase';

    return (
        <>
            <Head title="Clearcoat (demo site)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{CSS}</style>

            <div className="min-h-screen" style={{ background: C.black, color: C.text, fontFamily: "'Outfit Variable', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div className="border-b text-sm" style={{ borderColor: C.line, background: C.dark2, color: C.muted }}>
                    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 sm:px-8">
                        <p>Demo site for a fictional business, designed &amp; built by Timasi Werema.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 text-white underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                {/* Nav */}
                <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ borderColor: C.line, background: 'rgba(5,5,7,0.78)' }}>
                    <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <a href="#top" className="cc-chrome text-2xl font-bold tracking-[0.3em]" style={serif}>
                            CLEARCOAT
                        </a>
                        <div className="flex items-center gap-6 text-xs font-medium tracking-[0.25em] uppercase" style={{ color: C.muted }}>
                            <a href="#services" className="hidden py-2 hover:text-white md:inline">
                                Services
                            </a>
                            <a href="#visualizer" className="hidden py-2 hover:text-white md:inline">
                                Visualizer
                            </a>
                            <a href="#work" className="hidden py-2 hover:text-white md:inline">
                                Work
                            </a>
                            <a href="#good-to-know" className="hidden py-2 hover:text-white lg:inline">
                                Good to know
                            </a>
                            <button
                                type="button"
                                onClick={() => setQuoteOpen(true)}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-white"
                            >
                                <ClipboardList className="size-4" /> Quote
                                {quote.length > 0 && (
                                    <span
                                        className="flex size-5 items-center justify-center rounded-full text-[11px] text-black"
                                        style={{ background: C.gold }}
                                    >
                                        {quote.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </nav>
                </header>

                <main id="top">
                    {/* Hero */}
                    <section
                        className="relative overflow-hidden border-b"
                        style={{ borderColor: C.line, background: `radial-gradient(ellipse at 70% 40%, ${C.dark3} 0%, ${C.black} 65%)` }}
                    >
                        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-10 gap-y-8 px-5 py-16 sm:px-8 lg:py-24">
                            <div className="min-w-0 flex-[999_1_460px]">
                                <p className={eyebrow} style={{ color: C.gold }}>
                                    Ceramic · PPF · Wraps — Dallas–Fort Worth
                                </p>
                                <h1 className="mt-5 text-[52px] leading-[0.95] font-medium sm:text-7xl lg:text-[96px]" style={serif}>
                                    Protection that
                                    <br />
                                    <em className="cc-chrome font-semibold not-italic">looks like art.</em>
                                </h1>
                                <p className="mt-6 max-w-lg text-lg font-light" style={{ color: C.muted }}>
                                    Studio-grade coatings, paint protection film and colour-change wraps — in our Dallas studio or at your driveway.
                                </p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <a href="#services" className={btnLight}>
                                        Build your quote <ArrowRight className="size-4" />
                                    </a>
                                    <a href="#visualizer" className={btnGhost}>
                                        Try the wrap visualizer
                                    </a>
                                </div>
                            </div>
                            <div className="min-w-0 flex-[1_1_420px]">
                                <Car colour="#c9c9d0" finish="Chrome" />
                            </div>
                        </div>
                        <ul
                            className="mx-auto flex max-w-[1240px] flex-wrap gap-x-10 gap-y-3 border-t px-5 py-6 text-sm sm:px-8"
                            style={{ borderColor: C.line, color: C.muted }}
                        >
                            {['Studio or mobile', 'Manufacturer-warrantied films', 'Fully insured', 'Text updates on every job'].map((t) => (
                                <li key={t} className="flex items-center gap-2">
                                    <ShieldCheck className="size-4" style={{ color: C.gold }} /> {t}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Services */}
                    <section id="services" className="scroll-mt-20" style={{ background: C.dark }}>
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
                            <p className={eyebrow} style={{ color: C.muted }}>
                                Services
                            </p>
                            <h2 className="mt-3 text-5xl font-medium sm:text-6xl" style={serif}>
                                Choose your protection
                            </h2>
                            <p className="mt-3 max-w-xl" style={{ color: C.muted }}>
                                Add anything to your quote. Prices are starting points for a sedan; your final quote adjusts for vehicle size and
                                condition.
                            </p>
                            <div className="mt-10 border-t" style={{ borderColor: C.lineStrong }}>
                                {SERVICES.map((s) => (
                                    <article key={s.id} className="flex flex-wrap gap-x-12 gap-y-5 border-b py-10" style={{ borderColor: C.line }}>
                                        <div className="min-w-0 flex-[1_1_320px]">
                                            <p className="text-sm tracking-[0.3em]" style={{ color: C.gold }}>
                                                {s.tag}
                                            </p>
                                            <h3 className="mt-1 text-4xl font-semibold" style={serif}>
                                                {s.name}
                                            </h3>
                                            <p className="mt-3 max-w-md font-light" style={{ color: C.muted }}>
                                                {s.blurb}
                                            </p>
                                        </div>
                                        <ul className="min-w-0 flex-[1_1_420px] divide-y" style={{ borderColor: C.line }}>
                                            {s.options.map((o) => {
                                                const added = inQuote(o.id);
                                                return (
                                                    <li
                                                        key={o.id}
                                                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4"
                                                        style={{ borderColor: C.line }}
                                                    >
                                                        <div>
                                                            <p>{o.label}</p>
                                                            <p className="text-sm" style={{ color: C.muted }}>
                                                                from ${o.price.toLocaleString()} · {o.time}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            aria-pressed={added}
                                                            onClick={() => toggle({ id: o.id, label: `${s.name}: ${o.label}`, price: o.price })}
                                                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition ${added ? 'border-transparent text-black' : 'border-white/25 hover:border-white'}`}
                                                            style={added ? { background: C.gold } : undefined}
                                                        >
                                                            {added ? <Check className="size-4" /> : <Plus className="size-4" />}
                                                            {added ? 'In quote' : 'Add to quote'}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Wrap visualizer */}
                    <section
                        id="visualizer"
                        className="scroll-mt-20 border-y"
                        style={{ borderColor: C.line, background: `linear-gradient(180deg, ${C.black}, ${C.dark2})` }}
                    >
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
                            <p className={eyebrow} style={{ color: C.muted }}>
                                Wrap visualizer
                            </p>
                            <h2 className="mt-3 text-5xl font-medium sm:text-6xl" style={serif}>
                                See it before we wrap it
                            </h2>
                            <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-8">
                                <div className="min-w-0 flex-[999_1_520px]">
                                    <Car colour={wrapColour.hex} finish={finish} coverage={coverage} />
                                    <p className="mt-2 text-center text-sm" style={{ color: C.muted }} aria-live="polite">
                                        {coverageInfo.label} · {finish} {wrapColour.name}
                                    </p>
                                </div>
                                <div className="min-w-0 flex-[1_1_320px] space-y-6">
                                    <fieldset>
                                        <legend className="text-xs tracking-[0.25em] uppercase" style={{ color: C.muted }}>
                                            Colour · {wrapColour.name}
                                        </legend>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {WRAP_COLOURS.map((c) => (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    aria-label={c.name}
                                                    aria-pressed={c.name === wrapColour.name}
                                                    onClick={() => setWrapColour(c)}
                                                    className="flex size-11 items-center justify-center rounded-full border-2"
                                                    style={{ borderColor: c.name === wrapColour.name ? '#fff' : 'transparent' }}
                                                >
                                                    <span className="size-8 rounded-full border border-white/20" style={{ background: c.hex }} />
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <fieldset>
                                        <legend className="text-xs tracking-[0.25em] uppercase" style={{ color: C.muted }}>
                                            Finish
                                        </legend>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {(['Gloss', 'Satin', 'Matte', 'Chrome'] as Finish[]).map((f) => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    aria-pressed={finish === f}
                                                    onClick={() => setFinish(f)}
                                                    className={chip(finish === f)}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <fieldset>
                                        <legend className="text-xs tracking-[0.25em] uppercase" style={{ color: C.muted }}>
                                            Coverage
                                        </legend>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {COVERAGE.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    aria-pressed={coverage === c.id}
                                                    onClick={() => setCoverage(c.id)}
                                                    className={chip(coverage === c.id)}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <div className="flex flex-wrap items-center gap-4 border-t pt-5" style={{ borderColor: C.line }}>
                                        <p>
                                            <span className="text-sm" style={{ color: C.muted }}>
                                                Estimated from
                                            </span>
                                            <br />
                                            <span className="text-4xl font-semibold" style={serif}>
                                                ${wrapPrice.toLocaleString()}
                                            </span>
                                        </p>
                                        <button type="button" onClick={addWrap} className={btnLight}>
                                            Add to quote
                                        </button>
                                    </div>
                                    {finish === 'Chrome' && (
                                        <p className="text-sm" style={{ color: C.muted }}>
                                            Chrome films cost more and take longer to install.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Work log */}
                    <section id="work" className="scroll-mt-20" style={{ background: C.dark }}>
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
                            <p className={eyebrow} style={{ color: C.muted }}>
                                Recent work
                            </p>
                            <h2 className="mt-3 text-5xl font-medium sm:text-6xl" style={serif}>
                                The work log
                            </h2>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <div role="group" aria-label="Filter by service" className="flex flex-wrap gap-2">
                                    {JOB_SERVICES.map((s) => (
                                        <button key={s} type="button" aria-pressed={svc === s} onClick={() => setSvc(s)} className={chip(svc === s)}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <label className="relative ml-auto min-w-[220px] flex-[0_1_300px]">
                                    <span className="sr-only">Search work</span>
                                    <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2" style={{ color: C.muted }} />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search make, model or city"
                                        className="min-h-11 w-full rounded-full border bg-transparent pr-4 pl-11 text-sm placeholder:text-[#7d7d88]"
                                        style={{ borderColor: C.lineStrong }}
                                    />
                                </label>
                            </div>
                            <div role="group" aria-label="Filter by vehicle type" className="mt-3 flex flex-wrap gap-2">
                                {JOB_TYPES.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        aria-pressed={vtype === t}
                                        onClick={() => setVtype(t)}
                                        className={chip(vtype === t)}
                                    >
                                        {t === 'All' ? 'All vehicles' : t}
                                    </button>
                                ))}
                            </div>
                            <ul className="mt-8 border-t" style={{ borderColor: C.lineStrong }} aria-live="polite">
                                {visible.map((j) => (
                                    <li
                                        key={j.car}
                                        className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b py-5"
                                        style={{ borderColor: C.line }}
                                    >
                                        <div className="w-[180px] shrink-0">
                                            <Car colour={j.colour} finish={j.finish} sheen={false} />
                                        </div>
                                        <div className="min-w-0 flex-[1_1_240px]">
                                            <p className="text-2xl font-semibold" style={serif}>
                                                {j.car}
                                            </p>
                                            <p style={{ color: C.muted }}>{j.detail}</p>
                                        </div>
                                        <p className="text-sm tracking-[0.2em] uppercase" style={{ color: C.gold }}>
                                            {j.service}
                                        </p>
                                        <p className="flex w-36 items-center gap-1.5 text-sm" style={{ color: C.muted }}>
                                            <MapPin className="size-4" /> {j.city}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            {jobs.length === 0 && (
                                <p className="py-10 text-center" style={{ color: C.muted }}>
                                    No jobs match those filters yet.
                                </p>
                            )}
                            {jobs.length > 5 && (
                                <div className="mt-6 text-center">
                                    <button type="button" onClick={() => setShowAll((v) => !v)} className={btnGhost}>
                                        {showAll ? 'Show less' : `View all ${jobs.length} jobs`}
                                    </button>
                                </div>
                            )}
                            <p className="mt-6 text-sm" style={{ color: C.muted }}>
                                Sample jobs for this demo. A real site would show the shop's own photos here.
                            </p>
                        </div>
                    </section>

                    {/* Good to know */}
                    <section id="good-to-know" className="scroll-mt-20 border-t" style={{ borderColor: C.line, background: C.black }}>
                        <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-16 gap-y-10 px-5 py-20 sm:px-8">
                            <div className="min-w-0 flex-[2_1_480px]">
                                <p className={eyebrow} style={{ color: C.muted }}>
                                    Good to know
                                </p>
                                <h2 className="mt-3 text-5xl font-medium" style={serif}>
                                    How it works
                                </h2>
                                <dl className="mt-8 border-t" style={{ borderColor: C.lineStrong }}>
                                    {POLICIES.map(([k, v]) => (
                                        <div key={k} className="flex flex-wrap gap-x-8 gap-y-1 border-b py-4" style={{ borderColor: C.line }}>
                                            <dt className="w-32 shrink-0 text-sm tracking-[0.2em] uppercase" style={{ color: C.gold }}>
                                                {k}
                                            </dt>
                                            <dd className="min-w-0 flex-1 font-light">{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <div className="min-w-0 flex-[1_1_300px]">
                                <p className={eyebrow} style={{ color: C.muted }}>
                                    Service area
                                </p>
                                <p className="mt-3 text-3xl font-medium" style={serif}>
                                    Dallas studio, mobile across DFW
                                </p>
                                <p className="mt-2 font-light" style={{ color: C.muted }}>
                                    Coatings and detailing come to you within about 30 miles of Dallas. PPF and wraps are installed in our
                                    climate-controlled studio.
                                </p>
                                <ul className="mt-5 flex flex-wrap gap-2">
                                    {CITIES.map((c) => (
                                        <li key={c} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: C.lineStrong }}>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="border-t" style={{ borderColor: C.line, background: C.dark }}>
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
                            <h2 className="text-5xl font-medium" style={serif}>
                                Questions
                            </h2>
                            <div className="mt-6 border-t" style={{ borderColor: C.lineStrong }}>
                                {[
                                    [
                                        'Ceramic or PPF — which do I need?',
                                        'Ceramic makes paint glossy and easy to clean. PPF physically stops rock chips. Many owners put PPF on the front and ceramic over everything.',
                                    ],
                                    [
                                        'Will a wrap damage my paint?',
                                        'No. Quality wrap film protects the paint underneath and removes cleanly within its rated life.',
                                    ],
                                    [
                                        'How long will I be without my car?',
                                        'From a few hours for a detail up to 5 days for full-body PPF or a colour change.',
                                    ],
                                ].map(([q, a]) => (
                                    <details
                                        key={q}
                                        className="group border-b [&_summary::-webkit-details-marker]:hidden"
                                        style={{ borderColor: C.line }}
                                    >
                                        <summary
                                            className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-xl"
                                            style={serif}
                                        >
                                            {q}
                                            <ChevronDown
                                                className="size-5 shrink-0 transition-transform group-open:rotate-180"
                                                style={{ color: C.gold }}
                                            />
                                        </summary>
                                        <p className="pb-5 font-light" style={{ color: C.muted }}>
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
                        className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.muted }}
                    >
                        <p>Clearcoat is a fictional business. This site is a portfolio demo.</p>
                        <Link href="/#contact" className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-4">
                            Want a site like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Quote drawer */}
            <Sheet open={quoteOpen} onOpenChange={setQuoteOpen}>
                <SheetContent
                    side="right"
                    className="flex w-full flex-col gap-0 overflow-y-auto border-l p-0 sm:max-w-md"
                    style={{ background: C.dark, color: C.text, borderColor: C.line }}
                >
                    <div className="border-b px-6 py-5" style={{ borderColor: C.line }}>
                        <SheetTitle className="text-3xl font-semibold text-white" style={serif}>
                            {sent ? 'Request sent' : 'Your quote'}
                        </SheetTitle>
                        <SheetDescription style={{ color: C.muted }}>
                            {sent ? 'Demo only: nothing was sent.' : 'Estimates. We confirm the price after seeing the car.'}
                        </SheetDescription>
                    </div>

                    {sent ? (
                        <div role="status" className="flex flex-1 flex-col gap-3 p-6">
                            <CircleCheck className="size-12" style={{ color: C.gold }} />
                            <p className="text-3xl" style={serif}>
                                Thanks{vehicle ? ` — we'll look at your ${vehicle}` : ''}.
                            </p>
                            <p style={{ color: C.muted }}>
                                On a real site, the shop would get this request by email and text you back within a few hours. This is a demo, so
                                nothing was sent.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSent(false);
                                    setQuote([]);
                                    setQuoteOpen(false);
                                }}
                                className={`${btnLight} mt-4`}
                            >
                                Start over
                            </button>
                        </div>
                    ) : quote.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                            <ClipboardList className="size-10" style={{ color: C.muted }} />
                            <p style={{ color: C.muted }}>Nothing in your quote yet. Add services or a wrap from the visualizer.</p>
                            <a href="#services" onClick={() => setQuoteOpen(false)} className={btnLight}>
                                Browse services
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="flex flex-1 flex-col">
                            <ul className="divide-y px-6" style={{ borderColor: C.line }}>
                                {quote.map((q) => (
                                    <li key={q.id} className="flex items-start justify-between gap-3 py-4" style={{ borderColor: C.line }}>
                                        <span className="min-w-0">
                                            <span className="block">{q.label}</span>
                                            <span className="text-sm" style={{ color: C.muted }}>
                                                from ${Math.round(q.price * factor).toLocaleString()}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${q.label}`}
                                            onClick={() => toggle(q)}
                                            className="flex size-9 shrink-0 items-center justify-center"
                                            style={{ color: C.muted }}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="space-y-4 border-t p-6" style={{ borderColor: C.line }}>
                                <label className="flex flex-col gap-1.5 text-sm">
                                    Vehicle size
                                    <select
                                        value={size}
                                        onChange={(e) => setSize(e.target.value as Size)}
                                        className="min-h-11 rounded-lg border bg-transparent px-3"
                                        style={{ borderColor: C.lineStrong }}
                                    >
                                        {Object.keys(SIZE_FACTOR).map((s) => (
                                            <option key={s} className="text-black">
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5 text-sm">
                                    Year, make and model
                                    <input
                                        required
                                        value={vehicle}
                                        onChange={(e) => setVehicle(e.target.value)}
                                        placeholder="2022 BMW M4"
                                        className="min-h-11 rounded-lg border bg-transparent px-3"
                                        style={{ borderColor: C.lineStrong }}
                                    />
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex flex-[1_1_140px] flex-col gap-1.5 text-sm">
                                        Name
                                        <input
                                            required
                                            autoComplete="name"
                                            className="min-h-11 rounded-lg border bg-transparent px-3"
                                            style={{ borderColor: C.lineStrong }}
                                        />
                                    </label>
                                    <label className="flex flex-[1_1_140px] flex-col gap-1.5 text-sm">
                                        Phone or email
                                        <input
                                            required
                                            className="min-h-11 rounded-lg border bg-transparent px-3"
                                            style={{ borderColor: C.lineStrong }}
                                        />
                                    </label>
                                </div>
                                <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: C.line }}>
                                    <span style={{ color: C.muted }}>Estimated total</span>
                                    <span className="text-3xl font-semibold" style={serif}>
                                        ${estimate.toLocaleString()}
                                    </span>
                                </div>
                                <button type="submit" className={`${btnLight} w-full`}>
                                    Send quote request
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
