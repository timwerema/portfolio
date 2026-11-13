import { SectionHeading, SiteLayout } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

const UPDATED = 'November 9, 2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="border-maple-line border-t py-7 first:border-t-0">
            <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
            <div className="text-ink-soft mt-3 space-y-3 leading-relaxed [&_li]:ml-5 [&_li]:list-disc">{children}</div>
        </section>
    );
}

function Privacy({ name, email }: { name: string; email: string }) {
    return (
        <>
            <Section title="The short version">
                <p>
                    I collect only what you choose to send me, use it only to reply and do the work you ask for, and never sell it. There are no ads,
                    no tracking pixels and no analytics cookies on this site.
                </p>
            </Section>
            <Section title="What I collect">
                <ul>
                    <li>
                        <strong>Contact and project forms:</strong> your name, email, optional phone, business name and website, and what you write to
                        me.
                    </li>
                    <li>
                        <strong>Client work:</strong> comments you leave on a demo I send you, and the details on invoices I send you.
                    </li>
                    <li>
                        <strong>Encore Live (if you connect Spotify):</strong> your listening history is read in your browser and never sent to or
                        stored on my server. Only the artist names you pick and the location you choose are used to search for shows, and the search
                        results are cached for a few hours.
                    </li>
                    <li>
                        <strong>Basic technical data:</strong> your IP address when you submit a form (to stop spam) and standard server logs.
                    </li>
                </ul>
            </Section>
            <Section title="Cookies">
                <p>The site uses one essential session cookie so forms work securely. It doesn't track you across other sites.</p>
            </Section>
            <Section title="Who else sees it">
                <p>
                    Emails are delivered through an email service (Resend). Payments happen on the payment provider's own page (such as Square, Stripe
                    or PayPal), so I never see or store your card details. That's it: I don't share or sell your information to anyone else.
                </p>
            </Section>
            <Section title="How long I keep it">
                <p>
                    Enquiries are kept while we're in touch and for up to two years after. Invoices are kept as long as tax rules require. Backups are
                    kept for 14 days.
                </p>
            </Section>
            <Section title="Your choices">
                <p>
                    You can ask me to show you, correct or delete what I have about you at any time. Email{' '}
                    <a href={`mailto:${email}`} className="text-royal underline">
                        {email}
                    </a>{' '}
                    and I'll take care of it within 30 days.
                </p>
            </Section>
            <Section title="Contact">
                <p>
                    {name}, Dallas, TX ·{' '}
                    <a href={`mailto:${email}`} className="text-royal underline">
                        {email}
                    </a>
                </p>
            </Section>
        </>
    );
}

function Terms({ name, email }: { name: string; email: string }) {
    return (
        <>
            <Section title="Quotes & agreements">
                <p>
                    Every project starts with a written quote describing what's included, the price and the timeline. The quote you approve, together
                    with these terms, is our agreement.
                </p>
            </Section>
            <Section title="Free demo homepage">
                <p>
                    For website projects I may build a free demo homepage so you can see the direction before committing. You're under no obligation
                    to go ahead, and the demo stays mine unless the project goes forward.
                </p>
            </Section>
            <Section title="Payment">
                <ul>
                    <li>A deposit (usually 50%) starts the work; the rest is due at launch unless the quote says otherwise.</li>
                    <li>Invoices are due within 14 days and are paid through a secure payment link.</li>
                    <li>Care plans are billed monthly and can be cancelled any time before the next billing date.</li>
                </ul>
            </Section>
            <Section title="Revisions & changes">
                <p>
                    Each package includes the revision rounds listed in its quote. Changes beyond the agreed scope are quoted separately before I do
                    them, so there are no surprise charges.
                </p>
            </Section>
            <Section title="Your content & ownership">
                <p>
                    You're responsible for having the rights to the text, photos and logos you give me. Once the project is paid in full, you own your
                    website's design and content. I may show the finished work in my portfolio unless you ask me not to.
                </p>
            </Section>
            <Section title="Hosting & third-party services">
                <p>
                    Sites may rely on services like hosting, domains, email and payment providers. Their own terms apply, and I'm not responsible for
                    their outages or price changes.
                </p>
            </Section>
            <Section title="Limits">
                <p>
                    I build and test carefully, but no website can be guaranteed to be error-free or always online. My total liability for any project
                    is limited to the amount you paid for it.
                </p>
            </Section>
            <Section title="Governing law & contact">
                <p>
                    These terms are governed by the laws of the State of Texas. Questions? Email{' '}
                    <a href={`mailto:${email}`} className="text-royal underline">
                        {email}
                    </a>
                    . — {name}
                </p>
            </Section>
        </>
    );
}

export default function LegalPage({ portfolio, doc }: { portfolio: Portfolio; doc: 'privacy' | 'terms' }) {
    const email = portfolio.links.email ?? '';
    const title = doc === 'privacy' ? 'Privacy policy' : 'Terms of service';

    return (
        <>
            <Head title={`${title} · ${portfolio.name}`} />
            <SiteLayout name={portfolio.name} resumeUrl={portfolio.resume_url}>
                <main className="mx-auto max-w-[860px] px-5 py-14 sm:px-10 sm:py-20">
                    <SectionHeading eyebrow={`Last updated ${UPDATED}`} title={title} />
                    {doc === 'privacy' ? <Privacy name={portfolio.name} email={email} /> : <Terms name={portfolio.name} email={email} />}
                </main>
            </SiteLayout>
        </>
    );
}
