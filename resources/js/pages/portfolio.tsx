import ContactForm from '@/components/contact-form';
import { Typewriter, useReveal, useScrollProgress } from '@/components/motion';
import { Chip, Fig, PillLink, PlayDiagram, SectionHeading, SiteLayout, Spec } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { type CSSProperties, useRef, useState } from 'react';

/*
 * Home page, "Studio" look, written for business owners (clients). Recruiters get /hire (pages/hire.tsx).
 * Content comes from config/portfolio.php (`client` for the hero and about text).
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
    const { name, location, client, resume_url, links, services, packages, care_plan, demos } = portfolio;
    useReveal();
    // Five example sites to start with; the rest open with one tap (keeps the page short on phones).
    const [allDemos, setAllDemos] = useState(false);
    const shownDemos = allDemos ? demos : demos.slice(0, 5);
    const wrap = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10';

    return (
        <>
            <Head title={`${name} · ${client.title}`}>
                <meta name="description" content={client.tagline} />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url} home>
                <main id="top">
                    {/* Hero */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} grid gap-10 py-16 sm:py-24 lg:grid-cols-[7fr_5fr] lg:py-32`}>
                            <div>
                                <Fig n={1} className="mb-8 flex items-center gap-2">
                                    <span className="relative flex size-1.5">
                                        <span className="bg-royal absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                                        <span className="bg-royal relative inline-flex size-1.5 rounded-full" />
                                    </span>
                                    {client.eyebrow} · {location}
                                </Fig>
                                <h1 className="font-display max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-[80px]">
                                    Built to win
                                    <br />
                                    <span className="title-dim">your next customer.</span>
                                </h1>
                                <p className="font-display text-ink mt-8 min-h-[1.4em] text-xl sm:text-2xl">
                                    <span className="text-ink-muted">I build </span>
                                    <Typewriter phrases={client.typing} />
                                </p>
                                <p className="text-ink-soft mt-4 max-w-xl">{client.tagline}</p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <PillLink href="/start" internal>
                                        Get a free demo homepage <ArrowUpRight className="size-3.5" />
                                    </PillLink>
                                    <PillLink href="#work" variant="outline">
                                        See example sites
                                    </PillLink>
                                </div>
                            </div>

                            {/* What working together looks like */}
                            <div className="self-end">
                                <dl className="font-cond border-maple-line border-t">
                                    {client.facts.map(([k, v]) => (
                                        <div key={k} className="border-maple-line flex justify-between gap-4 border-b py-3">
                                            <dt className="text-ink-muted">{k}</dt>
                                            <dd className="text-ink text-right">{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <Link href="/hire" className="font-cond text-ink-muted hover:text-royal mt-4 inline-flex min-h-11 items-center gap-1">
                                    Hiring an engineer? See my engineering work <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Work: demo sites, each with its screenshot (visible on phones too) */}
                    <section id="work" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-16 lg:py-24`}>
                            <SectionHeading
                                n={2}
                                eyebrow="Example sites · made for fictional businesses"
                                title="What your site"
                                dim="could look like."
                                className="mb-10"
                            />
                            <div className="border-maple-line border-t">
                                {shownDemos.map((d, i) => (
                                    <Link
                                        key={d.url}
                                        href={d.url}
                                        data-reveal="left"
                                        style={stagger(i % 3)}
                                        className="group border-maple-line hover:bg-maple-light grid gap-x-8 gap-y-4 border-b py-6 transition-colors sm:grid-cols-[220px_1fr] lg:grid-cols-[3rem_240px_1fr_260px]"
                                    >
                                        <span aria-hidden="true" className="font-cond text-ink-muted hidden pt-1 lg:block">
                                            {num(i)}
                                        </span>
                                        <img
                                            src={previewFor(d.url)}
                                            alt={`Screenshot of the ${d.title} site`}
                                            width={640}
                                            height={400}
                                            loading="lazy"
                                            className="border-maple-line aspect-[16/10] w-full rounded-sm border object-cover object-top"
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-display text-xl sm:text-2xl">{d.title}</h3>
                                            <p className="text-ink-soft mt-2 max-w-2xl text-sm">{d.description}</p>
                                            <span className="font-cond text-ink group-hover:text-royal mt-3 inline-flex min-h-11 items-center gap-1">
                                                Open it{' '}
                                                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </span>
                                        </div>
                                        <Spec
                                            className="sm:col-span-2 lg:col-span-1"
                                            rows={[
                                                ['Type', d.type],
                                                ['Package', d.package],
                                                ['Status', d.url.startsWith('/demos/') ? 'Demo' : 'Live'],
                                            ]}
                                        />
                                    </Link>
                                ))}
                            </div>
                            {!allDemos && demos.length > shownDemos.length && (
                                <button
                                    type="button"
                                    onClick={() => setAllDemos(true)}
                                    className="font-cond text-ink hover:text-royal mt-6 inline-flex min-h-11 items-center gap-2"
                                >
                                    Show all {demos.length} example sites <span aria-hidden="true">+</span>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Services */}
                    <section id="services" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={3} eyebrow="What I build" title="Four services," dim="one way of working." className="mb-4" />
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
                                <SectionHeading n={4} eyebrow="How I work" title="Simple, honest," dim="and fast." className="mb-4" />
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
                            <SectionHeading n={5} eyebrow="Packages" title="Clear prices," dim="no surprises." className="mb-4" />
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
                                                {pkg.featured && <Chip tone="royal">Most chosen</Chip>}
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

                    {/* About: who the client works with (the engineering story is on /hire) */}
                    <section id="about" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} grid gap-x-16 gap-y-8 py-16 lg:grid-cols-[5fr_7fr] lg:py-24`}>
                            <SectionHeading n={6} eyebrow="About" title="Who you'll" dim="work with." className="!mb-0" />
                            <div className="max-w-xl">
                                {client.about.map((p, i) => (
                                    <p key={i} data-reveal className="text-ink-soft mb-4">
                                        {p}
                                    </p>
                                ))}
                                <Link href="/hire" className="font-cond text-ink hover:text-royal mt-2 inline-flex min-h-11 items-center gap-1">
                                    My engineering work and resume <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section id="contact" className="scroll-mt-16">
                        <div className={`${wrap} py-20 lg:py-28`}>
                            <SectionHeading n={7} eyebrow="Get started" title="Let's build" dim="something." className="mb-12" />
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
