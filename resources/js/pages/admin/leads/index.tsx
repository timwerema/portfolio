import Flash from '@/components/admin/flash';
import NativeSelect from '@/components/admin/native-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { addDays, date } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { BellRing, Check, ExternalLink, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

/*
 * Leads: who Timasi has contacted (or plans to), through which channel, where each one stands and when to follow up.
 * Open leads come first, and the ones due for a follow-up sit at the top with a marker.
 */

type Lead = {
    id: number;
    business: string;
    contact_name: string | null;
    channel: string;
    contact_info: string | null;
    interest: string;
    status: string;
    last_contacted_on: string | null;
    follow_up_on: string | null;
    demo_url: string | null;
    notes: string | null;
};
type Props = {
    leads: Lead[];
    today: string;
    statuses: string[];
    open_statuses: string[];
    channels: string[];
    interests: string[];
    counts: { open: number; due: number; won: number };
};

export default function LeadsIndex({ leads, today, statuses, open_statuses, channels, interests, counts }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        business: '',
        contact_name: '',
        channel: channels[0],
        contact_info: '',
        interest: interests[0],
        status: statuses[0],
        demo_url: '',
        notes: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.leads.store'), {
            preserveScroll: true,
            onSuccess: () => reset('business', 'contact_name', 'contact_info', 'demo_url', 'notes'),
        });
    };

    const patch = (lead: Lead, changes: Partial<Lead>) => router.patch(route('admin.leads.update', lead.id), changes, { preserveScroll: true });

    /** "I just contacted them": stamps today, moves a new lead to Contacted and sets a follow-up 5 days out. */
    const contactedToday = (lead: Lead) =>
        patch(lead, {
            last_contacted_on: today,
            follow_up_on: addDays(today, 5),
            ...(lead.status === 'To contact' ? { status: 'Contacted' } : {}),
        });

    const isDue = (l: Lead) => open_statuses.includes(l.status) && !!l.follow_up_on && l.follow_up_on <= today;

    return (
        <AppLayout breadcrumbs={[{ title: 'Leads', href: '/dashboard/leads' }]}>
            <Head title="Leads" />
            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h1 className="text-xl font-semibold">Leads</h1>
                    <p className="text-muted-foreground text-sm">
                        {counts.open} open · {counts.due} to follow up · {counts.won} won
                    </p>
                </div>
                <Flash />

                <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
                    <div className="grid min-w-48 flex-[2] gap-1.5">
                        <Label htmlFor="business">Business</Label>
                        <Input
                            id="business"
                            value={data.business}
                            onChange={(e) => setData('business', e.target.value)}
                            placeholder="La TacoTrona"
                            required
                        />
                        <InputError message={errors.business} />
                    </div>
                    <div className="grid min-w-36 flex-1 gap-1.5">
                        <Label htmlFor="contact_name">Contact (optional)</Label>
                        <Input
                            id="contact_name"
                            value={data.contact_name}
                            onChange={(e) => setData('contact_name', e.target.value)}
                            placeholder="Sandra"
                        />
                    </div>
                    <div className="grid w-40 gap-1.5">
                        <Label htmlFor="channel">Reached through</Label>
                        <NativeSelect id="channel" value={data.channel} onChange={(e) => setData('channel', e.target.value)}>
                            {channels.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="grid w-36 gap-1.5">
                        <Label htmlFor="interest">For</Label>
                        <NativeSelect id="interest" value={data.interest} onChange={(e) => setData('interest', e.target.value)}>
                            {interests.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="grid min-w-48 flex-[2] gap-1.5">
                        <Label htmlFor="demo_url">Concept link (optional)</Label>
                        <Input
                            id="demo_url"
                            type="url"
                            value={data.demo_url}
                            onChange={(e) => setData('demo_url', e.target.value)}
                            placeholder="https://..."
                        />
                        <InputError message={errors.demo_url} />
                    </div>
                    <div className="grid min-w-56 flex-[3] gap-1.5">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Input
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="No website, sells on Facebook"
                        />
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Add lead
                    </Button>
                </form>

                {leads.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
                        No leads yet. Add the first business you plan to contact.
                    </p>
                ) : (
                    <div className="relative overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="text-muted-foreground border-b text-left">
                                <tr>
                                    <th className="p-3 font-medium">Business</th>
                                    <th className="p-3 font-medium">Status</th>
                                    <th className="p-3 font-medium">Last contact</th>
                                    <th className="p-3 font-medium">Follow up</th>
                                    <th className="p-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {leads.map((l) => (
                                    <tr key={l.id} className={open_statuses.includes(l.status) ? '' : 'opacity-60'}>
                                        <td className="max-w-[340px] p-3 align-top">
                                            <span className="font-medium">{l.business}</span>
                                            <span className="text-muted-foreground block text-xs">
                                                {[l.interest, l.channel, l.contact_name, l.contact_info].filter(Boolean).join(' · ')}
                                            </span>
                                            {l.notes && <span className="text-muted-foreground mt-1 block text-xs">{l.notes}</span>}
                                            {l.demo_url && (
                                                <a
                                                    href={l.demo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-2"
                                                >
                                                    Concept <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-3 align-top">
                                            <NativeSelect
                                                aria-label={`Status of ${l.business}`}
                                                className="w-40"
                                                value={l.status}
                                                onChange={(e) => patch(l, { status: e.target.value })}
                                            >
                                                {statuses.map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </NativeSelect>
                                        </td>
                                        <td className="text-muted-foreground p-3 align-top whitespace-nowrap">
                                            {l.last_contacted_on ? date(l.last_contacted_on) : '—'}
                                        </td>
                                        <td className="p-3 align-top">
                                            <span className="flex items-center gap-2">
                                                <Input
                                                    type="date"
                                                    aria-label={`Follow-up date for ${l.business}`}
                                                    className="w-40"
                                                    value={l.follow_up_on ?? ''}
                                                    onChange={(e) => patch(l, { follow_up_on: e.target.value || null })}
                                                />
                                                {isDue(l) && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-amber-700 dark:text-amber-300">
                                                        <BellRing className="size-3.5" /> Due
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right align-top whitespace-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => contactedToday(l)}>
                                                <Check className="size-4" /> Contacted today
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete ${l.business}`}
                                                onClick={() =>
                                                    window.confirm(`Delete ${l.business}?`) &&
                                                    router.delete(route('admin.leads.destroy', l.id), { preserveScroll: true })
                                                }
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
            </div>
        </AppLayout>
    );
}
