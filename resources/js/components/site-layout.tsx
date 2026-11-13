import { useActiveSection } from '@/components/motion';
import { type Service } from '@/types/portfolio';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

/*
 * Public layout, "Studio" look: near-black paper, warm off-white ink, one blue accent,
 * Inter Tight for text, JetBrains Mono for small labels, hairline rules and plenty of air.
 * Token names (maple, navy, royal...) are kept from the old basketball theme; values live in app.css.
 */

const sections = [
    { id: 'work', label: 'Work' },
    { id: 'services', label: 'Services' },
    { id: 'packages', label: 'Packages' },
    { id: 'about', label: 'About' },
];
const SECTION_IDS = sections.map((s) => s.id);

/** Small mono label like "FIG. 02 / SELECTED WORK". `n` is the figure number. */
export function Fig({
    n,
    children,
    className = '',
    tone = 'light',
}: {
    n?: string | number;
    children: ReactNode;
    className?: string;
    tone?: 'light' | 'dark';
}) {
    return (
        <p className={`font-cond text-[11px] ${tone === 'dark' ? 'text-silver' : 'text-ink-muted'} ${className}`}>
            {n !== undefined && <span className="text-royal">FIG. {String(n).padStart(2, '0')} / </span>}
            {children}
        </p>
    );
}

/**
 * Section title in two tones: `title` bright, `dim` (second line) muted,
 * like "The ground truth / for every building."
 */
export function SectionHeading({
    eyebrow,
    title,
    dim,
    tone = 'light',
    className = 'mb-12',
    n,
}: {
    eyebrow: string;
    title: string;
    dim?: string;
    tone?: 'light' | 'dark';
    className?: string;
    n?: string | number;
}) {
    return (
        <div className={className}>
            <Fig n={n} tone={tone} className="mb-5" data-reveal>
                {eyebrow}
            </Fig>
            <h2 data-reveal="mask" className="font-display max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                {title}
                {dim && (
                    <>
                        <br />
                        <span className="title-dim">{dim}</span>
                    </>
                )}
            </h2>
        </div>
    );
}

/** A small line-art diagram, one per service. Kept from the first version of the site. */
export function PlayDiagram({ icon, className = '' }: { icon: Service['icon']; className?: string }) {
    const run = 'var(--play-run, var(--color-royal))';
    return (
        <svg aria-hidden="true" viewBox="0 0 120 80" className={className}>
            <rect x="2" y="2" width="116" height="76" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
            {icon === 'websites' && (
                <>
                    <circle cx="24" cy="58" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M30 52 Q 60 20 92 30" fill="none" stroke={run} strokeWidth="1.5" strokeDasharray="5 4" />
                    <path d="M86 24 l8 6 -9 3" fill="none" stroke={run} strokeWidth="1.5" />
                    <path d="M100 20 l8 8 M108 20 l-8 8" stroke="currentColor" strokeWidth="1.5" />
                </>
            )}
            {icon === 'software' && (
                <>
                    <circle cx="30" cy="40" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="70" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="70" cy="58" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M37 37 L63 25 M37 43 L63 55 M77 25 L98 40 M77 55 L98 40" stroke={run} strokeWidth="1.5" />
                </>
            )}
            {icon === 'growth' && (
                <>
                    <path d="M16 64 L44 48 L68 54 L104 18" fill="none" stroke={run} strokeWidth="1.5" />
                    <path d="M96 18 l8 0 0 8" fill="none" stroke={run} strokeWidth="1.5" />
                    <circle cx="16" cy="64" r="4" fill="currentColor" />
                </>
            )}
            {icon === 'agents' && (
                <>
                    <path d="M20 40 C 40 10, 60 70, 80 40 S 100 20, 104 40" fill="none" stroke={run} strokeWidth="1.5" />
                    <circle cx="20" cy="40" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="104" cy="40" r="5" fill="currentColor" />
                </>
            )}
        </svg>
    );
}

/** Button link. `solid` = blue, `outline` = hairline, `outline-light` = hairline on a dark band. */
export function PillLink({
    href,
    children,
    variant = 'solid',
    internal = false,
}: {
    href: string;
    children: ReactNode;
    variant?: 'solid' | 'outline' | 'outline-light';
    internal?: boolean;
}) {
    const styles = {
        solid: 'bg-royal text-maple hover:bg-royal-dark',
        outline: 'border border-rule text-ink hover:border-ink',
        'outline-light': 'border border-navy-line text-on-navy hover:border-on-navy',
    }[variant];
    const className = `font-cond inline-flex min-h-12 items-center gap-2 rounded-sm px-5 !text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal ${styles}`;
    return internal ? (
        <Link href={href} className={className}>
            {children}
        </Link>
    ) : (
        <a href={href} className={className}>
            {children}
        </a>
    );
}

