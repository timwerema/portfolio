import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type Client } from '@/types/business';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';

export default function ClientForm({
    client,
    prefill,
}: {
    client: Client | null;
    prefill: Partial<Record<'name' | 'email' | 'company' | 'phone' | 'notes', string>>;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: client?.name ?? prefill.name ?? '',
        company: client?.company ?? prefill.company ?? '',
        email: client?.email ?? prefill.email ?? '',
        phone: client?.phone ?? prefill.phone ?? '',
        notes: client?.notes ?? prefill.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (client) put(route('admin.clients.update', client.id));
        else post(route('admin.clients.store'));
    };

    const title = client ? `Edit ${client.name}` : 'New client';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Clients', href: '/dashboard/clients' },
                { title: client ? client.name : 'New', href: '#' },
            ]}
        >
            <Head title={title} />
            <form onSubmit={submit} className="max-w-2xl space-y-5 p-4">
                <h1 className="text-xl font-semibold">{title}</h1>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company">Business (optional)</Label>
                        <Input id="company" value={data.company} onChange={(e) => setData('company', e.target.value)} />
                        <InputError message={errors.company} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        <InputError message={errors.phone} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        rows={5}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="How you met, what they need, preferences…"
                    />
                    <InputError message={errors.notes} />
                </div>
                <Button type="submit" disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />} {client ? 'Save changes' : 'Add client'}
                </Button>
            </form>
        </AppLayout>
    );
}
