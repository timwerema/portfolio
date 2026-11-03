import Flash from '@/components/admin/flash';
import NativeSelect from '@/components/admin/native-select';
import StatusPill from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { date, money, today } from '@/lib/format';
import { type Invoice } from '@/types/business';
import { Head, Link, router } from '@inertiajs/react';
import { Ban, Check, CircleDollarSign, Copy, ExternalLink, Pencil, Send, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';

export default function InvoiceShow({ invoice }: { invoice: Invoice }) {
    const [copied, setCopied] = useState(false);
    const [paying, setPaying] = useState(false);
    const [method, setMethod] = useState('Stripe');
    const [paidOn, setPaidOn] = useState(today());

    const setStatus = (status: string, extra: Record<string, string> = {}) =>
        router.patch(route('admin.invoices.status', invoice.id), { status, ...extra }, { preserveScroll: true, onSuccess: () => setPaying(false) });

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(invoice.public_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this link:', invoice.public_url);
        }
    };

    const editable = invoice.status !== 'paid';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: '/dashboard/invoices' },
                { title: invoice.number, href: `/dashboard/invoices/${invoice.id}` },
            ]}
        >
            <Head title={invoice.number} />
            <div className="flex min-w-0 flex-col gap-6 p-4 lg:flex-row">
                {/* Invoice preview */}
                <div className="min-w-0 flex-1 space-y-4">
                    <Flash />
                    <div className="rounded-xl border p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold">{invoice.number}</h1>
                                <p className="text-muted-foreground text-sm">
                                    Issued {date(invoice.issue_date)} · Due {date(invoice.due_date)}
                                </p>
                            </div>
                            <StatusPill status={invoice.status} overdue={invoice.is_overdue} />
                        </div>
                        <div className="mt-6">
                            <p className="text-muted-foreground text-xs uppercase">Bill to</p>
                            <Link href={route('admin.clients.show', invoice.client_id)} className="font-medium hover:underline">
                                {invoice.client?.name}
                            </Link>
                            {invoice.client?.company && <p className="text-sm">{invoice.client.company}</p>}
                            {invoice.client?.email && <p className="text-muted-foreground text-sm">{invoice.client.email}</p>}
                            {invoice.project && <p className="text-muted-foreground mt-1 text-sm">Project: {invoice.project.name}</p>}
                        </div>
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                                <thead className="text-muted-foreground border-b text-left">
                                    <tr>
                                        <th className="py-2 font-medium">Description</th>
                                        <th className="py-2 text-right font-medium">Qty</th>
                                        <th className="py-2 text-right font-medium">Unit</th>
                                        <th className="py-2 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoice.items.map((it, i) => (
                                        <tr key={it.id ?? i}>
                                            <td className="py-2">{it.description}</td>
                                            <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                                            <td className="py-2 text-right tabular-nums">{money(it.unit_price_cents)}</td>
                                            <td className="py-2 text-right tabular-nums">{money(Math.round(it.quantity * it.unit_price_cents))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t">
                                        <td colSpan={3} className="pt-3 text-right font-medium">
                                            Total
                                        </td>
                                        <td className="pt-3 text-right text-lg font-semibold tabular-nums">{money(invoice.total_cents)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {invoice.notes && <p className="text-muted-foreground mt-6 text-sm whitespace-pre-line">{invoice.notes}</p>}
                        {invoice.status === 'paid' && (
                            <p className="mt-6 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Paid {date(invoice.paid_at)}
                                {invoice.payment_method && ` via ${invoice.payment_method}`}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <aside className="w-full shrink-0 space-y-4 lg:w-80">
                    <div className="space-y-2 rounded-xl border p-4">
                        <p className="text-sm font-medium">Client's invoice link</p>
                        <code className="bg-muted block truncate rounded px-2 py-1.5 text-xs">{invoice.public_url}</code>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={copy}>
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
                            </Button>
                            {invoice.status !== 'draft' && (
                                <Button size="sm" variant="outline" asChild>
                                    <a href={invoice.public_url} target="_blank" rel="noreferrer">
                                        <ExternalLink className="size-4" /> Open
                                    </a>
                                </Button>
                            )}
                        </div>
                        {invoice.status === 'draft' && <p className="text-muted-foreground text-xs">The link works once the invoice is sent.</p>}
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl border p-4">
                        {['draft', 'sent'].includes(invoice.status) && (
                            <Button onClick={() => router.post(route('admin.invoices.send', invoice.id), {}, { preserveScroll: true })} disabled={!invoice.client?.email}>
                                <Send className="size-4" /> {invoice.status === 'sent' ? 'Resend to client' : 'Email to client'}
                            </Button>
                        )}
                        {!invoice.client?.email && <p className="text-muted-foreground text-xs">Add the client's email to send from here.</p>}
                        {invoice.status === 'draft' && (
                            <Button variant="outline" onClick={() => setStatus('sent')}>
                                Mark sent (I'll send it myself)
                            </Button>
                        )}
                        {invoice.status === 'sent' &&
                            (paying ? (
                                <div className="space-y-3 rounded-lg border p-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="method">Paid via</Label>
                                        <NativeSelect id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                                            {['Stripe', 'Zelle', 'Venmo', 'Cash App', 'Cash', 'Check', 'Bank transfer', 'Other'].map((m) => (
                                                <option key={m}>{m}</option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="paid_at">Date paid</Label>
                                        <Input id="paid_at" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
                                    </div>
                                    <Button className="w-full" onClick={() => setStatus('paid', { payment_method: method, paid_at: paidOn })}>
                                        <Check className="size-4" /> Confirm payment
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setPaying(true)}>
                                    <CircleDollarSign className="size-4" /> Record payment
                                </Button>
                            ))}
                        {invoice.status === 'paid' && (
                            <Button variant="outline" onClick={() => setStatus('sent')}>
                                <Undo2 className="size-4" /> Mark unpaid
                            </Button>
                        )}
                        {editable && (
                            <Button variant="outline" asChild>
                                <Link href={route('admin.invoices.edit', invoice.id)}>
                                    <Pencil className="size-4" /> Edit
                                </Link>
                            </Button>
                        )}
                        {['draft', 'sent'].includes(invoice.status) && (
                            <Button variant="ghost" onClick={() => window.confirm('Void this invoice? It will no longer count as owed.') && setStatus('void')}>
                                <Ban className="size-4" /> Void
                            </Button>
                        )}
                        {invoice.status === 'void' && (
                            <Button variant="outline" onClick={() => setStatus('draft')}>
                                <Undo2 className="size-4" /> Restore as draft
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => window.confirm(`Delete ${invoice.number} permanently?`) && router.delete(route('admin.invoices.destroy', invoice.id))}
                        >
                            <Trash2 className="size-4" /> Delete
                        </Button>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
