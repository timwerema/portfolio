import InputError from '@/components/input-error';
import { Head, useForm } from '@inertiajs/react';
import { CircleCheck, ExternalLink, LoaderCircle, MessageSquare, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type ReviewPreview = {
    token: string;
    client_name: string;
    title: string;
    note: string | null;
    version: number;
    status: 'pending' | 'approved' | 'changes_requested';
    decided_at: string | null;
    frame_url: string | null;
    is_upload: boolean;
};

type Decision = 'approved' | 'changes_requested';

export default function PreviewReview({ preview, studio }: { preview: ReviewPreview; studio: { name: string; email: string | null } }) {
    const [mode, setMode] = useState<'idle' | 'changes'>('idle');
    const [noteOpen, setNoteOpen] = useState(!!preview.note);
    const { data, setData, post, transform, processing, errors, reset } = useForm<{ decision: Decision; name: string; comment: string }>({
        decision: 'approved',
        name: '',
        comment: '',
    });

    const submit = (decision: Decision) => (e?: FormEvent) => {
        e?.preventDefault();
        transform((d) => ({ ...d, decision })); // send the decision of the button that was clicked
        post(route('previews.decide', preview.token), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setMode('idle');
            },
        });
    };

    const decided = preview.status !== 'pending';

    return (
        <>
            <Head title={`${preview.title} · Review`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="hardwood bg-maple text-ink font-body flex h-dvh flex-col">
                {/* Top bar */}
                <header className="bg-navy text-maple-light flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="bg-royal font-display flex size-10 shrink-0 items-center justify-center rounded-full text-base text-white">TW</span>
                        <div className="min-w-0">
                            <p className="font-cond text-silver text-sm font-semibold tracking-[0.1em] uppercase">Demo for {preview.client_name}</p>
                            <h1 className="truncate font-semibold">
                                {preview.title} <span className="text-silver font-normal">· version {preview.version}</span>
                            </h1>
                        </div>
                    </div>
                    {preview.frame_url && (
                        <a
                            href={preview.frame_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-cond text-led inline-flex min-h-11 items-center gap-1.5 text-base font-bold tracking-[0.06em] uppercase hover:text-white"
                        >
                            <ExternalLink className="size-4" /> Open full screen
                        </a>
                    )}
                </header>

                {/* Note from the studio */}
                {preview.note && noteOpen && (
                    <div className="border-navy bg-maple-light flex items-start gap-3 border-b-2 px-4 py-3 sm:px-6">
                        <MessageSquare className="text-royal mt-0.5 size-5 shrink-0" />
                        <p className="flex-1 whitespace-pre-line">{preview.note}</p>
                        <button type="button" aria-label="Hide note" onClick={() => setNoteOpen(false)} className="text-ink-muted hover:text-ink -m-2 flex size-11 items-center justify-center">
                            <X className="size-5" />
                        </button>
                    </div>
                )}

                {/* The demo */}
                <main className="min-h-0 flex-1 bg-white">
                    {preview.frame_url ? (
                        <iframe
                            title={`Demo: ${preview.title}`}
                            src={preview.frame_url}
                            className="h-full w-full border-0"
                            // Uploaded demos are served from this site, so they never get same-origin access.
                            sandbox={preview.is_upload ? 'allow-scripts allow-forms allow-popups allow-modals' : 'allow-scripts allow-forms allow-popups allow-modals allow-same-origin'}
                        />
                    ) : (
                        <p className="text-ink-muted p-10 text-center">This demo isn't available right now.</p>
                    )}
                </main>

                {/* Decision bar */}
                <footer className="bg-navy text-maple-light border-royal border-t-4 px-4 py-4 sm:px-6">
                    {mode === 'changes' ? (
                        <form onSubmit={submit('changes_requested')} className="mx-auto flex max-w-3xl flex-col gap-3">
                            <label htmlFor="comment" className="font-semibold">
                                What would you like changed?
                            </label>
                            <textarea
                                id="comment"
                                rows={3}
                                autoFocus
                                value={data.comment}
                                onChange={(e) => setData('comment', e.target.value)}
                                placeholder="e.g. Can the header be darker? Swap the second photo. Add our opening hours."
                                className="bg-maple-light text-ink placeholder:text-ink-muted focus:outline-led w-full rounded-md p-3 focus:outline-2"
                            />
                            <InputError message={errors.comment} className="text-red-300" />
                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    aria-label="Your name (optional)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Your name (optional)"
                                    className="bg-maple-light text-ink placeholder:text-ink-muted min-h-11 flex-1 rounded-md px-3"
                                />
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-royal hover:bg-royal-dark inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-bold text-white disabled:opacity-60"
                                >
                                    {processing && <LoaderCircle className="size-4 animate-spin" />} Send feedback
                                </button>
                                <button type="button" onClick={() => setMode('idle')} className="text-silver min-h-11 px-3 hover:text-white">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                            <div role="status">
                                {preview.status === 'approved' && (
                                    <p className="flex items-center gap-2 font-semibold">
                                        <CircleCheck className="text-led size-5" /> You approved version {preview.version}. Thanks, {preview.client_name}! I'll be in touch about next steps.
                                    </p>
                                )}
                                {preview.status === 'changes_requested' && (
                                    <p className="font-semibold">Got your feedback on version {preview.version}. I'll send an updated version soon.</p>
                                )}
                                {!decided && (
                                    <p>
                                        <span className="font-semibold">Happy with this version?</span>{' '}
                                        <span className="text-silver">Approve it, or tell me what to change.</span>
                                    </p>
                                )}
                                <InputError message={errors.decision} className="text-red-300" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMode('changes')}
                                    className="border-silver hover:bg-maple-light hover:text-navy inline-flex min-h-11 items-center rounded-full border-2 px-6 font-bold"
                                >
                                    Request changes
                                </button>
                                {preview.status !== 'approved' && (
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => submit('approved')()}
                                        className="bg-royal hover:bg-royal-dark inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-bold text-white disabled:opacity-60"
                                    >
                                        {processing ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheck className="size-4" />} Approve
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <p className="text-silver mx-auto mt-3 max-w-5xl text-xs">
                        Shared privately by {studio.name}
                        {studio.email && (
                            <>
                                {' · '}
                                <a href={`mailto:${studio.email}`} className="underline underline-offset-2 hover:text-white">
                                    {studio.email}
                                </a>
                            </>
                        )}
                    </p>
                </footer>
            </div>
        </>
    );
}
