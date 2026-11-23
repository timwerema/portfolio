<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ClientSiteHealth;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ClientSiteHealthTest extends TestCase
{
    use RefreshDatabase;

    private function connect(): void
    {
        config(['services.client_sites.maanet.url' => 'https://demo.example.test/', 'services.client_sites.maanet.token' => 'secret-token']);
        Cache::flush();
    }

    public function test_a_site_with_no_address_shows_as_not_connected_and_makes_no_request(): void
    {
        config(['services.client_sites.maanet.url' => null, 'services.client_sites.maanet.token' => null]);
        Http::fake();

        $site = ClientSiteHealth::all()[0];

        $this->assertSame('not_connected', $site['status']);
        Http::assertNothingSent();
    }

    public function test_a_healthy_site_is_read_with_the_token_and_cached(): void
    {
        $this->connect();
        Http::fake(['demo.example.test/api/health' => Http::response([
            'site' => 'Maanet Gardens', 'status' => 'ok', 'healthy' => true, 'checked_at' => '2026-11-21T08:24:01+03:00',
            'checks' => [['name' => 'Database', 'status' => 'ok', 'detail' => 'Connected.']],
            'reservations' => ['pending' => 3, 'last_7_days' => 7],
        ])]);

        $site = ClientSiteHealth::all()[0];
        ClientSiteHealth::all(); // second read comes from the cache

        $this->assertSame('ok', $site['status']);
        $this->assertSame(3, $site['reservations']['pending']);
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer secret-token') && $request->url() === 'https://demo.example.test/api/health');
    }

    public function test_a_broken_site_names_the_failing_check(): void
    {
        $this->connect();
        Http::fake(['*' => Http::response(['status' => 'fail', 'checks' => [['name' => 'Database', 'status' => 'fail', 'detail' => 'Down']]], 503)]);

        $site = ClientSiteHealth::all()[0];

        $this->assertSame('fail', $site['status']);
        $this->assertStringContainsString('Database', $site['detail']);
    }

    public function test_a_site_in_maintenance_is_shown_as_such_not_as_broken(): void
    {
        $this->connect();
        Http::fake(['*' => Http::response([
            'status' => 'fail', 'healthy' => false,
            'maintenance' => ['mode' => 'auto', 'reason' => 'Database check failed', 'since' => now()->subMinutes(10)->toIso8601String()],
            'checks' => [['name' => 'Database', 'status' => 'fail', 'detail' => 'Down']],
        ], 503)]);

        $site = ClientSiteHealth::all()[0];

        $this->assertSame('maintenance', $site['status']);
        $this->assertStringContainsString('Database check failed', $site['detail']);
        $this->assertStringContainsString('10 minutes ago', $site['detail']);
        $this->assertStringContainsString('comes back by itself', $site['detail']);
    }

    public function test_hand_switched_maintenance_and_no_maintenance_are_told_apart(): void
    {
        $this->connect();
        Http::fake(['*' => Http::sequence()
            ->push(['status' => 'ok', 'healthy' => false, 'maintenance' => ['mode' => 'manual', 'reason' => 'Updating room photos', 'since' => 'not a date'], 'checks' => []], 503)
            ->push(['status' => 'ok', 'healthy' => true, 'maintenance' => null, 'checks' => []])]);

        $site = ClientSiteHealth::all()[0];
        $this->assertSame('maintenance', $site['status']);
        $this->assertStringContainsString('by hand', $site['detail']);
        $this->assertStringContainsString('Updating room photos', $site['detail']);

        Cache::flush();
        $this->assertSame('ok', ClientSiteHealth::all()[0]['status']);
    }

    public function test_a_stopped_health_bot_is_not_reported_as_the_site_being_down(): void
    {
        $this->connect();
        Http::fake(['*' => Http::response(['status' => 'stale', 'healthy' => false, 'stale' => true, 'maintenance' => null, 'checks' => []], 503)]);

        $site = ClientSiteHealth::all()[0];

        $this->assertSame('stale', $site['status']);
        $this->assertStringContainsString('health bot has stopped', $site['detail']);
    }

    public function test_a_wrong_token_shows_as_unknown(): void
    {
        $this->connect();
        Http::fake(['*' => Http::response('', 404)]);

        $this->assertSame('unknown', ClientSiteHealth::all()[0]['status']);
    }

    public function test_a_site_that_does_not_answer_shows_as_unreachable(): void
    {
        $this->connect();
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->assertSame('unreachable', ClientSiteHealth::all()[0]['status']);
    }

    public function test_the_token_never_reaches_the_browser(): void
    {
        $this->connect();
        Http::fake(['*' => Http::response(['status' => 'ok', 'checks' => []])]);

        $this->actingAs(User::factory()->create())->get('/dashboard')->assertOk()->assertDontSee('secret-token')
            ->assertInertia(fn ($page) => $page->where('clientSites.0.status', 'ok')->missing('clientSites.0.token'));
        // config/portfolio.php is sent to public pages: it must not carry client-site settings.
        $this->get('/')->assertOk()->assertDontSee('secret-token');
    }
}
