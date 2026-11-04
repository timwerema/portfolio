import Flash from '@/components/admin/flash';
import StatusPill from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { date, money } from '@/lib/format';
import { type Client, type Invoice, type Project } from '@/types/business';
import { Head, Link, router } from '@inertiajs/react';
import { Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';

type Props = { client: Client & { projects: Project[]; invoices: Invoice[] }; balance_cents: number };

export default function ClientShow({ client, balance_cents }: Props) {
    const destroy = () => {
        if (window.confirm(`Delete ${client.name}? Their projects and invoices will be deleted too.`))
            router.delete(route('admin.clients.destroy', client.id));
    };
    const paid = client.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_cents, 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Clients', href: '/dashboard/clients' },
                { title: client.name, href: `/dashboard/clients/${client.id}` },
            ]}
        >
            <Head title={client.name} />
            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{client.name}</h1>
                        {client.company && <p className="text-muted-foreground">{client.company}</p>}
                        <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {client.email && (
                                <a href={`mailto:${client.email}`} className="hover:text-foreground inline-flex items-center gap-1.5">
                                    <Mail className="size-4" /> {client.email}
                                </a>
                            )}
                            {client.phone && (
                                <a href={`tel:${client.phone}`} className="hover:text-foreground inline-flex items-center gap-1.5">
                                    <Phone className="size-4" /> {client.phone}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.clients.edit', client.id)}>
                                <Pencil className="size-4" /> Edit
                            </Link>
                        </Button>
                        <Button variant="ghost" className="text-red-600" onClick={destroy}>
                            <Trash2 className="size-4" /> Delete
                        </Button>
                    </div>
                </div>

                <Flash />

                <div className="flex flex-wrap gap-3">
                    <div className="flex-[1_1_180px] rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Balance due</p>
                        <p className="text-2xl font-semibold tabular-nums">{money(balance_cents)}</p>
                    </div>
                    <div className="flex-[1_1_180px] rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Paid to date</p>
                        <p className="text-2xl font-semibold tabular-nums">{money(paid)}</p>
                    </div>
                </div>

                {client.notes && <p className="bg-muted/40 rounded-xl border p-4 text-sm whitespace-pre-line">{client.notes}</p>}

                <section className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Projects</h2>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={route('admin.projects.create', { client_id: client.id })}>
                                <Plus className="size-4" /> Project
                            </Link>
                        </Button>
                    </div>
                    {client.projects.length ? (
                        <ul className="divide-y">
                            {client.projects.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <Link href={route('admin.projects.edit', p.id)} className="font-medium hover:underline">
                                            {p.name}
                                        </Link>
                                        <p className="text-muted-foreground text-xs">
                                            {[p.package, p.budget_cents ? money(p.budget_cents) : null, p.due_date ? `due ${date(p.due_date)}` : null]
                                                .filter(Boolean)
                                                .join(' · ') || 'No details yet'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusPill status={p.status} />
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={route('admin.invoices.create', { project_id: p.id })}>Invoice</Link>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground p-6 text-center text-sm">No projects yet.</p>
                    )}
                </section>

                <section className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Invoices</h2>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={route('admin.invoices.create', { client_id: client.id })}>
                                <Plus className="size-4" /> Invoice
                            </Link>
                        </Button>
                    </div>
                    {client.invoices.length ? (
                        <ul className="divide-y">
                            {client.invoices.map((i) => (
                                <li key={i.id}>
                                    <Link
                                        href={route('admin.invoices.show', i.id)}
                                        className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 p-4"
                                    >
                                        <span>
                                            <span className="font-medium">{i.number}</span>
                                            <span className="text-muted-foreground"> · {date(i.issue_date)}</span>
                                            {i.project && <span className="text-muted-foreground block text-xs">{i.project.name}</span>}
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
            </div>
        </AppLayout>
    );
}
