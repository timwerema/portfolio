import '@fontsource-variable/archivo/wdth.css';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Check, ChevronDown, Droplets, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { type FormEvent, useState } from 'react';

/*
 * DEMO SITE for a fictional business ("Clearcoat Detailing").
 * Built to show prospective clients what a Business-package site can look like.
 * Nothing here is a real company; the booking form does not send anything.
 */

const packages = [
    {
        id: 'express',
        name: 'Express Wash',
        price: 59,
        time: '45 min',
        tagline: 'A fast, thorough refresh between details.',
        items: ['Foam hand wash & dry', 'Wheels, tires & tire shine', 'Windows inside & out', 'Quick interior vacuum'],
    },
    {
        id: 'signature',
        name: 'Signature Detail',
        price: 179,
        time: '3 hrs',
        tagline: 'Our most-booked package: deep clean, inside and out.',
        items: [
            'Everything in Express',
            'Clay bar decontamination',
            'Hand-applied wax (3-month protection)',
            'Full interior shampoo & steam',
            'Leather clean & condition',
        ],
    },
    {
        id: 'ceramic',
        name: 'Ceramic Shield',
        price: 699,
        time: '1–2 days',
        tagline: 'Paint correction plus a long-lasting ceramic coating.',
        items: [
            'Everything in Signature',
            'One-step paint correction',
            'Ceramic coating (multi-year protection)',
            'Glass & wheel coating',
            'Aftercare kit',
        ],
    },
];

const addOns = [
    ['Pet hair removal', '$35'],
    ['Engine bay detail', '$45'],
    ['Headlight restoration', '$60'],
    ['Odor treatment', '$50'],
];

const faqs = [
    [
        'Do you need water or power at my place?',
        'No. Our van carries its own water and power, so we can work in a driveway, office lot or apartment garage.',
    ],
    [
        'How long does a ceramic coating last?',
        'With basic upkeep, our coating keeps its gloss and water beading for years. We’ll walk you through aftercare when we finish.',
    ],
    ['What if it rains on my appointment day?', 'We’ll text you the day before to reschedule for free if the forecast looks bad.'],
];

/** Stylised side profile of a sports car, drawn in line art. */
function CarProfile() {
    return (
        <svg role="img" aria-label="Line drawing of a sports car" viewBox="0 0 640 240" className="h-auto w-full">
            <path
                d="M40 170 C 60 168, 80 150, 130 140 L 230 96 C 260 84, 320 78, 380 80 C 430 82, 470 100, 510 128 L 580 140 C 600 144, 610 156, 606 172 L 600 182 L 40 182 Z"
                fill="#12161C"
                stroke="#C9D2DC"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            <path d="M250 104 L 300 90 C 340 84, 380 86, 410 92 L 452 118 L 262 122 Z" fill="#0B0D10" stroke="#5E6B78" strokeWidth="2" />
            <path d="M140 150 C 260 132, 420 128, 560 146" fill="none" stroke="#29D3E0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="160" cy="182" r="34" fill="#0B0D10" stroke="#C9D2DC" strokeWidth="2.5" />
            <circle cx="160" cy="182" r="16" fill="none" stroke="#5E6B78" strokeWidth="2" />
            <circle cx="500" cy="182" r="34" fill="#0B0D10" stroke="#C9D2DC" strokeWidth="2.5" />
            <circle cx="500" cy="182" r="16" fill="none" stroke="#5E6B78" strokeWidth="2" />
            <path d="M20 222 L 620 222" stroke="#2A323C" strokeWidth="2" />
            <path d="M330 60 l10 -22 M352 64 l18 -18 M308 64 l-4 -24" stroke="#29D3E0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

/** Before/after paint comparison: drag the slider to reveal the corrected finish. */
function BeforeAfter() {
    const [pos, setPos] = useState(50);

    return (
        <div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#2A323C]" aria-hidden="true">
                {/* After: deep, glossy paint */}
                <div className="absolute inset-0 bg-[#0E2A47]">
                    <div className="absolute -top-1/4 left-[8%] h-[150%] w-[18%] rotate-[24deg] bg-white/10" />
                    <div className="absolute -top-1/4 left-[30%] h-[150%] w-[5%] rotate-[24deg] bg-white/15" />
                    <span className="absolute right-5 bottom-4 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white">After</span>
                </div>
                {/* Before: dull paint with swirl marks */}
                <div className="absolute inset-0 overflow-hidden bg-[#3B4552]" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                    <svg viewBox="0 0 400 225" className="absolute inset-0 h-full w-full opacity-50">
                        <g fill="none" stroke="#8D98A5" strokeWidth="0.8">
                            {[20, 34, 48, 62, 76].map((r) => (
                                <circle key={r} cx="120" cy="100" r={r} />
                            ))}
                            {[16, 30, 44, 58].map((r) => (
                                <circle key={r} cx="290" cy="150" r={r} />
                            ))}
                            <path d="M10 40 L 140 10 M 200 210 L 390 120 M 40 200 L 120 160" />
                        </g>
                    </svg>
                    <span className="absolute bottom-4 left-5 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white">Before</span>
                </div>
                <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }} />
            </div>
            <label className="mt-4 flex flex-col gap-2 text-sm text-[#AEB8C4]">
                Drag to compare the paint before and after correction
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={pos}
                    onChange={(e) => setPos(Number(e.target.value))}
                    className="w-full accent-[#29D3E0]"
                />
            </label>
        </div>
    );
}

