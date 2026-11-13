import ContactForm from '@/components/contact-form';
import { PillLink, PlayDiagram, SectionHeading, SiteLayout } from '@/components/site-layout';
import { type Portfolio, type Service } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Github } from 'lucide-react';

export default function ServicePage({ portfolio, service }: { portfolio: Portfolio; service: Service }) {
    const { name, resume_url, services, projects } = portfolio;
    const index = services.findIndex((s) => s.slug === service.slug);
    const otherServices = services.filter((s) => s.slug !== service.slug);
    const related = projects.filter((p) => p.tags.some((t) => service.related_tags.includes(t)));

    const wrap = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10';

    return (
        <>
            <Head title={`${service.title} · ${name}`}>
                <meta name="description" content={service.description} />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url}>
                <main>
                    {/* Hero */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} py-14 sm:py-20`}>
                            <Link
                                href="/#services"
                                className="font-cond text-ink-muted hover:text-royal inline-flex min-h-11 items-center gap-1.5 font-medium"
                            >
                                <ArrowLeft className="size-4" /> The playbook
                            </Link>
                            <div className="mt-8 flex flex-wrap items-end gap-x-12 gap-y-8">
                                <div className="min-w-0 flex-[999_1_560px]">
                                    <p className="font-cond text-royal mb-3 font-medium">
                                        Play {String(index + 1).padStart(2, '0')} · {service.title}
                                    </p>
                                    <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{service.headline}</h1>
                                    <p className="text-ink-soft mt-6 max-w-2xl text-xl">{service.intro}</p>
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <PillLink href="#start">Start a project</PillLink>
                                        <PillLink href="#process" variant="outline">
                                            How it works
                                        </PillLink>
                                    </div>
                                </div>
                                <div className="border-maple-line text-ink flex-[1_1_260px] rounded-sm border p-6">
                                    <PlayDiagram icon={service.icon} className="text-ink h-28 w-full" />
                                    {service.for.length > 0 && (
                                        <>
                                            <p className="font-cond text-ink-soft mt-5 mb-2 text-[11px] font-medium">Great for</p>
                                            <ul className="space-y-1.5">
                                                {service.for.map((f) => (
                                                    <li key={f} className="flex items-start gap-2">
                                                        <span className="bg-led mt-2.5 size-1.5 shrink-0 rounded-full" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* What's included */}
                    <section className={`${wrap} py-20 lg:py-24`}>
                        <SectionHeading eyebrow="What's included" title="What you get" />
                        <ul className="border-maple-line border-y">
                            {service.deliverables.map((d) => (
                                <li
                                    key={d.title}
                                    className="border-maple-line flex flex-wrap items-baseline gap-x-8 gap-y-1 border-t py-6 first:border-t-0"
                                >
                                    <h3 className="font-display flex flex-[1_1_260px] items-center gap-3 text-xl sm:text-2xl">
                                        <Check className="text-royal size-6 shrink-0" strokeWidth={3} /> {d.title}
                                    </h3>
                                    <p className="text-ink-soft flex-[999_1_380px]">{d.description}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Process */}
                    <section id="process" className="bg-maple-light text-ink scroll-mt-20">
                        <div className={`${wrap} py-20 lg:py-24`}>
                            <SectionHeading eyebrow="Process" title="How it works" />
                            <ol className="flex flex-wrap gap-x-10 gap-y-10">
                                {service.process.map((step, i) => (
                                    <li key={step.title} className="min-w-0 flex-[1_1_220px]">
                                        <span className="font-cond text-royal">{String(i + 1).padStart(2, '0')}</span>
                                        <h3 className="font-display mt-3 text-xl sm:text-2xl">{step.title}</h3>
                                        <p className="text-ink-soft mt-2">{step.description}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* Related work */}
                    {related.length > 0 && (
                        <section className={`${wrap} py-20 lg:py-24`}>
                            <SectionHeading eyebrow="Related work" title="Game tape" />
                            <div className="border-maple-line border-y">
                                {related.map((p) => (
                                    <article
                                        key={p.title}
                                        className="border-maple-line flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t py-7 first:border-t-0"
                                    >
                                        <div className="min-w-0 flex-[999_1_420px]">
                                            <p className="font-cond text-royal text-[11px] font-medium">
                                                {[p.subtitle, p.period].filter(Boolean).join(' · ')}
                                            </p>
                                            <h3 className="font-display mt-1 text-2xl sm:text-3xl">{p.title}</h3>
                                            <p className="text-ink-soft mt-2">{p.description}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {p.url && (
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-royal inline-flex min-h-11 items-center gap-1 font-medium hover:underline"
                                                >
                                                    Live site <ArrowUpRight className="size-4" />
                                                </a>
                                            )}
                                            {p.repo && (
                                                <a
                                                    href={p.repo}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-royal inline-flex min-h-11 items-center gap-1 font-medium hover:underline"
                                                >
                                                    <Github className="size-4" /> Code
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* FAQ */}
                    {service.faq.length > 0 && (
                        <section className={`${wrap} pb-20 lg:pb-24 ${related.length > 0 ? '' : 'pt-20 lg:pt-24'}`}>
                            <SectionHeading eyebrow="FAQ" title="Common questions" />
                            <div className="border-maple-line bg-maple-light divide-maple-line divide-y rounded-sm border">
                                {service.faq.map((item) => (
                                    <details key={item.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
                                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                                            {item.q}
                                            <ChevronDown className="text-royal size-5 shrink-0 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <p className="text-ink-soft -mt-1 pb-5">{item.a}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Contact */}
                    <section id="start" className="bg-maple-light border-maple-line scroll-mt-20 border-y">
                        <div className={`${wrap} flex flex-wrap gap-x-20 gap-y-12 py-20 lg:py-24`}>
                            <div className="min-w-0 flex-[1_1_340px]">
                                <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">
                                    Run this
                                    <br />
                                    <span className="text-royal">play.</span>
                                </h2>
                                <p className="text-ink-soft mt-5">
                                    Tell me a little about what you need. I'll reply with a few questions and a rough plan — no obligation.
                                </p>
                            </div>
                            <div className="relative min-w-0 flex-[999_1_480px]">
                                <ContactForm services={services.map((s) => s.title)} defaultService={service.title} />
                            </div>
                        </div>
                    </section>

                    {/* Other plays */}
                    <section className={`${wrap} py-20 lg:py-24`}>
                        <SectionHeading eyebrow="More from the playbook" title="Other plays" />
                        <div className="border-maple-line border-y">
                            {otherServices.map((s) => (
                                <Link
                                    key={s.slug}
                                    href={route('services.show', s.slug)}
                                    className="group border-maple-line hover:bg-maple-light -mx-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t px-4 py-6 transition-colors first:border-t-0"
                                >
                                    <PlayDiagram icon={s.icon} className="text-strong h-14 w-[84px] flex-none [--play-run:var(--color-royal)]" />
                                    <h3 className="font-display flex-[1_1_180px] text-xl sm:text-2xl">{s.title}</h3>
                                    <p className="text-ink-soft flex-[999_1_360px]">{s.description}</p>
                                    <ArrowUpRight className="text-royal size-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>
            </SiteLayout>
        </>
    );
}
