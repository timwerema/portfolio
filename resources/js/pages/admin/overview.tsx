import StatusPill from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { date, money } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { type Invoice, type Project } from '@/types/business';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Inbox, MonitorCheck, Plus } from 'lucide-react';

type Stats = {
    outstanding_cents: number;
    overdue_cents: number;
    overdue_count: number;
    paid_this_month_cents: number;
    paid_this_year_cents: number;
    expenses_this_year_cents: number;
    profit_this_year_cents: number;
    active_projects: number;
    leads: number;
    unread_messages: number;
    previews_pending: number;
    year: number;
};

type ClientSite = {
    key: string;
    name: string;
    kind: string;
    url: string | null;
    status: 'maintenance' | 'ok' | 'warn' | 'fail' | 'stale' | 'unknown' | 'unreachable' | 'not_connected';
    detail: string;
    checked_at: string | null;
    reservations: { pending: number; last_7_days: number } | null;
};

const SITE_STATUS: Record<ClientSite['status'], { label: string; className: string }> = {
    ok: { label: 'Healthy', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200' },
    warn: { label: 'Warning', className: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' },
    fail: { label: 'Broken', className: 'bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200' },
    maintenance: { label: 'In maintenance', className: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200' },
    stale: { label: 'Not reporting', className: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' },
    unreachable: { label: 'No answer', className: 'bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200' },
    unknown: { label: 'Unknown', className: 'bg-muted text-muted-foreground' },
    not_connected: { label: 'Not connected', className: 'bg-muted text-muted-foreground' },
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Overview', href: '/dashboard' }];

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'bad' | 'good' }) {
    return (
        <div className="min-w-0 flex-[1_1_200px] rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'bad' ? 'text-red-600 dark:text-red-400' : tone === 'good' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
            >
                {value}
            </p>
            {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
        </div>
    );
}

export default function Overview({
    stats,
    recentInvoices,
    activeProjects,
    clientSites = [],
}: {
    stats: Stats;
    recentInvoices: Invoice[];
    activeProjects: Project[];
    clientSites?: ClientSite[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Overview" />
            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Overview</h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.clients.create')}>
                                <Plus className="size-4" /> Client
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('admin.invoices.create')}>
                                <Plus className="size-4" /> Invoice
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Things waiting on you */}
                {(stats.unread_messages > 0 || stats.previews_pending > 0 || stats.overdue_count > 0) && (
                    <div className="flex flex-wrap gap-2">
                        {stats.unread_messages > 0 && (
                            <Link
                                href={route('admin.messages')}
                                className="hover:bg-muted inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm"
                            >
                                <Inbox className="size-4 text-sky-600" /> {stats.unread_messages} unread message
                                {stats.unread_messages === 1 ? '' : 's'}
                            </Link>
                        )}
                        {stats.overdue_count > 0 && (
                            <Link
                                href={route('admin.invoices.index', { status: 'sent' })}
                                className="hover:bg-muted inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm"
                            >
                                <span className="size-2 rounded-full bg-red-500" /> {stats.overdue_count} overdue invoice
                                {stats.overdue_count === 1 ? '' : 's'}
                            </Link>
                        )}
                        {stats.previews_pending > 0 && (
                            <Link
                                href={route('admin.previews.index')}
                                className="hover:bg-muted inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm"
                            >
                                <MonitorCheck className="size-4 text-amber-600" /> {stats.previews_pending} demo
                                {stats.previews_pending === 1 ? '' : 's'} waiting on clients
                            </Link>
                        )}
                    </div>
                )}

                <section aria-label="Money" className="flex flex-wrap gap-3">
                    <Stat label="Outstanding" value={money(stats.outstanding_cents)} note="Sent, not yet paid" />
                    <Stat
                        label="Overdue"
                        value={money(stats.overdue_cents)}
                        tone={stats.overdue_cents > 0 ? 'bad' : undefined}
                        note={`${stats.overdue_count} invoice${stats.overdue_count === 1 ? '' : 's'}`}
                    />
                    <Stat label="Paid this month" value={money(stats.paid_this_month_cents)} />
                    <Stat label={`Paid in ${stats.year}`} value={money(stats.paid_this_year_cents)} />
                    <Stat label={`Expenses in ${stats.year}`} value={money(stats.expenses_this_year_cents)} />
                    <Stat
                        label={`Profit in ${stats.year}`}
                        value={money(stats.profit_this_year_cents)}
                        tone={stats.profit_this_year_cents < 0 ? 'bad' : 'good'}
                        note="Paid invoices minus expenses"
                    />
                </section>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <section className="min-w-0 flex-1 rounded-xl border">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="font-semibold">Recent invoices</h2>
                            <Link
                                href={route('admin.invoices.index')}
                                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                            >
                                All <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        {recentInvoices.length ? (
                            <ul className="divide-y">
                                {recentInvoices.map((i) => (
                                    <li key={i.id}>
                                        <Link
                                            href={route('admin.invoices.show', i.id)}
                                            className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-2 p-4"
                                        >
                                            <span className="min-w-0">
                                                <span className="font-medium">{i.number}</span>{' '}
                                                <span className="text-muted-foreground">· {i.client?.name}</span>
                                                <span className="text-muted-foreground block text-xs">Due {date(i.due_date)}</span>
                                            </span>
                                            <span className="flex items-center gap-3">
                                                <span className="font-medium tabular-nums">{money(i.total_cents)}</span>
                                                <StatusPill status={i.status} overdue={i.is_overdue} />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground p-6 text-center text-sm">No invoices yet.</p>
                        )}
                    </section>

                    <section className="min-w-0 flex-1 rounded-xl border">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="font-semibold">
                                Active projects <span className="text-muted-foreground font-normal">· {stats.active_projects}</span>
                                {stats.leads > 0 && (
                                    <span className="text-muted-foreground font-normal">
                                        {' '}
                                        · {stats.leads} lead{stats.leads === 1 ? '' : 's'}
                                    </span>
                                )}
                            </h2>
                            <Link
                                href={route('admin.projects.index')}
                                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                            >
                                All <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        {activeProjects.length ? (
                            <ul className="divide-y">
                                {activeProjects.map((p) => (
                                    <li key={p.id}>
                                        <Link
                                            href={route('admin.clients.show', p.client_id)}
                                            className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-2 p-4"
                                        >
                                            <span className="min-w-0">
                                                <span className="font-medium">{p.name}</span>{' '}
                                                <span className="text-muted-foreground">· {p.client?.name}</span>
                                                <span className="text-muted-foreground block text-xs">
                                                    {p.due_date ? `Due ${date(p.due_date)}` : 'No due date'}
                                                </span>
                                            </span>
                                            <StatusPill status={p.status} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground p-6 text-center text-sm">No active projects.</p>
                        )}
                    </section>
                </div>

                {clientSites.length > 0 && (
                    <section className="rounded-xl border">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">Client sites</h2>
                            <p className="text-muted-foreground text-sm">Live status of sites you look after, checked every few minutes.</p>
                        </div>
                        <ul className="divide-y">
                            {clientSites.map((site) => (
                                <li key={site.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <span className="min-w-0">
                                        <span className="font-medium">{site.name}</span>
                                        {site.kind && <span className="text-muted-foreground"> · {site.kind}</span>}
                                        <span className="text-muted-foreground block text-xs">
                                            {site.detail}
                                            {site.reservations &&
                                                ` ${site.reservations.pending} pending reservations, ${site.reservations.last_7_days} in the last 7 days.`}
                                        </span>
                                        {site.url && (
                                            <a
                                                href={site.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground text-xs underline underline-offset-2"
                                            >
                                                Open site
                                            </a>
                                        )}
                                    </span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SITE_STATUS[site.status].className}`}>
                                        {SITE_STATUS[site.status].label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
