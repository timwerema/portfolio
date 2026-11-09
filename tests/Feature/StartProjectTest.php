<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class StartProjectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('contact:127.0.0.1');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'services' => ['Websites', 'AI Agents'],
            'package' => 'Business',
            'budget' => '$1,000 - $2,500',
            'timeline' => 'Within a month',
            'business' => 'Reed Fitness',
            'business_website' => 'reedfitness.com',
            'name' => 'Marcus Reed',
            'email' => 'marcus@example.com',
            'phone' => '(214) 555-0123',
            'message' => 'I need a site with class bookings and a bot that answers common questions.',
        ], $overrides);
    }

    public function test_pages_load(): void
    {
        $this->withoutVite();
        $this->get('/start')->assertOk()->assertSee('Start a project');
        $this->get('/privacy')->assertOk()->assertSee('Privacy policy');
        $this->get('/terms')->assertOk()->assertSee('Terms of service');
    }

    public function test_project_request_is_saved_with_details_and_emailed(): void
    {
        Mail::fake();

        $this->post('/start', $this->payload())->assertSessionHasNoErrors()->assertSessionHas('status', 'sent');

        $m = ContactMessage::sole();
        $this->assertSame('start', $m->source);
        $this->assertSame(['Websites', 'AI Agents'], $m->services);
        $this->assertSame('Websites, AI Agents', $m->service);
        $this->assertSame('$1,000 - $2,500', $m->budget);
        Mail::assertSent(ContactMessageReceived::class, fn ($mail) => str_contains($mail->render(), 'New project request') && str_contains($mail->render(), 'Reed Fitness'));
    }

    public function test_validation(): void
    {
        $this->post('/start', $this->payload(['services' => [], 'budget' => 'A million', 'timeline' => '', 'email' => 'nope', 'message' => 'hi']))
            ->assertSessionHasErrors(['services', 'budget', 'timeline', 'email', 'message']);
        $this->post('/start', $this->payload(['services' => ['Hacking']]))->assertSessionHasErrors('services.0');
        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_honeypot_and_rate_limit(): void
    {
        Mail::fake();
        $this->post('/start', $this->payload(['website' => 'http://spam.example']))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('contact_messages', 0);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/start', $this->payload())->assertSessionHasNoErrors();
        }
        $this->post('/start', $this->payload())->assertSessionHasErrors('throttle');
    }

    public function test_sitemap_lists_new_public_pages(): void
    {
        $xml = $this->get('/sitemap.xml')->getContent();
        foreach (['/start', '/privacy', '/terms'] as $path) {
            $this->assertStringContainsString(url($path), $xml);
        }
    }
}
