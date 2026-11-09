<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** The "Start a project" questionnaire at /start. Saves into the Messages inbox. */
class ProjectRequestController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('start', [
            'portfolio' => config('portfolio'),
            'budgets' => ContactMessage::BUDGETS,
            'timelines' => ContactMessage::TIMELINES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (filled($request->input('website'))) { // honeypot
            return back();
        }

        $limiterKey = 'contact:'.$request->ip();
        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            throw ValidationException::withMessages(['throttle' => 'You\'ve sent a few requests already - please try again in a few minutes.']);
        }

        $services = collect(config('portfolio.services', []))->pluck('title')->all();
        $packages = collect(config('portfolio.packages', []))->pluck('name')->push('Not sure yet')->all();

        $data = $request->validate([
            'services' => ['required', 'array', 'min:1'],
            'services.*' => [Rule::in($services)],
            'package' => ['nullable', Rule::in($packages)],
            'budget' => ['required', Rule::in(ContactMessage::BUDGETS)],
            'timeline' => ['required', Rule::in(ContactMessage::TIMELINES)],
            'business' => ['nullable', 'string', 'max:120'],
            'business_website' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ], [
            'services.required' => 'Pick at least one thing you need help with.',
        ]);

        $message = ContactMessage::create([
            ...$data,
            'source' => 'start',
            'service' => implode(', ', $data['services']),
            'ip_address' => $request->ip(),
        ]);

        RateLimiter::hit($limiterKey, 600);

        $notify = config('portfolio.contact.notify_email') ?: config('portfolio.links.email');
        if ($notify) {
            try {
                Mail::to($notify)->send(new ContactMessageReceived($message));
            } catch (\Throwable $e) {
                Log::error('Project request email failed', ['id' => $message->id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('status', 'sent');
    }
}
