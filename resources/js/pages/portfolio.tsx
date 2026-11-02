import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppearance } from '@/hooks/use-appearance';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, Bot, ChartLine, CodeXml, FileText, LayoutTemplate, type LucideIcon, Github, Linkedin, Mail, MapPin, Menu, Moon, Sun, X } from 'lucide-react';
import { type Portfolio, type Service } from '@/types/portfolio';
import { useState } from 'react';

const serviceIcons: Record<Service['icon'], { icon: LucideIcon; color: string }> = {
    websites: { icon: LayoutTemplate, color: 'text-orange-500' },
    software: { icon: CodeXml, color: 'text-sky-500' },
    growth: { icon: ChartLine, color: 'text-violet-500' },
    agents: { icon: Bot, color: 'text-emerald-500' },
};

const sections = [
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' },
];

function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const isDark =
        appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => updateAppearance(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
    );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div className="mb-10">
            <p className="text-muted-foreground mb-2 font-mono text-xs tracking-widest uppercase">{eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        </div>
    );
}

export default function PortfolioPage({ portfolio }: { portfolio: Portfolio }) {
    const { name, first_name, availability, role, location, tagline, about, resume_url, links, services, skills, projects, experience } = portfolio;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Head title={`${name} · ${role}`}>
                <meta name="description" content={tagline} />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="bg-background text-foreground min-h-screen">
                {/* Nav */}
                <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
                    <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                        <a href="#top" className="font-semibold tracking-tight">
                            {name}
                            <span className="text-muted-foreground">.</span>
                        </a>
                        <div className="hidden items-center gap-1 sm:flex">
                            {sections.map((s) => (
                                <Button key={s.id} variant="ghost" size="sm" asChild>
                                    <a href={`#${s.id}`}>{s.label}</a>
                                </Button>
                            ))}
                            {resume_url && (
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={resume_url}>Resume</a>
                                </Button>
                            )}
                            <ThemeToggle />
                        </div>
                        <div className="flex items-center gap-1 sm:hidden">
                            <ThemeToggle />
                            <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
                                {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                            </Button>
                        </div>
                    </nav>
                    {menuOpen && (
                        <div className="border-t px-4 py-2 sm:hidden">
                            {sections.map((s) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="hover:bg-accent block rounded-md px-3 py-2 text-sm"
                                >
                                    {s.label}
                                </a>
                            ))}
                            {resume_url && (
                                <a href={resume_url} className="hover:bg-accent block rounded-md px-3 py-2 text-sm">
                                    Resume
                                </a>
                            )}
                        </div>
                    )}
                </header>

                <main id="top" className="mx-auto max-w-5xl px-4 sm:px-6">
                    {/* Hero */}
                    <section className="py-20 sm:py-32">
                        <p className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            {availability}
                        </p>
                        <h1 className="max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
                            Hi, I'm {first_name}.
                            <br />
                            <span className="text-muted-foreground">{role}.</span>
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">{tagline}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <a href="#projects">View my work</a>
                            </Button>
                            {resume_url ? (
                                <Button size="lg" variant="outline" asChild>
                                    <a href={resume_url}>
                                        <FileText className="size-4" /> Resume
                                    </a>
                                </Button>
                            ) : (
                                <Button size="lg" variant="outline" asChild>
                                    <a href="#contact">Get in touch</a>
                                </Button>
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Services */}
                    <section id="services" className="scroll-mt-20 py-20">
                        <SectionHeading eyebrow="01 · Services" title="What I can build for you" />
                        <div className="grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
                            {services.map((service, i) => {
                                const { icon: Icon, color } = serviceIcons[service.icon] ?? serviceIcons.software;
                                return (
                                    <div
                                        key={service.title}
                                        className="hover:bg-muted/40 flex flex-col border-b p-6 transition-colors last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground font-mono text-xs tracking-widest">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <Icon className={`size-5 ${color}`} strokeWidth={1.75} />
                                        </div>
                                        <h3 className="mt-10 text-2xl font-semibold tracking-tight">{service.title}</h3>
                                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{service.description}</p>
                                        <ul className="mt-6 space-y-2 text-sm">
                                            {service.points.map((point) => (
                                                <li key={point} className="flex items-start gap-2">
                                                    <span className="bg-muted-foreground/50 mt-2 size-1 shrink-0 rounded-full" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                        <a
                                            href="#contact"
                                            className="group mt-auto inline-flex items-center gap-1 pt-8 text-sm font-medium"
                                        >
                                            Start a project
                                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <Separator />

                    {/* About + skills */}
                    <section id="about" className="scroll-mt-20 py-20">
                        <SectionHeading eyebrow="02 · About" title="A bit about me" />
                        <div className="grid gap-12 md:grid-cols-5">
                            <div className="text-muted-foreground space-y-4 leading-relaxed md:col-span-3">
                                {about.map((p, i) => (
                                    <p key={i}>{p}</p>
                                ))}
                                <p className="flex items-center gap-2 text-sm">
                                    <MapPin className="size-4" /> {location}
                                </p>
                            </div>
                            <div className="space-y-6 md:col-span-2">
                                {Object.entries(skills).map(([group, items]) => (
                                    <div key={group}>
                                        <h3 className="mb-3 text-sm font-medium">{group}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {items.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="font-normal">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Projects */}
                    <section id="projects" className="scroll-mt-20 py-20">
                        <SectionHeading eyebrow="03 · Projects" title="Selected work" />
                        <div className="grid gap-6 sm:grid-cols-2">
                            {projects.map((project) => (
                                <Card key={project.title} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    {project.image && (
                                        <img src={project.image} alt={project.title} className="aspect-video w-full border-b object-cover" />
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-lg">{project.title}</CardTitle>
                                        {project.subtitle && (
                                            <p className="text-muted-foreground font-mono text-xs">
                                                {project.subtitle}
                                                {project.period && ` · ${project.period}`}
                                            </p>
                                        )}
                                        <CardDescription className="leading-relaxed">{project.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {project.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </CardContent>
                                    {(project.url || project.repo) && (
                                        <CardFooter className="mt-auto gap-2">
                                            {project.url && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={project.url} target="_blank" rel="noreferrer">
                                                        Live <ArrowUpRight className="size-3.5" />
                                                    </a>
                                                </Button>
                                            )}
                                            {project.repo && (
                                                <Button size="sm" variant="ghost" asChild>
                                                    <a href={project.repo} target="_blank" rel="noreferrer">
                                                        <Github className="size-3.5" /> Code
                                                    </a>
                                                </Button>
                                            )}
                                        </CardFooter>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Experience */}
                    <section id="experience" className="scroll-mt-20 py-20">
                        <SectionHeading eyebrow="04 · Experience" title="Where I've worked" />
                        <ol className="relative space-y-10 border-l pl-6">
                            {experience.map((job) => (
                                <li key={`${job.company}-${job.period}`} className="relative">
                                    <span className="bg-foreground absolute top-1.5 -left-[29px] size-2.5 rounded-full ring-4 ring-[var(--background)]" />
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                                        <h3 className="font-medium">
                                            {job.role} <span className="text-muted-foreground">· {job.company}</span>
                                        </h3>
                                        <span className="text-muted-foreground font-mono text-xs">{job.period}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{job.summary}</p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <Separator />

                    {/* Contact */}
                    <section id="contact" className="scroll-mt-20 py-20 text-center">
                        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-widest uppercase">05 · Contact</p>
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Let's work together.</h2>
                        <p className="text-muted-foreground mx-auto mt-4 max-w-lg">
                            Have a project in mind or just want to say hi? My inbox is always open.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {links.email && (
                                <Button size="lg" asChild>
                                    <a href={`mailto:${links.email}`}>
                                        <Mail className="size-4" /> Say hello
                                    </a>
                                </Button>
                            )}
                            {links.github && (
                                <Button size="lg" variant="outline" asChild>
                                    <a href={links.github} target="_blank" rel="noreferrer">
                                        <Github className="size-4" /> GitHub
                                    </a>
                                </Button>
                            )}
                            {links.linkedin && (
                                <Button size="lg" variant="outline" asChild>
                                    <a href={links.linkedin} target="_blank" rel="noreferrer">
                                        <Linkedin className="size-4" /> LinkedIn
                                    </a>
                                </Button>
                            )}
                        </div>
                    </section>
                </main>

                <footer className="border-t">
                    <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row sm:px-6">
                        <p>
                            © {new Date().getFullYear()} {name}
                        </p>
                        <p>Built with Laravel, Inertia & React</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
