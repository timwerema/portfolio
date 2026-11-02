import { Button } from '@/components/ui/button';
import { type Portfolio } from '@/types/portfolio';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { type ReactNode } from 'react';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-4 break-inside-avoid-page">
            <h2 className="border-b border-neutral-300 pb-1 text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">{title}</h2>
            <div className="mt-2 space-y-2.5">{children}</div>
        </section>
    );
}

function Entry({ title, meta, right, bullets }: { title: string; meta?: string | null; right?: string | null; bullets?: string[] }) {
    return (
        <div className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-[13px] font-semibold text-neutral-900">
                    {title}
                    {meta && <span className="font-normal text-neutral-600"> · {meta}</span>}
                </h3>
                {right && <span className="text-[12px] text-neutral-500 tabular-nums">{right}</span>}
            </div>
            {bullets && bullets.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-neutral-700 marker:text-neutral-400">
                    {bullets.map((b) => (
                        <li key={b}>{b}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default function ResumePage({ portfolio, pdfAvailable }: { portfolio: Portfolio; pdfAvailable: boolean }) {
    const { name, role, location, summary, links, education, experience, projects, skills } = portfolio;

    const contact: { label: string; href?: string }[] = [
        { label: location },
        ...(links.phone ? [{ label: links.phone, href: `tel:${links.phone.replace(/[^\d+]/g, '')}` }] : []),
        ...(links.email ? [{ label: links.email, href: `mailto:${links.email}` }] : []),
        ...(links.linkedin ? [{ label: displayUrl(links.linkedin), href: links.linkedin }] : []),
        ...(links.github ? [{ label: displayUrl(links.github), href: links.github }] : []),
    ];

    return (
        <>
            <Head title={`${name} · Resume`}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
                <style>{`@page { size: letter; margin: 0.4in 0.5in; }`}</style>
            </Head>

            <div className="bg-muted min-h-screen print:bg-white">
                {/* Toolbar (hidden when printing) */}
                <div className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur print:hidden">
                    <div className="mx-auto flex h-14 max-w-[8.5in] items-center justify-between px-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/">
                                <ArrowLeft className="size-4" /> Portfolio
                            </Link>
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <Printer className="size-4" /> Print
                            </Button>
                            {pdfAvailable && (
                                <Button size="sm" asChild>
                                    <a href="/resume.pdf" download={`${name.replace(/\s+/g, '_')}_Resume.pdf`}>
                                        <Download className="size-4" /> Download PDF
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Paper */}
                <main className="mx-auto max-w-[8.5in] px-0 py-0 sm:px-4 sm:py-8 print:p-0">
                    <article className="bg-white px-6 py-8 text-neutral-900 shadow-sm sm:rounded-md sm:px-[0.6in] sm:py-[0.55in] print:rounded-none print:p-0 print:shadow-none">
                        <header>
                            <h1 className="text-[28px] leading-none font-bold tracking-tight">{name}</h1>
                            <p className="mt-1.5 text-[14px] font-medium text-neutral-600">{role}</p>
                            <p className="mt-2 flex flex-wrap gap-x-2 text-[12px] text-neutral-600">
                                {contact.map((c, i) => (
                                    <span key={c.label} className="flex gap-x-2">
                                        {i > 0 && <span className="text-neutral-300">|</span>}
                                        {c.href ? (
                                            <a href={c.href} className="hover:text-neutral-900 hover:underline">
                                                {c.label}
                                            </a>
                                        ) : (
                                            c.label
                                        )}
                                    </span>
                                ))}
                            </p>
                        </header>

                        <Section title="Summary">
                            <p className="text-[12px] leading-snug text-neutral-700">{summary}</p>
                        </Section>

                        <Section title="Education">
                            {education.map((e) => (
                                <Entry key={e.school} title={e.school} meta={e.degree} right={e.period} />
                            ))}
                        </Section>

                        <Section title="Experience">
                            {experience.map((job) => (
                                <Entry key={`${job.company}-${job.period}`} title={job.company} meta={job.role} right={job.period} bullets={job.bullets} />
                            ))}
                        </Section>

                        <Section title="Projects">
                            {projects
                                .filter((p) => p.on_resume !== false)
                                .map((p) => (
                                    <Entry key={p.title} title={p.title} meta={p.subtitle} right={p.period} bullets={p.bullets} />
                                ))}
                        </Section>

                        <Section title="Technical Skills">
                            <dl className="space-y-1 text-[12px] leading-snug">
                                {Object.entries(skills).map(([group, items]) => (
                                    <div key={group} className="flex gap-2">
                                        <dt className="shrink-0 font-semibold text-neutral-900">{group}:</dt>
                                        <dd className="text-neutral-700">{items.join(', ')}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Section>
                    </article>
                </main>
            </div>
        </>
    );
}
