import { type Service } from '@/types/portfolio';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const sections = [
    { id: 'work', label: 'Work' },
    { id: 'services', label: 'Services' },
    { id: 'packages', label: 'Packages' },
    { id: 'about', label: 'About' },
];

/** The "Ball seams" logo: a basketball drawn in seams with a royal name plate. Seams use the current text colour. */
const TW_PATH =
    'M44.98 73V49.39H41.51V43.78H54.29V49.39H50.82V73ZM58.21 73 55.07 43.78H60.78L62.39 62.23L64.03 43.78H69.48L71.04 62.23L72.6 43.78H78.38L75.19 73H68.18L66.72 58.94L65.33 73Z';
export function BallMark({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <g fill="none" stroke="currentColor">
                <circle cx="60" cy="60" r="54" strokeWidth="7" />
                <path d="M60 6 V114 M6 60 H114" strokeWidth="5" />
                <path d="M22 22 Q46 60 22 98 M98 22 Q74 60 98 98" strokeWidth="5" />
            </g>
            <rect x="29" y="40" width="62" height="40" rx="6" style={{ fill: 'var(--color-royal)' }} />
            <path d={TW_PATH} fill="#fff" />
        </svg>
    );
}

/** Big condensed section title with a small label above it. `tone` = background it sits on. */
export function SectionHeading({
    eyebrow,
    title,
    tone = 'light',
    className = 'mb-12',
}: {
    eyebrow: string;
    title: string;
    tone?: 'light' | 'dark';
    className?: string;
}) {
    return (
        <div className={className}>
            <p
                data-reveal
                className={`font-cond mb-2 text-base font-bold tracking-[0.14em] uppercase ${tone === 'dark' ? 'text-led' : 'text-royal'}`}
            >
                {eyebrow}
            </p>
            <h2 data-reveal="mask" className="font-display text-5xl leading-[0.95] uppercase sm:text-7xl lg:text-[88px]">
                {title}
            </h2>
        </div>
    );
}

/** A small basketball play diagram, one per service, drawn in line art. */
export function PlayDiagram({ icon, className = '' }: { icon: Service['icon']; className?: string }) {
    const frame = <rect x="2" y="2" width="116" height="76" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />;
    const run = 'var(--play-run, var(--color-led))';

    return (
        <svg aria-hidden="true" viewBox="0 0 120 80" className={className}>
            {frame}
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

/** Pill-shaped button link in the Hardwood style. */
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
        solid: 'bg-royal text-white hover:bg-royal-dark',
        outline: 'border-2 border-rule text-strong hover:bg-navy hover:text-on-navy',
        'outline-light': 'border-2 border-silver text-on-navy hover:bg-on-navy hover:text-navy',
    }[variant];
    const className = `font-cond inline-flex min-h-[54px] items-center gap-2 rounded-full px-7 text-xl font-bold tracking-[0.06em] uppercase transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-royal ${styles}`;

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

/**
 * Header + footer shared by the public pages (Hardwood theme).
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
    const navLink = 'font-cond py-3 text-lg font-semibold tracking-[0.08em] uppercase text-silver hover:text-white';

    const brand = (
        <>
            <BallMark className="size-11 text-white" />
            <span className="font-cond text-xl font-bold tracking-[0.06em] uppercase">{name}</span>
        </>
    );

    return (
        <div className="hardwood bg-maple text-ink font-body min-h-screen text-[17px] leading-relaxed">
            <header className="bg-navy text-on-navy sticky top-0 z-40">
                <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-3 sm:px-10 lg:px-16">
                    {home ? (
                        <a href="#top" className="flex items-center gap-3">
                            {brand}
                        </a>
                    ) : (
                        <Link href="/" className="flex items-center gap-3">
                            {brand}
                        </Link>
                    )}
                    <div className="hidden items-center gap-7 md:flex">
                        {sections.map((s) => (
                            <a key={s.id} href={href(s.id)} className={navLink}>
                                {s.label}
                            </a>
                        ))}
                        {resumeUrl && (
                            <a href={resumeUrl} className={navLink}>
                                Resume
                            </a>
                        )}
                        <Link href="/start" className="font-cond border-led border-b-2 py-2 text-lg font-bold tracking-[0.08em] text-white uppercase">
                            Start a project
                        </Link>
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
                    <div className="border-navy-line border-t px-5 pb-4 md:hidden">
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
                        <Link href="/start" className={`${navLink} block text-white`}>
                            Start a project →
                        </Link>
                    </div>
                )}
            </header>

            {children}

            <footer className="bg-navy text-silver">
                <div className="font-cond mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-5 py-6 text-base font-semibold tracking-[0.08em] uppercase sm:flex-row sm:px-10 lg:px-16">
                    <p>
                        © {new Date().getFullYear()} {name} · Dallas, TX
                    </p>
                    <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-1">
                        <Link href="/start" className="py-2 hover:text-white">
                            Start a project
                        </Link>
                        <Link href="/privacy" className="py-2 hover:text-white">
                            Privacy
                        </Link>
                        <Link href="/terms" className="py-2 hover:text-white">
                            Terms
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
