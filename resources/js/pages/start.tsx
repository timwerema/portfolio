import InputError from '@/components/input-error';
import { PillLink, SiteLayout } from '@/components/site-layout';
import { type Portfolio } from '@/types/portfolio';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, CircleCheck, LoaderCircle } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';

type Props = { portfolio: Portfolio; budgets: string[]; timelines: string[] };

type FormData = {
    services: string[];
    package: string;
    budget: string;
    timeline: string;
    business: string;
    business_website: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    website: string; // honeypot
};

const STEPS = ['What you need', 'Your business', 'How to reach you'];

const field =
    'border-maple-line bg-maple-light text-ink placeholder:text-ink-muted focus-visible:outline-royal min-h-12 w-full rounded-sm border px-4 focus-visible:outline-3 focus-visible:outline-offset-1';

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`font-cond flex min-h-12 items-center gap-2 rounded-full border px-5 font-medium transition-colors ${
                selected ? 'border-royal bg-royal text-maple' : 'border-maple-line text-ink hover:border-ink'
            }`}
        >
            {selected && <Check className="size-4" />}
            {children}
        </button>
    );
}

export default function StartProject({ portfolio, budgets, timelines }: Props) {
    const { flash } = usePage<{ flash: { status?: string | null } }>().props;
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState('');
    const { data, setData, post, processing, errors } = useForm<FormData>({
        services: [],
        package: '',
        budget: '',
        timeline: '',
        business: '',
        business_website: '',
        name: '',
        email: '',
        phone: '',
        message: '',
        website: '',
    });
    const err = errors as Record<string, string>;

    // Hide the "pick something" warning as soon as the visitor makes a choice.
    useEffect(() => setStepError(''), [data.services, data.budget, data.timeline]);
    const sent = flash?.status === 'sent';

    const toggleService = (s: string) =>
        setData('services', data.services.includes(s) ? data.services.filter((x) => x !== s) : [...data.services, s]);

    const next = () => {
        if (step === 0 && (!data.services.length || !data.budget || !data.timeline)) {
            setStepError('Pick at least one service, a budget and a timeline.');
            return;
        }
        setStepError('');
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (step < 2) return next();
        post(route('start.store'), {
            preserveScroll: true,
            onError: (errs) => {
                if (errs.services || errs.budget || errs.timeline) setStep(0);
                else if (errs.message || errs.business || errs.business_website) setStep(1);
            },
        });
    };

    return (
        <>
            <Head title={`Start a project · ${portfolio.name}`} />
            <SiteLayout name={portfolio.name} resumeUrl={portfolio.resume_url}>
                <main className="mx-auto max-w-[900px] px-5 py-14 sm:px-10 sm:py-20">
                    {sent ? (
                        <div role="status">
                            <CircleCheck className="text-royal size-14" />
                            <h1 className="font-display mt-4 text-4xl sm:text-5xl">Request received.</h1>
                            <p className="text-ink-soft mt-4 text-xl">Thanks for reaching out. Here's what happens next:</p>
                            <ol className="border-maple-line mt-8 border-y">
                                {[
                                    ['Within 1 business day', 'I reply by email with a few questions, or a time for a quick call.'],
                                    ['15-minute call', 'We talk through your goals, what you like and what success looks like.'],
                                    [
                                        'Free demo homepage',
                                        'You get a private link to a demo of your new homepage to approve or comment on, before you pay anything.',
                                    ],
                                    ['Build & launch', 'Once you approve, I send a simple quote and we get to work.'],
                                ].map(([t, d], i) => (
                                    <li key={t} className="border-maple-line flex gap-6 border-t py-5 first:border-t-0">
                                        <span className="font-cond text-royal pt-1">{String(i + 1).padStart(2, '0')}</span>
                                        <span>
                                            <span className="block text-xl font-medium">{t}</span>
                                            <span className="text-ink-soft">{d}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <PillLink href="/#work" internal>
                                    See my work
                                </PillLink>
                                <PillLink href="/" variant="outline" internal>
                                    Back home
                                </PillLink>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="font-cond text-royal font-medium">Start a project</p>
                            <h1 className="font-display mt-2 text-4xl leading-[1.05] sm:text-5xl">Let's build something.</h1>
                            <p className="text-ink-soft mt-4 max-w-xl text-xl">
                                Three quick steps, about two minutes. Every website project starts with a <strong>free demo homepage</strong> you
                                approve before paying.
                            </p>

                            <ol className="mt-10 flex flex-wrap gap-x-6 gap-y-2" aria-label="Progress">
                                {STEPS.map((s, i) => (
                                    <li
                                        key={s}
                                        aria-current={step === i ? 'step' : undefined}
                                        className={`font-cond flex items-center gap-2 font-medium ${i <= step ? 'text-strong' : 'text-ink-muted'}`}
                                    >
                                        <span
                                            className={`flex size-8 items-center justify-center rounded-full border ${i < step ? 'bg-royal border-royal text-white' : i === step ? 'border-maple-line' : 'border-maple-line'}`}
                                        >
                                            {i < step ? <Check className="size-4" /> : i + 1}
                                        </span>
                                        {s}
                                    </li>
                                ))}
                            </ol>

                            <form
                                onSubmit={submit}
                                className="border-maple-line bg-maple-light relative mt-6 rounded-sm border p-6 sm:p-10"
                                noValidate
                            >
                                {step === 0 && (
                                    <div className="space-y-8">
                                        <fieldset>
                                            <legend className="font-display text-xl sm:text-2xl">What do you need help with?</legend>
                                            <p className="text-ink-soft mt-1">Pick all that apply.</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {portfolio.services.map((s) => (
                                                    <Choice
                                                        key={s.slug}
                                                        selected={data.services.includes(s.title)}
                                                        onClick={() => toggleService(s.title)}
                                                    >
                                                        {s.title}
                                                    </Choice>
                                                ))}
                                            </div>
                                            <InputError message={err.services} className="mt-2" />
                                        </fieldset>
                                        <fieldset>
                                            <legend className="font-display text-xl sm:text-2xl">Which package fits?</legend>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {[...portfolio.packages.map((p) => `${p.name}`), 'Not sure yet'].map((p) => (
                                                    <Choice
                                                        key={p}
                                                        selected={data.package === p}
                                                        onClick={() => setData('package', data.package === p ? '' : p)}
                                                    >
                                                        {p}
                                                        {portfolio.packages.find((x) => x.name === p) && (
                                                            <span className="font-body text-sm font-medium tracking-normal normal-case opacity-80">
                                                                {portfolio.packages.find((x) => x.name === p)!.price}
                                                            </span>
                                                        )}
                                                    </Choice>
                                                ))}
                                            </div>
                                        </fieldset>
                                        <fieldset>
                                            <legend className="font-display text-xl sm:text-2xl">Budget</legend>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {budgets.map((b) => (
                                                    <Choice key={b} selected={data.budget === b} onClick={() => setData('budget', b)}>
                                                        {b}
                                                    </Choice>
                                                ))}
                                            </div>
                                            <InputError message={err.budget} className="mt-2" />
                                        </fieldset>
                                        <fieldset>
                                            <legend className="font-display text-xl sm:text-2xl">Timeline</legend>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {timelines.map((t) => (
                                                    <Choice key={t} selected={data.timeline === t} onClick={() => setData('timeline', t)}>
                                                        {t}
                                                    </Choice>
                                                ))}
                                            </div>
                                            <InputError message={err.timeline} className="mt-2" />
                                        </fieldset>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="space-y-6">
                                        <h2 className="font-display text-xl sm:text-2xl">Tell me about your business</h2>
                                        <label className="block">
                                            <span className="mb-2 block font-medium">Business name (optional)</span>
                                            <input
                                                className={field}
                                                value={data.business}
                                                onChange={(e) => setData('business', e.target.value)}
                                                placeholder="Reed Fitness"
                                            />
                                            <InputError message={err.business} className="mt-1" />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block font-medium">Current website (optional)</span>
                                            <input
                                                className={field}
                                                value={data.business_website}
                                                onChange={(e) => setData('business_website', e.target.value)}
                                                placeholder="reedfitness.com, an Instagram, or none yet"
                                            />
                                            <InputError message={err.business_website} className="mt-1" />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block font-medium">What should this project do for you?</span>
                                            <textarea
                                                className={`${field} min-h-36 py-3`}
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                placeholder="e.g. Get more bookings, look more professional than my competitors, stop answering the same questions by text..."
                                            />
                                            <InputError message={err.message} className="mt-1" />
                                        </label>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <h2 className="font-display text-xl sm:text-2xl">How should I reach you?</h2>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="mb-2 block font-medium">Name</span>
                                                <input
                                                    className={field}
                                                    autoComplete="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                />
                                                <InputError message={err.name} className="mt-1" />
                                            </label>
                                            <label className="block">
                                                <span className="mb-2 block font-medium">Email</span>
                                                <input
                                                    className={field}
                                                    type="email"
                                                    autoComplete="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                />
                                                <InputError message={err.email} className="mt-1" />
                                            </label>
                                        </div>
                                        <label className="block">
                                            <span className="mb-2 block font-medium">Phone (optional)</span>
                                            <input
                                                className={field}
                                                type="tel"
                                                autoComplete="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                            />
                                        </label>
                                        <p className="text-ink-soft text-sm">
                                            I only use this to reply about your project. See the{' '}
                                            <a href="/privacy" className="text-royal underline">
                                                privacy policy
                                            </a>
                                            .
                                        </p>
                                    </div>
                                )}

                                {/* Honeypot */}
                                <div className="absolute -left-[9999px]" aria-hidden="true">
                                    <label>
                                        Website
                                        <input
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                    </label>
                                </div>

                                {(stepError || err.throttle) && (
                                    <p role="alert" className="text-danger mt-6 font-medium">
                                        {stepError || err.throttle}
                                    </p>
                                )}

                                <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                                    {step > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => setStep((s) => s - 1)}
                                            className="font-cond text-strong inline-flex min-h-12 items-center gap-2 font-medium"
                                        >
                                            <ArrowLeft className="size-5" /> Back
                                        </button>
                                    ) : (
                                        <span />
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-royal hover:bg-royal-dark font-cond inline-flex min-h-[54px] items-center gap-2 rounded-full px-8 text-xl font-medium text-white disabled:opacity-60"
                                    >
                                        {processing && <LoaderCircle className="size-5 animate-spin" />}
                                        {step < 2 ? 'Next' : 'Send request'} {!processing && <ArrowRight className="size-5" />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </main>
            </SiteLayout>
        </>
    );
}
