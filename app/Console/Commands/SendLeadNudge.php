<?php

namespace App\Console\Commands;

use App\Mail\LeadNudge;
use App\Models\Lead;
use App\Support\Alerts;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

/** Each morning: an email listing the leads whose follow-up is due and the ones not contacted yet. Nothing is sent on a quiet day. */
class SendLeadNudge extends Command
{
    protected $signature = 'leads:nudge {--show : Print the list instead of emailing it}';

    protected $description = 'Email yourself the leads that need a message today';

    public function handle(): int
    {
        $due = Lead::whereIn('status', Lead::OPEN)->where('status', '!=', 'To contact')
            ->whereNotNull('follow_up_on')->whereDate('follow_up_on', '<=', today())
            ->orderBy('follow_up_on')->limit(25)->get()
            ->map(fn (Lead $l) => [
                'business' => $l->business, 'contact_name' => $l->contact_name, 'channel' => $l->channel, 'status' => $l->status,
                'days_late' => (int) $l->follow_up_on->startOfDay()->diffInDays(today()),
                'last_contacted_on' => $l->last_contacted_on ? Carbon::parse($l->last_contacted_on)->format('M j') : null,
            ])->all();

        $toContact = Lead::where('status', 'To contact')->oldest()->limit(25)->get()
            ->map(fn (Lead $l) => ['business' => $l->business, 'channel' => $l->channel, 'added' => $l->created_at->format('M j')])->all();

        if ($this->option('show')) {
            $this->line(json_encode(['due' => $due, 'to_contact' => $toContact], JSON_PRETTY_PRINT));

            return self::SUCCESS;
        }

        if (! $due && ! $toContact) {
            $this->info('No leads need a message today.');

            return self::SUCCESS;
        }

        if (! config('portfolio.lead_nudge') || ! ($to = Alerts::recipient())) {
            $this->info('Lead nudges are turned off or have no recipient.');

            return self::SUCCESS;
        }

        Mail::to($to)->send(new LeadNudge($due, $toContact));
        $this->info('Lead nudge sent to '.$to.': '.count($due).' due, '.count($toContact).' to contact.');

        return self::SUCCESS;
    }
}
