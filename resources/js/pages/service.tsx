import ContactForm from '@/components/contact-form';
import { iconFor, SectionHeading, SiteLayout } from '@/components/site-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Portfolio, type Service } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Github } from 'lucide-react';

export default function ServicePage({ portfolio, service }: { portfolio: Portfolio; service: Service }) {
    const { name, resume_url, services, projects } = portfolio;
    const { icon: Icon, color, bg } = iconFor(service);
    const index = services.findIndex((s) => s.slug === service.slug);
    const otherServices = services.filter((s) => s.slug !== service.slug);
    const related = projects.filter((p) => p.tags.some((t) => service.related_tags.includes(t)));

    // Number the sections so they read in order, skipping any that are empty.
    let n = 0;
    const next = () => String(++n).padStart(2, '0');

    return (
        <>
            <Head title={`${service.title} · ${name}`}>
                <meta name="description" content={service.description} />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url}>
                <main className="mx-auto max-w-5xl px-4 sm:px-6">
                    {/* Hero */}
                    <section className="py-16 sm:py-24">
                        <Link href="/#services" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
                            <ArrowLeft className="size-4" /> All services
                        </Link>
                        <div className="mt-10 flex items-center gap-3">
                            <span className={`flex size-10 items-center justify-center rounded-lg ${bg}`}>
                                <Icon className={`size-5 ${color}`} strokeWidth={1.75} />
                            </span>
                            <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                                {String(index + 1).padStart(2, '0')} · {service.title}
                            </span>
                        </div>
                        <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">{service.headline}</h1>
                        <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed">{service.intro}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <a href="#start">
                                    Start a project <ArrowRight className="size-4" />
                                </a>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <a href="#process">How it works</a>
                            </Button>
                        </div>
                        {service.for.length > 0 && (
                            <div className="mt-12">
                                <p className="text-muted-foreground mb-3 text-sm">Great for</p>
                                <div className="flex flex-wrap gap-2">
                                    {service.for.map((f) => (
                                        <Badge key={f} variant="secondary" className="px-3 py-1 text-sm font-normal">
                                            {f}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <Separator />

                    {/* What's included */}
                    <section className="py-20">
                        <SectionHeading eyebrow={`${next()} · What's included`} title="What you get" />
                        <div className="grid gap-px overflow-hidden rounded-xl border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
                            {service.deliverables.map((d) => (
                                <div key={d.title} className="bg-background p-6">
                                    <Check className={`size-5 ${color}`} strokeWidth={2} />
                                    <h3 className="mt-4 font-medium">{d.title}</h3>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{d.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Process */}
                    <section id="process" className="scroll-mt-20 py-20">
                        <SectionHeading eyebrow={`${next()} · Process`} title="How it works" />
                        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {service.process.map((step, i) => (
                                <li key={step.title} className="relative">
                                    <div className="flex items-center gap-3">
                                        <span className="border-foreground/20 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs">
                                            {i + 1}
                                        </span>
                                        {i < service.process.length - 1 && <span className="bg-border hidden h-px flex-1 lg:block" />}
                                    </div>
                                    <h3 className="mt-4 font-medium">{step.title}</h3>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.description}</p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Related work */}
                    {related.length > 0 && (
                        <>
                            <Separator />
                            <section className="py-20">
                                <SectionHeading eyebrow={`${next()} · Related work`} title="Things I've built" />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {related.map((p) => (
                                        <div key={p.title} className="flex flex-col rounded-xl border p-6">
                                            <h3 className="font-medium">{p.title}</h3>
                                            {p.subtitle && (
                                                <p className="text-muted-foreground mt-1 font-mono text-xs">
                                                    {p.subtitle}
                                                    {p.period && ` · ${p.period}`}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{p.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {p.tags.map((t) => (
                                                    <Badge key={t} variant="outline" className="font-normal">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {(p.url || p.repo) && (
                                                <div className="mt-auto flex gap-2 pt-4">
                                                    {p.url && (
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a href={p.url} target="_blank" rel="noreferrer">
                                                                Live <ArrowUpRight className="size-3.5" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {p.repo && (
                                                        <Button size="sm" variant="ghost" asChild>
                                                            <a href={p.repo} target="_blank" rel="noreferrer">
                                                                <Github className="size-3.5" /> Code
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {/* FAQ */}
                    {service.faq.length > 0 && (
                        <>
                            <Separator />
                            <section className="py-20">
                                <SectionHeading eyebrow={`${next()} · FAQ`} title="Common questions" />
                                <div className="divide-y rounded-xl border">
                                    {service.faq.map((item) => (
                                        <details key={item.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
                                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                                                {item.q}
                                                <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                                            </summary>
                                            <p className="text-muted-foreground -mt-1 pb-5 text-sm leading-relaxed">{item.a}</p>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    <Separator />

                    {/* Contact */}
                    <section id="start" className="scroll-mt-20 py-20">
                        <div className="grid gap-12 lg:grid-cols-5">
                            <div className="lg:col-span-2">
                                <p className="text-muted-foreground mb-2 font-mono text-xs tracking-widest uppercase">{next()} · Get started</p>
                                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Let's talk about your project.</h2>
                                <p className="text-muted-foreground mt-4 max-w-md">
                                    Tell me a little about what you need. I'll reply with a few questions and a rough plan - no obligation.
                                </p>
                            </div>
                            <div className="relative lg:col-span-3">
                                <ContactForm services={services.map((s) => s.title)} defaultService={service.title} />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Other services */}
                    <section className="py-20">
                        <SectionHeading eyebrow="More" title="Other services" />
                        <div className="grid gap-4 sm:grid-cols-3">
                            {otherServices.map((s) => {
                                const other = iconFor(s);
                                return (
                                    <Link
                                        key={s.slug}
                                        href={route('services.show', s.slug)}
                                        className="group hover:bg-muted/40 flex flex-col rounded-xl border p-6 transition-colors"
                                    >
                                        <other.icon className={`size-5 ${other.color}`} strokeWidth={1.75} />
                                        <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.description}</p>
                                        <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium">
                                            Learn more
                                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </SiteLayout>
        </>
    );
}
