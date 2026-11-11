import '@fontsource-variable/plus-jakarta-sans/wght';

import { type Draft, notesToCards, readPdf, readPptx, slidesToCards } from '@/lib/slides';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Download, FileUp, Pencil, Printer, RotateCcw, Star, Timer, Trash2, Upload, X } from 'lucide-react';
import { type ChangeEvent, type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

/*
 * StudyLoop: turns lecture slides (PowerPoint/PDF) and notes into a study plan that adapts to the exam:
 * closed notes, one cheat sheet or open notes; multiple choice, short answer or written.
 * Everything runs in the browser and is saved on this device only (localStorage); nothing is uploaded.
 */

// Dark by default; a light look when the visitor's device is in light mode.
const C = {
    bg: 'var(--sl-bg)',
    card: 'var(--sl-card)',
    ink: 'var(--sl-ink)',
    soft: 'var(--sl-soft)',
    line: 'var(--sl-line)',
    brand: 'var(--sl-brand)',
    mint: 'var(--sl-mint)',
    mintBg: 'var(--sl-mintBg)',
    red: 'var(--sl-red)',
    redBg: 'var(--sl-redBg)',
    gold: 'var(--sl-gold)',
    banner: 'var(--sl-banner)',
};
const THEME = `:root:has(.sl){color-scheme:dark;--sl-bg:#0d0e1a;--sl-card:#161829;--sl-ink:#ecedf8;--sl-soft:#a3a6c4;--sl-line:#2a2d48;--sl-brand:#6d65f5;--sl-mint:#34d399;--sl-mintBg:#0f2e25;--sl-red:#fb923c;--sl-redBg:#3a1d10;--sl-gold:#fbbf24;--sl-banner:#1c1e36}
@media (prefers-color-scheme: light){:root:has(.sl){color-scheme:light;--sl-bg:#f6f7fb;--sl-card:#ffffff;--sl-ink:#16163a;--sl-soft:#55577a;--sl-line:#dfe1ee;--sl-brand:#4f46e5;--sl-mint:#0f9d76;--sl-mintBg:#e3f6ef;--sl-red:#c2410c;--sl-redBg:#fdeee6;--sl-gold:#b45309;--sl-banner:#16163a}}
@media print{body *{visibility:hidden!important}#print-area,#print-area *{visibility:visible!important;color:#000!important;background:#fff!important}#print-area{position:absolute;inset:0;padding:0}}`;

const SAMPLE = `# Processes
- Process: a program in execution, with its own address space, registers and open files.
- Thread: the smallest unit of CPU scheduling; threads in the same process share its memory.
- Context switch: saving the state of one process or thread and loading another's so the CPU can switch between them.
- PCB (Process Control Block): the record the OS keeps for each process, holding its state, program counter, registers and memory info.
- Fork: a system call that creates a new child process as a copy of the parent.

# Scheduling
- Round robin: a scheduling algorithm that gives each ready process a fixed time slice in turn.
- Preemption: the OS taking the CPU away from a running process before it finishes or blocks.
- Starvation: when a process waits indefinitely because others keep getting the CPU first.

# Synchronization
- Race condition: a bug where the result depends on the unpredictable timing of threads using shared data.
- Critical section: code that touches shared data and must not run in more than one thread at a time.
- Mutex: a lock that lets only one thread at a time enter a critical section.
- Semaphore: an integer counter with wait and signal operations, used to control access to shared resources.
- Deadlock: a state where each process in a group waits for a resource held by another, so none can proceed.`;

/* ---------------------------------------------------------------- data */

type NotesRule = 'closed' | 'sheet' | 'open';
type Format = 'mc' | 'short' | 'written' | 'mixed';
type Card = {
    id: string;
    term: string;
    def: string;
    topic: string;
    source: string;
    star: boolean;
    box: number;
    due: number;
    right: number;
    wrong: number;
};
type Course = { id: string; name: string; examName: string; examDate: string; notes: NotesRule; format: Format; cards: Card[] };
type Store = { courses: Course[]; active: string };
type Mode = 'review' | 'quiz' | 'recall' | 'explain' | 'drill' | 'sheet' | 'index' | 'trouble';

const KEY = 'studyloop.v1';
const DAY = 86400000;
/** Days until a card comes back, by how well you know it (spaced repetition, Leitner boxes 0-4). */
const GAPS = [0, 1, 3, 7, 16];
const uid = () => Math.random().toString(36).slice(2, 10);
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

const toCard = (d: Draft): Card => ({ id: uid(), ...d, star: false, box: 0, due: 0, right: 0, wrong: 0 });

function sampleCourse(): Course {
    const cards = notesToCards(SAMPLE, 'Sample notes').map(toCard);
    cards.filter((c) => /Deadlock|Semaphore/.test(c.term)).forEach((c) => (c.star = true));
    return {
        id: uid(),
        name: 'Operating Systems (sample)',
        examName: 'Midterm',
        examDate: isoDay(Date.now() + 14 * DAY),
        notes: 'closed',
        format: 'mixed',
        cards,
    };
}

function loadStore(): Store {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const s = JSON.parse(raw) as Store;
            if (Array.isArray(s.courses) && s.courses.length) return s;
        }
    } catch {
        /* private mode or bad data: start fresh */
    }
    const c = sampleCourse();
    return { courses: [c], active: c.id };
}

const norm = (s: string) =>
    s
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/^(an?|the)\s+/, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

function distance(a: string, b: string) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
}

