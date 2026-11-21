<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The dashboard holds client and invoice data, so it stays closed until the signed-in
 * account has two-step login switched on (see config/auth.php → two_factor_required).
 */
class RequireTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && config('auth.two_factor_required') && ! $user->hasTwoFactor()) {
            return redirect()->route('two-factor.edit')
                ->with('status', 'Set up two-step login to open the dashboard.');
        }

        return $next($request);
    }
}
