<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class ContactMessageController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        // Honeypot: real visitors never see or fill the "website" field; bots usually do.
        // Pretend it worked so bots don't learn to avoid it.
        if (filled($request->input('website'))) {
            return back();
        }

        // Max 5 messages per visitor every 10 minutes.
        $limiterKey = 'contact:'.$request->ip();
        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            throw ValidationException::withMessages([
                'throttle' => 'You\'ve sent a few messages already - please try again in a few minutes.',
            ]);
        }

        $services = collect(config('portfolio.services', []))->pluck('title')->push('Something else')->all();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'service' => ['nullable', 'string', Rule::in($services)],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $message = ContactMessage::create([
            ...$validated,
            'ip_address' => $request->ip(),
        ]);

        RateLimiter::hit($limiterKey, 600);

        $notify = config('portfolio.contact.notify_email') ?: config('portfolio.links.email');

        if ($notify) {
            try {
                Mail::to($notify)->send(new ContactMessageReceived($message));
            } catch (\Throwable $e) {
                // The message is already saved, so a mail outage never loses an enquiry.
                Log::error('Contact form email failed', ['id' => $message->id, 'error' => $e->getMessage()]);
            }
        }

        return back();
    }
}