const shuffle = <T,>(xs: T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/** Hardest first: starred (prof emphasized / pop quiz), then most missed, then least learned. */
const priority = (c: Card) => (c.star ? 100 : 0) + c.wrong * 10 + (4 - c.box);
const byPriority = (cards: Card[]) => [...cards].sort((a, b) => priority(b) - priority(a));

const STOP = new Set(
    'a an the of to and or in on for with by is are be it its that this as at from into when which their there each one so not can'.split(' '),
);
const keywords = (def: string) =>
    [...new Set(def.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [])]
        .filter((w) => !STOP.has(w))
        .sort((a, b) => b.length - a.length)
        .slice(0, 4);

function options(card: Card, all: Card[]) {
    const others = shuffle(all.filter((c) => c.id !== card.id));
    const sameTopic = others.filter((c) => c.topic === card.topic);
    return shuffle([card.term, ...[...sameTopic, ...others.filter((c) => c.topic !== card.topic)].slice(0, 3).map((c) => c.term)]);
}

/** What to practise, given how the exam works. */
function plan(c: Course) {
    const base: Record<NotesRule, Mode[]> = { closed: ['review', 'recall'], sheet: ['sheet', 'review'], open: ['index', 'drill'] };
    const fmt: Record<Format, Mode[]> = { mc: ['quiz'], short: ['recall'], written: ['explain'], mixed: ['quiz', 'recall', 'explain'] };
    const recommended = [...new Set([...base[c.notes], ...fmt[c.format], 'drill' as Mode])];
    const all: Mode[] = ['review', 'quiz', 'recall', 'explain', 'drill', 'sheet', 'index', 'trouble'];
    const tips: string[] = [];
    if (c.notes === 'closed')
        tips.push('Closed notes: you need to pull answers from memory, not just recognize them. Do Review daily and type answers in Recall.');
    if (c.notes === 'sheet')
        tips.push('One cheat sheet allowed: your sheet should hold what you keep missing. The Cheat sheet tab builds it from your trouble spots.');
    if (c.notes === 'open')
        tips.push(
            'Open notes: the risk is running out of time looking things up. Learn where each topic is (Index) and practise answering fast (Pop quiz drill).',
        );
    if (c.format === 'mc') tips.push('Multiple choice: practise telling similar terms apart. The quiz uses look-alike answers from the same topic.');
    if (c.format === 'short') tips.push('Short answer: practise producing the exact term from its definition (Recall).');
    if (c.format === 'written') tips.push('Written answers: practise explaining in your own words, then check you used the key terms (Explain).');
    if (c.format === 'mixed') tips.push('Mixed format: rotate Quiz, Recall and Explain.');
    tips.push('Star anything your professor stressed or put on a pop quiz. Starred cards come up first everywhere.');
    return { recommended, order: [...recommended, ...all.filter((m) => !recommended.includes(m))], tips };
}

const MODE_LABEL: Record<Mode, string> = {
    review: 'Review',
    quiz: 'Quiz',
    recall: 'Recall',
    explain: 'Explain',
    drill: 'Pop quiz drill',
    sheet: 'Cheat sheet',
    index: 'Index',
    trouble: 'Trouble spots',
};

/* ---------------------------------------------------------------- small UI pieces */

const btn =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-40';
const field = 'min-h-11 rounded-xl border px-3 text-base';
const fieldStyle: CSSProperties = { borderColor: C.line, background: C.bg, color: C.ink };
const panel: CSSProperties = { background: C.card, borderColor: C.line };

function StarBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            aria-label={on ? 'Unstar (no longer important)' : 'Star: professor stressed it / was on a pop quiz'}
            title="Professor stressed it / was on a pop quiz"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: on ? C.gold : C.line, color: on ? C.gold : C.soft }}
        >
            <Star className="size-5" fill={on ? 'currentColor' : 'none'} />
        </button>
    );
}

function Source({ card }: { card: Card }) {
    return (
        <span className="text-xs" style={{ color: C.soft }}>
            {card.source}
            {card.topic && !card.source.includes(card.topic) ? ` · ${card.topic}` : ''}
        </span>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return (
        <p className="py-10 text-center" style={{ color: C.soft }}>
            {children}
        </p>
    );
}

/* ---------------------------------------------------------------- study modes */

type Grade = (id: string, ok: boolean) => void;
type Toggle = (id: string) => void;

function Review({ cards, grade, toggleStar }: { cards: Card[]; grade: Grade; toggleStar: Toggle }) {
    const [ahead, setAhead] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const now = Date.now();
    const queue = byPriority(cards.filter((c) => ahead || c.due <= now));
    const card = queue[0];
    if (!cards.length) return <Empty>Add slides or notes to start.</Empty>;
    if (!card) {
        const next = Math.min(...cards.map((c) => c.due));
        return (
            <Empty>
                Nothing due right now. Next review {new Date(next).toLocaleDateString()}.{' '}
                <button type="button" className="font-semibold underline" style={{ color: C.ink }} onClick={() => setAhead(true)}>
                    Study ahead anyway
                </button>
            </Empty>
        );
    }
    const answer = (ok: boolean) => {
        grade(card.id, ok);
        setFlipped(false);
    };
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                {queue.length} to review {ahead ? '(studying ahead)' : 'today'} · missed cards come back sooner
            </p>
            <div className="mt-3 flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="flex min-h-56 flex-1 flex-col items-center justify-center rounded-3xl border p-8 text-center"
                    style={flipped ? { background: C.ink, color: C.card, borderColor: C.ink } : { ...panel, color: C.ink }}
                    aria-label={flipped ? `Definition: ${card.def}. Tap to see the term.` : `Term: ${card.term}. Tap to see the definition.`}
                >
                    <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-70">{flipped ? 'Definition' : 'Term'}</span>
                    <span className={`mt-3 ${flipped ? 'text-lg' : 'text-3xl font-extrabold'}`}>{flipped ? card.def : card.term}</span>
                    {!flipped && <span className="mt-4 text-sm opacity-60">Say the answer, then tap to check</span>}
                </button>
                <StarBtn on={card.star} onClick={() => toggleStar(card.id)} />
            </div>
            <div className="mt-2">
                <Source card={card} />
            </div>
            {flipped && (
                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => answer(false)} className={btn} style={{ background: C.redBg, color: C.red }}>
                        <X className="size-4" /> Missed it
                    </button>
                    <button type="button" onClick={() => answer(true)} className={btn} style={{ background: C.mintBg, color: C.mint }}>
                        <Check className="size-4" /> Got it
                    </button>
                </div>
            )}
        </div>
    );
}

