import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

/*
 * Small scroll-motion kit for the public pages (no animation library).
 * Everything turns itself off when the visitor's device asks for reduced motion,
 * and content is fully visible if JavaScript never runs.
 */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveal-on-scroll for every element with `data-reveal` (fade up) or `data-reveal="mask"` (slides up from behind a line).
 * Add `style={{ '--d': i }}` to stagger items in a list. Elements already on screen at load are shown at once (no flash).
 */
export function useReveal() {
    useLayoutEffect(() => {
        const root = document.documentElement;
        if (reduced()) return;
        const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown])'));
        els.forEach((el) => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.dataset.shown = '';
        });
        root.classList.add('js-motion');
        const io = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        (e.target as HTMLElement).dataset.shown = '';
                        io.unobserve(e.target);
                    }
                }),
            { rootMargin: '0px 0px -8% 0px' },
        );
        els.filter((el) => !('shown' in el.dataset)).forEach((el) => io.observe(el));
        return () => {
            io.disconnect();
            root.classList.remove('js-motion');
        };
    }, []);
}

/** Calls `fn(progress)` on scroll, where progress goes 0 → 1 as `ref` travels through the viewport. */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, fn: (p: number) => void, { start = 0.85, end = 0.35 } = {}) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => {
        if (reduced()) return fnRef.current(1);
        let frame = 0;
        const update = () => {
            frame = 0;
            const el = ref.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            // 0 when the top reaches `start` of the screen, 1 when the bottom reaches `end`.
            const total = r.height + vh * (start - end);
            fnRef.current(Math.min(1, Math.max(0, (vh * start - r.top) / total)));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [ref, start, end]);
}

/** Moves an element at a fraction of the scroll speed (parallax). */
export function useParallax<T extends HTMLElement | SVGElement>(speed = 0.25) {
    const ref = useRef<T>(null);
    useEffect(() => {
        if (reduced()) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            if (ref.current) ref.current.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [speed]);
    return ref;
}

/** Counts a stat like "65%", "3+" or "04" up from zero the first time it scrolls into view. */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
    const m = value.match(/^(\D*)(\d+)(.*)$/);
    const ref = useRef<HTMLSpanElement>(null);
    const [shown, setShown] = useState(value);
    useEffect(() => {
        const el = ref.current;
        if (!m || !el || reduced()) return;
        const [, pre, digits, post] = m;
        const target = Number(digits);
        const io = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting) return;
                io.disconnect();
                const t0 = performance.now();
                const tick = (t: number) => {
                    const k = Math.min(1, (t - t0) / duration);
                    const eased = 1 - Math.pow(1 - k, 3);
                    setShown(`${pre}${String(Math.round(target * eased)).padStart(digits.length, '0')}${post}`);
                    if (k < 1) requestAnimationFrame(tick);
                };
                setShown(`${pre}${'0'.padStart(digits.length, '0')}${post}`);
                requestAnimationFrame(tick);
            },
            { threshold: 0.6 },
        );
        io.observe(el);
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration]);
    return (
        <span ref={ref} aria-label={value}>
            <span aria-hidden="true">{shown}</span>
        </span>
    );
}

/** An endless strip of words that drifts sideways (pauses on hover; static for reduced motion). Decorative. */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
    const row = (hidden: boolean) => (
        <ul className="marquee-track flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
            {items.map((t, i) => (
                <li key={i} className="flex items-center gap-10 whitespace-nowrap">
                    {t}
                    <span className="text-royal" aria-hidden="true">
                        ✦
                    </span>
                </li>
            ))}
        </ul>
    );
    return (
        <div className={`marquee flex overflow-hidden ${className}`} aria-hidden="true">
            {row(false)}
            {row(true)}
        </div>
    );
}

/**
 * A list where hovering a row shows a floating preview image that follows the cursor (mouse/trackpad only).
 * `children` gets `bind(src)` to spread onto each row.
 */
export function HoverPreview({
    children,
    alt = '',
}: {
    children: (bind: (src: string | null) => { onPointerEnter: () => void; onPointerLeave: () => void }) => ReactNode;
    alt?: string;
}) {
    const box = useRef<HTMLDivElement>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [on, setOn] = useState(false);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        setEnabled(window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced());
    }, []);

    useEffect(() => {
        if (!enabled) return;
        let frame = 0;
        let x = 0;
        let y = 0;
        const move = (e: PointerEvent) => {
            x = e.clientX;
            y = e.clientY;
            if (!frame)
                frame = requestAnimationFrame(() => {
                    frame = 0;
                    if (box.current) box.current.style.transform = `translate3d(${x + 24}px, ${y - 110}px, 0) rotate(-2deg)`;
                });
        };
        window.addEventListener('pointermove', move, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', move);
        };
    }, [enabled]);

    const bind = (s: string | null) => ({
        onPointerEnter: () => {
            if (!enabled || !s) return;
            setSrc(s);
            setOn(true);
        },
        onPointerLeave: () => setOn(false),
    });

    return (
        <>
            {children(bind)}
            {enabled && (
                <div
                    ref={box}
                    aria-hidden="true"
                    className="pointer-events-none fixed top-0 left-0 z-30 hidden w-[340px] overflow-hidden rounded-md shadow-2xl transition-opacity duration-200 lg:block"
                    style={{ opacity: on ? 1 : 0 }}
                >
                    {src && <img src={src} alt={alt} className="block aspect-[16/10] w-full object-cover" onError={() => setOn(false)} />}
                </div>
            )}
        </>
    );
}

/** Which page section (by id) is currently on screen, so the nav can point at it. */
export function useActiveSection(ids: string[]): string | null {
    const [active, setActive] = useState<string | null>(null);
    useEffect(() => {
        const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
        if (!els.length) return;
        const ratios = new Map<string, number>();
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
                // Pick the section with the most of itself on screen; near the top of the page, none.
                const best = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0];
                setActive(best && best[1] > 0 ? best[0] : null);
            },
            { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [ids]);
    return active;
}

/** Types each phrase, pauses, backspaces, then the next one. Static first phrase for reduced motion and screen readers. */
export function Typewriter({ phrases, className = '' }: { phrases: string[]; className?: string }) {
    const [text, setText] = useState(phrases[0] ?? '');
    const [blink, setBlink] = useState(true);
    useEffect(() => {
        if (reduced() || phrases.length < 2) return;
        let i = 0;
        let len = phrases[0].length;
        let deleting = false;
        let timer = 0;
        const tick = () => {
            const full = phrases[i];
            if (!deleting && len < full.length) {
                len++;
                setText(full.slice(0, len));
                timer = window.setTimeout(tick, 45 + Math.random() * 40);
            } else if (!deleting) {
                deleting = true;
                timer = window.setTimeout(tick, 1900); // read it
            } else if (len > 0) {
                len--;
                setText(full.slice(0, len));
                timer = window.setTimeout(tick, 24);
            } else {
                deleting = false;
                i = (i + 1) % phrases.length;
                timer = window.setTimeout(tick, 350);
            }
        };
        timer = window.setTimeout(tick, 1600);
        const blinkTimer = window.setInterval(() => setBlink((b) => !b), 530);
        return () => {
            clearTimeout(timer);
            clearInterval(blinkTimer);
        };
    }, [phrases]);
    return (
        <span className={className} aria-label={phrases.join('. ')}>
            <span aria-hidden="true">{text}</span>
            <span
                aria-hidden="true"
                className="ml-0.5 inline-block w-[0.08em] translate-y-[0.08em] bg-current align-baseline"
                style={{ height: '0.95em', opacity: blink ? 1 : 0 }}
            />
        </span>
    );
}
