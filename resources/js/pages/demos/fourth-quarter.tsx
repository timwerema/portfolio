import '@fontsource-variable/manrope/wght';
import '@fontsource/bebas-neue/400';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleCheck, Clock, MapPin, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';

/*
 * DEMO SITE for a fictional business ("4th Quarter Performance", Frisco TX).
 * Built to show a local gym/trainer what a Business-package site looks like.
 * No real people, reviews or bookings: forms only show a demo confirmation.
 */

const C = { bone: '#f4f1ea', paper: '#fbfaf6', ink: '#111111', soft: '#4a4740', line: '#d9d3c4', volt: '#d4ff3a', dark: '#161616' };
const display = { fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.01em' };

const PROGRAMS = [
    {
        id: 'youth',
        name: 'Youth Athlete',
        who: 'Ages 10–17 · any sport',
        price: 149,
        blurb: 'Speed, agility and strength work built around the season your athlete is in — so they show up faster and stay healthy.',
        includes: ['2 coached sessions a week', 'Speed & vertical testing every 6 weeks', 'Injury-prevention warmups they can do at practice'],
    },
    {
        id: 'strength',
        name: 'Adult Strength',
        who: 'Beginners welcome',
        price: 129,
        blurb: 'Learn to lift with good form in small groups. Every program is scaled to where you are today.',
        includes: ['Unlimited group strength classes', 'Movement assessment on day one', 'Program tracked in the member app'],
    },
    {
        id: 'conditioning',
        name: 'Fourth Quarter Conditioning',
        who: 'High-energy group class',
        price: 99,
        blurb: 'Forty-five minutes of intervals, sleds and court work. Built for people who want to finish strong.',
        includes: ['Up to 5 classes a week', 'Heart-rate zones on screen', 'Partner workouts every Saturday'],
    },
    {
        id: 'private',
        name: '1-on-1 Training',
        who: 'Fully personal',
        price: 75,
        unit: '/session',
        blurb: 'A coach and a plan that are completely yours — for a specific goal, a comeback from injury, or a tryout date.',
        includes: ['Custom program and nutrition guide', 'Flexible scheduling', 'Text check-ins between sessions'],
    },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type Day = (typeof DAYS)[number];
const SCHEDULE: Record<Day, { time: string; name: string; coach: string; spots: number }[]> = {
    Mon: [
        { time: '6:00 AM', name: 'Adult Strength', coach: 'Coach Dre', spots: 4 },
        { time: '4:30 PM', name: 'Youth Athlete (10–13)', coach: 'Coach Maya', spots: 6 },
        { time: '6:00 PM', name: 'Fourth Quarter Conditioning', coach: 'Coach Dre', spots: 2 },
    ],
    Tue: [
        { time: '6:00 AM', name: 'Fourth Quarter Conditioning', coach: 'Coach Maya', spots: 8 },
        { time: '5:00 PM', name: 'Youth Athlete (14–17)', coach: 'Coach Dre', spots: 3 },
    ],
    Wed: [
        { time: '6:00 AM', name: 'Adult Strength', coach: 'Coach Dre', spots: 5 },
        { time: '4:30 PM', name: 'Youth Athlete (10–13)', coach: 'Coach Maya', spots: 7 },
        { time: '6:00 PM', name: 'Fourth Quarter Conditioning', coach: 'Coach Dre', spots: 0 },
    ],
    Thu: [
        { time: '6:00 AM', name: 'Fourth Quarter Conditioning', coach: 'Coach Maya', spots: 6 },
        { time: '5:00 PM', name: 'Youth Athlete (14–17)', coach: 'Coach Dre', spots: 4 },
        { time: '7:00 PM', name: 'Adult Strength', coach: 'Coach Maya', spots: 9 },
    ],
    Fri: [
        { time: '6:00 AM', name: 'Adult Strength', coach: 'Coach Dre', spots: 3 },
        { time: '5:30 PM', name: 'Open gym', coach: 'Staff', spots: 12 },
    ],
    Sat: [
        { time: '8:00 AM', name: 'Partner Conditioning', coach: 'Coach Maya', spots: 10 },
        { time: '10:00 AM', name: 'Youth Speed Clinic', coach: 'Coach Dre', spots: 5 },
    ],
};

const GOALS = ['Get faster for my sport', 'Get stronger', 'Lose weight & get fit', 'Come back from an injury', 'Not sure yet'];
const SLOTS = ['Mon 4:30 PM', 'Tue 6:00 AM', 'Wed 6:00 PM', 'Thu 5:00 PM', 'Sat 8:00 AM', 'Sat 10:00 AM'];

const FAQS = [
    [
        "I've never lifted before. Is that okay?",
        'Absolutely. Most members start as beginners. Your first session is a movement assessment, and every workout is scaled to you.',
    ],
    [
        'How young can athletes start?',
        'Our youth program starts at age 10, with coaching focused on movement quality, speed and confidence rather than heavy weights.',
    ],
    ['Do I need to sign a contract?', 'No. Memberships are month to month. Annual plans are optional and save you about 15%.'],
    ['What should I bring?', 'Athletic shoes, a water bottle and a towel. We have everything else.'],
];

export default function FourthQuarterDemo() {
    const [open, setOpen] = useState<string>('youth');
    const [day, setDay] = useState<Day>('Mon');
    const [reserved, setReserved] = useState<string[]>([]);
    const [annual, setAnnual] = useState(false);

    // Free-session booking: goal -> time -> details -> done
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('');
    const [slot, setSlot] = useState('');
    const [name, setName] = useState('');

    const price = (monthly: number, unit?: string) => (unit ? monthly : annual ? Math.round(monthly * 0.85) : monthly);

    const book = (e: FormEvent) => {
        e.preventDefault();
        setStep(4);
    };

    const pill = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 font-bold transition-colors';

    return (
        <>
            <Head title="4th Quarter Performance (demo site)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-screen" style={{ background: C.bone, color: C.ink, fontFamily: "'Manrope Variable', system-ui, sans-serif" }}>
                {/* Demo banner */}
                <div style={{ background: C.ink, color: C.bone }}>
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-semibold sm:px-8">
                        <p>Demo site for a fictional business, designed &amp; built by Timasi Werema.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                {/* Header */}
                <header className="border-b" style={{ borderColor: C.line }}>
                    <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
                        <a href="#top" className="flex items-center gap-2 text-3xl leading-none" style={display}>
                            <span className="rounded-md px-1.5 pt-1" style={{ background: C.volt }}>
                                4Q
                            </span>
                            4th Quarter Performance
                        </a>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-bold" style={{ color: C.soft }}>
                            <a href="#programs" className="py-2 hover:text-black">
                                Programs
                            </a>
                            <a href="#schedule" className="py-2 hover:text-black">
                                Schedule
                            </a>
                            <a href="#pricing" className="py-2 hover:text-black">
                                Pricing
                            </a>
                            <a href="#book" className={pill} style={{ background: C.ink, color: C.bone }}>
                                Free session
                            </a>
                        </div>
                    </nav>
                </header>

                <main id="top">
                    {/* Hero */}
                    <section className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-x-12 gap-y-10 px-5 py-16 sm:px-8 lg:py-24">
                        <div className="min-w-0 flex-[999_1_560px]">
                            <p className="mb-4 flex items-center gap-2 text-sm font-bold tracking-[0.14em] uppercase" style={{ color: C.soft }}>
                                <MapPin className="size-4" /> Frisco, TX · Athletes &amp; adults
                            </p>
                            <h1 className="text-[64px] leading-[0.88] sm:text-8xl lg:text-[136px]" style={display}>
                                Train like it's
                                <br />
                                <span
                                    className="rounded-lg [box-decoration-break:clone] px-3 [-webkit-box-decoration-break:clone]"
                                    style={{ background: C.volt }}
                                >
                                    the 4th quarter.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-xl text-lg" style={{ color: C.soft }}>
                                Small-group strength, conditioning and athlete development — coached, tracked and built so you finish strong.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href="#book" className={pill} style={{ background: C.ink, color: C.bone }}>
                                    Book a free session <ArrowRight className="size-4" />
                                </a>
                                <a href="#schedule" className={`${pill} border-2`} style={{ borderColor: C.ink }}>
                                    See this week's classes
                                </a>
                            </div>
                        </div>
                        {/* Coach card */}
                        <aside className="min-w-0 flex-[1_1_300px] rounded-2xl p-6" style={{ background: C.dark, color: C.bone }}>
                            <div className="flex items-center gap-4">
                                <span
                                    className="flex size-16 shrink-0 items-center justify-center rounded-full text-3xl"
                                    style={{ ...display, background: C.volt, color: C.ink }}
                                >
                                    DM
                                </span>
                                <div>
                                    <p className="text-3xl leading-none" style={display}>
                                        Coach Dre Mitchell
                                    </p>
                                    <p className="text-sm opacity-80">Head coach &amp; founder</p>
                                </div>
                            </div>
                            <p className="mt-5 text-sm leading-relaxed opacity-90">
                                Former college point guard turned strength coach. Dre built 4th Quarter for athletes who want an edge and adults who
                                want to feel like one.
                            </p>
                            <ul className="mt-5 space-y-2 text-sm">
                                {['Certified strength & conditioning coach', 'Youth athletic development specialist', '10 years coaching in DFW'].map(
                                    (c) => (
                                        <li key={c} className="flex items-start gap-2">
                                            <Check className="mt-0.5 size-4 shrink-0" style={{ color: C.volt }} /> {c}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </aside>
                    </section>

                    {/* Programs (expandable rows) */}
                    <section id="programs" className="scroll-mt-6 border-y" style={{ borderColor: C.line, background: C.paper }}>
                        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                            <h2 className="text-6xl sm:text-7xl" style={display}>
                                Programs
                            </h2>
                            <ul className="mt-8 border-t-2" style={{ borderColor: C.ink }}>
                                {PROGRAMS.map((p) => {
                                    const isOpen = open === p.id;
                                    return (
                                        <li key={p.id} className="border-b" style={{ borderColor: C.line }}>
                                            <button
                                                type="button"
                                                aria-expanded={isOpen}
                                                aria-controls={`prog-${p.id}`}
                                                onClick={() => setOpen(isOpen ? '' : p.id)}
                                                className="flex min-h-20 w-full flex-wrap items-center gap-x-6 gap-y-1 py-4 text-left"
                                            >
                                                <span className="flex-[1_1_260px] text-4xl sm:text-5xl" style={display}>
                                                    {p.name}
                                                </span>
                                                <span className="text-sm font-bold" style={{ color: C.soft }}>
                                                    {p.who}
                                                </span>
                                                <span className="ml-auto flex items-center gap-4">
                                                    <span className="text-3xl" style={display}>
                                                        ${p.price}
                                                        <span className="text-base" style={{ color: C.soft }}>
                                                            {p.unit ?? '/mo'}
                                                        </span>
                                                    </span>
                                                    <ChevronDown className={`size-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </span>
                                            </button>
                                            {isOpen && (
                                                <div id={`prog-${p.id}`} className="flex flex-wrap gap-x-12 gap-y-4 pb-8">
                                                    <p className="flex-[1_1_320px] text-lg" style={{ color: C.soft }}>
                                                        {p.blurb}
                                                    </p>
                                                    <ul className="flex-[1_1_300px] space-y-2">
                                                        {p.includes.map((i) => (
                                                            <li key={i} className="flex items-start gap-2 font-semibold">
                                                                <span
                                                                    className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full"
                                                                    style={{ background: C.volt }}
                                                                >
                                                                    <Check className="size-3.5" />
                                                                </span>
                                                                {i}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </section>

                    {/* Weekly schedule */}
                    <section id="schedule" className="mx-auto max-w-[1200px] scroll-mt-6 px-5 py-20 sm:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <h2 className="text-6xl sm:text-7xl" style={display}>
                                This week
                            </h2>
                            <div
                                role="tablist"
                                aria-label="Day"
                                className="flex flex-wrap gap-1 rounded-full border-2 p-1"
                                style={{ borderColor: C.ink }}
                            >
                                {DAYS.map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        role="tab"
                                        aria-selected={day === d}
                                        onClick={() => setDay(d)}
                                        className="min-h-10 min-w-12 rounded-full px-3 text-sm font-bold"
                                        style={day === d ? { background: C.ink, color: C.bone } : undefined}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ul role="tabpanel" aria-label={`${day} classes`} className="mt-8 border-t-2" style={{ borderColor: C.ink }}>
                            {SCHEDULE[day].map((c) => {
                                const key = `${day}-${c.time}`;
                                const done = reserved.includes(key);
                                return (
                                    <li
                                        key={key}
                                        className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b py-5"
                                        style={{ borderColor: C.line }}
                                    >
                                        <span className="w-24 text-3xl" style={display}>
                                            {c.time}
                                        </span>
                                        <div className="min-w-0 flex-[1_1_260px]">
                                            <p className="text-lg font-bold">{c.name}</p>
                                            <p className="flex flex-wrap gap-x-4 text-sm" style={{ color: C.soft }}>
                                                <span>{c.coach}</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="size-3.5" /> 45–60 min
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="size-3.5" /> {c.spots ? `${c.spots} spots left` : 'Full'}
                                                </span>
                                            </p>
                                        </div>
                                        {done ? (
                                            <span className="inline-flex items-center gap-1.5 font-bold">
                                                <CircleCheck className="size-5" /> {c.spots ? 'Reserved' : 'On waitlist'}
                                            </span>
                                        ) : c.spots ? (
                                            <button
                                                type="button"
                                                onClick={() => setReserved((r) => [...r, key])}
                                                className={`${pill} min-h-10 text-sm`}
                                                style={{ background: C.volt, color: C.ink }}
                                            >
                                                Reserve spot
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={`${pill} min-h-10 border-2 text-sm`}
                                                style={{ borderColor: C.line, color: C.soft }}
                                                onClick={() => setReserved((r) => [...r, key])}
                                            >
                                                Join waitlist
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        <p className="mt-3 text-sm" style={{ color: C.soft }}>
                            Members reserve in the app. In this demo, reservations aren't saved.
                        </p>
                    </section>

                    {/* Pricing */}
                    <section id="pricing" className="scroll-mt-6" style={{ background: C.dark, color: C.bone }}>
                        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <h2 className="text-6xl sm:text-7xl" style={display}>
                                    Memberships
                                </h2>
                                <div
                                    role="radiogroup"
                                    aria-label="Billing"
                                    className="flex gap-1 rounded-full border-2 p-1"
                                    style={{ borderColor: C.bone }}
                                >
                                    {[
                                        [false, 'Monthly'],
                                        [true, 'Annual · save 15%'],
                                    ].map(([val, label]) => (
                                        <button
                                            key={String(label)}
                                            type="button"
                                            role="radio"
                                            aria-checked={annual === val}
                                            onClick={() => setAnnual(val as boolean)}
                                            className="min-h-10 rounded-full px-4 text-sm font-bold"
                                            style={annual === val ? { background: C.volt, color: C.ink } : undefined}
                                        >
                                            {label as string}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ul className="mt-8 space-y-3">
                                {PROGRAMS.map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border p-6"
                                        style={{ borderColor: p.id === 'youth' ? C.volt : '#333' }}
                                    >
                                        <div className="min-w-0 flex-[1_1_260px]">
                                            <p className="text-4xl" style={display}>
                                                {p.name}
                                                {p.id === 'youth' && (
                                                    <span
                                                        className="ml-3 rounded-full px-2.5 py-0.5 align-middle text-xs font-bold"
                                                        style={{ background: C.volt, color: C.ink, fontFamily: 'inherit' }}
                                                    >
                                                        Most popular
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm opacity-80">{p.includes[0]}</p>
                                        </div>
                                        <p className="text-5xl" style={display}>
                                            ${price(p.price, p.unit)}
                                            <span className="text-lg opacity-70">{p.unit ?? '/mo'}</span>
                                        </p>
                                        <a href="#book" className={pill} style={{ background: C.bone, color: C.ink }}>
                                            Start with a free session
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            {annual && <p className="mt-3 text-sm opacity-80">Annual prices shown per month, billed yearly.</p>}
                        </div>
                    </section>

                    {/* What the first month looks like */}
                    <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                        <h2 className="text-6xl sm:text-7xl" style={display}>
                            Your first month
                        </h2>
                        <ol className="mt-8 flex flex-wrap gap-x-10 gap-y-8">
                            {[
                                ['Week 1', 'Free session & assessment', 'We test how you move, set a goal and pick the right program.'],
                                ['Week 2', 'Learn the basics', 'Coaches teach form on every lift before adding weight.'],
                                ['Week 3', 'Build the habit', 'Two to four sessions a week, tracked in the app.'],
                                ['Week 4', 'First check-in', 'Re-test, see your progress and adjust the plan.'],
                            ].map(([wk, title, text]) => (
                                <li key={wk} className="min-w-0 flex-[1_1_220px] border-t-4 pt-4" style={{ borderColor: C.volt }}>
                                    <p className="text-sm font-bold tracking-[0.12em] uppercase" style={{ color: C.soft }}>
                                        {wk}
                                    </p>
                                    <p className="mt-1 text-3xl" style={display}>
                                        {title}
                                    </p>
                                    <p className="mt-2" style={{ color: C.soft }}>
                                        {text}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Free session booking: 3 steps */}
                    <section id="book" className="scroll-mt-6 border-y" style={{ borderColor: C.line, background: C.paper }}>
                        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-x-16 gap-y-10 px-5 py-20 sm:px-8">
                            <div className="min-w-0 flex-[1_1_300px]">
                                <h2 className="text-6xl leading-[0.9] sm:text-7xl" style={display}>
                                    Your first
                                    <br />
                                    session's free.
                                </h2>
                                <p className="mt-4 text-lg" style={{ color: C.soft }}>
                                    Three quick steps. No card needed.
                                </p>
                                {step < 4 && (
                                    <ol className="mt-6 flex gap-2" aria-label="Progress">
                                        {[1, 2, 3].map((n) => (
                                            <li
                                                key={n}
                                                aria-current={step === n ? 'step' : undefined}
                                                className="h-2 w-12 rounded-full"
                                                style={{ background: step >= n ? C.ink : C.line }}
                                            />
                                        ))}
                                    </ol>
                                )}
                            </div>
                            <div
                                className="min-w-0 flex-[999_1_480px] rounded-2xl border-2 p-6 sm:p-8"
                                style={{ borderColor: C.ink, background: C.bone }}
                            >
                                {step === 1 && (
                                    <fieldset>
                                        <legend className="text-3xl" style={display}>
                                            1 · What's your goal?
                                        </legend>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {GOALS.map((g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    aria-pressed={goal === g}
                                                    onClick={() => {
                                                        setGoal(g);
                                                        setStep(2);
                                                    }}
                                                    className="flex min-h-12 items-center justify-between rounded-xl border-2 px-4 text-left font-bold"
                                                    style={{
                                                        borderColor: goal === g ? C.ink : C.line,
                                                        background: goal === g ? C.volt : 'transparent',
                                                    }}
                                                >
                                                    {g} <ArrowRight className="size-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}
                                {step === 2 && (
                                    <fieldset>
                                        <legend className="text-3xl" style={display}>
                                            2 · Pick a time
                                        </legend>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {SLOTS.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    aria-pressed={slot === s}
                                                    onClick={() => {
                                                        setSlot(s);
                                                        setStep(3);
                                                    }}
                                                    className="min-h-12 rounded-xl border-2 px-4 font-bold"
                                                    style={{
                                                        borderColor: slot === s ? C.ink : C.line,
                                                        background: slot === s ? C.volt : 'transparent',
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="mt-4 min-h-11 text-sm font-bold underline underline-offset-4"
                                        >
                                            ← Back
                                        </button>
                                    </fieldset>
                                )}
                                {step === 3 && (
                                    <form onSubmit={book} className="flex flex-col gap-4">
                                        <p className="text-3xl" style={display}>
                                            3 · Your details
                                        </p>
                                        <p className="text-sm" style={{ color: C.soft }}>
                                            {goal} · {slot}
                                        </p>
                                        <label className="flex flex-col gap-1.5 text-sm font-bold">
                                            Name
                                            <input
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                autoComplete="name"
                                                className="min-h-12 rounded-xl border-2 bg-transparent px-4 text-base font-normal"
                                                style={{ borderColor: C.line }}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5 text-sm font-bold">
                                            Phone
                                            <input
                                                required
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder="(214) 555-0123"
                                                className="min-h-12 rounded-xl border-2 bg-transparent px-4 text-base font-normal"
                                                style={{ borderColor: C.line }}
                                            />
                                        </label>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button type="submit" className={pill} style={{ background: C.ink, color: C.bone }}>
                                                Book my free session
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                className="min-h-11 text-sm font-bold underline underline-offset-4"
                                            >
                                                ← Back
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {step === 4 && (
                                    <div role="status">
                                        <CircleCheck className="size-12" />
                                        <p className="mt-3 text-4xl" style={display}>
                                            You're booked, {name.split(' ')[0] || 'champ'}!
                                        </p>
                                        <p className="mt-2" style={{ color: C.soft }}>
                                            {slot} · {goal}. This is a demo, so nothing was actually booked. A real site would text you a confirmation
                                            and add it to the coach's calendar.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setGoal('');
                                                setSlot('');
                                            }}
                                            className={`${pill} mt-6 border-2`}
                                            style={{ borderColor: C.ink }}
                                        >
                                            Start over
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                        <h2 className="text-6xl sm:text-7xl" style={display}>
                            Questions
                        </h2>
                        <div className="mt-6 border-t-2" style={{ borderColor: C.ink }}>
                            {FAQS.map(([q, a]) => (
                                <details
                                    key={q}
                                    className="group border-b [&_summary::-webkit-details-marker]:hidden"
                                    style={{ borderColor: C.line }}
                                >
                                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold">
                                        {q}
                                        <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="pb-5" style={{ color: C.soft }}>
                                        {a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>
                </main>

                <footer style={{ background: C.ink, color: C.bone }}>
                    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8">
                        <p>4th Quarter Performance is a fictional business. This site is a portfolio demo.</p>
                        <Link href="/#contact" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                            Want a site like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
