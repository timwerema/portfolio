import Flash from '@/components/admin/flash';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { money } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';

type Row = { id: number; name: string; company: string | null; email: string | null; phone: string | null; projects_count: number; balance_cents: number };

export default function ClientsIndex({ clients }: { clients: Row[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Clients', href: '/dashboard/clients' }]}>
            <Head title="Clients" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Clients</h1>
                    <Button asChild>
                        <Link href={route('admin.clients.create')}>
                            <Plus className="size-4" /> New client
                        </Link>
                    </Button>
                </div>
                <Flash />
                {clients.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
                        <Users className="size-10" strokeWidth={1.5} />
                        <p className="mt-4 font-medium">No clients yet</p>
                        <p className="mt-1 text-sm">Add one here, or use "Add as client" on a contact message.</p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="text-muted-foreground border-b text-left">
                                <tr>
                                    <th className="p-3 font-medium">Name</th>
                                    <th className="p-3 font-medium">Contact</th>
                                    <th className="p-3 text-right font-medium">Projects</th>
                                    <th className="p-3 text-right font-medium">Balance due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {clients.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/40">
                                        <td className="p-3">
                                            <Link href={route('admin.clients.show', c.id)} className="font-medium hover:underline">
                                                {c.name}
                                            </Link>
                                            {c.company && <span className="text-muted-foreground block text-xs">{c.company}</span>}
                                        </td>
                                        <td className="text-muted-foreground p-3">
                                            {c.email ?? '—'}
                                            {c.phone && <span className="block text-xs">{c.phone}</span>}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">{c.projects_count}</td>
                                        <td className={`p-3 text-right font-medium tabular-nums ${c.balance_cents > 0 ? '' : 'text-muted-foreground'}`}>{money(c.balance_cents)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
