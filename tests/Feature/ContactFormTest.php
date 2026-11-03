<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'service' => 'AI Agents',
            'message' => 'I would like a bot that fills in our weekly reports.',
        ], $overrides);
    }

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('contact:127.0.0.1');
    }

    public function test_message_is_saved_and_emailed(): void
    {
        Mail::fake();

        $this->post('/contact', $this->validPayload())->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseHas('contact_messages', ['email' => 'jane@example.com', 'service' => 'AI Agents']);
        Mail::assertSent(ContactMessageReceived::class, function ($mail) {
            return $mail->hasTo(config('portfolio.links.email')) && $mail->hasReplyTo('jane@example.com');
        });
    }

    public function test_message_is_saved_even_if_email_fails(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->post('/contact', $this->validPayload())->assertSessionHasNoErrors();

        $this->assertDatabaseCount('contact_messages', 1);
    }

    public function test_required_fields_are_validated(): void
    {
        $this->post('/contact', ['name' => '', 'email' => 'not-an-email', 'message' => 'short'])
            ->assertSessionHasErrors(['name', 'email', 'message']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_unknown_service_is_rejected(): void
    {
        $this->post('/contact', $this->validPayload(['service' => 'Hacking']))->assertSessionHasErrors('service');
    }

    public function test_honeypot_submissions_are_silently_dropped(): void
    {
        Mail::fake();

        $this->post('/contact', $this->validPayload(['website' => 'http://spam.example']))->assertSessionHasNoErrors();

        $this->assertDatabaseCount('contact_messages', 0);
        Mail::assertNothingSent();
    }

    public function test_visitors_are_rate_limited(): void
    {
        Mail::fake();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/contact', $this->validPayload())->assertSessionHasNoErrors();
        }

        $this->post('/contact', $this->validPayload())->assertSessionHasErrors('throttle');
        $this->assertDatabaseCount('contact_messages', 5);
    }

    public function test_dashboard_lists_messages_and_toggles_read(): void
    {
        $user = User::factory()->create();
        $message = ContactMessage::create($this->validPayload());

        $this->get('/dashboard/messages')->assertRedirect('/login');

        $this->actingAs($user)->get('/dashboard/messages')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/messages', false)->has('messages', 1)->where('unread', 1));

        $this->actingAs($user)->patch("/dashboard/messages/{$message->id}/read")->assertRedirect();
        $this->assertNotNull($message->fresh()->read_at);
    }
}
