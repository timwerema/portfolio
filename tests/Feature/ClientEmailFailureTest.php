<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Preview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

/** When the email service refuses a client email, show a clear message - no error page, nothing marked as sent. */
class ClientEmailFailureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mail.from.address' => 'onboarding@resend.dev']);
        Mail::shouldReceive('to')->andThrow(new RuntimeException('You can only send testing emails to your own email address'));
        $this->actingAs(User::factory()->create());
    }

    public function test_invoice_send_failure_shows_a_message_and_stays_draft(): void
    {
        $client = Client::create(['name' => 'Joe', 'email' => 'joe@example.com']);
        $invoice = Invoice::create(['client_id' => $client->id, 'issue_date' => '2026-11-01', 'due_date' => '2026-11-15']);
        $invoice->items()->create(['description' => 'Site', 'quantity' => 1, 'unit_price_cents' => 75000]);

        $this->post("/dashboard/invoices/{$invoice->id}/send")
            ->assertRedirect()
            ->assertSessionHasErrors(['status' => "Couldn't email joe@example.com. You're still using Resend's test sender, which can only email your own address. Verify your domain in Resend (Domains), then set MAIL_FROM_ADDRESS to an address on it. For now, use Copy link and send the link yourself."]);

        $this->assertSame(Invoice::DRAFT, $invoice->fresh()->status);
        $this->assertNull($invoice->fresh()->sent_at);
    }

    public function test_preview_send_failure_shows_a_message(): void
    {
        $preview = Preview::create(['client_name' => 'Joe', 'client_email' => 'joe@example.com', 'title' => 'Concept', 'demo_url' => 'https://example.com']);

        $this->post("/dashboard/previews/{$preview->id}/send")->assertRedirect()->assertSessionHasErrors('send');
        $this->assertNull($preview->fresh()->sent_at);
    }

    public function test_creating_a_preview_still_works_when_the_email_fails(): void
    {
        $this->post('/dashboard/previews', [
            'client_name' => 'Joe', 'client_email' => 'joe@example.com', 'title' => 'Concept', 'demo_url' => 'https://example.com', 'send_now' => '1',
        ])->assertRedirect()->assertSessionHasErrors('send');

        $this->assertDatabaseCount('previews', 1);
        $this->assertNull(Preview::sole()->sent_at);
    }

    public function test_non_resend_failures_include_the_reason(): void
    {
        config(['mail.from.address' => 'hello@timasi.dev']);
        $preview = Preview::create(['client_name' => 'Joe', 'client_email' => 'joe@example.com', 'title' => 'Concept', 'demo_url' => 'https://example.com']);

        $this->post("/dashboard/previews/{$preview->id}/send");

        $this->assertStringContainsString('The email service said: You can only send testing emails', session('errors')->first('send'));
    }
}
