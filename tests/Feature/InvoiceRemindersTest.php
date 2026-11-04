<?php

namespace Tests\Feature;

use App\Mail\InvoiceReminder;
use App\Mail\WeeklySummary;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvoiceRemindersTest extends TestCase
{
    use RefreshDatabase;

    private function sentInvoice(string $due, array $clientAttrs = [], string $status = Invoice::SENT): Invoice
    {
        $client = Client::create(array_merge(['name' => 'Joe', 'email' => 'joe@example.com'], $clientAttrs));
        $invoice = Invoice::create(['client_id' => $client->id, 'issue_date' => '2026-10-01', 'due_date' => $due]);
        $invoice->items()->create(['description' => 'Website', 'quantity' => 1, 'unit_price_cents' => 175000]);
        $invoice->forceFill(['status' => $status])->save();

        return $invoice;
    }

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->travelTo(now()->setDate(2026, 11, 10)->setTime(9, 20));
    }

    public function test_first_reminder_goes_out_three_days_after_due(): void
    {
        $twoDays = $this->sentInvoice('2026-11-08');
        $threeDays = $this->sentInvoice('2026-11-07', ['email' => 'late@example.com']);

        $this->artisan('invoices:remind')->assertSuccessful();

        Mail::assertSent(InvoiceReminder::class, 1);
        Mail::assertSent(InvoiceReminder::class, fn ($m) => $m->hasTo('late@example.com') && $m->reminderNumber === 1);
        $this->assertSame(1, $threeDays->fresh()->reminders_sent);
        $this->assertSame(0, $twoDays->fresh()->reminders_sent);
    }

    public function test_reminders_repeat_weekly_and_stop_at_three(): void
    {
        $invoice = $this->sentInvoice('2026-11-01');

        $this->artisan('invoices:remind');                     // reminder 1
        $this->artisan('invoices:remind');                     // same day: nothing
        $this->travel(3)->days();
        $this->artisan('invoices:remind');                     // too soon: nothing
        $this->travel(4)->days();
        $this->artisan('invoices:remind');                     // reminder 2
        $this->travel(7)->days();
        $this->artisan('invoices:remind');                     // reminder 3 (final)
        $this->travel(7)->days();
        $this->artisan('invoices:remind');                     // capped: nothing

        Mail::assertSent(InvoiceReminder::class, 3);
        Mail::assertSent(InvoiceReminder::class, fn ($m) => $m->reminderNumber === 3 && str_starts_with($m->envelope()->subject, 'Final reminder'));
        $this->assertSame(3, $invoice->fresh()->reminders_sent);
    }

    public function test_no_reminders_for_paid_paused_draft_or_emailless_invoices(): void
    {
        $this->sentInvoice('2026-11-01', [], Invoice::PAID);
        $this->sentInvoice('2026-11-01', [], Invoice::DRAFT);
        $this->sentInvoice('2026-11-01', ['email' => null]);
        $paused = $this->sentInvoice('2026-11-01');
        $paused->forceFill(['reminders_paused' => true])->save();

        $this->artisan('invoices:remind')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_reminders_can_be_turned_off_globally(): void
    {
        config(['portfolio.reminders.enabled' => false]);
        $this->sentInvoice('2026-11-01');

        $this->artisan('invoices:remind')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_dry_run_sends_nothing(): void
    {
        $this->sentInvoice('2026-11-01');

        $this->artisan('invoices:remind', ['--dry-run' => true])->expectsOutputToContain('reminder 1')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_admin_can_pause_reminders(): void
    {
        $invoice = $this->sentInvoice('2026-11-01');

        $this->patch("/dashboard/invoices/{$invoice->id}/reminders", ['paused' => true])->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->patch("/dashboard/invoices/{$invoice->id}/reminders", ['paused' => true])->assertSessionHasNoErrors();

        $this->assertTrue($invoice->fresh()->reminders_paused);
    }

    public function test_weekly_summary_reports_paid_and_overdue(): void
    {
        $this->sentInvoice('2026-11-01'); // overdue $1,750
        $paid = $this->sentInvoice('2026-11-20');
        $paid->forceFill(['status' => Invoice::PAID, 'paid_at' => now()->subDays(2)])->save();

        $this->artisan('business:weekly-summary')->assertSuccessful();

        Mail::assertSent(WeeklySummary::class, function ($m) {
            return $m->data['paid_last_week_cents'] === 175000
                && $m->data['outstanding_cents'] === 175000
                && count($m->data['overdue']) === 1
                && str_contains($m->envelope()->subject, '$1,750.00 paid');
        });
    }

    public function test_reminder_and_summary_emails_render(): void
    {
        $invoice = $this->sentInvoice('2026-11-01');

        $html = (new InvoiceReminder($invoice->load('client', 'items'), 2))->render();
        $this->assertStringContainsString('following up', $html);
        $this->assertStringContainsString($invoice->public_url, $html);

        $summary = (new WeeklySummary(['paid_last_week_cents' => 0, 'outstanding_cents' => 175000, 'overdue' => [], 'expenses_month_cents' => 600,
            'new_messages' => 1, 'unread_messages' => 1, 'previews_pending' => 0, 'due_soon' => [], 'leads' => 2]))->render();
        $this->assertStringContainsString('$1,750.00', $summary);
    }
}
