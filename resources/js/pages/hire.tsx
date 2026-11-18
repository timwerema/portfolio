import { CountUp, useReveal } from '@/components/motion';
import { Chip, Fig, PillLink, SectionHeading, SiteLayout, Spec } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { type CSSProperties } from 'react';

/*
 * /hire: the page for recruiters and hiring managers. Engineering work, numbers, experience, skills, resume.
 * The home page is for business owners; this keeps the two stories apart. Content: config/portfolio.php.
 */

const stagger = (i: number) => ({ '--d': i }) as CSSProperties;
const num = (i: number) => String(i + 1).padStart(2, '0');

export default function HirePage({ portfolio }: { portfolio: Portfolio }) {
    const { name, role, availability, location, tagline, about, resume_url, links, education, stats, skills, projects, experience } = portfolio;
    useReveal();
    const school = education[0];
    const wrap = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10';

    return (
        <>
            <Head title={`${name} · ${role}`}>
                <meta name="description" content={tagline} />
            </Head>

            <SiteLayout name={name} resumeUrl={resume_url}>
                <main>
                    {/* Hero */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} grid gap-10 py-16 sm:py-24 lg:grid-cols-[7fr_5fr] lg:py-28`}>
                            <div>
                                <Fig n={1} className="mb-8">
                                    For hiring managers · {location}
                                </Fig>
                                <h1 className="font-display max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-[72px]">
                                    {role},
                                    <br />
                                    <span className="title-dim">graduating {school ? school.period.replace(/^expected /i, '') : 'soon'}.</span>
                                </h1>
                                <p className="text-ink-soft mt-8 max-w-xl text-lg">{tagline}</p>
                                <div className="mt-9 flex flex-wrap gap-3">
                                    {resume_url && (
                                        <PillLink href={resume_url}>
                                            Resume <ArrowUpRight className="size-3.5" />
                                        </PillLink>
                                    )}
                                    {links.email && (
                                        <PillLink href={`mailto:${links.email}`} variant="outline">
                                            <Mail className="size-3.5" /> Email me
                                        </PillLink>
                                    )}
                                </div>
                                <ul className="font-cond mt-6 flex flex-wrap gap-x-6">
                                    {links.linkedin && (
                                        <li>
                                            <a
                                                href={links.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-ink hover:text-royal inline-flex min-h-11 items-center gap-2"
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
                                                className="text-ink hover:text-royal inline-flex min-h-11 items-center gap-2"
                                            >
                                                <Github className="size-4" /> GitHub
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <dl className="font-cond border-maple-line self-end border-t">
                                {[
                                    ['Role', role],
                                    ['School', school ? `${school.school} · ${school.period}` : '—'],
                                    ['Last team', experience[0]?.company ?? '—'],
                                    ['Based in', location],
                                    ['Open to', (availability ?? 'New roles').replace(/^open to /i, '')],
                                ].map(([k, v]) => (
                                    <div key={k} className="border-maple-line flex justify-between gap-4 border-b py-3">
                                        <dt className="text-ink-muted">{k}</dt>
                                        <dd className="text-ink text-right">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    {/* Numbers */}
                    <section aria-label="Results in numbers" className="border-maple-line border-b">
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

                    {/* Summary */}
                    <section className="border-maple-line border-b">
                        <div className={`${wrap} grid gap-8 py-16 lg:grid-cols-[3fr_9fr] lg:py-24`}>
                            <Fig n={2}>Summary</Fig>
                            <div className="max-w-3xl">
                                <p data-reveal="mask" className="font-display text-ink-soft text-2xl leading-snug sm:text-3xl">
                                    {about[0]}
                                </p>
                                {about.slice(1).map((p, i) => (
                                    <p key={i} className="text-ink-soft mt-6 max-w-2xl">
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Engineering work */}
                    <section id="work" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-16 lg:py-24`}>
                            <SectionHeading n={3} eyebrow="Engineering work" title="What I've built," dim="and for whom." />
                            <div className="border-maple-line border-t">
                                {projects.map((p, i) => (
                                    <article
                                        key={p.title}
                                        data-reveal="left"
                                        className="border-maple-line grid gap-x-8 gap-y-5 border-b py-8 sm:grid-cols-[3rem_1fr] lg:grid-cols-[3rem_1fr_300px]"
                                    >
                                        <span aria-hidden="true" className="font-cond text-ink-muted pt-1.5">
                                            {num(i)}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="font-display text-2xl sm:text-3xl">{p.title}</h3>
                                            <p className="font-cond text-ink-muted mt-1">{[p.subtitle, p.period].filter(Boolean).join(' · ')}</p>
                                            <p className="text-ink-soft mt-3 max-w-2xl">{p.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2 pl-1">
                                                {p.tags.map((t) => (
                                                    <Chip key={t}>{t}</Chip>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="sm:col-start-2 lg:col-start-auto">
                                            {p.spec && <Spec rows={Object.entries(p.spec)} />}
                                            {(p.url || p.repo) && (
                                                <div className="font-cond mt-2 flex items-start gap-5">
                                                    {p.url && (
                                                        <a
                                                            href={p.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-ink hover:text-royal inline-flex min-h-11 items-center gap-1"
                                                        >
                                                            Visit site <ArrowUpRight className="size-3.5" />
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
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Experience and skills */}
                    <section id="experience" className="border-maple-line scroll-mt-16 border-b">
                        <div className={`${wrap} py-16 lg:py-24`}>
                            <SectionHeading
                                n={4}
                                eyebrow="Experience & skills"
                                title="Where I've worked,"
                                dim="what I work with."
                                className="mb-10"
                            />
                            <div className="grid gap-12 lg:grid-cols-2">
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
                    <section className="scroll-mt-16">
                        <div className={`${wrap} flex flex-wrap items-end justify-between gap-8 py-16 lg:py-24`}>
                            <SectionHeading
                                n={5}
                                eyebrow="Get in touch"
                                title="Hiring for a role?"
                                dim="I'd like to hear about it."
                                className="!mb-0"
                            />
                            <div className="flex flex-wrap gap-3">
                                {links.email && (
                                    <PillLink href={`mailto:${links.email}`}>
                                        <Mail className="size-3.5" /> {links.email}
                                    </PillLink>
                                )}
                                {resume_url && (
                                    <PillLink href={resume_url} variant="outline">
                                        Resume
                                    </PillLink>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </SiteLayout>
        </>
    );
}
