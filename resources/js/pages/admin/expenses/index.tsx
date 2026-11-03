import Flash from '@/components/admin/flash';
import NativeSelect from '@/components/admin/native-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { date, money, today } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

type Expense = { id: number; date: string; vendor: string; category: string; amount_cents: number; notes: string | null; project?: { id: number; name: string } | null };
type Props = {
    expenses: Expense[];
    year: number;
    total_cents: number;
    by_category: Record<string, number>;
    categories: string[];
    projects: { id: number; name: string }[];
};

export default function ExpensesIndex({ expenses, year, total_cents, by_category, categories, projects }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({ date: today(), vendor: '', category: categories[0], amount: '', project_id: '', notes: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.expenses.store'), { preserveScroll: true, onSuccess: () => reset('vendor', 'amount', 'notes', 'project_id') });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Expenses', href: '/dashboard/expenses' }]}>
            <Head title="Expenses" />
            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Expenses</h1>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild aria-label="Previous year">
                            <Link href={route('admin.expenses.index', { year: year - 1 })}>
                                <ChevronLeft className="size-4" />
                            </Link>
                        </Button>
                        <span className="w-14 text-center font-medium">{year}</span>
                        <Button variant="ghost" size="icon" asChild aria-label="Next year">
                            <Link href={route('admin.expenses.index', { year: year + 1 })}>
                                <ChevronRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
                <Flash />

                <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
                    <div className="grid w-40 gap-1.5">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} required />
                        <InputError message={errors.date} />
                    </div>
                    <div className="grid min-w-40 flex-1 gap-1.5">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Input id="vendor" value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} placeholder="DigitalOcean" required />
                        <InputError message={errors.vendor} />
                    </div>
                    <div className="grid w-40 gap-1.5">
                        <Label htmlFor="category">Category</Label>
                        <NativeSelect id="category" value={data.category} onChange={(e) => setData('category', e.target.value)}>
                            {categories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="grid w-32 gap-1.5">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input id="amount" inputMode="decimal" value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="6.00" required />
                        <InputError message={errors.amount} />
                    </div>
                    <div className="grid w-48 gap-1.5">
                        <Label htmlFor="project_id">Project (optional)</Label>
                        <NativeSelect id="project_id" value={data.project_id} onChange={(e) => setData('project_id', e.target.value)}>
                            <option value="">—</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
                    </Button>
                </form>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <section className="min-w-0 flex-1">
                        {expenses.length === 0 ? (
                            <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">No expenses recorded for {year}.</p>
                        ) : (
                            <div className="relative overflow-x-auto rounded-xl border">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead className="text-muted-foreground border-b text-left">
                                        <tr>
                                            <th className="p-3 font-medium">Date</th>
                                            <th className="p-3 font-medium">Vendor</th>
                                            <th className="p-3 font-medium">Category</th>
                                            <th className="p-3 text-right font-medium">Amount</th>
                                            <th className="p-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {expenses.map((x) => (
                                            <tr key={x.id}>
                                                <td className="text-muted-foreground p-3">{date(x.date)}</td>
                                                <td className="p-3">
                                                    {x.vendor}
                                                    {x.project && <span className="text-muted-foreground block text-xs">{x.project.name}</span>}
                                                </td>
                                                <td className="p-3">{x.category}</td>
                                                <td className="p-3 text-right tabular-nums">{money(x.amount_cents)}</td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Delete ${x.vendor} expense`}
                                                        onClick={() => window.confirm('Delete this expense?') && router.delete(route('admin.expenses.destroy', x.id), { preserveScroll: true })}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                    <aside className="w-full shrink-0 rounded-xl border p-4 lg:w-72">
                        <p className="text-muted-foreground text-sm">Total for {year}</p>
                        <p className="text-2xl font-semibold tabular-nums">{money(total_cents)}</p>
                        {Object.keys(by_category).length > 0 && (
                            <dl className="mt-4 space-y-2 text-sm">
                                {Object.entries(by_category).map(([cat, cents]) => (
                                    <div key={cat}>
                                        <div className="flex justify-between">
                                            <dt>{cat}</dt>
                                            <dd className="tabular-nums">{money(cents)}</dd>
                                        </div>
                                        <div className="bg-muted mt-1 h-1.5 rounded-full" aria-hidden="true">
                                            <div className="bg-foreground/60 h-1.5 rounded-full" style={{ width: `${Math.max(2, (cents / total_cents) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