function Quiz({ cards, grade }: { cards: Card[]; grade: Grade }) {
    const build = () =>
        shuffle(cards)
            .slice(0, Math.min(10, cards.length))
            .map((c) => ({ card: c, opts: options(c, cards) }));
    const [qs, setQs] = useState(build);
    const [i, setI] = useState(0);
    const [picked, setPicked] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    if (cards.length < 4) return <Empty>The quiz needs at least 4 cards.</Empty>;
    const q = qs[i];
    if (!q)
        return (
            <div className="py-6 text-center">
                <p className="text-4xl font-extrabold">
                    {score}/{qs.length}
                </p>
                <button
                    type="button"
                    className={`${btn} mt-5`}
                    style={{ background: C.brand, color: '#fff' }}
                    onClick={() => {
                        setQs(build());
                        setI(0);
                        setScore(0);
                    }}
                >
                    <RotateCcw className="size-4" /> New quiz
                </button>
            </div>
        );
    const pick = (o: string) => {
        if (picked) return;
        setPicked(o);
        const ok = o === q.card.term;
        if (ok) setScore((s) => s + 1);
        grade(q.card.id, ok);
    };
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                Question {i + 1} of {qs.length} · look-alike answers come from the same topic
            </p>
            <p className="mt-3 text-xl font-semibold">{q.card.def}</p>
            <Source card={q.card} />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.opts.map((o) => {
                    const right = picked && o === q.card.term;
                    const wrong = picked === o && o !== q.card.term;
                    return (
                        <button
                            key={o}
                            type="button"
                            onClick={() => pick(o)}
                            className="min-h-12 rounded-xl border px-4 text-left font-semibold"
                            style={
                                right
                                    ? { background: C.mintBg, borderColor: C.mint }
                                    : wrong
                                      ? { background: C.redBg, borderColor: C.red }
                                      : { borderColor: C.line }
                            }
                        >
                            {o}
                        </button>
                    );
                })}
            </div>
            {picked && (
                <button
                    type="button"
                    className={`${btn} mt-4`}
                    style={{ background: C.brand, color: '#fff' }}
                    onClick={() => {
                        setI((n) => n + 1);
                        setPicked(null);
                    }}
                >
                    {i + 1 < qs.length ? 'Next' : 'See score'}
                </button>
            )}
        </div>
    );
}

function Recall({ cards, grade }: { cards: Card[]; grade: Grade }) {
    const [order, setOrder] = useState(() => byPriority(cards).map((c) => c.id));
    const [i, setI] = useState(0);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<null | 'right' | 'close' | 'wrong'>(null);
    const card = cards.find((c) => c.id === order[i % Math.max(1, order.length)]);
    useEffect(() => setOrder(byPriority(cards).map((c) => c.id)), [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!card) return <Empty>Add slides or notes to start.</Empty>;
    const check = () => {
        if (!guess.trim() || result) return;
        const g = norm(guess);
        const t = norm(card.term);
        const r = g === t ? 'right' : distance(g, t) <= Math.max(1, Math.floor(t.length / 6)) ? 'close' : 'wrong';
        setResult(r);
        grade(card.id, r !== 'wrong');
    };
    const next = () => {
        setI((n) => n + 1);
        setGuess('');
        setResult(null);
    };
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                Type the term. Hardest cards first.
            </p>
            <p className="mt-3 text-xl font-semibold">{card.def}</p>
            <Source card={card} />
            <form
                className="mt-4 flex flex-wrap gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (result) next();
                    else check();
                }}
            >
                <label className="min-w-0 flex-[1_1_240px]">
                    <span className="sr-only">Your answer</span>
                    <input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        className={`${field} w-full`}
                        style={fieldStyle}
                        placeholder="Your answer"
                        autoComplete="off"
                    />
                </label>
                <button type="submit" className={btn} style={{ background: C.brand, color: '#fff' }}>
                    {result ? 'Next' : 'Check'}
                </button>
            </form>
            {result && (
                <p
                    role="status"
                    className="mt-3 rounded-xl px-4 py-3 font-semibold"
                    style={result === 'wrong' ? { background: C.redBg, color: C.red } : { background: C.mintBg, color: C.mint }}
                >
                    {result === 'right' ? 'Correct!' : result === 'close' ? `Close enough, watch the spelling: ${card.term}` : `It was: ${card.term}`}
                </p>
            )}
        </div>
    );
}

