<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Nightly backup at 3:10am server time (needs the scheduler cron line - see DEPLOY.md).
Schedule::command('backup:run')->dailyAt('03:10')->withoutOverlapping()->onOneServer();

// Every 5 minutes: heartbeat + email alert when a health check fails or recovers.
Schedule::command('health:check')->everyFiveMinutes()->withoutOverlapping();
