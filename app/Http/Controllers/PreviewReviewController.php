<?php

namespace App\Http\Controllers;

use App\Mail\PreviewDecisionReceived;
use App\Models\Preview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** The client's side of the demo approval portal: /p/{token}. */
class PreviewReviewController extends Controller
{
    public function show(string $token): Response
    {
        $preview = Preview::where('token', $token)->firstOrFail();

        return Inertia::render('previews/review', [
            'preview' => [
                'token' => $preview->token,
                'client_name' => $preview->client_name,
                'title' => $preview->title,
                'note' => $preview->note,
                'version' => $preview->version,
                'status' => $preview->status,
                'decided_at' => $preview->decided_at,
                'frame_url' => $preview->frameUrl(),
                'is_upload' => (bool) $preview->html_path,
            ],
            'studio' => [
                'name' => config('portfolio.name'),
                'email' => config('portfolio.links.email'),
            ],
        ]);
    }

    /**
     * Serve an uploaded index.html inside a sandbox: the browser treats it as a
     * separate, unprivileged origin, so its scripts can't touch this site or its cookies.
     */
    public function demo(string $token)
    {
        $preview = Preview::where('token', $token)->firstOrFail();

        abort_unless($preview->html_path && Storage::disk('local')->exists($preview->html_path), 404);

        return response(Storage::disk('local')->get($preview->html_path), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Security-Policy' => 'sandbox allow-scripts allow-forms allow-popups allow-modals',
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-Robots-Tag' => 'noindex, nofollow',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function decide(Request $request, string $token): RedirectResponse
    {
        $preview = Preview::where('token', $token)->firstOrFail();

        $limiterKey = 'preview-decision:'.$preview->id.':'.$request->ip();
        if (RateLimiter::tooManyAttempts($limiterKey, 10)) {
            throw ValidationException::withMessages(['comment' => 'Too many submissions - please try again later.']);
        }

        $data = $request->validate([
            'decision' => ['required', Rule::in([Preview::APPROVED, Preview::CHANGES_REQUESTED])],
            'name' => ['nullable', 'string', 'max:100'],
            'comment' => ['nullable', 'required_if:decision,'.Preview::CHANGES_REQUESTED, 'string', 'max:5000'],
        ], [
            'comment.required_if' => 'Tell me what you\'d like changed.',
        ]);

        RateLimiter::hit($limiterKey, 3600);

        $feedback = $preview->feedback()->create([
            ...$data,
            'version' => $preview->version,
            'ip_address' => $request->ip(),
        ]);

        $preview->forceFill(['status' => $data['decision'], 'decided_at' => now()])->save();

        $notify = config('portfolio.contact.notify_email') ?: config('portfolio.links.email');
        if ($notify) {
            try {
                Mail::to($notify)->send(new PreviewDecisionReceived($preview, $feedback));
            } catch (\Throwable $e) {
                Log::error('Preview decision email failed', ['preview' => $preview->id, 'error' => $e->getMessage()]);
            }
        }

        return back();
    }
}
