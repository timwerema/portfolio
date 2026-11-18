import { SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));

    // The dashboard look ("workspace": Notion-style neutrals with frosted glass) lives in app.css under body.workspace.
    // It is set on <body> so menus and dialogs, which render outside this component, pick it up too.
    useEffect(() => {
        if (variant !== 'sidebar') return;
        document.body.classList.add('workspace');
        return () => document.body.classList.remove('workspace');
    }, [variant]);

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            {children}
        </SidebarProvider>
    );
}
