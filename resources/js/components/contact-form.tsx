import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { CircleCheck, LoaderCircle, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type ContactFormData = {
    name: string;
    email: string;
    service: string;
    message: string;
    website: string; // honeypot - stays empty for real visitors
};

export default function ContactForm({ services, defaultService = '' }: { services: string[]; defaultService?: string }) {
    const [sent, setSent] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<ContactFormData>({
        name: '',
        email: '',
        service: defaultService,
        message: '',
        website: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('contact.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSent(true);
            },
        });
    };

    if (sent) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border p-10 text-center">
                <CircleCheck className="size-10 text-emerald-500" strokeWidth={1.5} />
                <h3 className="mt-4 text-xl font-semibold">Message sent</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">Thanks for reaching out - I'll get back to you within a day or two.</p>
                <Button variant="outline" size="sm" className="mt-6" onClick={() => setSent(false)}>
                    Send another
                </Button>
            </div>
        );
    }

    const tooMany = (errors as Record<string, string>).throttle;

    return (
        <form onSubmit={submit} className="space-y-5 rounded-xl border p-6 text-left sm:p-8" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                        id="contact-name"
                        autoComplete="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        aria-invalid={!!errors.name}
                        placeholder="Jane Smith"
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        aria-invalid={!!errors.email}
                        placeholder="jane@company.com"
                    />
                    <InputError message={errors.email} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="contact-service">What can I help with?</Label>
                <Select
                    value={data.service}
                    onValueChange={(v) => {
                        setData('service', v);
                        clearErrors('service');
                    }}
                >
                    <SelectTrigger id="contact-service" aria-invalid={!!errors.service}>
                        <SelectValue placeholder="Choose a service (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {[...services, 'Something else'].map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.service} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                    id="contact-message"
                    rows={5}
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    aria-invalid={!!errors.message}
                    placeholder="Tell me about your project, timeline, or the task you'd like automated..."
                />
                <InputError message={errors.message} />
            </div>

            {/* Honeypot: hidden from people and screen readers */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                    id="contact-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={data.website}
                    onChange={(e) => setData('website', e.target.value)}
                />
            </div>

            {tooMany && <InputError message={tooMany} />}

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={processing}>
                {processing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send message
            </Button>
        </form>
    );
}
