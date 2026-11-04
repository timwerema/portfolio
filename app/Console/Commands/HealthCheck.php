<?php

namespace App\Console\Commands;

use App\Support\Alerts;
use App\Support\HealthChecks;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Runs every 5 minutes from the scheduler. Records a heartbeat, and emails you
 * when a check starts failing and again when everything recovers - not every 5 minutes.
 */
class HealthCheck extends Command
{
    protected $signature = 'health:check';

    protected $description = 'Check site health and email an alert when something breaks or recovers';

    private const STATE_KEY = 'health:failing';

    public function handle(): int
    {
        Cache::forever(HealthChecks::HEARTBEAT_KEY, time());

        $checks = HealthChecks::run();
        $failing = collect($checks)->filter(fn ($c) => $c['status'] === 'fail');
        $previous = Cache::get(self::STATE_KEY, []);

        foreach ($checks as $name => $c) {
            $this->line(str_pad($name, 10).' '.strtoupper($c['status']).'  '.$c['detail']);
        }

        $now = $failing->keys()->sort()->values()->all();

        if ($now !== $previous) {
            if ($failing->isNotEmpty()) {
                Alerts::send('Health check failing: '.implode(', ', $now), $failing->map(fn ($c, $name) => ucfirst($name).': '.$c['detail'])->values()->all());
            } elseif ($previous) {
                Alerts::send('Recovered: all health checks passing', ['Previously failing: '.implode(', ', $previous)]);
            }
            Cache::forever(self::STATE_KEY, $now);
        }

        return $failing->isEmpty() ? self::SUCCESS : self::FAILURE;
    }
}
