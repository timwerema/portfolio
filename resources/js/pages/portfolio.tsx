import ContactForm from '@/components/contact-form';
import { CountUp, HoverPreview, Typewriter, useReveal, useScrollProgress } from '@/components/motion';
import { Fig, PillLink, PlayDiagram, SectionHeading, SiteLayout } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { type CSSProperties, useRef, useState } from 'react';

/*
 * Home page, "Studio" look. Content comes from config/portfolio.php.
 * Layout rules: hairline rows instead of cards, mono "FIG." labels, two-tone section titles,
 * left-to-right reveals, lots of air. The basketball version lives on at /demos/hardwood.
 */

const stagger = (i: number) => ({ '--d': i }) as CSSProperties;
const num = (i: number) => String(i + 1).padStart(2, '0');

/** Screenshot of a demo for the hover preview (made by `npm run demo:previews`). */
const previewFor = (url: string) => `/images/previews/${url.split('/').filter(Boolean).pop()}.jpg`;

const STEPS = [
    ['Quick call', '15 minutes to talk through your business, your customers and what you need the site to do.', 'Free'],
    [
        'Free demo homepage',
        'Within a week you get a private link to a real demo of your homepage. Approve it or tell me what to change, right on the page.',
        'Free',
    ],
    ['Build & launch', 'Once you approve, I send a clear quote, take a deposit and build the full site, with check-ins along the way.', '1–4 weeks'],
    ['Care & grow', 'Hosting, updates, backups and small changes on a simple monthly plan, so you never have to think about it.', 'Optional'],
] as const;

