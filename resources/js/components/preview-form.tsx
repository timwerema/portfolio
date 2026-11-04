import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Preview } from '@/types/preview';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';

type PreviewFormData = {
    client_name: string;
    client_email: string;
    title: string;
    note: string;
    demo_url: string;
    html_file: File | null;
    send_now: boolean;
};

/** Create a preview, or (with `preview`) edit it / upload a new version. */
export default function PreviewForm({ preview }: { preview?: Preview }) {
    const editing = !!preview;
    const { data, setData, post, processing, errors, reset } = useForm<PreviewFormData>({
        client_name: preview?.client_name ?? '',
        client_email: preview?.client_email ?? '',
        title: preview?.title ?? '',
        note: preview?.note ?? '',
        demo_url: preview?.demo_url ?? '',
        html_file: null,
        send_now: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(editing ? route('admin.previews.update', preview.id) : route('admin.previews.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset('html_file', 'send_now'),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5" encType="multipart/form-data">
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="client_name">Client name</Label>
                    <Input
                        id="client_name"
                        value={data.client_name}
                        onChange={(e) => setData('client_name', e.target.value)}
                        placeholder="Joe's Barbershop"
                        required
                    />
                    <InputError message={errors.client_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="client_email">Client email (optional)</Label>
                    <Input
                        id="client_email"
                        type="email"
                        value={data.client_email}
                        onChange={(e) => setData('client_email', e.target.value)}
                        placeholder="joe@example.com"
                    />
                    <InputError message={errors.client_email} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Homepage concept" required />
                <InputError message={errors.title} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="note">Note to the client (optional)</Label>
                <Textarea
                    id="note"
                    rows={3}
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    placeholder="Here's a first look at your new homepage. The photos are placeholders until we get yours."
                />
                <InputError message={errors.note} />
            </div>

            <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">{editing ? 'New version (optional)' : 'The demo'}</legend>
                <p className="text-muted-foreground text-sm">
                    Upload a single <code>index.html</code> file (styles and scripts inside it, images linked from the web), or link to a demo hosted
                    elsewhere.
                    {editing && ' Changing either one counts as a new version and asks the client to review again.'}
                </p>
                <div className="grid gap-2">
                    <Label htmlFor="html_file">Upload index.html</Label>
                    <Input
                        id="html_file"
                        type="file"
                        accept=".html,.htm,text/html"
                        onChange={(e) => setData('html_file', e.target.files?.[0] ?? null)}
                    />
                    {editing && preview.has_upload && !data.html_file && (
                        <p className="text-muted-foreground text-xs">Current version uses an uploaded file.</p>
                    )}
                    <InputError message={errors.html_file} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="demo_url">…or demo link</Label>
                    <Input
                        id="demo_url"
                        type="url"
                        value={data.demo_url}
                        onChange={(e) => setData('demo_url', e.target.value)}
                        placeholder="https://joes-barbershop-demo.netlify.app"
                    />
                    <InputError message={errors.demo_url} />
                </div>
            </fieldset>

            <div className="flex items-center gap-2">
                <Checkbox
                    id="send_now"
                    checked={data.send_now}
                    onCheckedChange={(v) => setData('send_now', v === true)}
                    disabled={!data.client_email}
                />
                <Label htmlFor="send_now" className={!data.client_email ? 'text-muted-foreground' : ''}>
                    Email the review link to the client when I save
                </Label>
            </div>

            <Button type="submit" disabled={processing}>
                {processing && <LoaderCircle className="size-4 animate-spin" />}
                {editing ? 'Save changes' : 'Create preview'}
            </Button>
        </form>
    );
}
