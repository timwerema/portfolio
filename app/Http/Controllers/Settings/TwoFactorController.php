<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\TwoFactor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings > Two-step login: switch it on (scan, then confirm with a code), get new
 * recovery codes, or switch it off. Every change asks for the current password.
 */
class TwoFactorController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $pending = ! $user->hasTwoFactor() && filled($user->two_factor_secret);

        return Inertia::render('settings/two-factor', [
            'enabled' => $user->hasTwoFactor(),
            'required' => (bool) config('auth.two_factor_required'),
            // Only while setting up: the QR code and the same key as text, for typing in by hand.
            'setup' => $pending ? [
                'qr' => TwoFactor::qrDataUri($user, $user->two_factor_secret),
                'secret' => $user->two_factor_secret,
            ] : null,
            // Shown once, right after they are created.
            'recoveryCodes' => $request->session()->get('recovery_codes'),
            'codesLeft' => $user->hasTwoFactor() ? count($user->two_factor_recovery_codes ?? []) : null,
        ]);
    }

    /** Step 1: create a secret to scan. Nothing is enforced until it is confirmed with a code. */
    public function store(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);
        $user = $request->user();

        if (! $user->hasTwoFactor()) {
            $user->forceFill([
                'two_factor_secret' => TwoFactor::newSecret(),
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ])->save();
        }

        return to_route('two-factor.edit');
    }

    /** Step 2: prove the app works by entering a code. Switches two-step login on. */
    public function confirm(Request $request): RedirectResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:20']]);
        $user = $request->user();

        if ($user->hasTwoFactor() || blank($user->two_factor_secret)) {
            return to_route('two-factor.edit');
        }

        if (! TwoFactor::verify($user, $data['code'])) {
            throw ValidationException::withMessages(['code' => 'That code is not right. Check the app and try again.']);
        }

        $codes = TwoFactor::newRecoveryCodes();
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $codes,
        ])->save();

        return to_route('two-factor.edit')->with('recovery_codes', $codes);
    }

    public function recoveryCodes(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);
        $user = $request->user();

        if (! $user->hasTwoFactor()) {
            return to_route('two-factor.edit');
        }

        $codes = TwoFactor::newRecoveryCodes();
        $user->forceFill(['two_factor_recovery_codes' => $codes])->save();

        return to_route('two-factor.edit')->with('recovery_codes', $codes);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);

        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return to_route('two-factor.edit');
    }
}
