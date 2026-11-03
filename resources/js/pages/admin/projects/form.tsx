import NativeSelect from '@/components/admin/native-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { labelize } from '@/lib/format';
import { type Project, type ProjectStatus } from '@/types/business';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

type Props = { project: Project | null; clientId: number | null; clients: { id: number; name: string }[]; statuses: ProjectStatus[]; packages: string[] };

export default function ProjectForm({ project, clientId, clients, statuses, packages }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        client_id: String(project?.client_id ?? clientId ?? ''),
        name: project?.name ?? '',
        package: project?.package ?? '',
        status: project?.status ?? 'lead',
        budget: project?.budget_cents != null ? String(project.budget_cents / 100) : '',
        start_date: project?.start_date ?? '',
        due_date: project?.due_date ?? '',
        notes: project?.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (project) put(route('admin.projects.update', project.id));
        else post(route('admin.projects.store'));
    };

    const title = project ? `Edit ${project.name}` : 'New project';

    if (clients.length === 0) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Projects', href: '/dashboard/projects' }]}>
                <Head title={title} />
                <div className="p-4">
                    <p className="mb-4">Add a client first. Every project belongs to one.</p>
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
                { title: 'Projects', href: '/dashboard/projects' },
                { title: project ? project.name : 'New', href: '#' },
            ]}
        >
            <Head title={title} />
            <form onSubmit={submit} className="max-w-2xl space-y-5 p-4">
                <h1 className="text-xl font-semibold">{title}</h1>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="client_id">Client</Label>
                        <NativeSelect id="client_id" value={data.client_id} onChange={(e) => setData('client_id', e.target.value)} required>
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
                        <Label htmlFor="name">Project name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="New website" required />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="package">Package</Label>
                        <NativeSelect id="package" value={data.package} onChange={(e) => setData('package', e.target.value)}>
                            <option value="">—</option>
                            {packages.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.package} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <NativeSelect id="status" value={data.status} onChange={(e) => setData('status', e.target.value as ProjectStatus)}>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {labelize(s)}
                                </option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.status} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budget">Budget ($)</Label>
                        <Input id="budget" inputMode="decimal" value={data.budget} onChange={(e) => setData('budget', e.target.value)} placeholder="1750" />
                        <InputError message={errors.budget} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Start</Label>
                            <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                            <InputError message={errors.start_date} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="due_date">Due</Label>
                            <Input id="due_date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                            <InputError message={errors.due_date} />
                        </div>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" rows={5} value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Scope, pages, logins, things the client asked for…" />
                    <InputError message={errors.notes} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />} {project ? 'Save changes' : 'Add project'}
                    </Button>
                    {project && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => window.confirm(`Delete ${project.name}?`) && router.delete(route('admin.projects.destroy', project.id))}
                        >
                            <Trash2 className="size-4" /> Delete
                        </Button>
                    )}
                </div>
            </form>
        </AppLayout>
    );
}
