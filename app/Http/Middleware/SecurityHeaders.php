<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers on every web response, including a Content-Security-Policy.
 *
 * Scripts run only from this site and only with the per-request nonce, so injected markup cannot
 * run code. Inline style attributes stay allowed (React and the demos use them). The two Spotify
 * hosts are for the Encore Live demo, which talks to Spotify from the visitor's browser.
 *
 * HSTS is left out on purpose: HTTPS for this host is handled by the proxy in front of the box.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // The Vite dev server (npm run dev) injects its own scripts; the policy is for built assets.
        $csp = ! Vite::isRunningHot();
        if ($csp) {
            Vite::useCspNonce();
        }

        $response = $next($request);

        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(self), payment=()',
        ];

        if ($csp) {
            $headers['Content-Security-Policy'] = implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'nonce-".Vite::cspNonce()."'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https:",
                "font-src 'self' data:",
                "connect-src 'self' https://api.spotify.com https://accounts.spotify.com",
                "frame-src 'self' https:", // client demos may be an uploaded file or a link to another site
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'",
            ]);
        }

        // Responses that set their own value (the sandboxed client demo files) keep it.
        foreach ($headers as $name => $value) {
            if (! $response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }

        return $response;
    }
}
