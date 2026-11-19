<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(): Response
    {
        $today = now()->toDateString();
        // Open leads first, those due for a follow-up at the very top, then most recently touched.
        $leads = Lead::all()->sortBy([
            fn (Lead $a, Lead $b) => in_array($b->status, Lead::OPEN, true) <=> in_array($a->status, Lead::OPEN, true),
            fn (Lead $a, Lead $b) => self::due($b, $today) <=> self::due($a, $today),
            fn (Lead $a, Lead $b) => $b->updated_at <=> $a->updated_at,
        ])->values();

        return Inertia::render('admin/leads/index', [
            'leads' => $leads,
            'today' => $today,
            'statuses' => Lead::STATUSES,
            'open_statuses' => Lead::OPEN,
            'channels' => Lead::CHANNELS,
            'interests' => Lead::INTERESTS,
            'counts' => [
                'open' => $leads->whereIn('status', Lead::OPEN)->count(),
                'due' => $leads->filter(fn (Lead $l) => self::due($l, $today))->count(),
                'won' => $leads->where('status', 'Won')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Lead::create($this->validated($request));

        return back()->with('status', 'Lead added.');
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        // Small updates from the list (status, dates, notes) send only the fields that changed.
        $lead->update($this->validated($request, partial: true));

        return back()->with('status', 'Lead updated.');
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();

        return back()->with('status', 'Lead deleted.');
    }

    private static function due(Lead $lead, string $today): bool
    {
        return in_array($lead->status, Lead::OPEN, true) && $lead->follow_up_on && $lead->follow_up_on->toDateString() <= $today;
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $must = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'business' => [$must, 'string', 'max:160'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'channel' => [$must, Rule::in(Lead::CHANNELS)],
            'contact_info' => ['nullable', 'string', 'max:200'],
            'interest' => [$must, Rule::in(Lead::INTERESTS)],
            'status' => [$partial ? 'sometimes' : 'nullable', Rule::in(Lead::STATUSES)],
            'last_contacted_on' => ['nullable', 'date'],
            'follow_up_on' => ['nullable', 'date'],
            'demo_url' => ['nullable', 'url:http,https', 'max:500'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);
    }
}
