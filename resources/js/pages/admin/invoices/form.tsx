import NativeSelect from '@/components/admin/native-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { addDays, money, today } from '@/lib/format';
import { type Invoice } from '@/types/business';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

type Line = { description: string; quantity: string | number; unit_price: string | number };
type Props = {
    invoice: Invoice | null;
    nextNumber: string;
    clients: { id: number; name: string; email: string | null }[];
    projects: { id: number; name: string; client_id: number }[];
    prefill: { client_id?: number | null; project_id?: number | null; items?: Line[] | null };
};

export default function InvoiceForm({ invoice, nextNumber, clients, projects, prefill }: Props) {
    const issue = invoice?.issue_date ?? today();
    const { data, setData, post, put, processing, errors } = useForm<{
        client_id: string;
        project_id: string;
        issue_date: string;
        due_date: string;
        notes: string;
        payment_link: string;
        items: Line[];
    }>({
        client_id: String(invoice?.client_id ?? prefill.client_id ?? ''),
        project_id: String(invoice?.project_id ?? prefill.project_id ?? ''),
        issue_date: issue,
        due_date: invoice?.due_date ?? addDays(issue, 14),
        notes: invoice?.notes ?? 'Thank you for your business!',
        payment_link: invoice?.payment_link ?? '',
        items: invoice?.items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price_cents / 100 })) ??
            prefill.items ?? [{ description: '', quantity: 1, unit_price: '' }],
    });

    const err = errors as Record<string, string>;
    const lineTotal = (l: Line) => Math.round((Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * 100);
    const total = data.items.reduce((s, l) => s + lineTotal(l), 0);
    const clientProjects = projects.filter((p) => String(p.client_id) === data.client_id);

    const setLine = (i: number, key: keyof Line, value: string) =>
        setData(
            'items',
            data.items.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
        );
    const addLine = () => setData('items', [...data.items, { description: '', quantity: 1, unit_price: '' }]);
    const removeLine = (i: number) =>
        setData(
            'items',
            data.items.filter((_, idx) => idx !== i),
        );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (invoice) put(route('admin.invoices.update', invoice.id));
        else post(route('admin.invoices.store'));
    };

    if (clients.length === 0) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Invoices', href: '/dashboard/invoices' }]}>
                <Head title="New invoice" />
                <div className="p-4">
                    <p className="mb-4">Add a client first. Every invoice is billed to one.</p>
                    <Button asChild>
                        <Link href={route('admin.clients.create')}>New client</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: '/dashboard/invoices' },
                { title: invoice ? invoice.number : 'New', href: '#' },
            ]}
        >
            <Head title={invoice ? `Edit ${invoice.number}` : 'New invoice'} />
            <form onSubmit={submit} className="max-w-3xl space-y-6 p-4">
                <h1 className="text-xl font-semibold">{invoice ? `Edit ${invoice.number}` : `New invoice · ${nextNumber}`}</h1>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="client_id">Bill to</Label>
                        <NativeSelect
                            id="client_id"
                            value={data.client_id}
                            onChange={(e) => {
                                setData((d) => ({ ...d, client_id: e.target.value, project_id: '' }));
                            }}
                            required
                        >
                            <option value="">Choose a client…</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.client_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="project_id">Project (optional)</Label>
                        <NativeSelect
                            id="project_id"
                            value={data.project_id}
                            onChange={(e) => setData('project_id', e.target.value)}
                            disabled={!clientProjects.length}
                        >
                            <option value="">—</option>
                            {clientProjects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.project_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="issue_date">Issue date</Label>
                        <Input id="issue_date" type="date" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} required />
                        <InputError message={errors.issue_date} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="due_date">Due date</Label>
                        <Input id="due_date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} required />
                        <InputError message={errors.due_date} />
                    </div>
                </div>

                <fieldset className="rounded-xl border">
                    <legend className="sr-only">Line items</legend>
                    <div className="text-muted-foreground hidden grid-cols-[1fr_80px_120px_110px_40px] gap-3 border-b px-4 py-2 text-xs font-medium sm:grid">
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit price ($)</span>
                        <span className="text-right">Amount</span>
                        <span />
                    </div>
                    <ul className="divide-y">
                        {data.items.map((line, i) => (
                            <li key={i} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1fr_80px_120px_110px_40px] sm:items-start">
                                <div className="col-span-2 sm:col-span-1">
                                    <Input
                                        aria-label={`Line ${i + 1} description`}
                                        value={line.description}
                                        onChange={(e) => setLine(i, 'description', e.target.value)}
                                        placeholder="Business website (5 pages)"
                                    />
                                    <InputError message={err[`items.${i}.description`]} />
                                </div>
                                <div>
                                    <Input
                                        aria-label={`Line ${i + 1} quantity`}
                                        inputMode="decimal"
                                        value={line.quantity}
                                        onChange={(e) => setLine(i, 'quantity', e.target.value)}
                                    />
                                    <InputError message={err[`items.${i}.quantity`]} />
                                </div>
                                <div>
                                    <Input
                                        aria-label={`Line ${i + 1} unit price`}
                                        inputMode="decimal"
                                        value={line.unit_price}
                                        onChange={(e) => setLine(i, 'unit_price', e.target.value)}
                                        placeholder="1750"
                                    />
                                    <InputError message={err[`items.${i}.unit_price`]} />
                                </div>
                                <p className="self-center text-right font-medium tabular-nums">{money(lineTotal(line))}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove line ${i + 1}`}
                                    onClick={() => removeLine(i)}
                                    disabled={data.items.length === 1}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
                        <Button type="button" variant="outline" size="sm" onClick={addLine}>
                            <Plus className="size-4" /> Add line
                        </Button>
                        <p className="text-lg font-semibold tabular-nums">Total {money(total)}</p>
                    </div>
                    <InputError message={errors.items} className="px-4 pb-4" />
                </fieldset>

                <div className="grid gap-2">
                    <Label htmlFor="payment_link">Payment link (optional)</Label>
                    <Input
                        id="payment_link"
                        type="url"
                        value={data.payment_link}
                        onChange={(e) => setData('payment_link', e.target.value)}
                        placeholder="https://square.link/… or https://buy.stripe.com/…"
                    />
                    <p className="text-muted-foreground text-xs">
                        Paste a Square, Stripe or PayPal payment link. The client sees a "Pay now" button on their invoice.
                    </p>
                    <InputError message={errors.payment_link} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="notes">Notes on the invoice</Label>
                    <Textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    <InputError message={errors.notes} />
                </div>

                <Button type="submit" disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />} {invoice ? 'Save changes' : 'Save as draft'}
                </Button>
            </form>
        </AppLayout>
    );
}
