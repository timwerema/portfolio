import { cn } from '@/lib/utils';
import * as React from 'react';

/** A plain <select> styled like the shadcn Input (simple, accessible, works everywhere). */
export default function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
    return (
        <select
            className={cn(
                'border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-[3px] md:text-sm dark:bg-transparent [&>option]:text-black',
                className,
            )}
            {...props}
        />
    );
}
