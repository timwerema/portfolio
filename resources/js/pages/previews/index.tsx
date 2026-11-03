import PreviewStatusBadge from '@/components/preview-status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Preview } from '@/types/preview';
import { Head, Link } from '@inertiajs/react';
import { MonitorCheck, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Client previews', href: '/dashboard/previews' }];

export default function PreviewsIndex({ previews }: { previews: Preview[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client previews" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Client previews</h1>
                        <p className="text-muted-foreground text-sm">Send a demo to a client and get their approval in one click.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.previews.create')}>
                            <Plus className="size-4" /> New preview
                        </Link>
                    </Button>
                </div>

                {previews.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
                        <MonitorCheck className="size-10" strokeWidth={1.5} />
                        <p className="mt-4 font-medium">No previews yet</p>
                        <p className="mt-1 max-w-sm text-sm">Upload a demo homepage for a client, send them the link, and they can approve it or ask for changes.</p>
                    </div>
                ) : (
                    <ul className="divide-y rounded-xl border">
                        {previews.map((p) => (
                            <li key={p.id}>
                                <Link href={route('admin.previews.show', p.id)} className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 p-4 transition-colors">
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {p.client_name} <span className="text-muted-foreground font-normal">· {p.title}</span>
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Version {p.version} · {p.feedback_count ?? 0} response{p.feedback_count === 1 ? '' : 's'}
                                            {p.sent_at ? ' · link emailed' : ''}
                                        </p>
                                    </div>
                                    <PreviewStatusBadge status={p.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
