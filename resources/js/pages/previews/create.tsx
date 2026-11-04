import PreviewForm from '@/components/preview-form';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Client previews', href: '/dashboard/previews' },
    { title: 'New', href: '/dashboard/previews/create' },
];

export default function PreviewsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New preview" />
            <div className="max-w-2xl p-4">
                <h1 className="mb-1 text-xl font-semibold">New client preview</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                    You'll get a private link to send the client. Only people with the link can see the demo.
                </p>
                <PreviewForm />
            </div>
        </AppLayout>
    );
}
