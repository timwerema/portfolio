<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Nightly backup at 3:10am server time (needs the scheduler cron line - see DEPLOY.md).
// Output is kept in storage/logs/backup.log so a failed night can be explained.
Schedule::command('backup:run')->dailyAt('03:10')->withoutOverlapping(60)->onOneServer()
    ->appendOutputTo(storage_path('logs/backup.log'));

// Every 5 minutes: heartbeat + email alert when a health check fails or recovers.
Schedule::command('health:check')->everyFiveMinutes()->withoutOverlapping();

// Payment reminders for overdue invoices, every morning at 9:20.
Schedule::command('invoices:remind')->dailyAt('09:20')->withoutOverlapping();

// Weekly business summary to you, Mondays at 7:40.
Schedule::command('business:weekly-summary')->weeklyOn(1, '07:40');

// Lead follow-ups due today, 13:35 UTC (about 7:35am Central in winter, 8:35am in summer).
Schedule::command('leads:nudge')->dailyAt('13:35')->withoutOverlapping(10);

// Rundown demo: every hour, save new model leans before kickoff and grade finished games (calls ESPN's public feeds).
Schedule::command('rundown:refresh')->hourlyAt(7)->withoutOverlapping(10);
