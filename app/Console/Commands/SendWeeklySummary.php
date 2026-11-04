<?php

namespace App\Console\Commands;

use App\Mail\WeeklySummary;
use App\Models\ContactMessage;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Preview;
use App\Models\Project;
use App\Support\Alerts;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/** Monday morning: a short email to you with last week's money and what needs attention. */
class SendWeeklySummary extends Command
{
    protected $signature = 'business:weekly-summary {--show : Print the numbers instead of emailing them}';

    protected $description = 'Email yourself a weekly business summary';

    public function handle(): int
    {
        $weekAgo = now()->subWeek();
        $invoices = Invoice::with('items', 'client:id,name')->get();
        $sent = $invoices->where('status', Invoice::SENT);
        $overdue = $sent->filter->is_overdue->sortBy('due_date')->values();

        $data = [
            'paid_last_week_cents' => $invoices->filter(fn ($i) => $i->status === Invoice::PAID && $i->paid_at?->gte($weekAgo))->sum->totalCents(),
            'outstanding_cents' => $sent->sum->totalCents(),
            'overdue' => $overdue->map(fn ($i) => ['number' => $i->number, 'client' => $i->client?->name, 'total_cents' => $i->totalCents(), 'days' => $i->daysOverdue(), 'reminders' => $i->reminders_sent])->all(),
            'expenses_month_cents' => (int) Expense::whereYear('date', now()->year)->whereMonth('date', now()->month)->sum('amount_cents'),
            'new_messages' => ContactMessage::where('created_at', '>=', $weekAgo)->count(),
            'unread_messages' => ContactMessage::whereNull('read_at')->count(),
            'previews_pending' => Preview::where('status', Preview::PENDING)->count(),
            'due_soon' => Project::with('client:id,name')->whereNotIn('status', ['completed', 'on_hold'])
                ->whereBetween('due_date', [today(), today()->addDays(14)])->orderBy('due_date')->get()
                ->map(fn ($p) => ['name' => $p->name, 'client' => $p->client?->name, 'due' => $p->due_date->format('D M j')])->all(),
            'leads' => Project::where('status', 'lead')->count(),
        ];

        if ($this->option('show')) {
            $this->line(json_encode($data, JSON_PRETTY_PRINT));

            return self::SUCCESS;
        }

        if (! config('portfolio.weekly_summary') || ! ($to = Alerts::recipient())) {
            $this->info('Weekly summary is turned off or has no recipient.');

            return self::SUCCESS;
        }

        Mail::to($to)->send(new WeeklySummary($data));
        $this->info("Weekly summary sent to {$to}.");

        return self::SUCCESS;
    }
}
