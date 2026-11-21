import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function TwoFactorChallenge() {
    const [useRecovery, setUseRecovery] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        recovery_code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.challenge'), { onError: () => reset() });
    };

    return (
        <AuthLayout
            title="Enter your code"
            description={
                useRecovery
                    ? 'Type one of the recovery codes you saved. Each one works once.'
                    : 'Open your authenticator app and type the 6-digit code.'
            }
        >
            <Head title="Two-step login" />

            <form onSubmit={submit} className="space-y-6">
                {useRecovery ? (
                    <div className="grid gap-2">
                        <Label htmlFor="recovery_code">Recovery code</Label>
                        <Input
                            id="recovery_code"
                            name="recovery_code"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            autoFocus
                            value={data.recovery_code}
                            onChange={(e) => setData('recovery_code', e.target.value)}
                        />
                        <InputError message={errors.recovery_code} />
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="code">6-digit code</Label>
                        <Input
                            id="code"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9 ]*"
                            maxLength={7}
                            required
                            autoFocus
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        <InputError message={errors.code} />
                    </div>
                )}

                <Button className="w-full" disabled={processing}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Sign in
                </Button>

                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground mx-auto block min-h-11 text-sm underline underline-offset-4"
                    onClick={() => {
                        setUseRecovery(!useRecovery);
                        reset();
                        clearErrors();
                    }}
                >
                    {useRecovery ? 'Use a code from the app instead' : 'Lost your phone? Use a recovery code'}
                </button>
            </form>
        </AuthLayout>
    );
}