function Explain({ cards, grade }: { cards: Card[]; grade: Grade }) {
    const order = useMemo(() => byPriority(cards).map((c) => c.id), [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const [i, setI] = useState(0);
    const [text, setText] = useState('');
    const [shown, setShown] = useState(false);
    const card = cards.find((c) => c.id === order[i % Math.max(1, order.length)]);
    if (!card) return <Empty>Add slides or notes to start.</Empty>;
    const keys = keywords(card.def);
    const lower = text.toLowerCase();
    const done = (ok: boolean) => {
        grade(card.id, ok);
        setI((n) => n + 1);
        setText('');
        setShown(false);
    };
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                Explain it in your own words, like on a written exam.
            </p>
            <p className="mt-3 text-3xl font-extrabold">{card.term}</p>
            <Source card={card} />
            <label className="mt-4 block">
                <span className="sr-only">Your explanation</span>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className={`${field} w-full py-3`}
                    style={fieldStyle}
                    placeholder="Write your answer..."
                />
            </label>
            {!shown ? (
                <button type="button" className={`${btn} mt-3`} style={{ background: C.brand, color: '#fff' }} onClick={() => setShown(true)}>
                    Check my answer
                </button>
            ) : (
                <div className="mt-4 rounded-2xl border p-4" style={panel}>
                    <p className="text-sm font-bold" style={{ color: C.soft }}>
                        From the slides
                    </p>
                    <p className="mt-1">{card.def}</p>
                    {keys.length > 0 && (
                        <p className="mt-3 flex flex-wrap gap-2 text-sm">
                            Key words:
                            {keys.map((k) => (
                                <span
                                    key={k}
                                    className="rounded-full px-2.5"
                                    style={lower.includes(k) ? { background: C.mintBg, color: C.mint } : { background: C.redBg, color: C.red }}
                                >
                                    {lower.includes(k) ? '✓' : '✗'} {k}
                                </span>
                            ))}
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => done(false)} className={btn} style={{ background: C.redBg, color: C.red }}>
                            I missed parts
                        </button>
                        <button type="button" onClick={() => done(true)} className={btn} style={{ background: C.mintBg, color: C.mint }}>
                            I had it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Five quick questions from starred and most-missed cards, against a 90-second clock. */
function Drill({ cards, grade }: { cards: Card[]; grade: Grade }) {
    const [qs, setQs] = useState<{ card: Card; opts: string[] | null }[] | null>(null);
    const [i, setI] = useState(0);
    const [left, setLeft] = useState(90);
    const [guess, setGuess] = useState('');
    const [log, setLog] = useState<{ card: Card; ok: boolean }[]>([]);
    const finished = qs && (i >= qs.length || left <= 0);
    useEffect(() => {
        if (!qs || finished) return;
        const t = setInterval(() => setLeft((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [qs, finished]);
    if (cards.length < 4) return <Empty>The drill needs at least 4 cards.</Empty>;
    const start = () => {
        const top = byPriority(cards).slice(0, 8);
        const pick = shuffle(top).slice(0, 5);
        setQs(pick.map((c, n) => ({ card: c, opts: n % 2 === 0 ? options(c, cards) : null })));
        setI(0);
        setLeft(90);
        setLog([]);
        setGuess('');
    };
    if (!qs)
        return (
            <div className="py-6 text-center">
                <p className="text-lg">5 questions · 90 seconds · starred and most-missed cards first.</p>
                <button type="button" onClick={start} className={`${btn} mt-5`} style={{ background: C.brand, color: '#fff' }}>
                    <Timer className="size-4" /> Start the drill
                </button>
            </div>
        );
    if (finished) {
        const right = log.filter((l) => l.ok).length;
        return (
            <div>
                <p className="text-4xl font-extrabold">
                    {right}/{qs.length}
                </p>
                <p style={{ color: C.soft }}>{left <= 0 ? "Time's up." : `Done with ${left}s left.`}</p>
                {log.some((l) => !l.ok) && (
                    <ul className="mt-4 space-y-2">
                        {log
                            .filter((l) => !l.ok)
                            .map((l) => (
                                <li key={l.card.id} className="rounded-xl px-4 py-2" style={{ background: C.redBg }}>
                                    <b>{l.card.term}</b>: {l.card.def}
                                </li>
                            ))}
                    </ul>
                )}
                <button type="button" onClick={start} className={`${btn} mt-5`} style={{ background: C.brand, color: '#fff' }}>
                    <RotateCcw className="size-4" /> Again
                </button>
            </div>
        );
    }
    const q = qs[i];
    const answer = (ok: boolean) => {
        grade(q.card.id, ok);
        setLog((l) => [...l, { card: q.card, ok }]);
        setI((n) => n + 1);
        setGuess('');
    };
    return (
        <div>
            <p className="flex justify-between text-sm font-bold" style={{ color: left <= 15 ? C.red : C.soft }}>
                <span>
                    Question {i + 1}/{qs.length}
                </span>
                <span aria-live="off">{left}s</span>
            </p>
            <p className="mt-3 text-xl font-semibold">{q.card.def}</p>
            {q.opts ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.opts.map((o) => (
                        <button
                            key={o}
                            type="button"
                            onClick={() => answer(o === q.card.term)}
                            className="min-h-12 rounded-xl border px-4 text-left font-semibold"
                            style={{ borderColor: C.line }}
                        >
                            {o}
                        </button>
                    ))}
                </div>
            ) : (
                <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const g = norm(guess);
                        const t = norm(q.card.term);
                        answer(g === t || distance(g, t) <= Math.max(1, Math.floor(t.length / 6)));
                    }}
                >
                    <label className="min-w-0 flex-1">
                        <span className="sr-only">Your answer</span>
                        <input
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            className={`${field} w-full`}
                            style={fieldStyle}
                            placeholder="Type the term"
                            autoComplete="off"
                        />
                    </label>
                    <button type="submit" className={btn} style={{ background: C.brand, color: '#fff' }}>
                        Answer
                    </button>
                </form>
            )}
        </div>
    );
}

/** One printed page: the cards you need most, densest first. */
function CheatSheet({ course }: { course: Course }) {
    const BUDGET = 5200; // characters that fit on one page at this size
    const picked: Card[] = [];
    let used = 0;
    for (const c of byPriority(course.cards)) {
        const len = c.term.length + c.def.length + 4;
        if (used + len > BUDGET) continue;
        picked.push(c);
        used += len;
    }
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                {picked.length} of {course.cards.length} cards fit on one page. Starred and most-missed go first, so study more and the sheet updates.
                Check your professor's rules (hand-written only? one side?).
            </p>
            <button type="button" onClick={() => window.print()} className={`${btn} mt-3`} style={{ background: C.brand, color: '#fff' }}>
                <Printer className="size-4" /> Print / save as PDF
            </button>
            <div id="print-area" className="mt-5 rounded-2xl border p-4" style={panel}>
                <p className="text-xs font-bold">
                    {course.name} · {course.examName} cheat sheet
                </p>
                <div className="mt-2 columns-1 gap-6 text-[11px] leading-snug sm:columns-2">
                    {picked.map((c) => (
                        <p key={c.id} className="mb-1 break-inside-avoid">
                            <b>
                                {c.star ? '★ ' : ''}
                                {c.term}
                            </b>
                            : {c.def}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** For open-notes exams: where each topic lives in the slides, so lookups take seconds. */
function Index({ course }: { course: Course }) {
    const groups = new Map<string, Card[]>();
    for (const c of course.cards) {
        const lecture = c.source.split(' · ')[0] || 'Notes';
        groups.set(lecture, [...(groups.get(lecture) ?? []), c]);
    }
    const az = [...course.cards].sort((a, b) => a.term.localeCompare(b.term));
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                Print this and keep it on top of your notes: find any term in seconds.
            </p>
            <button type="button" onClick={() => window.print()} className={`${btn} mt-3`} style={{ background: C.brand, color: '#fff' }}>
                <Printer className="size-4" /> Print / save as PDF
            </button>
            <div id="print-area" className="mt-5 rounded-2xl border p-4 text-sm" style={panel}>
                <p className="text-xs font-bold">{course.name} · A-Z index</p>
                <ul className="mt-2 columns-1 gap-6 sm:columns-2">
                    {az.map((c) => (
                        <li key={c.id} className="flex break-inside-avoid justify-between gap-3 border-b py-1" style={{ borderColor: C.line }}>
                            <span>
                                {c.star ? '★ ' : ''}
                                {c.term}
                            </span>
                            <span className="shrink-0" style={{ color: C.soft }}>
                                {c.source.replace(/^.* · /, '') || c.source}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-xs font-bold">By lecture</p>
                {[...groups.entries()].map(([lecture, cs]) => (
                    <p key={lecture} className="mt-1 text-xs">
                        <b>{lecture}:</b> {cs.map((c) => c.term).join(', ')}
                    </p>
                ))}
            </div>
        </div>
    );
}

function Trouble({
    cards,
    update,
    remove,
    toggleStar,
}: {
    cards: Card[];
    update: (c: Card) => void;
    remove: (id: string) => void;
    toggleStar: Toggle;
}) {
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState({ term: '', def: '' });
    if (!cards.length) return <Empty>No cards yet.</Empty>;
    return (
        <div>
            <p className="text-sm" style={{ color: C.soft }}>
                Everything, hardest first. Strength dots fill as you get a card right on different days. Fix a card the slides got wrong with Edit.
            </p>
            <ul className="mt-3 border-t" style={{ borderColor: C.line }}>
                {byPriority(cards).map((c) => (
                    <li key={c.id} className="flex flex-wrap items-start gap-3 border-b py-3" style={{ borderColor: C.line }}>
                        <StarBtn on={c.star} onClick={() => toggleStar(c.id)} />
                        {editing === c.id ? (
                            <form
                                className="flex min-w-0 flex-[1_1_300px] flex-col gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    update({ ...c, term: draft.term.trim() || c.term, def: draft.def.trim() || c.def });
                                    setEditing(null);
                                }}
                            >
                                <input
                                    aria-label="Term"
                                    value={draft.term}
                                    onChange={(e) => setDraft({ ...draft, term: e.target.value })}
                                    className={field}
                                    style={fieldStyle}
                                />
                                <textarea
                                    aria-label="Definition"
                                    value={draft.def}
                                    onChange={(e) => setDraft({ ...draft, def: e.target.value })}
                                    rows={3}
                                    className={`${field} py-2`}
                                    style={fieldStyle}
                                />
                                <span className="flex gap-2">
                                    <button type="submit" className={btn} style={{ background: C.brand, color: '#fff' }}>
                                        Save
                                    </button>
                                    <button type="button" className={btn} onClick={() => setEditing(null)}>
                                        Cancel
                                    </button>
                                </span>
                            </form>
                        ) : (
                            <div className="min-w-0 flex-[1_1_300px]">
                                <p className="font-bold">{c.term}</p>
                                <p className="text-sm" style={{ color: C.soft }}>
                                    {c.def}
                                </p>
                                <Source card={c} />
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <span style={{ color: c.wrong ? C.red : C.soft }}>{c.wrong} missed</span>
                            <span aria-label={`Strength ${c.box} of 4`} className="flex gap-1">
                                {[1, 2, 3, 4].map((n) => (
                                    <span key={n} className="size-2 rounded-full" style={{ background: n <= c.box ? C.mint : C.line }} />
                                ))}
                            </span>
                            <button
                                type="button"
                                aria-label={`Edit ${c.term}`}
                                className="inline-flex size-11 items-center justify-center"
                                onClick={() => {
                                    setEditing(c.id);
                                    setDraft({ term: c.term, def: c.def });
                                }}
                            >
                                <Pencil className="size-4" />
                            </button>
                            <button
                                type="button"
                                aria-label={`Delete ${c.term}`}
                                className="inline-flex size-11 items-center justify-center"
                                style={{ color: C.red }}
                                onClick={() => remove(c.id)}
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ---------------------------------------------------------------- page */

export default function StudyLoop() {
    const [store, setStore] = useState<Store | null>(null);
    const [mode, setMode] = useState<Mode | null>(null);
    const [lecture, setLecture] = useState('');
    const [paste, setPaste] = useState('');
    const [preview, setPreview] = useState<Draft[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState('');
    const [newName, setNewName] = useState('');
    const importRef = useRef<HTMLInputElement>(null);

    useEffect(() => setStore(loadStore()), []);
    useEffect(() => {
        if (!store) return;
        try {
            localStorage.setItem(KEY, JSON.stringify(store));
        } catch {
            /* storage full or blocked: keep working in memory */
        }
    }, [store]);

    const course = store?.courses.find((c) => c.id === store.active) ?? store?.courses[0];
    const p = course ? plan(course) : null;
    const activeMode = mode && p?.order.includes(mode) ? mode : p?.order[0];

    const editCourse = (patch: Partial<Course>) =>
        setStore((s) => (s && course ? { ...s, courses: s.courses.map((c) => (c.id === course.id ? { ...c, ...patch } : c)) } : s));
    const editCards = (fn: (cards: Card[]) => Card[]) => course && editCourse({ cards: fn(course.cards) });

    const grade: Grade = (id, ok) =>
        editCards((cs) =>
            cs.map((c) => {
                if (c.id !== id) return c;
                const box = ok ? Math.min(4, c.box + 1) : 0;
                return { ...c, box, due: Date.now() + GAPS[box] * DAY, right: c.right + (ok ? 1 : 0), wrong: c.wrong + (ok ? 0 : 1) };
            }),
        );
    const toggleStar: Toggle = (id) => editCards((cs) => cs.map((c) => (c.id === id ? { ...c, star: !c.star } : c)));

    const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const name = lecture.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        setNote('');
        setBusy(true);
        try {
            let drafts: Draft[];
            if (/\.pptx$/i.test(file.name)) drafts = slidesToCards(await readPptx(file), name);
            else if (/\.pdf$/i.test(file.name)) drafts = slidesToCards(await readPdf(file), name);
            else if (/\.(txt|md|markdown)$/i.test(file.name)) drafts = notesToCards(await file.text(), name);
            else if (/\.ppt$/i.test(file.name)) throw new Error('Old .ppt files can\'t be read. In PowerPoint, use "Save As" .pptx or PDF first.');
            else throw new Error('Use a .pptx, .pdf, .txt or .md file.');
            if (!drafts.length) throw new Error('No text found. If the slides are pictures (scanned), paste the text instead.');
            setLecture(name);
            setPreview(drafts);
        } catch (err) {
            setNote(err instanceof Error ? err.message : 'Could not read that file.');
        } finally {
            setBusy(false);
        }
    };

    const addPreview = () => {
        if (!preview || !course) return;
        const have = new Set(course.cards.map((c) => norm(c.term)));
        const fresh = preview.filter((d) => !have.has(norm(d.term)));
        editCards((cs) => [...cs, ...fresh.map(toCard)]);
        setNote(`Added ${fresh.length} cards${preview.length - fresh.length ? ` (${preview.length - fresh.length} already there)` : ''}.`);
        setPreview(null);
        setPaste('');
        setLecture('');
    };

    const exportAll = () => {
        if (!store) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `studyloop-backup-${isoDay(Date.now())}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const importAll = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const s = JSON.parse(await file.text()) as Store;
            if (!Array.isArray(s.courses) || !s.courses.length) throw new Error();
            setStore(s);
            setNote('Backup restored.');
        } catch {
            setNote('That file is not a StudyLoop backup.');
        }
    };

    if (!store || !course || !p) return <div className="sl min-h-screen" style={{ background: C.bg }} />;

    const now = Date.now();
    const daysLeft = Math.max(0, Math.ceil((new Date(course.examDate + 'T23:59:59').getTime() - now) / DAY));
    const learned = course.cards.filter((c) => c.box >= 3).length;
    const due = course.cards.filter((c) => c.due <= now).length;
    const perDay = Math.ceil((course.cards.length - learned) / Math.max(1, daysLeft));
    const troubleCount = course.cards.filter((c) => c.wrong > 0 || c.star).length;

    const chip = (on: boolean): CSSProperties =>
        on ? { background: C.brand, color: '#fff', borderColor: C.brand } : { borderColor: C.line, color: C.soft };

    return (
        <>
            <Head title="StudyLoop">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div
                className="sl min-h-screen"
                style={{ background: C.bg, color: C.ink, fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif" }}
            >
                <div style={{ background: C.banner, color: '#fff' }}>
                    <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-medium sm:px-8">
                        <p>Built by Timasi Werema. Runs in your browser: slides and progress stay on this device.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">
                    {/* Course bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-2 text-xl font-extrabold">
                            <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: C.brand, color: '#fff' }}>
                                <RotateCcw className="size-5" />
                            </span>
                            StudyLoop
                        </span>
                        <label className="ml-auto min-w-0 flex-[0_1_280px]">
                            <span className="sr-only">Course</span>
                            <select
                                value={course.id}
                                onChange={(e) => {
                                    setStore({ ...store, active: e.target.value });
                                    setMode(null);
                                }}
                                className={`${field} w-full font-semibold`}
                                style={fieldStyle}
                            >
                                {store.courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!newName.trim()) return;
                                const c: Course = {
                                    id: uid(),
                                    name: newName.trim(),
                                    examName: 'Exam',
                                    examDate: isoDay(now + 21 * DAY),
                                    notes: 'closed',
                                    format: 'mixed',
                                    cards: [],
                                };
                                setStore({ courses: [...store.courses, c], active: c.id });
                                setNewName('');
                                setMode(null);
                            }}
                        >
                            <label>
                                <span className="sr-only">New course name</span>
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="New course, e.g. CS 3345"
                                    className={`${field} w-48`}
                                    style={fieldStyle}
                                />
                            </label>
                            <button type="submit" className={`${btn} border`} style={{ borderColor: C.line }}>
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Exam setup + plan */}
                    <section aria-labelledby="exam" className="mt-6 grid gap-6 rounded-3xl border p-5 sm:p-7 lg:grid-cols-[3fr_2fr]" style={panel}>
                        <div>
                            <h1 id="exam" className="text-2xl font-extrabold sm:text-3xl">
                                {course.name}
                            </h1>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <label className="text-sm font-semibold">
                                    Exam
                                    <input
                                        value={course.examName}
                                        onChange={(e) => editCourse({ examName: e.target.value })}
                                        className={`${field} mt-1 w-full`}
                                        style={fieldStyle}
                                    />
                                </label>
                                <label className="text-sm font-semibold">
                                    Date
                                    <input
                                        type="date"
                                        value={course.examDate}
                                        onChange={(e) => editCourse({ examDate: e.target.value })}
                                        className={`${field} mt-1 w-full`}
                                        style={fieldStyle}
                                    />
                                </label>
                            </div>
                            <p className="mt-4 text-sm font-semibold">Notes allowed?</p>
                            <div role="radiogroup" aria-label="Notes allowed" className="mt-1 flex flex-wrap gap-2">
                                {(
                                    [
                                        ['closed', 'None (closed notes)'],
                                        ['sheet', 'One cheat sheet'],
                                        ['open', 'Open notes'],
                                    ] as [NotesRule, string][]
                                ).map(([v, l]) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={course.notes === v}
                                        onClick={() => editCourse({ notes: v })}
                                        className="min-h-11 rounded-full border px-4 text-sm font-semibold"
                                        style={chip(course.notes === v)}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-4 text-sm font-semibold">Question style</p>
                            <div role="radiogroup" aria-label="Question style" className="mt-1 flex flex-wrap gap-2">
                                {(
                                    [
                                        ['mc', 'Multiple choice'],
                                        ['short', 'Short answer'],
                                        ['written', 'Written / essay'],
                                        ['mixed', 'Mix'],
                                    ] as [Format, string][]
                                ).map(([v, l]) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={course.format === v}
                                        onClick={() => editCourse({ format: v })}
                                        className="min-h-11 rounded-full border px-4 text-sm font-semibold"
                                        style={chip(course.format === v)}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <dl className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    [daysLeft, daysLeft === 1 ? 'day left' : 'days left'],
                                    [due, 'due today'],
                                    [`${learned}/${course.cards.length}`, 'learned'],
                                ].map(([v, l]) => (
                                    <div key={String(l)} className="rounded-2xl py-3" style={{ background: C.bg }}>
                                        <dt className="sr-only">{l}</dt>
                                        <dd className="text-2xl font-extrabold">{v}</dd>
                                        <dd className="text-xs" style={{ color: C.soft }}>
                                            {l}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mt-4 font-semibold">
                                Your plan: about {perDay} new card{perDay === 1 ? '' : 's'} a day
                                {troubleCount ? `, plus your ${troubleCount} trouble spots` : ''}.
                            </p>
                            <ul className="mt-2 space-y-2 text-sm" style={{ color: C.soft }}>
                                {p.tips.map((t) => (
                                    <li key={t}>• {t}</li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Add material */}
                    <section aria-labelledby="add" className="mt-6 rounded-3xl border p-5 sm:p-7" style={panel}>
                        <h2 id="add" className="text-xl font-extrabold">
                            Add slides or notes
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: C.soft }}>
                            PowerPoint (.pptx) or PDF slides, or .txt/.md notes. Read on your device, never uploaded. Each card remembers its slide.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <label className="min-w-0 flex-[1_1_220px] text-sm font-semibold">
                                Lecture name (optional)
                                <input
                                    value={lecture}
                                    onChange={(e) => setLecture(e.target.value)}
                                    placeholder="e.g. Lecture 5"
                                    className={`${field} mt-1 w-full`}
                                    style={fieldStyle}
                                />
                            </label>
                            <label className={`${btn} mt-5 cursor-pointer`} style={{ background: C.brand, color: '#fff' }}>
                                <FileUp className="size-4" /> {busy ? 'Reading...' : 'Choose slides'}
                                <input
                                    type="file"
                                    accept=".pptx,.pdf,.txt,.md,.markdown,.ppt"
                                    className="sr-only"
                                    onChange={onFile}
                                    disabled={busy}
                                />
                            </label>
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">
                                Or paste notes ("Term: definition" lines, "# Topic" headings)
                            </summary>
                            <textarea
                                value={paste}
                                onChange={(e) => setPaste(e.target.value)}
                                rows={5}
                                className={`${field} mt-2 w-full py-2 font-mono text-sm`}
                                style={fieldStyle}
                            />
                            <button
                                type="button"
                                className={`${btn} mt-2 border`}
                                style={{ borderColor: C.line }}
                                onClick={() => {
                                    const d = notesToCards(paste, lecture.trim() || 'Notes');
                                    if (d.length) setPreview(d);
                                    else setNote('No "Term: definition" lines found.');
                                }}
                            >
                                Find cards
                            </button>
                        </details>
                        {note && (
                            <p role="status" className="mt-3 text-sm font-semibold">
                                {note}
                            </p>
                        )}
                        {preview && (
                            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: C.line }}>
                                <p className="font-semibold">Found {preview.length} cards. First few:</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {preview.slice(0, 6).map((d, i) => (
                                        <li key={i}>
                                            <b>{d.term}</b>
                                            <span style={{ color: C.soft }}>
                                                {' '}
                                                · {d.def.slice(0, 90)}
                                                {d.def.length > 90 ? '…' : ''} ({d.source})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 flex gap-2">
                                    <button type="button" onClick={addPreview} className={btn} style={{ background: C.brand, color: '#fff' }}>
                                        Add {preview.length} cards
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreview(null)}
                                        className={`${btn} border`}
                                        style={{ borderColor: C.line }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Study */}
                    <section aria-labelledby="study" className="mt-6 rounded-3xl border p-5 sm:p-7" style={panel}>
                        <h2 id="study" className="sr-only">
                            Study
                        </h2>
                        <div role="tablist" aria-label="Study modes" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
                            {p.order.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeMode === m}
                                    onClick={() => setMode(m)}
                                    className="relative min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold"
                                    style={activeMode === m ? { background: C.brand, color: '#fff' } : { color: C.soft }}
                                >
                                    {MODE_LABEL[m]}
                                    {p.recommended.includes(m) && (
                                        <span
                                            className="ml-1.5 inline-block size-1.5 rounded-full align-middle"
                                            style={{ background: C.gold }}
                                            aria-label="(recommended)"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1 text-xs" style={{ color: C.soft }}>
                            <span className="mr-1 inline-block size-1.5 rounded-full align-middle" style={{ background: C.gold }} /> recommended for
                            this exam
                        </p>
                        <div role="tabpanel" className="mt-5" key={`${course.id}-${activeMode}`}>
                            {activeMode === 'review' && <Review cards={course.cards} grade={grade} toggleStar={toggleStar} />}
                            {activeMode === 'quiz' && <Quiz cards={course.cards} grade={grade} />}
                            {activeMode === 'recall' && <Recall cards={course.cards} grade={grade} />}
                            {activeMode === 'explain' && <Explain cards={course.cards} grade={grade} />}
                            {activeMode === 'drill' && <Drill cards={course.cards} grade={grade} />}
                            {activeMode === 'sheet' && <CheatSheet course={course} />}
                            {activeMode === 'index' && <Index course={course} />}
                            {activeMode === 'trouble' && (
                                <Trouble
                                    cards={course.cards}
                                    toggleStar={toggleStar}
                                    update={(c) => editCards((cs) => cs.map((x) => (x.id === c.id ? c : x)))}
                                    remove={(id) => editCards((cs) => cs.filter((x) => x.id !== id))}
                                />
                            )}
                        </div>
                    </section>

                    {/* Data */}
                    <section className="mt-6 flex flex-wrap items-center gap-3 text-sm" style={{ color: C.soft }}>
                        <span>Your data lives in this browser. Back it up before clearing your browser or switching devices.</span>
                        <button type="button" onClick={exportAll} className={`${btn} border`} style={{ borderColor: C.line, color: C.ink }}>
                            <Download className="size-4" /> Back up
                        </button>
                        <button
                            type="button"
                            onClick={() => importRef.current?.click()}
                            className={`${btn} border`}
                            style={{ borderColor: C.line, color: C.ink }}
                        >
                            <Upload className="size-4" /> Restore
                        </button>
                        <input
                            ref={importRef}
                            type="file"
                            accept=".json"
                            className="sr-only"
                            onChange={importAll}
                            aria-label="Restore a backup file"
                        />
                        <button
                            type="button"
                            className={`${btn} border`}
                            style={{ borderColor: C.line, color: C.red }}
                            onClick={() => {
                                if (!confirm(`Delete "${course.name}" and all its cards?`)) return;
                                const rest = store.courses.filter((c) => c.id !== course.id);
                                const next = rest.length ? rest : [sampleCourse()];
                                setStore({ courses: next, active: next[0].id });
                                setMode(null);
                            }}
                        >
                            <Trash2 className="size-4" /> Delete course
                        </button>
                    </section>
                </main>
            </div>
        </>
    );
}
