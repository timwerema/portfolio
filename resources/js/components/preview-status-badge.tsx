import { type PreviewStatus } from '@/types/preview';
import { CircleCheck, Clock, MessageSquareWarning } from 'lucide-react';

const styles: Record<PreviewStatus, { label: string; className: string; Icon: typeof Clock }> = {
    pending: { label: 'Waiting for client', className: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200', Icon: Clock },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200', Icon: CircleCheck },
    changes_requested: {
        label: 'Changes requested',
        className: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
        Icon: MessageSquareWarning,
    },
};

export default function PreviewStatusBadge({ status }: { status: PreviewStatus }) {
    const { label, className, Icon } = styles[status] ?? styles.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            <Icon className="size-3.5" /> {label}
        </span>
    );
}
