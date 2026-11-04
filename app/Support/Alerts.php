<?php

namespace App\Support;

use App\Mail\SiteAlert;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class Alerts
{
    public static function recipient(): ?string
    {
        return config('portfolio.alerts.email') ?: config('portfolio.contact.notify_email') ?: config('portfolio.links.email');
    }

    /** Send an alert email. Never throws: alerting must not break the site. */
    public static function send(string $subject, array $lines): void
    {
        $to = self::recipient();
        if (! $to) {
            return;
        }

        try {
            Mail::to($to)->send(new SiteAlert($subject, $lines));
        } catch (Throwable $e) {
            Log::warning('Alert email failed: '.$e->getMessage(), ['subject' => $subject]);
        }
    }

    /** Called for every reported exception. Emails at most once per hour per distinct error. */
    public static function exception(Throwable $e): void
    {
        if (! config('portfolio.alerts.errors')) {
            return;
        }

        try {
            self::reportException($e);
        } catch (Throwable) {
            // e.g. the cache/database is down - the error is still logged normally.
        }
    }

    private static function reportException(Throwable $e): void
    {

        $fingerprint = 'alert:error:'.md5($e::class.'|'.$e->getFile().'|'.$e->getLine());
        if (! Cache::add($fingerprint, true, now()->addHour())) {
            return; // already alerted about this one recently
        }

        $request = app()->runningInConsole() ? null : request();
        $frames = collect($e->getTrace())->take(8)->map(fn ($f) => ($f['file'] ?? '[internal]').':'.($f['line'] ?? '?'));

        self::send('Site error: '.class_basename($e), array_filter([
            'Message: '.str($e->getMessage())->limit(300),
            'Where: '.str_replace(base_path().'/', '', $e->getFile()).':'.$e->getLine(),
            $request ? 'Request: '.$request->method().' '.$request->fullUrl() : 'Context: console / scheduled task',
            $request?->user() ? 'Logged-in user: #'.$request->user()->id : null,
            'Time: '.now()->toDayDateTimeString(),
            'Trace: '.$frames->map(fn ($f) => str_replace(base_path().'/', '', $f))->implode(' <- '),
            'Full details are in storage/logs/laravel.log. You will not get another email for this same error for an hour.',
        ]));
    }
}
