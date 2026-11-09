import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Inbox, Mail, MailOpen, Reply, UserPlus } from 'lucide-react';

type ContactMessage = {
    id: number;
    name: string;
    email: string;
    service: string | null;
    message: string;
    read_at: string | null;
    created_at: string;
    source?: string;
    package?: string | null;
    budget?: string | null;
    timeline?: string | null;
    business?: string | null;
    business_website?: string | null;
    phone?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Messages', href: '/dashboard/messages' }];

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function Dashboard({ messages, unread }: { messages: ContactMessage[]; unread: number }) {
    const toggleRead = (id: number) => router.patch(route('messages.toggle-read', id), {}, { preserveScroll: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-xl font-semibold">Contact messages</h1>
                    <p className="text-muted-foreground text-sm">
                        {messages.length} total · {unread} unread
                    </p>
                </div>

                {messages.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
                        <Inbox className="size-10" strokeWidth={1.5} />
                        <p className="mt-4 font-medium">No messages yet</p>
                        <p className="mt-1 text-sm">Messages from your portfolio's contact form will show up here.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {messages.map((m) => (
                            <li key={m.id} className={`rounded-xl border p-5 ${m.read_at ? 'opacity-70' : 'bg-muted/30'}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="flex items-center gap-2 font-medium">
                                            {!m.read_at && <span className="size-2 rounded-full bg-sky-500" aria-label="Unread" />}
                                            {m.name}
                                            {m.source === 'start' && <Badge className="font-normal">Project request</Badge>}
                                            {m.service && (
                                                <Badge variant="secondary" className="font-normal">
                                                    {m.service}
                                                </Badge>
                                            )}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {m.email} · {formatDate(m.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your enquiry')}`}>
                                                <Reply className="size-4" /> Reply
                                            </a>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link
                                                href={route('admin.clients.create', {
                                                    name: m.name,
                                                    email: m.email,
                                                    company: m.business ?? '',
                                                    phone: m.phone ?? '',
                                                    notes: [
                                                        m.service && `Interested in: ${m.service}`,
                                                        m.budget && `Budget: ${m.budget}`,
                                                        m.timeline && `Timeline: ${m.timeline}`,
                                                        m.business_website && `Website: ${m.business_website}`,
                                                        m.message,
                                                    ]
                                                        .filter(Boolean)
                                                        .join('\n'),
                                                })}
                                            >
                                                <UserPlus className="size-4" /> Add as client
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => toggleRead(m.id)}>
                                            {m.read_at ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                                            {m.read_at ? 'Mark unread' : 'Mark read'}
                                        </Button>
                                    </div>
                                </div>
                                {(m.budget || m.timeline || m.package || m.business || m.phone) && (
                                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                        {(
                                            [
                                                ['Budget', m.budget],
                                                ['Timeline', m.timeline],
                                                ['Package', m.package],
                                                [
                                                    'Business',
                                                    m.business ? `${m.business}${m.business_website ? ` (${m.business_website})` : ''}` : null,
                                                ],
                                                ['Phone', m.phone],
                                            ] as const
                                        )
                                            .filter(([, v]) => v)
                                            .map(([k, v]) => (
                                                <div key={k} className="flex gap-1.5">
                                                    <dt className="text-muted-foreground">{k}:</dt>
                                                    <dd className="font-medium">{v}</dd>
                                                </div>
                                            ))}
                                    </dl>
                                )}
                                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
