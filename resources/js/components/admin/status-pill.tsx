import { labelize } from '@/lib/format';

const tones: Record<string, string> = {
    // projects
    lead: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200',
    proposal: 'bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-200',
    in_progress: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
    review: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
    completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
    on_hold: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300',
    // invoices
    draft: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200',
    sent: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
    paid: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
    void: 'bg-zinc-200 text-zinc-600 line-through dark:bg-zinc-500/20 dark:text-zinc-400',
    overdue: 'bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200',
};

export default function StatusPill({ status, overdue = false }: { status: string; overdue?: boolean }) {
    const key = overdue ? 'overdue' : status;
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tones[key] ?? tones.lead}`}>{overdue ? 'Overdue' : labelize(status)}</span>;
}
