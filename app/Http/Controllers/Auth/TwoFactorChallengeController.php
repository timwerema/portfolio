<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\TwoFactor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Second step of login: a code from the authenticator app, or a one-time recovery code.
 */
class TwoFactorChallengeController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if (! $this->pendingUser($request)) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:20'],
            'recovery_code' => ['nullable', 'string', 'max:40'],
        ]);

        $user = $this->pendingUser($request);
        if (! $user) {
            return redirect()->route('login');
        }

        $key = 'two-factor:'.$user->getKey().'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'code' => 'Too many tries. Wait '.RateLimiter::availableIn($key).' seconds and try again.',
            ]);
        }

        $ok = filled($data['recovery_code'] ?? null)
            ? TwoFactor::useRecoveryCode($user, $data['recovery_code'])
            : TwoFactor::verify($user, (string) ($data['code'] ?? ''));

        if (! $ok) {
            RateLimiter::hit($key, 60);

            throw ValidationException::withMessages(
                filled($data['recovery_code'] ?? null)
                    ? ['recovery_code' => 'That recovery code is not valid or was already used.']
                    : ['code' => 'That code is not right. Check the app and try again.']
            );
        }

        RateLimiter::clear($key);
        $remember = (bool) $request->session()->pull('two_factor_login.remember', false);
        $request->session()->forget('two_factor_login');

        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /** The account that passed the password step in this session, within the last 10 minutes. */
    private function pendingUser(Request $request): ?User
    {
        $pending = $request->session()->get('two_factor_login');

        if (! is_array($pending) || ($pending['expires'] ?? 0) < now()->timestamp) {
            $request->session()->forget('two_factor_login');

            return null;
        }

        $user = User::find($pending['id'] ?? null);

        return $user && $user->hasTwoFactor() ? $user : null;
    }
}
