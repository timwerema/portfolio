import ContactForm from '@/components/contact-form';
import { PillLink, PlayDiagram, SectionHeading, SiteLayout } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Github, Linkedin, Mail, MapPin } from 'lucide-react';

/** Faint half-court lines behind the hero. */
function CourtLines() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 600 600"
            preserveAspectRatio="xMaxYMid slice"
            className="text-strong pointer-events-none absolute top-0 -right-32 hidden h-full w-[720px] opacity-40 md:block"
        >
            <g fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="200" y="160" width="400" height="280" />
                <circle cx="200" cy="300" r="90" />
                <path d="M 600 40 L 520 40 A 260 260 0 0 0 520 560 L 600 560" />
                <circle cx="540" cy="300" r="14" />
            </g>
        </svg>
    );
}

export default function PortfolioPage({ portfolio }: { portfolio: Portfolio }) {
    const {
        name,
        availability,
        role,
        location,
        tagline,
        about,
        resume_url,
        links,
        education,
        services,
        packages,
        care_plan,
        stats,
        demos,
        skills,
        projects,
        experience,
    } = portfolio;
    const school = education[0];
    const classYear = school?.period.match(/\d{4}/)?.[0]?.slice(2);

    return (
        <>
            <Head title={`${name} · ${role}`}>
                <meta name="description" content={tagline} />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url} home>
                <main id="top">
                    {/* Hero */}
                    <section className="border-rule relative overflow-hidden border-b-[3px]">
                        <CourtLines />
                        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end gap-12 px-5 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">
                            <div className="min-w-0 flex-[999_1_540px]">
                                <p className="font-cond text-royal mb-4 flex items-center gap-2 text-lg font-bold tracking-[0.14em] uppercase">
                                    <span className="relative flex size-2.5">
                                        <span className="bg-royal absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                                        <span className="bg-royal relative inline-flex size-2.5 rounded-full" />
                                    </span>
                                    {availability}
                                </p>
                                <h1 className="font-display text-[56px] leading-[0.92] uppercase sm:text-8xl lg:text-[132px]">
                                    Built to
                                    <br />
                                    win your next
                                    <br />
                                    <span className="text-royal">customer.</span>
                                </h1>
                                <p className="text-ink-soft mt-7 max-w-xl text-xl">{tagline}</p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <PillLink href="/start" internal>
                                        Start a project
                                    </PillLink>
                                    <PillLink href="#work" variant="outline">
                                        Watch highlights
                                    </PillLink>
                                </div>
                            </div>

                            {/* Player card */}
                            <div className="bg-navy text-on-navy w-full max-w-[360px] flex-[1_1_300px] rounded-md p-7 shadow-[10px_10px_0_var(--color-royal)]">
                                <div className="flex items-start justify-between">
                                    <span className="font-cond text-silver text-[15px] font-bold tracking-[0.12em] uppercase">Player card</span>
                                    {classYear && <span className="font-display text-led text-6xl leading-[0.8]">{classYear}</span>}
                                </div>
                                <p className="font-display mt-2 mb-5 text-[34px] leading-none uppercase">{name}</p>
                                <dl className="text-base">
                                    {[
                                        ['Position', role],
                                        ['College', classYear ? `UT Dallas · Class of '${classYear}` : (school?.school ?? '—')],
                                        ['Last team', experience[0]?.company ?? '—'],
                                        ['Home court', location],
                                    ].map(([label, value]) => (
                                        <div key={label} className="border-navy-line flex justify-between gap-3 border-t py-2.5">
                                            <dt className="text-silver">{label}</dt>
                                            <dd className="text-right font-semibold">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    </section>

                    {/* Scoreboard */}
                    <section aria-label="Career stats" className="bg-navy-deep text-on-navy">
                        <dl className="mx-auto flex max-w-[1240px] flex-wrap gap-y-8 px-5 py-10 sm:px-10 lg:px-16">
                            {stats.map((s) => (
                                <div key={s.label} className="border-navy-line flex-[1_1_220px] border-l-2 px-6">
                                    <dt className="font-cond text-silver text-[15px] font-semibold tracking-[0.14em] uppercase">{s.label}</dt>
                                    <dd className="font-led text-led mt-1.5 text-6xl leading-none">{s.value}</dd>
                                    <dd className="text-silver mt-1.5 text-sm">{s.note}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Work */}
                    <section id="work" className="scroll-mt-20">
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <SectionHeading eyebrow="Selected work" title="Season highlights" />
                            <div className="border-rule border-y-[3px]">
                                {projects.map((p, i) => (
                                    <article
                                        key={p.title}
                                        className="border-maple-line flex flex-wrap items-center gap-x-10 gap-y-2 border-t py-8 first:border-t-0"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="font-display flex-[0_0_140px] text-[112px] leading-[0.85] text-transparent [-webkit-text-stroke:2px_var(--color-strong)]"
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="min-w-0 flex-[999_1_420px]">
                                            <p className="font-cond text-royal text-[15px] font-bold tracking-[0.12em] uppercase">
                                                {[p.subtitle, p.period].filter(Boolean).join(' · ')}
                                            </p>
                                            <h3 className="font-display mt-1 mb-2 text-[38px] leading-[1.05] uppercase">{p.title}</h3>
                                            <p className="text-ink-soft">{p.description}</p>
                                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                                                <p className="font-cond text-ink-muted text-base font-semibold tracking-[0.06em] uppercase">
                                                    {p.tags.join(' · ')}
                                                </p>
                                                {p.url && (
                                                    <a
                                                        href={p.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-royal inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline"
                                                    >
                                                        Live site <ArrowUpRight className="size-4" />
                                                    </a>
                                                )}
                                                {p.repo && (
                                                    <a
                                                        href={p.repo}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-royal inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline"
                                                    >
                                                        <Github className="size-4" /> Code
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {demos.length > 0 && (
                                <div className="mt-16">
                                    <h3 className="font-cond text-royal text-lg font-bold tracking-[0.12em] uppercase">Demo sites</h3>
                                    <p className="text-ink-soft mt-1 mb-6 max-w-xl">
                                        Websites I built for fictional businesses, to show what your site could look like.
                                    </p>
                                    <div className="flex flex-col gap-4">
                                        {demos.map((d) => (
                                            <Link
                                                key={d.url}
                                                href={d.url}
                                                className="group border-rule bg-maple-light hover:bg-navy hover:text-on-navy flex flex-wrap items-center gap-x-8 gap-y-2 rounded-md border-2 px-6 py-5 transition-colors"
                                            >
                                                <div className="min-w-0 flex-[999_1_360px]">
                                                    <p className="font-cond text-royal group-hover:text-led text-[15px] font-bold tracking-[0.12em] uppercase">
                                                        {d.type} · {d.package} package
                                                    </p>
                                                    <h4 className="font-display text-3xl uppercase">{d.title}</h4>
                                                    <p className="text-ink-soft group-hover:text-silver">{d.description}</p>
                                                </div>
                                                <span className="font-cond inline-flex items-center gap-1 text-lg font-bold tracking-[0.06em] uppercase">
                                                    View demo <ArrowUpRight className="size-5" />
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Services */}
                    <section id="services" className="bg-navy text-on-navy scroll-mt-20">
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <SectionHeading eyebrow="What I build" title="The playbook" tone="dark" className="mb-4" />
                            <p className="text-silver mb-12 max-w-xl text-lg">
                                Four plays I run for businesses. Every one starts with your goal and ends with something you can measure.
                            </p>
                            <div className="border-navy-line border-y">
                                {services.map((s) => (
                                    <Link
                                        key={s.slug}
                                        href={route('services.show', s.slug)}
                                        className="group border-navy-line hover:bg-navy-deep/60 -mx-4 flex flex-wrap items-center gap-x-10 gap-y-4 rounded-sm border-t px-4 py-7 transition-colors first:border-t-0"
                                    >
                                        <PlayDiagram icon={s.icon} className="text-on-navy h-20 w-[120px] flex-none" />
                                        <h3 className="font-display flex-[1_1_200px] text-4xl uppercase">{s.title}</h3>
                                        <p className="text-silver flex-[999_1_380px]">{s.description}</p>
                                        <span className="font-cond text-led inline-flex items-center gap-1 text-lg font-bold tracking-[0.06em] uppercase">
                                            Run this play
                                            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* How I work */}
                    <section id="process" className="bg-maple-light border-rule scroll-mt-20 border-b-[3px]">
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <SectionHeading eyebrow="How I work" title="Game plan" className="mb-4" />
                            <p className="text-ink-soft mb-12 max-w-xl text-lg">
                                Simple, honest and fast. You see your new homepage before you pay a thing.
                            </p>
                            <ol className="border-rule border-y-[3px]">
                                {[
                                    [
                                        'Quick call',
                                        '15 minutes to talk through your business, your customers and what you need the site to do.',
                                        'Free',
                                    ],
                                    [
                                        'Free demo homepage',
                                        'Within a week you get a private link to a real demo of your homepage. Approve it or tell me what to change, right on the page.',
                                        'Free',
                                    ],
                                    [
                                        'Build & launch',
                                        'Once you approve, I send a clear quote, take a deposit and build the full site, with check-ins along the way.',
                                        '1–4 weeks',
                                    ],
                                    [
                                        'Care & grow',
                                        'Hosting, updates, backups and small changes on a simple monthly plan, so you never have to think about it.',
                                        'Optional',
                                    ],
                                ].map(([title, text, note], i) => (
                                    <li
                                        key={title}
                                        className="border-maple-line flex flex-wrap items-baseline gap-x-10 gap-y-2 border-t py-7 first:border-t-0"
                                    >
                                        <span aria-hidden="true" className="font-display text-royal w-16 text-5xl leading-none">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="font-display flex-[1_1_220px] text-3xl uppercase">{title}</h3>
                                        <p className="text-ink-soft flex-[999_1_380px]">{text}</p>
                                        <span className="font-cond text-royal text-lg font-bold tracking-[0.08em] uppercase">{note}</span>
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-10">
                                <PillLink href="/start" internal>
                                    Start a project
                                </PillLink>
                            </div>
                        </div>
                    </section>

                    {/* Packages */}
                    <section id="packages" className="scroll-mt-20">
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <SectionHeading eyebrow="Packages" title="Sign the deal" className="mb-4" />
                            <p className="text-ink-soft mb-12 max-w-xl text-lg">
                                Every website starts with a free demo homepage. You approve it before we go any further.
                            </p>
                            <div className="flex flex-col gap-5">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.name}
                                        className={`border-rule flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-md border-2 px-6 py-7 sm:px-8 ${
                                            pkg.featured ? 'bg-navy text-on-navy shadow-[8px_8px_0_var(--color-royal)]' : 'bg-maple-light'
                                        }`}
                                    >
                                        <h3 className="font-display flex-[1_1_200px] text-4xl uppercase">
                                            {pkg.name}
                                            {pkg.featured && (
                                                <span className="bg-royal font-cond ml-3 inline-block rounded-full px-3 py-0.5 align-middle text-sm font-bold tracking-[0.08em] text-white">
                                                    MVP pick
                                                </span>
                                            )}
                                        </h3>
                                        <p className={`flex-[999_1_380px] ${pkg.featured ? 'text-silver' : 'text-ink-soft'}`}>{pkg.summary}</p>
                                        <p className={`font-display text-5xl leading-none ${pkg.featured ? 'text-led' : ''}`}>{pkg.price}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-ink-soft mt-6">
                                <strong className="font-cond text-royal text-lg tracking-[0.08em] uppercase">Training staff</strong> —{' '}
                                {care_plan.summary} <span className="font-semibold">{care_plan.price}</span>
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <PillLink href="/start" internal>
                                    Get a free demo homepage
                                </PillLink>
                            </div>
                        </div>
                    </section>

                    {/* About */}
                    <section id="about" className="bg-maple-light border-rule scroll-mt-20 border-y-[3px]">
                        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <SectionHeading eyebrow="About me" title="Scouting report" />
                            <div className="flex flex-wrap gap-x-20 gap-y-12">
                                <div className="text-ink-soft min-w-0 flex-[999_1_480px] space-y-5 text-lg">
                                    {about.map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                    <p className="text-ink-muted flex items-center gap-2 text-base">
                                        <MapPin className="size-4" /> {location}
                                    </p>
                                </div>
                                <div className="flex-[1_1_320px] space-y-8">
                                    <div>
                                        <h3 className="font-cond text-royal mb-3 text-lg font-bold tracking-[0.12em] uppercase">Career</h3>
                                        <ol className="border-rule space-y-5 border-l-2 pl-5">
                                            {experience.map((job) => (
                                                <li key={`${job.company}-${job.period}`}>
                                                    <p className="font-semibold">
                                                        {job.role} · {job.company}
                                                    </p>
                                                    <p className="font-led text-ink-muted text-sm">{job.period}</p>
                                                    <p className="text-ink-soft mt-1 text-base">{job.summary}</p>
                                                </li>
                                            ))}
                                            {school && (
                                                <li>
                                                    <p className="font-semibold">{school.degree}</p>
                                                    <p className="text-ink-soft text-base">{school.school}</p>
                                                    <p className="font-led text-ink-muted text-sm">{school.period}</p>
                                                </li>
                                            )}
                                        </ol>
                                    </div>
                                    <div>
                                        <h3 className="font-cond text-royal mb-3 text-lg font-bold tracking-[0.12em] uppercase">Strengths</h3>
                                        <dl className="space-y-3 text-base">
                                            {Object.entries(skills).map(([group, items]) => (
                                                <div key={group}>
                                                    <dt className="font-semibold">{group}</dt>
                                                    <dd className="text-ink-soft">{items.join(' · ')}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section id="contact" className="scroll-mt-20">
                        <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-20 gap-y-12 px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
                            <div className="min-w-0 flex-[1_1_340px]">
                                <h2 className="font-display text-6xl leading-[0.95] uppercase sm:text-7xl lg:text-[88px]">
                                    Get in
                                    <br />
                                    the <span className="text-royal">game.</span>
                                </h2>
                                <p className="text-ink-soft mt-5 text-lg">
                                    Tell me about your business. For websites, you'll get a free demo homepage to approve before we tip off.
                                </p>
                                <div className="mt-8 flex flex-col items-start gap-1 font-semibold">
                                    {links.email && (
                                        <a href={`mailto:${links.email}`} className="hover:text-royal flex min-h-11 items-center gap-3">
                                            <Mail className="size-5" /> {links.email}
                                        </a>
                                    )}
                                    {links.linkedin && (
                                        <a
                                            href={links.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:text-royal flex min-h-11 items-center gap-3"
                                        >
                                            <Linkedin className="size-5" /> LinkedIn
                                        </a>
                                    )}
                                    {links.github && (
                                        <a
                                            href={links.github}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:text-royal flex min-h-11 items-center gap-3"
                                        >
                                            <Github className="size-5" /> GitHub
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="bg-maple-light relative min-w-0 flex-[999_1_480px] rounded-xl">
                                <ContactForm services={services.map((s) => s.title)} />
                            </div>
                        </div>
                    </section>
                </main>
            </SiteLayout>
        </>
    );
}
