import '@fontsource-variable/fraunces/opsz';
import '@fontsource-variable/fraunces/opsz-italic';
import '@fontsource/space-grotesk/400';
import '@fontsource/space-grotesk/500';
import '@fontsource/space-grotesk/700';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CircleCheck, Minus, Plus, Ruler, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

/*
 * DEMO SITE for a fictional streetwear brand ("LATESHIFT", Dallas TX).
 * Shows a store build: drop countdown, quick view, sizes/colours, bag, checkout.
 * Garments are drawn as SVG (no product photos). Checkout is simulated:
 * no card or account details are collected and no order is placed.
 */

// Dark by default; the original light look when the visitor's device is in light mode.
const C = {
    paper: 'var(--ls-paper)',
    paper2: 'var(--ls-paper2)',
    ink: 'var(--ls-ink)',
    soft: 'var(--ls-soft)',
    line: 'var(--ls-line)',
    oxText: 'var(--ls-ox-text)',
    band: 'var(--ls-band)',
    glass: 'var(--ls-glass)',
    ox: '#6b1e2b',
    oxDark: '#521620',
    cream: '#efe9df',
    night: '#141210',
};
const THEME = `:root:has(.ls){color-scheme:dark;--ls-paper:#12100f;--ls-paper2:#3a3530;--ls-ink:#efe9df;--ls-soft:#a89f93;--ls-line:#35302b;--ls-ox-text:#e47a8a;--ls-band:#1f1b18;--ls-glass:rgba(18,16,15,0.9)}
@media (prefers-color-scheme: light){:root:has(.ls){color-scheme:light;--ls-paper:#efe9df;--ls-paper2:#f7f3ec;--ls-ink:#141210;--ls-soft:#5b544b;--ls-line:#d8cfc1;--ls-ox-text:#6b1e2b;--ls-band:#141210;--ls-glass:rgba(239,233,223,0.9)}}`;
const serif = { fontFamily: "'Fraunces Variable', Georgia, serif" };

type Kind = 'hoodie' | 'tee' | 'crew' | 'pants' | 'cap' | 'tote';
type Colour = { name: string; hex: string };
type Product = { id: string; name: string; kind: Kind; price: number; colours: Colour[]; soldOut: string[]; blurb: string; details: string[] };

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FREE_SHIPPING = 100;

const PRODUCTS: Product[] = [
    {
        id: 'after-midnight-hoodie',
        name: 'After Midnight Hoodie',
        kind: 'hoodie',
        price: 98,
        colours: [
            { name: 'Oxblood', hex: '#6b1e2b' },
            { name: 'Night', hex: '#1d1b1a' },
            { name: 'Bone', hex: '#e4dccd' },
        ],
        soldOut: ['XS'],
        blurb: 'Heavyweight 450gsm fleece, boxy fit, dropped shoulders and a double-lined hood. Embroidered "LATESHIFT" across the chest.',
        details: ['100% cotton fleece, 450gsm', 'Boxy fit — size down for a closer fit', 'Made in small batches, Los Angeles'],
    },
    {
        id: 'slow-jam-tee',
        name: 'Slow Jam Tee',
        kind: 'tee',
        price: 42,
        colours: [
            { name: 'Bone', hex: '#e4dccd' },
            { name: 'Night', hex: '#1d1b1a' },
            { name: 'Smoke', hex: '#8a8580' },
        ],
        soldOut: ['XXL'],
        blurb: 'Garment-dyed 260gsm tee with a cassette-label back print. Gets softer every wash.',
        details: ['Garment-dyed heavyweight cotton', 'Relaxed fit', 'Screen-printed back graphic'],
    },
    {
        id: 'quiet-storm-crew',
        name: 'Quiet Storm Crewneck',
        kind: 'crew',
        price: 84,
        colours: [
            { name: 'Smoke', hex: '#8a8580' },
            { name: 'Oxblood', hex: '#6b1e2b' },
        ],
        soldOut: [],
        blurb: 'Loopback French terry crew with ribbed side panels and a small tonal logo.',
        details: ['Loopback French terry', 'Regular fit', 'Ribbed side panels'],
    },
    {
        id: 'late-shift-cargo',
        name: 'Late Shift Cargo',
        kind: 'pants',
        price: 110,
        colours: [
            { name: 'Night', hex: '#1d1b1a' },
            { name: 'Olive', hex: '#4d4a35' },
        ],
        soldOut: ['XS', 'XXL'],
        blurb: 'Relaxed ripstop cargos with a hidden zip pocket — room for keys, phone and the aux cord.',
        details: ['Cotton ripstop', 'Adjustable drawcord hem', 'Hidden zip pocket'],
    },
    {
        id: 'b-side-cap',
        name: 'B-Side Cap',
        kind: 'cap',
        price: 38,
        colours: [
            { name: 'Night', hex: '#1d1b1a' },
            { name: 'Oxblood', hex: '#6b1e2b' },
        ],
        soldOut: [],
        blurb: 'Six-panel washed twill cap with a curved brim and brass buckle.',
        details: ['Washed cotton twill', 'One size, adjustable', 'Brass buckle'],
    },
    {
        id: 'mixtape-tote',
        name: 'Mixtape Tote',
        kind: 'tote',
        price: 32,
        colours: [{ name: 'Bone', hex: '#e4dccd' }],
        soldOut: [],
        blurb: 'Heavy canvas tote that fits a laptop, a hoodie and a stack of records.',
        details: ['16oz canvas', 'Inside pocket', 'Fits a 15" laptop'],
    },
];

