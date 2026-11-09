import '@fontsource-variable/plus-jakarta-sans/wght';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, FileUp, Lightbulb, RotateCcw, Shuffle, Sparkles, X } from 'lucide-react';
import { type ChangeEvent, useCallback, useEffect, useState } from 'react';

/*
 * DEMO for a fictional study app ("StudyLoop").
 * Turns pasted notes into flashcards, a quiz and typed practice.
 * This demo uses simple rules in the browser (no AI, nothing uploaded);
 * a production version would use an AI model to read full slide decks.
 */

// Dark by default; the original light look when the visitor's device is in light mode.
const C = {
    bg: 'var(--sl-bg)',
    card: 'var(--sl-card)',
    ink: 'var(--sl-ink)',
    soft: 'var(--sl-soft)',
    line: 'var(--sl-line)',
    brand: 'var(--sl-brand)',
    brandDark: 'var(--sl-brandDark)',
    mint: 'var(--sl-mint)',
    mintBg: 'var(--sl-mintBg)',
    red: 'var(--sl-red)',
    redBg: 'var(--sl-redBg)',
    banner: 'var(--sl-banner)',
};
const THEME = `:root:has(.sl){color-scheme:dark;--sl-bg:#0d0e1a;--sl-card:#161829;--sl-ink:#ecedf8;--sl-soft:#a3a6c4;--sl-line:#2a2d48;--sl-brand:#6d65f5;--sl-brandDark:#5a52e6;--sl-mint:#34d399;--sl-mintBg:#0f2e25;--sl-red:#fb923c;--sl-redBg:#3a1d10;--sl-banner:#1c1e36}
@media (prefers-color-scheme: light){:root:has(.sl){color-scheme:light;--sl-bg:#f6f7fb;--sl-card:#ffffff;--sl-ink:#16163a;--sl-soft:#55577a;--sl-line:#dfe1ee;--sl-brand:#4f46e5;--sl-brandDark:#3f37c9;--sl-mint:#0f9d76;--sl-mintBg:#e3f6ef;--sl-red:#c2410c;--sl-redBg:#fdeee6;--sl-banner:#16163a}}`;

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

type Card = { term: string; def: string; topic: string };

/** Rule-based "Term: definition" extraction (the AI version would read whole decks). */
function parseNotes(text: string): Card[] {
    const cards: Card[] = [];
    let topic = 'General';
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        const heading = line.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
            topic = heading[1].trim();
            continue;
        }
        const body = line.replace(/^([-*•]|\d+[.)])\s+/, '');
        const m =
            body.match(/^(.{2,70}?)\s*(?::|\s[-–—=]\s)\s*(.{8,})$/) ??
            body.match(/^(?:an?|the)?\s*([\w\s()/-]{2,40}?)\s+(?:is|are|means|refers to)\s+(.{8,})$/i);
        if (!m) continue;
        const term = m[1].trim().replace(/^(an?|the)\s+/i, '');
        const def = m[2].trim().replace(/\.$/, '');
        if (term.split(/\s+/).length <= 6) cards.push({ term: term.charAt(0).toUpperCase() + term.slice(1), def, topic });
    }
    return cards;
}

