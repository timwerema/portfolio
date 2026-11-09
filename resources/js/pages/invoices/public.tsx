import { date, money } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { CircleCheck, Printer } from 'lucide-react';

type PublicInvoice = {
    number: string;
    status: 'sent' | 'paid' | 'void';
    notes: string | null;
    payment_link: string | null;
    total_cents: number;
    is_overdue: boolean;
    issue_date: string;
    due_date: string;
    paid_at: string | null;
    client: { name: string; company: string | null };
    items: { description: string; quantity: number; unit_price_cents: number; amount_cents: number }[];
};

export default function PublicInvoicePage({
    invoice,
    studio,
}: {
    invoice: PublicInvoice;
    studio: { name: string; email: string | null; location: string };
}) {
    return (
        <>
            <Head title={`Invoice ${invoice.number} · ${studio.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div className="hardwood bg-maple text-ink font-body min-h-screen px-4 py-10 print:bg-white print:p-0">
                <article className="bg-maple-light border-rule mx-auto max-w-3xl rounded-md border-2 p-6 sm:p-10 print:border-0 print:p-0">
                    <header className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <span className="bg-royal font-display flex size-12 items-center justify-center rounded-full text-lg text-white print:border print:border-black">
                                TW
                            </span>
                            <div>
                                <p className="font-display text-2xl uppercase">{studio.name}</p>
                                <p className="text-ink-muted text-sm">
                                    {studio.location}
                                    {studio.email && ` · ${studio.email}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-cond text-royal text-lg font-bold tracking-[0.12em] uppercase">Invoice</p>
                            <p className="font-display text-3xl">{invoice.number}</p>
                        </div>
                    </header>

                    <div className="mt-10 flex flex-wrap justify-between gap-6">
                        <div>
                            <p className="font-cond text-ink-muted text-sm font-bold tracking-[0.1em] uppercase">Bill to</p>
                            <p className="font-semibold">{invoice.client.name}</p>
                            {invoice.client.company && <p>{invoice.client.company}</p>}
                        </div>
                        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
                            <dt className="text-ink-muted">Issued</dt>
                            <dd className="text-right">{date(invoice.issue_date)}</dd>
                            <dt className="text-ink-muted">Due</dt>
                            <dd className={`text-right ${invoice.is_overdue ? 'text-danger font-semibold' : ''}`}>{date(invoice.due_date)}</dd>
                        </dl>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full min-w-[460px] text-left">
                            <thead className="border-rule border-b-2">
                                <tr className="font-cond text-sm tracking-[0.08em] uppercase">
                                    <th className="py-2">Description</th>
                                    <th className="py-2 text-right">Qty</th>
                                    <th className="py-2 text-right">Rate</th>
                                    <th className="py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-maple-line divide-y">
                                {invoice.items.map((it, i) => (
                                    <tr key={i}>
                                        <td className="py-3">{it.description}</td>
                                        <td className="py-3 text-right tabular-nums">{it.quantity}</td>
                                        <td className="py-3 text-right tabular-nums">{money(it.unit_price_cents)}</td>
                                        <td className="py-3 text-right tabular-nums">{money(it.amount_cents)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-rule border-t-2">
                                    <td colSpan={3} className="font-cond pt-4 text-right text-lg font-bold tracking-[0.06em] uppercase">
                                        Total due
                                    </td>
                                    <td className="font-display pt-4 text-right text-3xl">
                                        {invoice.status === 'paid' ? money(0) : money(invoice.total_cents)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {invoice.notes && <p className="text-ink-soft mt-8 whitespace-pre-line">{invoice.notes}</p>}

                    <div className="mt-10 flex flex-wrap items-center gap-3 print:hidden">
                        {invoice.status === 'paid' ? (
                            <p role="status" className="flex items-center gap-2 font-semibold text-emerald-800">
                                <CircleCheck className="size-5" /> Paid {invoice.paid_at ? date(invoice.paid_at) : ''} — thank you!
                            </p>
                        ) : invoice.status === 'void' ? (
                            <p role="status" className="font-semibold">
                                This invoice has been cancelled. Nothing is owed.
                            </p>
                        ) : (
                            invoice.payment_link && (
                                <a
                                    href={invoice.payment_link}
                                    className="bg-royal hover:bg-royal-dark font-cond inline-flex min-h-[54px] items-center rounded-full px-8 text-xl font-bold tracking-[0.06em] text-white uppercase"
                                >
                                    Pay {money(invoice.total_cents)} now
                                </a>
                            )
                        )}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="border-rule text-strong font-cond inline-flex min-h-[54px] items-center gap-2 rounded-full border-2 px-6 text-lg font-bold tracking-[0.06em] uppercase"
                        >
                            <Printer className="size-5" /> Print / save PDF
                        </button>
                    </div>
                    {invoice.status === 'sent' && !invoice.payment_link && studio.email && (
                        <p className="text-ink-soft mt-4 text-sm print:hidden">
                            Questions or ready to pay? Email{' '}
                            <a href={`mailto:${studio.email}?subject=Invoice ${invoice.number}`} className="text-royal underline">
                                {studio.email}
                            </a>
                            .
                        </p>
                    )}
                </article>
            </div>
        </>
    );
}
