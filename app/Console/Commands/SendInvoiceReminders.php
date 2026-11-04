<?php

namespace App\Console\Commands;

use App\Mail\InvoiceReminder;
use App\Models\Invoice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/** Daily: email polite payment reminders for overdue invoices (rules in config/portfolio.php). */
class SendInvoiceReminders extends Command
{
    protected $signature = 'invoices:remind {--dry-run : List what would be sent without sending}';

    protected $description = 'Send payment reminders for overdue invoices';

    public function handle(): int
    {
        if (! config('portfolio.reminders.enabled')) {
            $this->info('Invoice reminders are turned off (INVOICE_REMINDERS=false).');

            return self::SUCCESS;
        }

        $due = Invoice::with('client', 'items')->where('status', Invoice::SENT)->get()->filter->reminderDue();

        if ($due->isEmpty()) {
            $this->info('No reminders due today.');

            return self::SUCCESS;
        }

        foreach ($due as $invoice) {
            $n = $invoice->reminders_sent + 1;
            $this->line("{$invoice->number} -> {$invoice->client->email} (reminder {$n}, {$invoice->daysOverdue()} days overdue)");

            if ($this->option('dry-run')) {
                continue;
            }

            try {
                Mail::to($invoice->client->email, $invoice->client->name)->send(new InvoiceReminder($invoice, $n));
                $invoice->forceFill(['reminders_sent' => $n, 'last_reminder_at' => now()])->save();
            } catch (Throwable $e) {
                Log::error('Invoice reminder failed', ['invoice' => $invoice->number, 'error' => $e->getMessage()]);
                $this->error("  failed: {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
