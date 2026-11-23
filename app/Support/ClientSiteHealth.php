<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Health of client sites Timasi looks after, for the dashboard overview.
 *
 * Each site exposes GET {url}/api/health with "Authorization: Bearer {token}" (see the site's HANDOFF.md).
 * The call is made here, on the server, so the token never reaches the browser. Results are cached
 * for a few minutes so the dashboard stays fast and the client site is not hammered.
 */
class ClientSiteHealth
{
    private const CACHE_SECONDS = 300;

    private const TIMEOUT_SECONDS = 5;

    /** @return list<array{key: string, name: string, kind: string, url: ?string, status: string, detail: string, checked_at: ?string, checks: list<array{name: string, status: string, detail: string}>, reservations: ?array}> */
    public static function all(): array
    {
        $out = [];
        foreach (config('services.client_sites', []) as $key => $site) {
            $out[] = self::one((string) $key, $site);
        }

        return $out;
    }

    private static function one(string $key, array $site): array
    {
        $url = rtrim((string) ($site['url'] ?? ''), '/');
        $base = [
            'key' => $key,
            'name' => (string) ($site['name'] ?? $key),
            'kind' => (string) ($site['kind'] ?? ''),
            'url' => $url ?: null,
            'checked_at' => null,
            'checks' => [],
            'reservations' => null,
        ];

        if ($url === '' || empty($site['token'])) {
            return $base + ['status' => 'not_connected', 'detail' => 'Add its address and health token to .env to see its status here.'];
        }

        // Cache key includes the address so changing it in .env takes effect straight away.
        return Cache::remember('client-site-health:'.$key.':'.md5($url), self::CACHE_SECONDS, fn () => self::fetch($base, $url, (string) $site['token']));
    }

    private static function fetch(array $base, string $url, string $token): array
    {
        try {
            $response = Http::withToken($token)->acceptJson()->timeout(self::TIMEOUT_SECONDS)->get($url.'/api/health');
        } catch (Throwable) {
            return $base + ['status' => 'unreachable', 'detail' => 'The site did not answer. It may be down.'];
        }

        if ($response->status() === 404) {
            return $base + ['status' => 'unknown', 'detail' => 'The site answered but refused the health token. Check MAANET_HEALTH_TOKEN matches its HEALTH_TOKEN.'];
        }

        $data = $response->json();
        if (! is_array($data) || ! isset($data['status'])) {
            return $base + ['status' => 'unknown', 'detail' => "Unexpected answer (HTTP {$response->status()})."];
        }

        $status = in_array($data['status'], ['ok', 'warn', 'fail', 'stale', 'unknown'], true) ? $data['status'] : 'unknown';
        $checks = collect($data['checks'] ?? [])->filter(fn ($c) => is_array($c))->map(fn ($c) => [
            'name' => (string) ($c['name'] ?? ''),
            'status' => (string) ($c['status'] ?? ''),
            'detail' => (string) ($c['detail'] ?? ''),
        ])->values()->all();
        $problems = collect($checks)->where('status', '!=', 'ok')->pluck('name')->implode(', ');

        // The site has put up its "back shortly" page: by hand, or by itself after a failed check.
        // That is a different thing from "broken", so it gets its own status.
        $maintenance = is_array($data['maintenance'] ?? null) ? $data['maintenance'] : null;
        if ($maintenance) {
            $status = 'maintenance';
        }

        return array_merge($base, [
            'status' => $status,
            'detail' => match ($status) {
                'maintenance' => self::maintenanceDetail($maintenance, $problems),
                'ok' => 'All checks passing.',
                'stale' => 'Its health bot has stopped reporting. Check the cron entry on that host.',
                default => $problems !== '' ? "Needs attention: {$problems}." : 'Needs attention.',
            },
            'checked_at' => isset($data['checked_at']) ? (string) $data['checked_at'] : null,
            'checks' => $checks,
            'reservations' => is_array($data['reservations'] ?? null) ? [
                'pending' => (int) ($data['reservations']['pending'] ?? 0),
                'last_7_days' => (int) ($data['reservations']['last_7_days'] ?? 0),
            ] : null,
        ]);
    }

    private static function maintenanceDetail(array $maintenance, string $problems): string
    {
        $auto = ($maintenance['mode'] ?? '') === 'auto';
        $detail = $auto
            ? 'The site switched itself to its maintenance page after a failed check. It comes back by itself when the checks pass.'
            : 'Maintenance page switched on by hand. It stays on until someone switches it off.';

        $reason = trim((string) ($maintenance['reason'] ?? ''));
        if ($reason !== '') {
            $detail .= ' Reason: '.Str::limit($reason, 160).'.';
        }
        if ($auto && $problems !== '') {
            $detail .= " Failing: {$problems}.";
        }

        try {
            if (! empty($maintenance['since'])) {
                $detail .= ' Since '.Carbon::parse((string) $maintenance['since'])->diffForHumans().'.';
            }
        } catch (Throwable) {
            // An unreadable date is simply left out.
        }

        return $detail;
    }
}