const oneSize = (p: Product) => p.kind === 'cap' || p.kind === 'tote';

/** Flat garment illustration, coloured by the selected swatch. */
function Garment({ kind, colour, className = '' }: { kind: Kind; colour: string; className?: string }) {
    const shade = 'rgba(0,0,0,0.18)';
    const light = colour === '#e4dccd';
    const mark = light ? C.night : C.cream;
    return (
        <svg viewBox="0 0 240 240" className={className} role="img" aria-label={`${kind} illustration`}>
            {kind === 'hoodie' && (
                <g>
                    <path
                        d="M78 52 Q120 20 162 52 L200 78 L222 150 L192 160 L180 122 L180 214 L60 214 L60 122 L48 160 L18 150 L40 78 Z"
                        fill={colour}
                    />
                    <path d="M92 50 Q120 82 148 50 Q140 30 120 28 Q100 30 92 50Z" fill={shade} />
                    <path d="M84 162 h72 v30 h-72z" fill={shade} />
                    <path d="M114 70 v30 M126 70 v30" stroke={mark} strokeWidth="2" strokeLinecap="round" opacity=".7" />
                    <text x="120" y="128" textAnchor="middle" fontFamily="Fraunces Variable, serif" fontStyle="italic" fontSize="15" fill={mark}>
                        LATESHIFT
                    </text>
                </g>
            )}
            {kind === 'tee' && (
                <g>
                    <path d="M82 40 Q120 60 158 40 L214 70 L196 112 L172 102 L172 210 L68 210 L68 102 L44 112 L26 70 Z" fill={colour} />
                    <path d="M98 42 Q120 58 142 42" fill="none" stroke={shade} strokeWidth="6" />
                    <rect x="98" y="96" width="44" height="28" rx="4" fill="none" stroke={mark} strokeWidth="2.5" />
                    <circle cx="111" cy="110" r="5" fill="none" stroke={mark} strokeWidth="2" />
                    <circle cx="129" cy="110" r="5" fill="none" stroke={mark} strokeWidth="2" />
                </g>
            )}
            {kind === 'crew' && (
                <g>
                    <path
                        d="M80 44 Q120 64 160 44 L204 70 L224 168 L196 174 L180 110 L180 212 L60 212 L60 110 L44 174 L16 168 L36 70 Z"
                        fill={colour}
                    />
                    <path d="M96 46 Q120 62 144 46" fill="none" stroke={shade} strokeWidth="7" />
                    <path d="M60 196 h120 M190 160 l30 -6 M50 160 l-30 -6" stroke={shade} strokeWidth="6" />
                    <circle cx="146" cy="88" r="6" fill={mark} opacity=".6" />
                </g>
            )}
            {kind === 'pants' && (
                <g>
                    <path d="M70 24 h100 l18 196 h-52 l-16 -130 l-16 130 h-52 Z" fill={colour} />
                    <path d="M70 24 h100 v14 h-100z" fill={shade} />
                    <rect x="58" y="110" width="30" height="36" rx="3" fill={shade} />
                    <rect x="152" y="110" width="30" height="36" rx="3" fill={shade} />
                </g>
            )}
            {kind === 'cap' && (
                <g>
                    <path d="M44 140 Q50 70 120 66 Q190 70 196 140 Z" fill={colour} />
                    <path d="M44 140 Q120 120 196 140 Q214 150 226 166 Q140 150 56 160 Q40 156 44 140Z" fill={shade} />
                    <path d="M120 66 v74" stroke={shade} strokeWidth="3" />
                    <circle cx="120" cy="68" r="5" fill={shade} />
                    <text x="148" y="118" textAnchor="middle" fontFamily="Fraunces Variable, serif" fontStyle="italic" fontSize="16" fill={mark}>
                        B
                    </text>
                </g>
            )}
            {kind === 'tote' && (
                <g>
                    <path d="M88 80 Q88 30 120 30 Q152 30 152 80" fill="none" style={{ stroke: C.ink }} strokeWidth="8" opacity=".75" />
                    <rect x="52" y="76" width="136" height="146" rx="6" fill={colour} />
                    <rect x="84" y="128" width="72" height="44" rx="5" fill="none" stroke={mark} strokeWidth="3" />
                    <circle cx="104" cy="150" r="7" fill="none" stroke={mark} strokeWidth="3" />
                    <circle cx="136" cy="150" r="7" fill="none" stroke={mark} strokeWidth="3" />
                </g>
            )}
        </svg>
    );
}

