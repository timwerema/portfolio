import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Two-step login', href: '/settings/two-factor' }];

type Props = {
    enabled: boolean;
    required: boolean;
    setup: { qr: string; secret: string } | null;
    recoveryCodes: string[] | null;
    codesLeft: number | null;
};

/** A small form that asks for the current password before a sensitive change. */
function PasswordAction({
    id,
    label,
    routeName,
    method = 'post',
    destructive = false,
}: {
    id: string;
    label: string;
    routeName: string;
    method?: 'post' | 'delete';
    destructive?: boolean;
}) {
    const form = useForm({ current_password: '' });
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.submit(method, route(routeName), { preserveScroll: true, onFinish: () => form.reset() });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-2">
                <Label htmlFor={id}>Your password</Label>
                <Input
                    id={id}
                    type="password"
                    autoComplete="current-password"
                    required
                    value={form.data.current_password}
                    onChange={(e) => form.setData('current_password', e.target.value)}
                />
                <InputError message={form.errors.current_password} />
            </div>
            <Button variant={destructive ? 'destructive' : 'default'} disabled={form.processing}>
                {label}
            </Button>
        </form>
    );
}

export default function TwoFactor({ enabled, required, setup, recoveryCodes, codesLeft }: Props) {
    const { flash } = usePage<SharedData>().props;
    const confirm = useForm({ code: '' });

    const submitCode: FormEventHandler = (e) => {
        e.preventDefault();
        confirm.post(route('two-factor.confirm'), { preserveScroll: true, onError: () => confirm.reset() });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-step login" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Two-step login"
                        description="After your password, sign-in also asks for a 6-digit code from an authenticator app on your phone."
                    />

                    {flash?.status && !enabled && (
                        <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                            {flash.status}
                        </p>
                    )}

                    {recoveryCodes && (
                        <div role="status" className="space-y-3 rounded-md border px-4 py-4">
                            <p className="font-medium">Save these recovery codes now</p>
                            <p className="text-muted-foreground text-sm">
                                They are shown only this once. Each code signs you in one time if you lose your phone. Keep them somewhere safe, not
                                in your email.
                            </p>
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
                                {recoveryCodes.map((c) => (
                                    <li key={c}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {enabled ? (
                        <>
                            <p className="text-sm">
                                <span className="font-medium text-green-700 dark:text-green-400">On.</span> Recovery codes left: {codesLeft}.
                            </p>

                            <div className="space-y-3 border-t pt-6">
                                <HeadingSmall title="New recovery codes" description="Replaces the old codes. Use this if you have few left." />
                                <PasswordAction id="pw-codes" label="Make new codes" routeName="two-factor.recovery-codes" />
                            </div>

                            <div className="space-y-3 border-t pt-6">
                                <HeadingSmall
                                    title="Switch off"
                                    description={
                                        required
                                            ? 'The dashboard stays closed while this is off. Only switch it off to move to a new phone.'
                                            : 'Sign-in will ask for your password only.'
                                    }
                                />
                                <PasswordAction id="pw-off" label="Switch off" routeName="two-factor.destroy" method="delete" destructive />
                            </div>
                        </>
                    ) : setup ? (
                        <div className="space-y-6">
                            <ol className="list-decimal space-y-2 pl-5 text-sm">
                                <li>Open an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password...).</li>
                                <li>Scan this code, or type the key below into the app.</li>
                                <li>Enter the 6-digit code the app shows.</li>
                            </ol>

                            <img
                                src={setup.qr}
                                alt="QR code to scan with your authenticator app"
                                width={220}
                                height={220}
                                className="rounded-md bg-white p-2"
                            />

                            <p className="text-sm">
                                Key: <code className="font-mono break-all select-all">{setup.secret}</code>
                            </p>

                            <form onSubmit={submitCode} className="space-y-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">6-digit code</Label>
                                    <Input
                                        id="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={7}
                                        required
                                        className="max-w-40"
                                        value={confirm.data.code}
                                        onChange={(e) => confirm.setData('code', e.target.value)}
                                    />
                                    <InputError message={confirm.errors.code} />
                                </div>
                                <Button disabled={confirm.processing}>Switch on</Button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm">
                                <span className="font-medium">Off.</span>{' '}
                                {required ? 'The dashboard stays closed until you set this up.' : 'Your account is protected by its password only.'}
                            </p>
                            <PasswordAction id="pw-on" label="Set up" routeName="two-factor.store" />
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
