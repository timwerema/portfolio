import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { type Service } from '@/types/portfolio';
import { Link } from '@inertiajs/react';
import { Bot, ChartLine, CodeXml, LayoutTemplate, type LucideIcon, Menu, Moon, Sun, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export const serviceIcons: Record<Service['icon'], { icon: LucideIcon; color: string; bg: string }> = {
    websites: { icon: LayoutTemplate, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    software: { icon: CodeXml, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    growth: { icon: ChartLine, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    agents: { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export const iconFor = (service: Service) => serviceIcons[service.icon] ?? serviceIcons.software;

const sections = [
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' },
];

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const isDark =
        appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => updateAppearance(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
    );
}

export function SectionHeading({ eyebrow, title, className = 'mb-10' }: { eyebrow: string; title: string; className?: string }) {
    return (
        <div className={className}>
            <p className="text-muted-foreground mb-2 font-mono text-xs tracking-widest uppercase">{eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        </div>
    );
}

/**
 * Header + footer shared by the public pages.
 * On the home page (`home`), menu links scroll to sections; elsewhere they go back to the home page sections.
 */
export function SiteLayout({ name, resumeUrl, home = false, children }: { name: string; resumeUrl: string | null; home?: boolean; children: ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const href = (id: string) => (home ? `#${id}` : `/#${id}`);

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
                <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    {home ? (
                        <a href="#top" className="font-semibold tracking-tight">
                            {name}
                            <span className="text-muted-foreground">.</span>
                        </a>
                    ) : (
                        <Link href="/" className="font-semibold tracking-tight">
                            {name}
                            <span className="text-muted-foreground">.</span>
                        </Link>
                    )}
                    <div className="hidden items-center gap-1 sm:flex">
                        {sections.map((s) => (
                            <Button key={s.id} variant="ghost" size="sm" asChild>
                                <a href={href(s.id)}>{s.label}</a>
                            </Button>
                        ))}
                        {resumeUrl && (
                            <Button variant="ghost" size="sm" asChild>
                                <a href={resumeUrl}>Resume</a>
                            </Button>
                        )}
                        <ThemeToggle />
                    </div>
                    <div className="flex items-center gap-1 sm:hidden">
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
                            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                        </Button>
                    </div>
                </nav>
                {menuOpen && (
                    <div className="border-t px-4 py-2 sm:hidden">
                        {sections.map((s) => (
                            <a key={s.id} href={href(s.id)} onClick={() => setMenuOpen(false)} className="hover:bg-accent block rounded-md px-3 py-2 text-sm">
                                {s.label}
                            </a>
                        ))}
                        {resumeUrl && (
                            <a href={resumeUrl} className="hover:bg-accent block rounded-md px-3 py-2 text-sm">
                                Resume
                            </a>
                        )}
                    </div>
                )}
            </header>

            {children}

            <footer className="border-t">
                <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row sm:px-6">
                    <p>
                        © {new Date().getFullYear()} {name}
                    </p>
                    <p>Built with Laravel, Inertia & React</p>
                </div>
            </footer>
        </div>
    );
}