/** Process steps with a hairline that fills as you scroll; each step brightens as the line reaches it. */
function Process() {
    const list = useRef<HTMLOListElement>(null);
    const [p, setP] = useState(0);
    useScrollProgress(list, setP);
    return (
        <ol ref={list} className="border-maple-line relative border-t pl-6 sm:pl-8">
            <span aria-hidden="true" className="bg-maple-line absolute top-0 bottom-0 left-0 w-px" />
            <span aria-hidden="true" className="bg-royal absolute top-0 left-0 w-px" style={{ height: `${p * 100}%` }} />
            {STEPS.map(([title, text, note], i) => (
                <li
                    key={title}
                    className="border-maple-line grid gap-x-8 gap-y-1 border-b py-7 transition-opacity duration-500 sm:grid-cols-[3rem_1fr_7rem]"
                    style={{ opacity: p >= i / STEPS.length ? 1 : 0.35 }}
                >
                    <span aria-hidden="true" className="font-cond text-royal pt-1">
                        {num(i)}
                    </span>
                    <div>
                        <h3 className="font-display text-xl sm:text-2xl">{title}</h3>
                        <p className="text-ink-soft mt-1 max-w-xl">{text}</p>
                    </div>
                    <span className="font-cond text-ink-muted pt-1 sm:text-right">{note}</span>
                </li>
            ))}
        </ol>
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
    useReveal();
    const school = education[0];
    const typing = [
        'websites that bring in customers',
        'dashboards that save hours a week',
        'AI bots that do the busywork',
        'tools that cut validation time 65%',
        'software shaped around how you work',
    ];
    const wrap = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10';

    return (
        <>
            <Head title={`${name} · ${role}`}>
                <meta name="description" content={tagline} />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url} home>
                <main id="top">
                    {/* Hero */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} grid gap-10 py-20 sm:py-28 lg:grid-cols-[7fr_5fr] lg:py-36`}>
                            <div>
                                <Fig n={1} className="mb-8 flex items-center gap-2">
                                    <span className="relative flex size-1.5">
                                        <span className="bg-royal absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                                        <span className="bg-royal relative inline-flex size-1.5 rounded-full" />
                                    </span>
                                    {availability} · {location}
                                </Fig>
                                <h1 className="font-display max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-[80px]">
                                    Built to win
                                    <br />
                                    <span className="title-dim">your next customer.</span>
                                </h1>
                                <p className="font-display text-ink mt-8 min-h-[1.4em] text-xl sm:text-2xl">
                                    <span className="text-ink-muted">I build </span>
                                    <Typewriter phrases={typing} />
                                </p>
                                <p className="text-ink-soft mt-4 max-w-xl">{tagline}</p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <PillLink href="/start" internal>
                                        Start a project <ArrowUpRight className="size-3.5" />
                                    </PillLink>
                                    <PillLink href="#work" variant="outline">
                                        See the work
                                    </PillLink>
                                </div>
                            </div>

                            {/* Spec sheet */}
                            <dl className="font-cond border-maple-line self-end border-t">
                                {[
                                    ['Role', role],
                                    ['School', school ? `${school.school} · ${school.period}` : '—'],
                                    ['Last team', experience[0]?.company ?? '—'],
                                    ['Based in', location],
                                    ['Open to', (availability ?? 'New projects').replace(/^open to /i, '')],
                                ].map(([k, v]) => (
                                    <div key={k} className="border-maple-line flex justify-between gap-4 border-b py-3">
                                        <dt className="text-ink-muted">{k}</dt>
                                        <dd className="text-ink text-right">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    {/* Readings */}
                    <section aria-label="Readings" className="border-maple-line border-b">
                        <dl className={`${wrap} grid grid-cols-2 gap-x-8 gap-y-8 py-10 md:grid-cols-4`}>
                            {stats.map((s, i) => (
                                <div key={s.label} data-reveal style={stagger(i)}>
                                    <dt className="font-cond text-ink-muted">
                                        <span className="text-royal">{String.fromCharCode(65 + i)} /</span> {s.label}
                                    </dt>
                                    <dd className="font-display mt-2 text-4xl tabular-nums sm:text-5xl">
                                        <CountUp value={s.value} />
                                    </dd>
                                    <dd className="text-ink-muted mt-1 text-sm">{s.note}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Manifesto */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} grid gap-8 py-20 lg:grid-cols-[3fr_9fr] lg:py-28`}>
                            <Fig n={2}>Manifesto</Fig>
                            <p data-reveal="mask" className="font-display text-ink-soft max-w-3xl text-2xl leading-snug sm:text-3xl lg:text-4xl">
                                {about[0]}
                            </p>
                        </div>
                    </section>

                    {/* Work */}
                    <section id="work" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={3} eyebrow="Selected work · still in service" title="Three projects," dim="three kinds of problem." />
                            <div className="border-maple-line border-t">
                                {projects.map((p, i) => (
                                    <article
                                        key={p.title}
                                        data-reveal="left"
                                        className="border-maple-line grid gap-x-8 gap-y-2 border-b py-7 sm:grid-cols-[3rem_1fr_auto]"
                                    >
                                        <span aria-hidden="true" className="font-cond text-ink-muted pt-1.5">
                                            {num(i)}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="font-display text-2xl sm:text-3xl">{p.title}</h3>
                                            <p className="font-cond text-ink-muted mt-1">{[p.subtitle, p.period].filter(Boolean).join(' · ')}</p>
                                            <p className="text-ink-soft mt-3 max-w-2xl">{p.description}</p>
                                            <p className="font-cond text-ink-muted mt-3">{p.tags.join(' · ')}</p>
                                        </div>
                                        <div className="font-cond flex items-start gap-5 pt-1.5">
                                            {p.url && (
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-ink hover:text-royal inline-flex min-h-11 items-center gap-1"
                                                >
                                                    Live <ArrowUpRight className="size-3.5" />
                                                </a>
                                            )}
                                            {p.repo && (
                                                <a
                                                    href={p.repo}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-ink hover:text-royal inline-flex min-h-11 items-center gap-1"
                                                >
                                                    <Github className="size-3.5" /> Code
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {demos.length > 0 && (
                                <div className="mt-20">
                                    <SectionHeading
                                        n={4}
                                        eyebrow="Demo sites · fictional businesses"
                                        title="What your site"
                                        dim="could look like."
                                        className="mb-10"
                                    />
                                    <HoverPreview>
                                        {(bind) => (
                                            <div className="border-maple-line border-t">
                                                {demos.map((d, i) => (
                                                    <Link
                                                        key={d.url}
                                                        href={d.url}
                                                        data-reveal="left"
                                                        style={stagger(i % 3)}
                                                        {...bind(previewFor(d.url))}
                                                        className="group border-maple-line hover:bg-maple-light grid gap-x-8 gap-y-1 border-b py-5 transition-colors sm:grid-cols-[3rem_1fr_auto]"
                                                    >
                                                        <span aria-hidden="true" className="font-cond text-ink-muted pt-1">
                                                            {num(i)}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h4 className="font-display text-xl sm:text-2xl">{d.title}</h4>
                                                            <p className="font-cond text-ink-muted mt-1">
                                                                {d.type} · {d.package} package
                                                            </p>
                                                            <p className="text-ink-soft mt-2 max-w-2xl text-sm">{d.description}</p>
                                                        </div>
                                                        <span className="font-cond text-ink group-hover:text-royal inline-flex items-center gap-1 pt-1">
                                                            Open{' '}
                                                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </HoverPreview>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Services */}
                    <section id="services" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={5} eyebrow="What I build" title="Four services," dim="one way of working." className="mb-4" />
                            <p className="text-ink-soft mb-12 max-w-xl">Every one starts with your goal and ends with something you can measure.</p>
                            <div className="border-maple-line border-t">
                                {services.map((s, i) => (
                                    <Link
                                        key={s.slug}
                                        href={route('services.show', s.slug)}
                                        data-reveal="left"
                                        style={stagger(i)}
                                        className="group border-maple-line hover:bg-maple-light grid items-center gap-x-8 gap-y-3 border-b py-7 transition-colors sm:grid-cols-[3rem_120px_1fr_auto]"
                                    >
                                        <span aria-hidden="true" className="font-cond text-ink-muted">
                                            {num(i)}
                                        </span>
                                        <PlayDiagram icon={s.icon} className="text-ink hidden h-16 w-[120px] sm:block" />
                                        <div className="min-w-0">
                                            <h3 className="font-display text-2xl sm:text-3xl">{s.title}</h3>
                                            <p className="text-ink-soft mt-1 max-w-2xl">{s.description}</p>
                                        </div>
                                        <span className="font-cond text-ink group-hover:text-royal inline-flex items-center gap-1">
                                            Details{' '}
                                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Process */}
                    <section id="process" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} grid gap-x-16 gap-y-10 py-20 lg:grid-cols-[5fr_7fr] lg:py-28`}>
                            <div className="lg:sticky lg:top-24 lg:self-start">
                                <SectionHeading n={6} eyebrow="How I work" title="Simple, honest," dim="and fast." className="mb-4" />
                                <p className="text-ink-soft mb-8 max-w-md">You see your new homepage before you pay a thing.</p>
                                <PillLink href="/start" internal>
                                    Start a project <ArrowUpRight className="size-3.5" />
                                </PillLink>
                            </div>
                            <Process />
                        </div>
                    </section>

                    {/* Packages */}
                    <section id="packages" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={7} eyebrow="Packages" title="Clear prices," dim="no surprises." className="mb-4" />
                            <p className="text-ink-soft mb-12 max-w-xl">
                                Every website starts with a free demo homepage. You approve it before we go any further.
                            </p>
                            <div className="border-maple-line border-t">
                                {packages.map((pkg, i) => (
                                    <div
                                        key={pkg.name}
                                        data-reveal="left"
                                        style={stagger(i)}
                                        className={`border-maple-line grid gap-x-8 gap-y-2 border-b py-7 sm:grid-cols-[3rem_1fr_auto] ${pkg.featured ? 'bg-maple-light -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10' : ''}`}
                                    >
                                        <span aria-hidden="true" className="font-cond text-ink-muted pt-1.5">
                                            {num(i)}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="font-display flex flex-wrap items-center gap-3 text-2xl sm:text-3xl">
                                                {pkg.name}
                                                {pkg.featured && (
                                                    <span className="font-cond text-royal border-royal rounded-sm border px-2 py-0.5">
                                                        Most chosen
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-ink-soft mt-1 max-w-2xl">{pkg.summary}</p>
                                        </div>
                                        <p className="font-display text-3xl tabular-nums sm:text-right sm:text-4xl">{pkg.price}</p>
                                    </div>
                                ))}
                                {care_plan && (
                                    <div className="border-maple-line grid gap-x-8 gap-y-1 border-b py-6 sm:grid-cols-[3rem_1fr_auto]">
                                        <span aria-hidden="true" className="font-cond text-ink-muted pt-1">
                                            +
                                        </span>
                                        <p className="text-ink-soft max-w-2xl">{care_plan.summary}</p>
                                        <p className="font-display text-2xl tabular-nums sm:text-right">{care_plan.price}</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-10">
                                <PillLink href="/start" internal>
                                    Get a free demo homepage <ArrowUpRight className="size-3.5" />
                                </PillLink>
                            </div>
                        </div>
                    </section>

                    {/* About */}
                    <section id="about" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} grid gap-x-16 gap-y-12 py-20 lg:grid-cols-[5fr_7fr] lg:py-28`}>
                            <div>
                                <SectionHeading n={8} eyebrow="About" title="Notes from" dim="the field." className="mb-8" />
                                {about.map((p, i) => (
                                    <p key={i} className="text-ink-soft mb-4 max-w-md">
                                        {p}
                                    </p>
                                ))}
                            </div>
                            <div className="grid gap-12 sm:grid-cols-2">
                                <div>
                                    <Fig className="border-maple-line mb-2 border-b pb-3">Career</Fig>
                                    <ol>
                                        {experience.map((job) => (
                                            <li key={job.role + job.company} data-reveal className="border-maple-line border-b py-4">
                                                <p className="font-display text-lg">{job.role}</p>
                                                <p className="text-ink-soft text-sm">{job.company}</p>
                                                <p className="font-cond text-ink-muted mt-1">{job.period}</p>
                                                <p className="text-ink-soft mt-2 text-sm">{job.summary}</p>
                                            </li>
                                        ))}
                                        {school && (
                                            <li data-reveal className="border-maple-line border-b py-4">
                                                <p className="font-display text-lg">{school.degree}</p>
                                                <p className="text-ink-soft text-sm">{school.school}</p>
                                                <p className="font-cond text-ink-muted mt-1">{school.period}</p>
                                            </li>
                                        )}
                                    </ol>
                                </div>
                                <div>
                                    <Fig className="border-maple-line mb-2 border-b pb-3">Stack</Fig>
                                    {Object.entries(skills).map(([group, items]) => (
                                        <div key={group} data-reveal className="border-maple-line border-b py-4">
                                            <p className="font-cond text-ink-muted">{group}</p>
                                            <p className="text-ink-soft mt-1 text-sm">{items.join(' · ')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section id="contact" className="scroll-mt-16">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={9} eyebrow="Engage the studio" title="Let's build" dim="something." className="mb-12" />
                            <div className="grid gap-12 lg:grid-cols-[5fr_7fr]">
                                <div>
                                    <p className="text-ink-soft max-w-md">
                                        Tell me about your business. For websites, you'll get a free demo homepage to approve before we tip off.
                                    </p>
                                    <ul className="font-cond mt-8 space-y-1">
                                        {links.email && (
                                            <li>
                                                <a
                                                    href={`mailto:${links.email}`}
                                                    className="text-ink hover:text-royal flex min-h-11 items-center gap-3"
                                                >
                                                    <Mail className="size-4" /> {links.email}
                                                </a>
                                            </li>
                                        )}
                                        {links.linkedin && (
                                            <li>
                                                <a
                                                    href={links.linkedin}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-ink hover:text-royal flex min-h-11 items-center gap-3"
                                                >
                                                    <Linkedin className="size-4" /> LinkedIn
                                                </a>
                                            </li>
                                        )}
                                        {links.github && (
                                            <li>
                                                <a
                                                    href={links.github}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-ink hover:text-royal flex min-h-11 items-center gap-3"
                                                >
                                                    <Github className="size-4" /> GitHub
                                                </a>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-maple-light border-maple-line relative min-w-0 rounded-sm border">
                                    <ContactForm services={services.map((s) => s.title)} />
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </SiteLayout>
        </>
    );
}
