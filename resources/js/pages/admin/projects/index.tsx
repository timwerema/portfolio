import Flash from '@/components/admin/flash';
import NativeSelect from '@/components/admin/native-select';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { date, labelize, money } from '@/lib/format';
import { type Project, type ProjectStatus } from '@/types/business';
import { Head, Link, router } from '@inertiajs/react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { useState } from 'react';

export default function ProjectsIndex({ projects, statuses }: { projects: Project[]; statuses: ProjectStatus[] }) {
    const [filter, setFilter] = useState<'open' | 'all' | ProjectStatus>('open');
    const shown = projects.filter((p) =>
        filter === 'all' ? true : filter === 'open' ? !['completed', 'on_hold'].includes(p.status) : p.status === filter,
    );

    const setStatus = (p: Project, status: string) => router.patch(route('admin.projects.status', p.id), { status }, { preserveScroll: true });

    return (
        <AppLayout breadcrumbs={[{ title: 'Projects', href: '/dashboard/projects' }]}>
            <Head title="Projects" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Projects</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <NativeSelect
                            aria-label="Filter projects"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className="w-auto"
                        >
                            <option value="open">Open</option>
                            <option value="all">All</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {labelize(s)}
                                </option>
                            ))}
                        </NativeSelect>
                        <Button asChild>
                            <Link href={route('admin.projects.create')}>
                                <Plus className="size-4" /> New project
                            </Link>
                        </Button>
                    </div>
                </div>
                <Flash />
                {shown.length === 0 ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
                        <BriefcaseBusiness className="size-10" strokeWidth={1.5} />
                        <p className="mt-4 font-medium">No projects here</p>
                        <p className="mt-1 text-sm">Projects belong to a client. Start a lead the moment someone gets in touch.</p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="text-muted-foreground border-b text-left">
                                <tr>
                                    <th className="p-3 font-medium">Project</th>
                                    <th className="p-3 font-medium">Package</th>
                                    <th className="p-3 text-right font-medium">Budget</th>
                                    <th className="p-3 font-medium">Due</th>
                                    <th className="p-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {shown.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/40">
                                        <td className="p-3">
                                            <Link href={route('admin.projects.edit', p.id)} className="font-medium hover:underline">
                                                {p.name}
                                            </Link>
                                            <Link
                                                href={route('admin.clients.show', p.client_id)}
                                                className="text-muted-foreground block text-xs hover:underline"
                                            >
                                                {p.client?.name}
                                            </Link>
                                        </td>
                                        <td className="text-muted-foreground p-3">{p.package ?? '—'}</td>
                                        <td className="p-3 text-right tabular-nums">{p.budget_cents ? money(p.budget_cents) : '—'}</td>
                                        <td className="text-muted-foreground p-3">{date(p.due_date)}</td>
                                        <td className="p-3">
                                            <NativeSelect
                                                aria-label={`Status of ${p.name}`}
                                                value={p.status}
                                                onChange={(e) => setStatus(p, e.target.value)}
                                                className="h-8 w-36"
                                            >
                                                {statuses.map((s) => (
                                                    <option key={s} value={s}>
                                                        {labelize(s)}
                                                    </option>
                                                ))}
                                            </NativeSelect>
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