/** The "TW" mark: a square with the initials, drawn in the current text colour. */
export function BallMark({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
            <rect x="0.75" y="0.75" width="38.5" height="38.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text
                x="20"
                y="25.5"
                textAnchor="middle"
                fontFamily="'Inter Tight Variable', 'Inter Tight', sans-serif"
                fontWeight="600"
                fontSize="15"
                fill="currentColor"
                letterSpacing="-0.5"
            >
                TW
            </text>
            <circle cx="33" cy="7" r="2.2" style={{ fill: 'var(--color-royal)' }} />
        </svg>
    );
}

/**
 * Header + footer shared by the public pages.
 * On the home page (`home`), menu links scroll to sections; elsewhere they go back to the home page sections.
 */
export function SiteLayout({
    name,
    resumeUrl,
    home = false,
    children,
}: {
    name: string;
    resumeUrl: string | null;
    home?: boolean;
    children: ReactNode;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const href = (id: string) => (home ? `#${id}` : `/#${id}`);
    const active = useActiveSection(SECTION_IDS);
    const navRef = useRef<HTMLDivElement>(null);
    const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

    // The underline slides to the section you're reading (or "Start a project" at the very top / on other pages).
    useLayoutEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const target = nav.querySelector<HTMLElement>(`[data-nav="${home && active ? active : 'start'}"]`);
        if (!target) return;
        const measure = () => setBar({ left: target.offsetLeft, width: target.offsetWidth });
        measure();
        document.fonts?.ready.then(measure);
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [active, home]);

    const navLink = 'font-cond py-3 text-ink-muted hover:text-ink transition-colors';
    const brand = (
        <>
            <BallMark className="text-ink size-8" />
            <span className="font-cond text-ink">{name}</span>
        </>
    );

    return (
        <div className="hardwood bg-maple text-ink font-body min-h-screen text-[15px] leading-relaxed sm:text-[16px]">
            <header className="border-maple-line bg-maple/85 sticky top-0 z-40 border-b backdrop-blur">
                <nav className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-10">
                    {home ? (
                        <a href="#top" className="flex items-center gap-3">
                            {brand}
                        </a>
                    ) : (
                        <Link href="/" className="flex items-center gap-3">
                            {brand}
                        </Link>
                    )}
                    <div ref={navRef} className="relative hidden items-center gap-7 md:flex">
                        {sections.map((s, i) => (
                            <a
                                key={s.id}
                                href={href(s.id)}
                                data-nav={s.id}
                                aria-current={home && active === s.id ? 'location' : undefined}
                                className={`${navLink} ${home && active === s.id ? 'text-ink' : ''}`}
                            >
                                <span className="text-ink-muted/60 mr-1.5">0{i + 1}</span>
                                {s.label}
                            </a>
                        ))}
                        {resumeUrl && (
                            <a href={resumeUrl} className={navLink}>
                                Resume
                            </a>
                        )}
                        <Link href="/start" data-nav="start" className="font-cond text-ink inline-flex items-center gap-1 py-3">
                            Start a project <ArrowUpRight className="size-3.5" />
                        </Link>
                        <span
                            aria-hidden="true"
                            className="bg-royal absolute bottom-1 h-px transition-[left,width] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none"
                            style={bar ? { left: bar.left, width: bar.width } : { left: 0, width: 0, opacity: 0 }}
                        />
                    </div>
                    <button
                        type="button"
                        className="text-ink flex size-11 items-center justify-center md:hidden"
                        aria-label="Menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </nav>
                {menuOpen && (
                    <div className="border-maple-line border-t px-5 pb-4 md:hidden">
                        {sections.map((s) => (
                            <a key={s.id} href={href(s.id)} onClick={() => setMenuOpen(false)} className={`${navLink} block`}>
                                {s.label}
                            </a>
                        ))}
                        {resumeUrl && (
                            <a href={resumeUrl} className={`${navLink} block`}>
                                Resume
                            </a>
                        )}
                        <Link href="/start" className="font-cond text-ink block py-3">
                            Start a project →
                        </Link>
                    </div>
                )}
            </header>

            {children}

            <footer className="border-maple-line border-t">
                <div className="font-cond text-ink-muted mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-3 px-5 py-8 sm:flex-row sm:items-center sm:px-8 lg:px-10">
                    <p>
                        © {new Date().getFullYear()} {name} · Dallas, TX
                    </p>
                    <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1">
                        <Link href="/start" className="hover:text-ink py-2">
                            Start a project
                        </Link>
                        <Link href="/privacy" className="hover:text-ink py-2">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-ink py-2">
                            Terms
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
