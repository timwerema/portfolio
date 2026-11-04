<?php

namespace Tests\Feature;

use App\Mail\SiteAlert;
use App\Support\Alerts;
use App\Support\HealthChecks;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class HealthAndAlertsTest extends TestCase
{
    use RefreshDatabase;

    private string $backups;

    protected function setUp(): void
    {
        parent::setUp();
        $this->backups = storage_path('backups');
        File::ensureDirectoryExists($this->backups);
        $this->clearBackups();
        config(['cache.default' => 'array']);
    }

    protected function tearDown(): void
    {
        $this->clearBackups();
        parent::tearDown();
    }

    private function clearBackups(): void
    {
        foreach (File::glob($this->backups.'/backup-*.tar.gz') as $f) {
            File::delete($f);
        }
    }

    private function fakeBackup(int $hoursAgo): void
    {
        $f = $this->backups.'/backup-test-'.$hoursAgo.'.tar.gz';
        File::put($f, 'x');
        touch($f, time() - $hoursAgo * 3600);
    }

    public function test_health_endpoint_reports_ok_with_checks(): void
    {
        $this->fakeBackup(2);
        Cache::forever(HealthChecks::HEARTBEAT_KEY, time());

        $this->getJson('/health')->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database.status', 'ok')
            ->assertJsonPath('checks.backups.status', 'ok')
            ->assertJsonPath('checks.scheduler.status', 'ok');
    }

    public function test_stale_backups_make_the_site_unhealthy(): void
    {
        $this->fakeBackup(48);

        $this->getJson('/health')->assertStatus(503)->assertJsonPath('status', 'fail')->assertJsonPath('checks.backups.status', 'fail');
    }

    public function test_missing_backups_and_heartbeat_are_only_warnings(): void
    {
        $this->getJson('/health')->assertOk()->assertJsonPath('checks.backups.status', 'warn')->assertJsonPath('checks.scheduler.status', 'warn');
    }

    public function test_health_check_emails_once_when_failing_and_once_on_recovery(): void
    {
        Mail::fake();
        $this->fakeBackup(48);

        $this->artisan('health:check')->assertFailed();
        $this->artisan('health:check')->assertFailed(); // still failing: no second email
        Mail::assertSent(SiteAlert::class, 1);
        Mail::assertSent(SiteAlert::class, fn ($m) => str_contains($m->alertSubject, 'backups'));

        $this->clearBackups();
        $this->fakeBackup(1);
        $this->artisan('health:check')->assertSuccessful();
        Mail::assertSent(SiteAlert::class, 2);
        Mail::assertSent(SiteAlert::class, fn ($m) => str_starts_with($m->alertSubject, 'Recovered'));
    }

    public function test_errors_email_the_owner_once_per_hour_when_enabled(): void
    {
        Mail::fake();
        config(['portfolio.alerts.errors' => true]);
        Route::get('/_boom', fn () => throw new RuntimeException('Kaboom'));

        $this->get('/_boom')->assertStatus(500);
        $this->get('/_boom')->assertStatus(500);

        Mail::assertSent(SiteAlert::class, 1);
        Mail::assertSent(SiteAlert::class, fn ($m) => $m->hasTo(Alerts::recipient()) && collect($m->lines)->contains(fn ($l) => str_contains($l, 'Kaboom')));
    }

    public function test_no_error_emails_when_disabled_or_for_404s(): void
    {
        Mail::fake();
        config(['portfolio.alerts.errors' => false]);
        Route::get('/_boom', fn () => throw new RuntimeException('Kaboom'));
        $this->get('/_boom')->assertStatus(500);

        config(['portfolio.alerts.errors' => true]);
        $this->get('/definitely-not-a-page')->assertNotFound();

        Mail::assertNothingSent();
    }
}
