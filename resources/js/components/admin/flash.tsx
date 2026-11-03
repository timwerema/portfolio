import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/** Success message from the last action, plus any general (non-field) error. */
export default function Flash() {
    const { flash, errors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    return (
        <>
            {flash?.status && (
                <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {flash.status}
                </p>
            )}
            {errors?.status && (
                <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {errors.status}
                </p>
            )}
        </>
    );
}
