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