export default function ClearcoatDemo() {
    const [picked, setPicked] = useState('signature');
    const [booked, setBooked] = useState(false);
    const active = packages.find((p) => p.id === picked)!;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setBooked(true);
    };

    const field =
        'min-h-12 w-full rounded-lg border border-[#2A323C] bg-[#12161C] px-4 text-base text-white placeholder:text-[#6F7B88] focus:border-[#29D3E0] focus:outline-none';

    return (
        <>
            <Head title="Clearcoat Detailing (demo site)">
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content="Demo website for a fictional mobile car detailing business, built by Timasi Werema." />
            </Head>

            <div className="min-h-screen bg-[#0B0D10] text-[#E9EEF3]" style={{ fontFamily: "'Archivo Variable', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div className="bg-[#29D3E0] text-[#0B0D10]">
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-semibold sm:px-10">
                        <p>Demo site for a fictional business, designed &amp; built by Timasi Werema.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                {/* Nav */}
                <header className="border-b border-[#1C2229]">
                    <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-10">
                        <a href="#top" className="flex items-center gap-2 text-xl font-black tracking-wide uppercase" style={{ fontStretch: '125%' }}>
                            <Droplets className="size-6 text-[#29D3E0]" /> Clearcoat
                        </a>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-semibold text-[#AEB8C4]">
                            <a href="#packages" className="py-2 hover:text-white">
                                Packages
                            </a>
                            <a href="#results" className="py-2 hover:text-white">
                                Results
                            </a>
                            <a href="#faq" className="py-2 hover:text-white">
                                FAQ
                            </a>
                            <a
                                href="#book"
                                className="inline-flex min-h-11 items-center rounded-full bg-white px-5 font-bold text-[#0B0D10] hover:bg-[#29D3E0]"
                            >
                                Book now
                            </a>
                        </div>
                    </nav>
                </header>

                <main id="top">
                    {/* Hero */}
                    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-10 px-5 py-16 sm:px-10 lg:py-24">
                        <div className="min-w-0 flex-[999_1_480px]">
                            <p className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#29D3E0] uppercase">
                                <MapPin className="size-4" /> Mobile detailing · Dallas, TX
                            </p>
                            <h1 className="text-[38px] leading-[0.95] font-black uppercase sm:text-5xl xl:text-7xl" style={{ fontStretch: '125%' }}>
                                Showroom shine.
                                <br />
                                <span className="text-[#29D3E0]">In your driveway.</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-lg text-[#AEB8C4]">
                                We bring the wash bay to you — hand washes, deep interior details and ceramic coatings, booked online in under a
                                minute.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href="#book"
                                    className="inline-flex min-h-12 items-center rounded-full bg-[#29D3E0] px-7 font-bold text-[#0B0D10] hover:bg-white"
                                >
                                    Book a detail
                                </a>
                                <a
                                    href="#packages"
                                    className="inline-flex min-h-12 items-center rounded-full border border-[#5E6B78] px-7 font-bold hover:border-white"
                                >
                                    See packages
                                </a>
                            </div>
                        </div>
                        <div className="min-w-0 flex-[1_1_380px]">
                            <CarProfile />
                        </div>
                    </section>

                    {/* Why us */}
                    <section className="border-y border-[#1C2229] bg-[#0F1216]">
                        <ul className="mx-auto flex max-w-[1200px] flex-wrap gap-x-12 gap-y-6 px-5 py-8 sm:px-10">
                            {[
                                [Truck, 'We come to you', 'Home, office or apartment garage'],
                                [Droplets, 'Self-contained van', 'Our own water and power'],
                                [ShieldCheck, 'Pro-grade products', 'Safe on paint, leather and trim'],
                                [Calendar, 'Book online', 'Pick a time that works for you'],
                            ].map(([Icon, title, note]) => {
                                const I = Icon as typeof Truck;
                                return (
                                    <li key={title as string} className="flex flex-[1_1_220px] items-start gap-3">
                                        <I className="mt-0.5 size-6 shrink-0 text-[#29D3E0]" />
                                        <div>
                                            <p className="font-bold">{title as string}</p>
                                            <p className="text-sm text-[#AEB8C4]">{note as string}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Packages */}
                    <section id="packages" className="mx-auto max-w-[1200px] scroll-mt-6 px-5 py-20 sm:px-10">
                        <h2 className="text-4xl font-black uppercase sm:text-6xl" style={{ fontStretch: '125%' }}>
                            Pick your package
                        </h2>
                        <p className="mt-3 max-w-xl text-[#AEB8C4]">
                            Prices for sedans and coupes. SUVs and trucks add $20–$100 depending on the package.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-8">
                            <div role="tablist" aria-label="Packages" className="flex flex-[1_1_300px] flex-col gap-3">
                                {packages.map((p) => {
                                    const selected = p.id === picked;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={selected}
                                            onClick={() => setPicked(p.id)}
                                            className={`flex min-h-20 items-center justify-between gap-4 rounded-2xl border px-6 text-left transition-colors ${
                                                selected ? 'border-[#29D3E0] bg-[#12161C]' : 'border-[#2A323C] hover:border-[#5E6B78]'
                                            }`}
                                        >
                                            <span>
                                                <span className="block text-xl font-black uppercase" style={{ fontStretch: '112%' }}>
                                                    {p.name}
                                                </span>
                                                <span className="block text-sm text-[#AEB8C4]">{p.time}</span>
                                            </span>
                                            <span className={`text-3xl font-black ${selected ? 'text-[#29D3E0]' : ''}`}>${p.price}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div role="tabpanel" className="min-w-0 flex-[999_1_420px] rounded-2xl border border-[#2A323C] bg-[#12161C] p-8">
                                <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-[#29D3E0] uppercase">
                                    <Sparkles className="size-4" /> {active.name}
                                </p>
                                <p className="mt-3 text-2xl font-bold">{active.tagline}</p>
                                <ul className="mt-6 divide-y divide-[#2A323C] border-y border-[#2A323C]">
                                    {active.items.map((item) => (
                                        <li key={item} className="flex items-center gap-3 py-3">
                                            <Check className="size-5 shrink-0 text-[#29D3E0]" /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href="#book"
                                    className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-7 font-bold text-[#0B0D10] hover:bg-[#29D3E0]"
                                >
                                    Book {active.name} — ${active.price}
                                </a>
                            </div>
                        </div>
                        <div className="mt-10">
                            <h3 className="text-sm font-semibold tracking-[0.12em] text-[#AEB8C4] uppercase">Add-ons</h3>
                            <ul className="mt-3 flex flex-wrap gap-3">
                                {addOns.map(([name, price]) => (
                                    <li key={name} className="rounded-full border border-[#2A323C] px-4 py-2 text-sm">
                                        {name} <span className="font-bold text-[#29D3E0]">{price}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Results */}
                    <section id="results" className="scroll-mt-6 border-y border-[#1C2229] bg-[#0F1216]">
                        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-16 gap-y-10 px-5 py-20 sm:px-10">
                            <div className="min-w-0 flex-[1_1_400px]">
                                <h2 className="text-4xl font-black uppercase" style={{ fontStretch: '125%' }}>
                                    See the difference
                                </h2>
                                <p className="mt-4 text-[#AEB8C4]">
                                    Paint correction removes the swirl marks and haze that automatic car washes leave behind, then a coating locks in
                                    the gloss.
                                </p>
                                <ol className="mt-8 space-y-4">
                                    {['Book online and pick a time', 'We arrive with everything we need', 'Drive away looking brand new'].map(
                                        (step, i) => (
                                            <li key={step} className="flex items-center gap-4">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#29D3E0] font-bold text-[#29D3E0]">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ),
                                    )}
                                </ol>
                            </div>
                            <div className="min-w-0 flex-[999_1_480px]">
                                <BeforeAfter />
                            </div>
                        </div>
                    </section>

                    {/* Booking */}
                    <section id="book" className="mx-auto flex max-w-[1200px] scroll-mt-6 flex-wrap gap-x-16 gap-y-10 px-5 py-20 sm:px-10">
                        <div className="min-w-0 flex-[1_1_300px]">
                            <h2 className="text-4xl font-black uppercase sm:text-6xl" style={{ fontStretch: '125%' }}>
                                Book your detail
                            </h2>
                            <p className="mt-4 text-[#AEB8C4]">Pick a package and a day. We'll text to confirm your time within the hour.</p>
                        </div>
                        <div className="min-w-0 flex-[999_1_480px]">
                            {booked ? (
                                <div role="status" className="rounded-2xl border border-[#29D3E0] bg-[#12161C] p-8">
                                    <p className="text-2xl font-bold">Request received!</p>
                                    <p className="mt-2 text-[#AEB8C4]">
                                        This is a demo, so no booking was actually made. On a real site, the business would get your request by email
                                        and text.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setBooked(false)}
                                        className="mt-6 min-h-11 rounded-full border border-[#5E6B78] px-6 font-bold"
                                    >
                                        Back to the form
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-[#2A323C] bg-[#0F1216] p-6 sm:p-8">
                                    <div className="flex flex-wrap gap-5">
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            Name
                                            <input required className={field} placeholder="Jordan Lee" autoComplete="name" />
                                        </label>
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            Phone
                                            <input required type="tel" className={field} placeholder="(214) 555-0123" autoComplete="tel" />
                                        </label>
                                    </div>
                                    <div className="flex flex-wrap gap-5">
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            Package
                                            <select className={field} value={picked} onChange={(e) => setPicked(e.target.value)}>
                                                {packages.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} — ${p.price}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            Vehicle
                                            <select className={field} defaultValue="Sedan / coupe">
                                                <option>Sedan / coupe</option>
                                                <option>SUV / crossover</option>
                                                <option>Truck / van</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="flex flex-wrap gap-5">
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            Preferred date
                                            <input required type="date" className={`${field} [color-scheme:dark]`} />
                                        </label>
                                        <label className="flex flex-[1_1_200px] flex-col gap-2 text-sm font-semibold">
                                            ZIP code
                                            <input required inputMode="numeric" className={field} placeholder="75201" autoComplete="postal-code" />
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="min-h-12 self-start rounded-full bg-[#29D3E0] px-8 font-bold text-[#0B0D10] hover:bg-white"
                                    >
                                        Request booking
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="mx-auto max-w-[1200px] scroll-mt-6 px-5 pb-20 sm:px-10">
                        <h2 className="text-4xl font-black uppercase sm:text-5xl" style={{ fontStretch: '125%' }}>
                            Questions
                        </h2>
                        <div className="mt-8 divide-y divide-[#2A323C] border-y border-[#2A323C]">
                            {faqs.map(([q, a]) => (
                                <details key={q} className="group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold">
                                        {q}
                                        <ChevronDown className="size-5 shrink-0 text-[#29D3E0] transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="pb-5 text-[#AEB8C4]">{a}</p>
                                </details>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#1C2229]">
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-[#AEB8C4] sm:px-10">
                        <p>Clearcoat Detailing is a fictional business. This site is a portfolio demo.</p>
                        <Link
                            href="/#contact"
                            className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-4 hover:text-[#29D3E0]"
                        >
                            Want a site like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
