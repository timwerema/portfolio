import Flash from '@/components/admin/flash';
import StatusPill from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { date, money } from '@/lib/format';
import { type Invoice } from '@/types/business';
import { Head, Link } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';

const filters = [
    [null, 'All'],
    ['draft', 'Drafts'],
    ['sent', 'Unpaid'],
    ['paid', 'Paid'],
    ['void', 'Void'],
] as const;

export default function InvoicesIndex({ invoices, status }: { invoices: Invoice[]; status: string | null }) {
    const total = invoices.filter((i) => i.status !== 'void').reduce((s, i) => s + i.total_cents, 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Invoices', href: '/dashboard/invoices' }]}>
            <Head title="Invoices" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Invoices</h1>
                    <Button asChild>
                        <Link href={route('admin.invoices.create')}>
                            <Plus className="size-4" /> New invoice
                        </Link>
                    </Button>
                </div>
                <nav aria-label="Filter invoices" className="flex flex-wrap gap-1">
                    {filters.map(([value, label]) => (
                        <Link
                            key={label}
                            href={route('admin.invoices.index', value ? { status: value } : {})}
                            preserveScroll
                            aria-current={status === value || (!status && !value) ? 'page' : undefined}
                            className="aria-[current=page]:bg-foreground aria-[current=page]:text-background hover:bg-muted inline-flex min-h-9 items-center rounded-full px-3 text-sm"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                <Flash />
                {invoices.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
                        <FileText className="size-10" strokeWidth={1.5} />
                        <p className="mt-4 font-medium">No invoices here</p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="text-muted-foreground border-b text-left">
                                <tr>
                                    <th className="p-3 font-medium">Invoice</th>
                                    <th className="p-3 font-medium">Client</th>
                                    <th className="p-3 font-medium">Issued</th>
                                    <th className="p-3 font-medium">Due</th>
                                    <th className="p-3 text-right font-medium">Amount</th>
                                    <th className="p-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map((i) => (
                                    <tr key={i.id} className="hover:bg-muted/40">
                                        <td className="p-3">
                                            <Link href={route('admin.invoices.show', i.id)} className="font-medium hover:underline">
                                                {i.number}
                                            </Link>
                                        </td>
                                        <td className="p-3">{i.client?.name}</td>
                                        <td className="text-muted-foreground p-3">{date(i.issue_date)}</td>
                                        <td className={`p-3 ${i.is_overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{date(i.due_date)}</td>
                                        <td className="p-3 text-right font-medium tabular-nums">{money(i.total_cents)}</td>
                                        <td className="p-3">
                                            <StatusPill status={i.status} overdue={i.is_overdue} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t">
                                <tr>
                                    <td colSpan={4} className="text-muted-foreground p-3 text-right">
                                        Total (excluding void)
                                    </td>
                                    <td className="p-3 text-right font-semibold tabular-nums">{money(total)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