const shuffle = <T,>(xs: T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

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

type Question = { card: Card; options: string[] };
const buildQuiz = (cards: Card[]): Question[] =>
    shuffle(cards)
        .slice(0, 10)
        .map((card) => ({
            card,
            options: shuffle([
                card.term,
                ...shuffle(cards.filter((c) => c.term !== card.term))
                    .slice(0, 3)
                    .map((c) => c.term),
            ]),
        }));

type Mode = 'cards' | 'quiz' | 'practice';

export default function StudyLoopDemo() {
    const [notes, setNotes] = useState(SAMPLE);
    const [cards, setCards] = useState<Card[]>(() => parseNotes(SAMPLE));
    const [mode, setMode] = useState<Mode>('cards');
    const [fileNote, setFileNote] = useState('');

    // Flashcards
    const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
    const [pos, setPos] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [known, setKnown] = useState<string[]>([]);

    // Quiz
    const [quiz, setQuiz] = useState<Question[]>(() => buildQuiz(cards));
    const [qi, setQi] = useState(0);
    const [picked, setPicked] = useState<string | null>(null);
    const [answers, setAnswers] = useState<boolean[]>([]);

    // Practice
    const [pi, setPi] = useState(0);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<null | 'right' | 'close' | 'wrong'>(null);
    const [hint, setHint] = useState(false);
    const [practiceOrder, setPracticeOrder] = useState<number[]>(() => shuffle(cards.map((_, i) => i)));

    const generate = () => {
        const next = parseNotes(notes);
        setCards(next);
        setOrder(next.map((_, i) => i));
        setPos(0);
        setFlipped(false);
        setKnown([]);
        setQuiz(buildQuiz(next));
        setQi(0);
        setPicked(null);
        setAnswers([]);
        setPracticeOrder(shuffle(next.map((_, i) => i)));
        setPi(0);
        setGuess('');
        setResult(null);
        setHint(false);
        document.getElementById('study')?.scrollIntoView({ behavior: 'smooth' });
    };

    const onFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/\.(txt|md|markdown)$/i.test(file.name)) {
            setFileNote('This demo reads .txt and .md files. The AI version would read PDFs and slide decks.');
            return;
        }
        file.text().then((t) => {
            setNotes(t);
            setFileNote(`Loaded ${file.name} (read in your browser, nothing uploaded).`);
        });
    };

    const card = cards[order[pos]];
    const go = useCallback(
        (d: number) => {
            setFlipped(false);
            setPos((p) => (p + d + order.length) % order.length);
        },
        [order.length],
    );

    useEffect(() => {
        if (mode !== 'cards') return;
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.closest('textarea, input')) return;
            if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === ' ') {
                e.preventDefault();
                setFlipped((f) => !f);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mode, go]);

    const mark = (got: boolean) => {
        if (!card) return;
        setKnown((k) => (got ? [...new Set([...k, card.term])] : k.filter((t) => t !== card.term)));
        go(1);
    };

    const q = quiz[qi];
    const quizDone = quiz.length > 0 && qi >= quiz.length; // only after "See results" on the last question
    const score = answers.filter(Boolean).length;

    const pc = cards[practiceOrder[pi]];
    const check = () => {
        if (!pc || !guess.trim()) return;
        const g = norm(guess);
        const t = norm(pc.term);
        setResult(g === t ? 'right' : distance(g, t) <= Math.max(1, Math.floor(t.length / 6)) ? 'close' : 'wrong');
    };
    const nextPractice = () => {
        setPi((i) => (i + 1) % practiceOrder.length);
        setGuess('');
        setResult(null);
        setHint(false);
    };

    const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-colors';
    const tab = (id: Mode, label: string) => (
        <button
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className="min-h-11 rounded-xl px-5 font-semibold"
            style={mode === id ? { background: C.brand, color: '#fff' } : { color: C.soft }}
        >
            {label}
        </button>
    );

    return (
        <>
            <Head title="StudyLoop (demo)">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <style>{THEME}</style>

            <div
                className="sl min-h-screen"
                style={{ background: C.bg, color: C.ink, fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif" }}
            >
                {/* Demo banner */}
                <div style={{ background: C.banner, color: '#fff' }}>
                    <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5 text-sm font-medium sm:px-8">
                        <p>Demo app designed &amp; built by Timasi Werema. Runs entirely in your browser.</p>
                        <Link href="/#work" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4">
                            <ArrowLeft className="size-4" /> Back to portfolio
                        </Link>
                    </div>
                </div>

                <header className="border-b" style={{ borderColor: C.line, background: C.card }}>
                    <nav className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <span className="flex items-center gap-2 text-xl font-extrabold">
                            <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: C.brand, color: '#fff' }}>
                                <RotateCcw className="size-5" />
                            </span>
                            StudyLoop
                        </span>
                        <span className="text-sm font-semibold" style={{ color: C.soft }}>
                            {cards.length} cards · {known.length} mastered
                        </span>
                    </nav>
                </header>

                <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
                    <h1 className="max-w-3xl text-4xl leading-tight font-extrabold sm:text-5xl">
                        Turn your lecture notes into <span style={{ color: C.brand }}>flashcards, quizzes and practice</span> in one click.
                    </h1>
                    <p className="mt-3 max-w-2xl text-lg" style={{ color: C.soft }}>
                        Paste notes with lines like{' '}
                        <code className="rounded px-1.5 py-0.5 text-base" style={{ background: C.line }}>
                            Term: definition
                        </code>
                        , or upload a .txt or .md file. The sample below is from an Operating Systems unit.
                    </p>

                    {/* Input */}
                    <section
                        aria-label="Your notes"
                        className="mt-8 rounded-2xl border p-5 sm:p-6"
                        style={{ background: C.card, borderColor: C.line }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label htmlFor="notes" className="font-bold">
                                Your notes
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <label className={`${btn} cursor-pointer border`} style={{ borderColor: C.line }}>
                                    <FileUp className="size-4" /> Upload .txt / .md
                                    <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" onChange={onFile} className="sr-only" />
                                </label>
                                <button type="button" onClick={() => setNotes(SAMPLE)} className={`${btn} border`} style={{ borderColor: C.line }}>
                                    Load sample
                                </button>
                            </div>
                        </div>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={9}
                            className="mt-3 w-full rounded-xl border p-4 font-mono text-sm leading-relaxed"
                            style={{ borderColor: C.line, background: C.bg }}
                        />
                        {fileNote && (
                            <p role="status" className="mt-2 text-sm" style={{ color: C.soft }}>
                                {fileNote}
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <button type="button" onClick={generate} className={btn} style={{ background: C.brand, color: '#fff' }}>
                                <Sparkles className="size-4" /> Generate study set
                            </button>
                            <p className="text-sm" style={{ color: C.soft }}>
                                Found <strong>{parseNotes(notes).length}</strong> terms. This demo uses simple rules; the AI version reads full slide
                                decks and writes its own questions.
                            </p>
                        </div>
                    </section>

                    {/* Study modes */}
                    <section id="study" className="mt-10 scroll-mt-6">
                        <div
                            role="tablist"
                            aria-label="Study mode"
                            className="inline-flex flex-wrap gap-1 rounded-2xl border p-1"
                            style={{ background: C.card, borderColor: C.line }}
                        >
                            {tab('cards', 'Flashcards')}
                            {tab('quiz', 'Quiz')}
                            {tab('practice', 'Practice')}
                        </div>

                        {cards.length < 4 ? (
                            <p className="mt-6 rounded-2xl border p-6" style={{ background: C.card, borderColor: C.line }}>
                                Add at least 4 terms (one per line, like <code>Term: definition</code>) and press Generate.
                            </p>
                        ) : mode === 'cards' ? (
                            <div role="tabpanel" className="mt-6">
                                <div
                                    className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold"
                                    style={{ color: C.soft }}
                                >
                                    <span>
                                        Card {pos + 1} of {order.length} · {card?.topic}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOrder(shuffle(cards.map((_, i) => i)));
                                            setPos(0);
                                            setFlipped(false);
                                        }}
                                        className="inline-flex min-h-10 items-center gap-1.5"
                                    >
                                        <Shuffle className="size-4" /> Shuffle
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFlipped((f) => !f)}
                                    aria-label={
                                        flipped
                                            ? `Definition: ${card?.def}. Click to show the term.`
                                            : `Term: ${card?.term}. Click to show the definition.`
                                    }
                                    className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border-2 p-8 text-center shadow-sm transition-colors"
                                    style={{
                                        background: flipped ? C.ink : C.card,
                                        color: flipped ? C.card : C.ink,
                                        borderColor: flipped ? C.ink : C.line,
                                    }}
                                >
                                    <span className="mb-3 text-xs font-bold tracking-[0.15em] uppercase opacity-60">
                                        {flipped ? 'Definition' : 'Term'}
                                    </span>
                                    <span
                                        className={flipped ? 'max-w-2xl text-xl leading-relaxed sm:text-2xl' : 'text-3xl font-extrabold sm:text-4xl'}
                                    >
                                        {flipped ? card?.def : card?.term}
                                    </span>
                                    <span className="mt-6 text-xs opacity-60">Click or press Space to flip · ← → to move</span>
                                </button>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            aria-label="Previous card"
                                            onClick={() => go(-1)}
                                            className={`${btn} border px-3`}
                                            style={{ borderColor: C.line, background: C.card }}
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Next card"
                                            onClick={() => go(1)}
                                            className={`${btn} border px-3`}
                                            style={{ borderColor: C.line, background: C.card }}
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => mark(false)}
                                            className={btn}
                                            style={{ background: C.redBg, color: C.red }}
                                        >
                                            Still learning
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => mark(true)}
                                            className={btn}
                                            style={{ background: C.mintBg, color: C.mint }}
                                        >
                                            <Check className="size-4" /> Got it
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="h-2 rounded-full" style={{ background: C.line }} aria-hidden="true">
                                        <div
                                            className="h-2 rounded-full transition-all"
                                            style={{ width: `${(known.length / cards.length) * 100}%`, background: C.mint }}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm" style={{ color: C.soft }}>
                                        {known.length} of {cards.length} mastered
                                    </p>
                                </div>
                            </div>
                        ) : mode === 'quiz' ? (
                            <div role="tabpanel" className="mt-6 rounded-3xl border p-6 sm:p-8" style={{ background: C.card, borderColor: C.line }}>
                                {quizDone ? (
                                    <div role="status">
                                        <p className="text-sm font-bold tracking-[0.12em] uppercase" style={{ color: C.soft }}>
                                            Quiz complete
                                        </p>
                                        <p className="mt-2 text-5xl font-extrabold">
                                            {score}/{quiz.length}
                                        </p>
                                        <p className="mt-2" style={{ color: C.soft }}>
                                            {score === quiz.length
                                                ? 'Perfect score. You know this unit.'
                                                : score >= quiz.length * 0.7
                                                  ? 'Solid. Review the ones you missed below.'
                                                  : 'Keep going: flashcards first, then try again.'}
                                        </p>
                                        <ul className="mt-6 divide-y" style={{ borderColor: C.line }}>
                                            {quiz.map((qq, i) => (
                                                <li key={qq.card.term} className="flex items-start gap-3 py-3" style={{ borderColor: C.line }}>
                                                    {answers[i] ? (
                                                        <Check className="mt-0.5 size-5 shrink-0" style={{ color: C.mint }} />
                                                    ) : (
                                                        <X className="mt-0.5 size-5 shrink-0" style={{ color: C.red }} />
                                                    )}
                                                    <span>
                                                        <strong>{qq.card.term}</strong> — {qq.card.def}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuiz(buildQuiz(cards));
                                                setQi(0);
                                                setPicked(null);
                                                setAnswers([]);
                                            }}
                                            className={`${btn} mt-6`}
                                            style={{ background: C.brand, color: '#fff' }}
                                        >
                                            <RotateCcw className="size-4" /> New quiz
                                        </button>
                                    </div>
                                ) : (
                                    q && (
                                        <fieldset>
                                            <legend className="w-full">
                                                <span className="flex justify-between text-sm font-semibold" style={{ color: C.soft }}>
                                                    <span>
                                                        Question {qi + 1} of {quiz.length}
                                                    </span>
                                                    <span>Score: {score}</span>
                                                </span>
                                                <span className="mt-3 block text-xl font-bold sm:text-2xl">Which term matches this definition?</span>
                                                <span className="mt-2 block text-lg" style={{ color: C.soft }}>
                                                    "{q.card.def}"
                                                </span>
                                            </legend>
                                            <div className="mt-5 flex flex-col gap-2">
                                                {q.options.map((opt) => {
                                                    const isRight = opt === q.card.term;
                                                    const chosen = picked === opt;
                                                    const style = picked
                                                        ? isRight
                                                            ? { background: C.mintBg, borderColor: C.mint, color: C.ink }
                                                            : chosen
                                                              ? { background: C.redBg, borderColor: C.red, color: C.ink }
                                                              : { borderColor: C.line, color: C.soft }
                                                        : { borderColor: C.line };
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            disabled={!!picked}
                                                            onClick={() => {
                                                                setPicked(opt);
                                                                setAnswers((a) => [...a, isRight]);
                                                            }}
                                                            className="flex min-h-12 items-center justify-between rounded-xl border-2 px-4 text-left font-semibold disabled:cursor-default"
                                                            style={style}
                                                        >
                                                            {opt}
                                                            {picked && isRight && <Check className="size-5" style={{ color: C.mint }} />}
                                                            {picked && chosen && !isRight && <X className="size-5" style={{ color: C.red }} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {picked && (
                                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                                    <p
                                                        role="status"
                                                        className="font-semibold"
                                                        style={{ color: picked === q.card.term ? C.mint : C.red }}
                                                    >
                                                        {picked === q.card.term ? 'Correct!' : `Not quite. It's "${q.card.term}".`}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQi((i) => i + 1);
                                                            setPicked(null);
                                                        }}
                                                        className={btn}
                                                        style={{ background: C.brand, color: '#fff' }}
                                                    >
                                                        {qi + 1 === quiz.length ? 'See results' : 'Next'} <ArrowRight className="size-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </fieldset>
                                    )
                                )}
                            </div>
                        ) : (
                            pc && (
                                <div
                                    role="tabpanel"
                                    className="mt-6 rounded-3xl border p-6 sm:p-8"
                                    style={{ background: C.card, borderColor: C.line }}
                                >
                                    <p className="text-sm font-semibold" style={{ color: C.soft }}>
                                        Type the term · {pi + 1} of {practiceOrder.length}
                                    </p>
                                    <p className="mt-3 text-xl leading-relaxed font-semibold sm:text-2xl">"{pc.def}"</p>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (result) nextPractice();
                                            else check();
                                        }}
                                        className="mt-5 flex flex-wrap gap-2"
                                    >
                                        <label htmlFor="guess" className="sr-only">
                                            Your answer
                                        </label>
                                        <input
                                            id="guess"
                                            value={guess}
                                            onChange={(e) => setGuess(e.target.value)}
                                            disabled={!!result}
                                            autoComplete="off"
                                            placeholder="Your answer"
                                            className="min-h-12 min-w-0 flex-[1_1_240px] rounded-xl border-2 px-4 text-lg"
                                            style={{ borderColor: C.line }}
                                        />
                                        <button type="submit" className={btn} style={{ background: C.brand, color: '#fff' }}>
                                            {result ? 'Next' : 'Check'}
                                        </button>
                                        {!result && (
                                            <button
                                                type="button"
                                                onClick={() => setHint(true)}
                                                className={`${btn} border`}
                                                style={{ borderColor: C.line }}
                                            >
                                                <Lightbulb className="size-4" /> Hint
                                            </button>
                                        )}
                                    </form>
                                    {hint && !result && (
                                        <p className="mt-3 text-sm" style={{ color: C.soft }}>
                                            Starts with <strong>{pc.term.charAt(0)}</strong>, {pc.term.replace(/\s*\(.*?\)/, '').length} characters.
                                        </p>
                                    )}
                                    {result && (
                                        <p
                                            role="status"
                                            className="mt-4 rounded-xl px-4 py-3 font-semibold"
                                            style={
                                                result === 'wrong' ? { background: C.redBg, color: C.red } : { background: C.mintBg, color: C.mint }
                                            }
                                        >
                                            {result === 'right' && 'Correct!'}
                                            {result === 'close' && `Close enough. Watch the spelling: "${pc.term}".`}
                                            {result === 'wrong' && `The answer is "${pc.term}".`}
                                        </p>
                                    )}
                                </div>
                            )
                        )}
                    </section>

                    {/* What a real version adds */}
                    <section className="mt-16 border-t pt-10" style={{ borderColor: C.line }}>
                        <h2 className="text-2xl font-extrabold">What the full AI version adds</h2>
                        <ul className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                            {[
                                'Reads PowerPoint and PDF slides, not just typed notes',
                                'Writes its own questions, including "why" and "compare" questions',
                                'Spaced repetition: brings back cards right before you forget them',
                                'Short explainer videos and worked examples for tough topics',
                                'Shares a study set with classmates',
                                'Tracks which topics need more work before the exam',
                            ].map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                    <Sparkles className="mt-1 size-4 shrink-0" style={{ color: C.brand }} /> {f}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <footer className="border-t" style={{ borderColor: C.line, background: C.card }}>
                    <div
                        className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8"
                        style={{ color: C.soft }}
                    >
                        <p>StudyLoop is a demo app. Your notes stay in your browser and are never uploaded.</p>
                        <Link
                            href="/services/ai-agents"
                            className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                            style={{ color: C.ink }}
                        >
                            Want an AI tool like this? Let's talk →
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
