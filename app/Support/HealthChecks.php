<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Checks used by GET /health (for an outside uptime monitor) and by the
 * scheduled `health:check` command (which emails you when something breaks).
 * Each check returns status ok | warn | fail. Only "fail" makes the site unhealthy.
 */
class HealthChecks
{
    public const HEARTBEAT_KEY = 'health:scheduler-heartbeat';

    /** @return array<string, array{status: string, detail: string}> */
    public static function run(): array
    {
        return [
            'database' => self::guard(fn () => self::database()),
            'storage' => self::guard(fn () => self::storage()),
            'disk' => self::guard(fn () => self::disk()),
            'backups' => self::guard(fn () => self::backups()),
            'scheduler' => self::guard(fn () => self::scheduler()),
        ];
    }

    public static function healthy(array $checks): bool
    {
        return collect($checks)->every(fn ($c) => $c['status'] !== 'fail');
    }

    private static function database(): array
    {
        DB::select('select 1');

        return ['status' => 'ok', 'detail' => 'Connected'];
    }

    private static function storage(): array
    {
        $probe = storage_path('framework/health-'.bin2hex(random_bytes(4)));
        File::put($probe, 'ok');
        File::delete($probe);

        return ['status' => 'ok', 'detail' => 'Writable'];
    }

    private static function disk(): array
    {
        $free = (float) @disk_free_space(base_path());
        $total = (float) @disk_total_space(base_path()) ?: 1;
        $pct = $free / $total * 100;
        $detail = sprintf('%.1f GB free (%d%%)', $free / 1073741824, $pct);

        if ($free < 500 * 1048576 || $pct < 3) {
            return ['status' => 'fail', 'detail' => $detail];
        }
        if ($free < 2 * 1073741824 || $pct < 10) {
            return ['status' => 'warn', 'detail' => $detail];
        }

        return ['status' => 'ok', 'detail' => $detail];
    }

    private static function backups(): array
    {
        $files = File::glob(storage_path('backups/backup-*.tar.gz'));
        if (! $files) {
            return ['status' => 'warn', 'detail' => 'No backups yet (run php artisan backup:run)'];
        }

        $newest = max(array_map('filemtime', $files));
        $hours = (int) floor((time() - $newest) / 3600);

        return $hours > 36
            ? ['status' => 'fail', 'detail' => "Last backup {$hours}h ago - is the scheduler running?"]
            : ['status' => 'ok', 'detail' => "Last backup {$hours}h ago"];
    }

    private static function scheduler(): array
    {
        $beat = Cache::get(self::HEARTBEAT_KEY);
        if (! $beat) {
            return ['status' => 'warn', 'detail' => 'No heartbeat yet (the scheduler cron may not be installed)'];
        }

        $minutes = (int) floor((time() - $beat) / 60);

        return $minutes > 15
            ? ['status' => 'fail', 'detail' => "Last ran {$minutes} min ago"]
            : ['status' => 'ok', 'detail' => "Last ran {$minutes} min ago"];
    }

    private static function guard(callable $check): array
    {
        try {
            return $check();
        } catch (Throwable $e) {
            return ['status' => 'fail', 'detail' => class_basename($e).': '.str($e->getMessage())->limit(160)];
        }
    }
}
