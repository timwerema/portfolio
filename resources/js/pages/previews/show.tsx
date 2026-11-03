import PreviewForm from '@/components/preview-form';
import PreviewStatusBadge from '@/components/preview-status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { type Preview } from '@/types/preview';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Copy, ExternalLink, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function PreviewsShow({ preview }: { preview: Preview }) {
    const { flash, errors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const [copied, setCopied] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client previews', href: '/dashboard/previews' },
        { title: preview.client_name, href: `/dashboard/previews/${preview.id}` },
    ];

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(preview.review_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this link:', preview.review_url);
        }
    };

    const send = () => router.post(route('admin.previews.send', preview.id), {}, { preserveScroll: true });
    const destroy = () => {
        if (window.confirm(`Delete the preview for ${preview.client_name}? The client's link will stop working.`)) {
            router.delete(route('admin.previews.destroy', preview.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Preview · ${preview.client_name}`} />
            <div className="flex flex-col gap-8 p-4 lg:flex-row">
                <div className="min-w-0 flex-1 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold">
                                {preview.client_name} · {preview.title}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Version {preview.version}
                                {preview.sent_at && ` · emailed ${formatDate(preview.sent_at)}`}
                            </p>
                        </div>
                        <PreviewStatusBadge status={preview.status} />
                    </div>

                    {flash?.status && (
                        <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {flash.status}
                        </p>
                    )}
                    {errors?.client_email && <p className="text-sm text-red-600">{errors.client_email}</p>}

                    <div className="rounded-xl border p-4">
                        <p className="mb-2 text-sm font-medium">Client review link</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="bg-muted min-w-0 flex-1 truncate rounded px-2 py-1.5 text-xs">{preview.review_url}</code>
                            <Button size="sm" variant="outline" onClick={copy}>
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <a href={preview.review_url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="size-4" /> Open
                                </a>
                            </Button>
                            <Button size="sm" onClick={send} disabled={!preview.client_email}>
                                <Send className="size-4" /> Email to client
                            </Button>
                        </div>
                        {!preview.client_email && <p className="text-muted-foreground mt-2 text-xs">Add the client's email below to send the link from here.</p>}
                    </div>

                    <div>
                        <h2 className="mb-3 font-semibold">Client responses</h2>
                        {preview.feedback && preview.feedback.length > 0 ? (
                            <ol className="space-y-3">
                                {preview.feedback.map((f) => (
                                    <li key={f.id} className="rounded-xl border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <PreviewStatusBadge status={f.decision} />
                                            <span className="text-muted-foreground text-xs">
                                                v{f.version} · {formatDate(f.created_at)}
                                                {f.name && ` · ${f.name}`}
                                            </span>
                                        </div>
                                        {f.comment && <p className="mt-3 text-sm whitespace-pre-line">{f.comment}</p>}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">No response yet.</p>
                        )}
                    </div>
                </div>

                <div className="w-full shrink-0 space-y-6 lg:w-[440px]">
                    <div className="rounded-xl border p-4">
                        <h2 className="mb-4 font-semibold">Edit or upload a new version</h2>
                        <PreviewForm preview={preview} />
                    </div>
                    <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={destroy}>
                        <Trash2 className="size-4" /> Delete preview
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