/** Next Friday at 7pm local time (the "drop"). */
function nextDrop(): Date {
    const now = new Date();
    const d = new Date(now);
    d.setHours(19, 0, 0, 0);
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7)); // this week's (or today's) Friday
    if (d <= now) d.setDate(d.getDate() + 7); // already passed: next week's
    return d;
}

function Countdown() {
    const target = useMemo(nextDrop, []);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
    const parts = [
        [Math.floor(s / 86400), 'days'],
        [Math.floor((s % 86400) / 3600), 'hrs'],
        [Math.floor((s % 3600) / 60), 'min'],
        [s % 60, 'sec'],
    ] as const;
    return (
        <div className="flex gap-4" aria-label="Time until the next drop">
            {parts.map(([n, label]) => (
                <div key={label} className="text-center">
                    <p className="text-4xl tabular-nums sm:text-5xl" style={serif}>
                        {String(n).padStart(2, '0')}
                    </p>
                    <p className="text-xs tracking-[0.2em] uppercase" style={{ color: C.soft }}>
                        {label}
                    </p>
                </div>
            ))}
        </div>
    );
}

type Line = { key: string; product: Product; colour: Colour; size: string; qty: number };

export default function LateshiftDemo() {
    const [quick, setQuick] = useState<Product | null>(null);
    const [colour, setColour] = useState<Colour | null>(null);
    const [size, setSize] = useState<string>('');
    const [qty, setQty] = useState(1);
    const [showGuide, setShowGuide] = useState(false);
    const [bag, setBag] = useState<Line[]>([]);
    const [bagOpen, setBagOpen] = useState(false);
    const [stage, setStage] = useState<'bag' | 'checkout' | 'done'>('bag');
    const [shipping, setShipping] = useState<'standard' | 'express' | 'pickup'>('standard');
    const [orderNo, setOrderNo] = useState('');
    const [alerted, setAlerted] = useState(false);

    const subtotal = bag.reduce((s, l) => s + l.product.price * l.qty, 0);
    const count = bag.reduce((s, l) => s + l.qty, 0);
    const shipCost = shipping === 'pickup' || (shipping === 'standard' && subtotal >= FREE_SHIPPING) ? 0 : shipping === 'express' ? 18 : 8;
    const toFree = Math.max(0, FREE_SHIPPING - subtotal);

    const openQuick = (p: Product) => {
        setQuick(p);
        setColour(p.colours[0]);
        setSize(oneSize(p) ? 'One size' : '');
        setQty(1);
        setShowGuide(false);
    };

    const addToBag = () => {
        if (!quick || !colour || !size) return;
        const key = `${quick.id}-${colour.name}-${size}`;
        setBag((b) =>
            b.some((l) => l.key === key)
                ? b.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
                : [...b, { key, product: quick, colour, size, qty }],
        );
        setQuick(null);
        setStage('bag');
        setBagOpen(true);
    };

    const changeQty = (key: string, delta: number) =>
        setBag((b) => b.flatMap((l) => (l.key !== key ? [l] : l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }])));

    const placeOrder = (e: FormEvent) => {
        e.preventDefault();
        setOrderNo(`LS-${Math.floor(10000 + Math.random() * 89999)}`);
        setStage('done');
        setBag([]);
    };

    const [hero, second, third, ...rest] = PRODUCTS;
    const btn = 'inline-flex min-h-12 items-center justify-center gap-2 px-6 text-sm font-bold tracking-[0.12em] uppercase transition-colors';

    const Tile = ({ p, big = false }: { p: Product; big?: boolean }) => (
        <button
            type="button"
            onClick={() => openQuick(p)}
            className="group flex h-full w-full flex-col text-left"
            aria-label={`Quick view: ${p.name}, $${p.price}`}
        >
            <div
                className="relative flex flex-1 items-center justify-center overflow-hidden"
                style={{ background: C.paper2, minHeight: big ? 420 : 220 }}
            >
                <Garment
                    kind={p.kind}
                    colour={p.colours[0].hex}
                    className={`${big ? 'w-[70%] max-w-[380px]' : 'w-[62%] max-w-[220px]'} transition-transform duration-300 group-hover:scale-105`}
                />
                <span
                    className="absolute right-3 bottom-3 translate-y-2 px-3 py-1.5 text-xs font-bold tracking-[0.12em] uppercase opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                    style={{ background: C.ink, color: C.paper }}
                >
                    Quick view
                </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-3">
                <span className={big ? 'text-3xl' : 'text-xl'} style={serif}>
                    {p.name}
                </span>
                <span className="font-bold">${p.price}</span>
            </div>
            <span className="mt-1 flex gap-1.5" aria-hidden="true">
                {p.colours.map((c) => (
                    <span key={c.name} className="size-3 rounded-full border" style={{ background: c.hex, borderColor: C.line }} />
                ))}
            </span>
        </button>
    );

    return (
        <>
            <Head title="LATESHIFT (demo store)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div className="ls min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div style={{ background: C.ox, color: C.cream }}>
                    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-medium sm:px-8">
                        <p>Demo store for a fictional brand, designed &amp; built by Timasi Werema. Nothing here is for sale.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: C.line, background: C.glass }}>
                    <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <a href="#top" className="text-3xl italic" style={serif}>
                            LATESHIFT
                        </a>
                        <div className="flex items-center gap-6 text-sm font-medium tracking-[0.1em] uppercase">
                            <a href="#drop" className="hidden py-2 hover:underline sm:inline">
                                Drop 04
                            </a>
                            <a href="#lookbook" className="hidden py-2 hover:underline sm:inline">
                                Lookbook
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    setStage('bag');
                                    setBagOpen(true);
                                }}
                                className="relative flex min-h-11 items-center gap-2"
                                aria-label={`Bag, ${count} item${count === 1 ? '' : 's'}`}
                            >
                                <ShoppingBag className="size-5" />
                                <span className="hidden sm:inline">Bag</span>
                                {count > 0 && (
                                    <span
                                        className="flex size-5 items-center justify-center rounded-full text-xs"
                                        style={{ background: C.ox, color: C.cream }}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </nav>
                </header>

                <main id="top">
                    {/* Hero */}
                    <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-12 gap-y-10 px-5 py-14 sm:px-8 lg:py-20">
                        <div className="min-w-0 flex-[999_1_480px]">
                            <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.oxText }}>
                                Drop 04 · "After Midnight" · Dallas, TX
                            </p>
                            <h1 className="mt-4 text-[56px] leading-[0.95] sm:text-7xl lg:text-[104px]" style={serif}>
                                Made for the <em style={{ color: C.oxText }}>late shift.</em>
                            </h1>
                            <p className="mt-5 max-w-lg text-lg" style={{ color: C.soft }}>
                                Heavyweight basics for the hours after everyone else goes home. Small runs, no restocks.
                            </p>
                            <div className="mt-8">
                                <p className="mb-3 text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.soft }}>
                                    Next drop goes live Friday, 7 PM
                                </p>
                                <Countdown />
                            </div>
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <a href="#drop" className={btn} style={{ background: C.ink, color: C.paper }}>
                                    Shop Drop 04 <ArrowRight className="size-4" />
                                </a>
                                {alerted ? (
                                    <span role="status" className="inline-flex items-center gap-2 text-sm font-bold">
                                        <CircleCheck className="size-4" /> You're on the list (demo)
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setAlerted(true)}
                                        className={`${btn} border-2`}
                                        style={{ borderColor: C.ink }}
                                    >
                                        Text me when it drops
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => openQuick(hero)}
                            className="flex min-w-0 flex-[1_1_340px] justify-center"
                            aria-label={`Quick view: ${hero.name}`}
                        >
                            <Garment kind="hoodie" colour={C.ox} className="w-full max-w-[440px] drop-shadow-[0_24px_30px_rgba(20,18,16,0.18)]" />
                        </button>
                    </section>

                    {/* Editorial product layout */}
                    <section id="drop" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 pb-20 sm:px-8">
                        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-t pt-6" style={{ borderColor: C.ink }}>
                            <h2 className="text-5xl sm:text-6xl" style={serif}>
                                Drop 04
                            </h2>
                            <p className="text-sm" style={{ color: C.soft }}>
                                {PRODUCTS.length} pieces · free shipping over ${FREE_SHIPPING}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <div className="min-w-0 flex-[3_1_420px]">
                                <Tile p={hero} big />
                            </div>
                            <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-6">
                                <Tile p={second} />
                                <Tile p={third} />
                            </div>
                        </div>
                        <h3 className="mt-14 mb-4 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: C.soft }}>
                            Also in the drop →
                        </h3>
                        <div className="-mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
                            {rest.map((p) => (
                                <div key={p.id} className="w-[260px] shrink-0 snap-start">
                                    <Tile p={p} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Lookbook */}
                    <section id="lookbook" className="scroll-mt-20" style={{ background: C.band, color: C.cream }}>
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
                            <h2 className="text-5xl sm:text-6xl" style={serif}>
                                Lookbook
                            </h2>
                            <ol className="mt-10 space-y-14">
                                {[
                                    [
                                        '01',
                                        '1:47 AM, Deep Ellum',
                                        'After Midnight Hoodie in Oxblood with the Late Shift Cargo in Olive.',
                                        ['hoodie', '#6b1e2b'],
                                        ['pants', '#4d4a35'],
                                    ],
                                    [
                                        '02',
                                        'Sunday, slow start',
                                        'Slow Jam Tee in Bone, the B-Side Cap in Oxblood and the Mixtape Tote for the record run.',
                                        ['tee', '#e4dccd'],
                                        ['cap', '#6b1e2b'],
                                    ],
                                ].map(([n, title, text, a, b]) => (
                                    <li key={n as string} className="flex flex-wrap items-center gap-x-12 gap-y-6">
                                        <div className="flex flex-[1_1_320px] gap-4">
                                            <div
                                                className="flex flex-1 items-center justify-center"
                                                style={{ background: '#2c2824', minHeight: 240 }}
                                            >
                                                <Garment kind={(a as string[])[0] as Kind} colour={(a as string[])[1]} className="w-[70%]" />
                                            </div>
                                            <div
                                                className="flex flex-1 items-center justify-center"
                                                style={{ background: '#2c2824', minHeight: 240 }}
                                            >
                                                <Garment kind={(b as string[])[0] as Kind} colour={(b as string[])[1]} className="w-[70%]" />
                                            </div>
                                        </div>
                                        <div className="flex-[1_1_280px]">
                                            <p className="text-sm tracking-[0.2em] opacity-70">LOOK {n as string}</p>
                                            <p className="mt-2 text-4xl italic" style={serif}>
                                                {title as string}
                                            </p>
                                            <p className="mt-3 opacity-80">{text as string}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* Policies */}
                    <section className="mx-auto flex max-w-[1240px] flex-wrap gap-x-12 gap-y-6 px-5 py-14 sm:px-8">
                        {[
                            ['Free shipping', `On orders over $${FREE_SHIPPING} in the US. Local pickup in Dallas is always free.`],
                            ['30-day returns', 'Unworn, with tags. Exchanges for a different size are free.'],
                            ['Small batches', 'Each drop is made once. When it sells out, it is gone.'],
                        ].map(([t, d]) => (
                            <div key={t} className="flex-[1_1_240px] border-t pt-4" style={{ borderColor: C.ink }}>
                                <p className="text-2xl" style={serif}>
                                    {t}
                                </p>
                                <p className="mt-1 text-sm" style={{ color: C.soft }}>
                                    {d}
                                </p>
                            </div>
                        ))}
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line }}>
                    <div
                        className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.soft }}
                    >
                        <p>LATESHIFT is a fictional brand. This store is a portfolio demo; nothing is for sale.</p>
                        <Link
                            href="/#contact"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            style={{ color: C.ink }}
                        >
                            Want a store like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Quick view */}
            <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
                <DialogContent
                    className="max-h-[92dvh] max-w-3xl overflow-y-auto rounded-none border-0 p-0 sm:max-w-3xl"
                    style={{ background: C.paper, color: C.ink }}
                >
                    {quick && colour && (
                        <div className="flex flex-wrap">
                            <div className="flex min-h-[300px] flex-[1_1_300px] items-center justify-center" style={{ background: C.paper2 }}>
                                <Garment kind={quick.kind} colour={colour.hex} className="w-[72%]" />
                            </div>
                            <div className="flex-[1_1_300px] p-6 sm:p-8">
                                <DialogTitle className="text-4xl font-normal" style={serif}>
                                    {quick.name}
                                </DialogTitle>
                                <p className="mt-1 text-xl font-bold">${quick.price}</p>
                                <DialogDescription className="mt-3" style={{ color: C.soft }}>
                                    {quick.blurb}
                                </DialogDescription>

                                <fieldset className="mt-6">
                                    <legend className="text-xs font-bold tracking-[0.15em] uppercase">Colour: {colour.name}</legend>
                                    <div className="mt-2 flex gap-2">
                                        {quick.colours.map((c) => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                aria-label={c.name}
                                                aria-pressed={c.name === colour.name}
                                                onClick={() => setColour(c)}
                                                className="flex size-11 items-center justify-center rounded-full border-2"
                                                style={{ borderColor: c.name === colour.name ? C.ink : 'transparent' }}
                                            >
                                                <span className="size-8 rounded-full border" style={{ background: c.hex, borderColor: C.line }} />
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>

                                {!oneSize(quick) && (
                                    <fieldset className="mt-5">
                                        <div className="flex items-center justify-between">
                                            <legend className="text-xs font-bold tracking-[0.15em] uppercase">Size{size ? `: ${size}` : ''}</legend>
                                            <button
                                                type="button"
                                                onClick={() => setShowGuide((g) => !g)}
                                                className="inline-flex min-h-9 items-center gap-1 text-xs font-bold underline underline-offset-4"
                                            >
                                                <Ruler className="size-3.5" /> Size guide
                                            </button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {SIZES.map((s) => {
                                                const out = quick.soldOut.includes(s);
                                                return (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        disabled={out}
                                                        aria-pressed={size === s}
                                                        aria-label={out ? `${s}, sold out` : s}
                                                        onClick={() => setSize(s)}
                                                        className="min-h-11 min-w-12 border px-3 text-sm font-bold disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
                                                        style={
                                                            size === s
                                                                ? { background: C.ink, color: C.paper, borderColor: C.ink }
                                                                : { borderColor: C.ink }
                                                        }
                                                    >
                                                        {s}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {showGuide && (
                                            <div className="mt-3 overflow-x-auto">
                                                <table className="w-full min-w-[300px] text-left text-sm">
                                                    <caption className="sr-only">Size guide in inches</caption>
                                                    <thead>
                                                        <tr className="border-b" style={{ borderColor: C.line }}>
                                                            <th className="py-1.5 font-bold">Size</th>
                                                            <th className="py-1.5 font-bold">Chest</th>
                                                            <th className="py-1.5 font-bold">Length</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {SIZES.map((s, i) => (
                                                            <tr key={s} className="border-b" style={{ borderColor: C.line }}>
                                                                <td className="py-1.5">{s}</td>
                                                                <td className="py-1.5">{40 + i * 2}"</td>
                                                                <td className="py-1.5">{26 + i}"</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </fieldset>
                                )}

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <div className="flex items-center border" style={{ borderColor: C.ink }}>
                                        <button
                                            type="button"
                                            aria-label="Decrease quantity"
                                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                                            className="flex size-12 items-center justify-center"
                                        >
                                            <Minus className="size-4" />
                                        </button>
                                        <span className="w-8 text-center font-bold" aria-live="polite">
                                            {qty}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="Increase quantity"
                                            onClick={() => setQty((q) => Math.min(9, q + 1))}
                                            className="flex size-12 items-center justify-center"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addToBag}
                                        disabled={!size}
                                        className={`${btn} flex-1 disabled:opacity-50`}
                                        style={{ background: C.ox, color: C.cream }}
                                    >
                                        {size ? `Add to bag · $${quick.price * qty}` : 'Choose a size'}
                                    </button>
                                </div>
                                <ul className="mt-6 space-y-1 text-sm" style={{ color: C.soft }}>
                                    {quick.details.map((d) => (
                                        <li key={d}>— {d}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bag + checkout drawer */}
            <Sheet open={bagOpen} onOpenChange={setBagOpen}>
                <SheetContent
                    side="right"
                    className="flex w-full flex-col gap-0 overflow-y-auto border-l p-0 sm:max-w-md"
                    style={{ background: C.paper, color: C.ink, borderColor: C.line }}
                >
                    <div className="border-b px-6 py-5" style={{ borderColor: C.line }}>
                        <SheetTitle className="text-3xl font-normal" style={serif}>
                            {stage === 'checkout' ? 'Checkout' : stage === 'done' ? 'Order placed' : 'Your bag'}
                        </SheetTitle>
                        <SheetDescription style={{ color: C.soft }}>
                            {stage === 'done'
                                ? 'Demo only — nothing was charged.'
                                : stage === 'checkout'
                                  ? 'Simulated checkout: no card details are collected.'
                                  : `${count} item${count === 1 ? '' : 's'}`}
                        </SheetDescription>
                    </div>

                    {stage === 'done' ? (
                        <div className="flex flex-1 flex-col items-start gap-3 p-6" role="status">
                            <CircleCheck className="size-12" style={{ color: C.oxText }} />
                            <p className="text-3xl" style={serif}>
                                Thank you!
                            </p>
                            <p>
                                Order <strong>{orderNo}</strong> is confirmed.
                            </p>
                            <p className="text-sm" style={{ color: C.soft }}>
                                On a real store you'd get an email receipt and tracking. This is a demo, so no order was placed and nothing was
                                charged.
                            </p>
                            <button
                                type="button"
                                onClick={() => setBagOpen(false)}
                                className={`${btn} mt-4 w-full`}
                                style={{ background: C.ink, color: C.paper }}
                            >
                                Keep browsing
                            </button>
                        </div>
                    ) : bag.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                            <ShoppingBag className="size-10" style={{ color: C.soft }} />
                            <p>Your bag is empty.</p>
                            <button type="button" onClick={() => setBagOpen(false)} className={btn} style={{ background: C.ink, color: C.paper }}>
                                Shop Drop 04
                            </button>
                        </div>
                    ) : stage === 'bag' ? (
                        <>
                            <div className="px-6 pt-5">
                                <p className="flex items-center gap-2 text-sm">
                                    <Truck className="size-4" />
                                    {toFree > 0 ? (
                                        <span>
                                            You're <strong>${toFree}</strong> away from free shipping
                                        </span>
                                    ) : (
                                        <strong>You've unlocked free shipping</strong>
                                    )}
                                </p>
                                <div className="mt-2 h-1.5 w-full" style={{ background: C.line }} aria-hidden="true">
                                    <div
                                        className="h-1.5 transition-all"
                                        style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%`, background: C.ox }}
                                    />
                                </div>
                            </div>
                            <ul className="flex-1 divide-y px-6" style={{ borderColor: C.line }}>
                                {bag.map((l) => (
                                    <li key={l.key} className="flex gap-4 py-5" style={{ borderColor: C.line }}>
                                        <div className="flex size-20 shrink-0 items-center justify-center" style={{ background: C.paper2 }}>
                                            <Garment kind={l.product.kind} colour={l.colour.hex} className="w-[80%]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-lg leading-tight" style={serif}>
                                                {l.product.name}
                                            </p>
                                            <p className="text-sm" style={{ color: C.soft }}>
                                                {l.colour.name} · {l.size}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center border" style={{ borderColor: C.line }}>
                                                    <button
                                                        type="button"
                                                        aria-label={`Decrease ${l.product.name}`}
                                                        onClick={() => changeQty(l.key, -1)}
                                                        className="flex size-9 items-center justify-center"
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                                                    <button
                                                        type="button"
                                                        aria-label={`Increase ${l.product.name}`}
                                                        onClick={() => changeQty(l.key, 1)}
                                                        className="flex size-9 items-center justify-center"
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </button>
                                                </div>
                                                <span className="font-bold">${l.product.price * l.qty}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${l.product.name}`}
                                            onClick={() => changeQty(l.key, -l.qty)}
                                            className="flex size-9 items-center justify-center self-start"
                                            style={{ color: C.soft }}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t p-6" style={{ borderColor: C.line }}>
                                <div className="flex justify-between text-lg">
                                    <span>Subtotal</span>
                                    <strong>${subtotal}</strong>
                                </div>
                                <p className="mt-1 text-sm" style={{ color: C.soft }}>
                                    Shipping and taxes at checkout.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStage('checkout')}
                                    className={`${btn} mt-4 w-full`}
                                    style={{ background: C.ox, color: C.cream }}
                                >
                                    Checkout <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={placeOrder} className="flex flex-1 flex-col gap-5 p-6">
                            <fieldset>
                                <legend className="text-xs font-bold tracking-[0.15em] uppercase">Delivery</legend>
                                <div className="mt-2 flex flex-col gap-2">
                                    {(
                                        [
                                            ['standard', 'Standard (3–5 days)', subtotal >= FREE_SHIPPING ? 'Free' : '$8'],
                                            ['express', 'Express (1–2 days)', '$18'],
                                            ['pickup', 'Pickup in Dallas', 'Free'],
                                        ] as const
                                    ).map(([id, label, price]) => (
                                        <label
                                            key={id}
                                            className="flex min-h-12 cursor-pointer items-center justify-between gap-3 border px-4"
                                            style={{ borderColor: shipping === id ? C.ink : C.line }}
                                        >
                                            <span className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    checked={shipping === id}
                                                    onChange={() => setShipping(id)}
                                                    className="accent-[#6b1e2b]"
                                                />
                                                {label}
                                            </span>
                                            <span className="font-bold">{price}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <div className="space-y-1 border-t pt-4 text-sm" style={{ borderColor: C.line }}>
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>{shipCost ? `$${shipCost}` : 'Free'}</span>
                                </div>
                                <div className="flex justify-between pt-2 text-lg">
                                    <span>Total</span>
                                    <strong>${subtotal + shipCost}</strong>
                                </div>
                            </div>
                            <p className="text-sm" style={{ color: C.soft }}>
                                On a real store this step hands off to a secure checkout (Shopify, Square or Stripe) with Apple Pay and Google Pay.
                            </p>
                            <div className="mt-auto flex flex-col gap-2">
                                <button type="submit" className={btn} style={{ background: C.ox, color: C.cream }}>
                                    Place demo order · ${subtotal + shipCost}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStage('bag')}
                                    className="min-h-11 text-sm font-bold underline underline-offset-4"
                                >
                                    ← Back to bag
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
