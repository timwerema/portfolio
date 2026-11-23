<?php

namespace App\Support\Rundown;

use Closure;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Reads ESPN's public (unofficial, key-less) JSON feeds for the Rundown demo.
 *
 * Calls are made here, on the server, with a short timeout, and only a small cleaned-up copy is kept:
 * the browser never talks to ESPN and never downloads the multi-megabyte injury file. The feeds can
 * change or disappear without notice, so every method returns null when a feed is down or malformed
 * and the page shows an honest "data unavailable" state. Nothing is ever filled in with made-up data.
 *
 * Feed text is untrusted: it is trimmed, length-capped and only ever rendered as plain text.
 * Sportsbook links in the feed are dropped on purpose.
 */
class EspnFeed
{
    public const BASE = 'https://site.api.espn.com/apis/site/v2/sports/';

    public const LEAGUES = [
        'nfl' => ['label' => 'NFL', 'name' => 'NFL', 'path' => 'football/nfl', 'sport' => 'football'],
        'nba' => ['label' => 'NBA', 'name' => 'NBA', 'path' => 'basketball/nba', 'sport' => 'basketball'],
        'cfb' => ['label' => 'CFB', 'name' => 'College football', 'path' => 'football/college-football', 'sport' => 'football'],
        'ncaab' => ['label' => 'NCAAB', 'name' => "NCAA men's basketball", 'path' => 'basketball/mens-college-basketball', 'sport' => 'basketball'],
    ];

    public const SCOREBOARD_SECONDS = 180;

    public const FINISHED_SECONDS = 1800;

    public const INJURY_SECONDS = 1800;

    public const NEWS_SECONDS = 900;

    /** A failed feed is retried after this long, so a broken feed is not hammered on every page view. */
    public const FAILURE_SECONDS = 60;

    private const TIMEOUT_SECONDS = 8;

    private const MAX_BYTES = 25_000_000;

    /** Injury statuses the page understands. Anything else in the feed (such as "Active") is ignored. */
    private const STATUSES = ['Out' => 0, 'Doubtful' => 1, 'Questionable' => 2, 'Day-To-Day' => 3, 'Injured Reserve' => 4];

    /** The injury feed counts as usable only when it lists at least this many teams (college feeds are nearly empty). */
    public const INJURY_MIN_TEAMS = 10;

    /**
     * @param  array<string, scalar>  $query  for example ['dates' => '20261124'] or ['week' => 10]
     * @return array{at: string, week: ?int, seasonType: ?int, byeTeamIds: list<string>, games: list<array<string, mixed>>}|null
     */
    public function scoreboard(string $league, array $query = [], int $ttl = self::SCOREBOARD_SECONDS): ?array
    {
        ksort($query);

        return $this->cached("scoreboard:{$league}:".http_build_query($query), $ttl, function () use ($league, $query) {
            $raw = $this->get($league, 'scoreboard', $query);
            if (! is_array($raw) || ! is_array($raw['events'] ?? null)) {
                return null;
            }
            $games = [];
            foreach ($raw['events'] as $event) {
                if (is_array($event) && ($game = $this->game($league, $event))) {
                    $games[] = $game;
                }
            }
            usort($games, fn ($a, $b) => strcmp($a['start'], $b['start']));

            return [
                'at' => now()->toIso8601String(),
                'week' => is_numeric(data_get($raw, 'week.number')) ? (int) data_get($raw, 'week.number') : null,
                'seasonType' => is_numeric(data_get($raw, 'season.type')) ? (int) data_get($raw, 'season.type') : null,
                'byeTeamIds' => collect(data_get($raw, 'week.teamsOnBye', []))->pluck('id')->filter()->map(fn ($id) => (string) $id)->values()->all(),
                'games' => $games,
            ];
        });
    }

    /**
     * @return array{at: string, usable: bool, teams: array<string, list<array<string, mixed>>>}|null
     */
    public function injuries(string $league): ?array
    {
        return $this->cached("injuries:{$league}", self::INJURY_SECONDS, function () use ($league) {
            $raw = $this->get($league, 'injuries');
            if (! is_array($raw) || ! is_array($raw['injuries'] ?? null)) {
                return null;
            }
            $teams = [];
            foreach ($raw['injuries'] as $team) {
                $teamId = (string) data_get($team, 'id', '');
                if ($teamId === '' || ! is_array($team['injuries'] ?? null)) {
                    continue;
                }
                $players = [];
                foreach ($team['injuries'] as $item) {
                    $status = is_string($item['status'] ?? null) ? $item['status'] : '';
                    $name = self::text(data_get($item, 'athlete.displayName'), 60);
                    if (! isset(self::STATUSES[$status]) || $name === '') {
                        continue;
                    }
                    $players[] = [
                        'athleteId' => self::athleteId($item),
                        'name' => $name,
                        'pos' => self::text(data_get($item, 'athlete.position.abbreviation'), 4),
                        'status' => $status,
                        'comment' => self::text($item['shortComment'] ?? '', 200),
                        'date' => self::date($item['date'] ?? null),
                    ];
                }
                usort($players, fn ($a, $b) => [self::STATUSES[$a['status']], $b['date']] <=> [self::STATUSES[$b['status']], $a['date']]);
                $teams[$teamId] = array_slice($players, 0, 30);
            }

            return ['at' => now()->toIso8601String(), 'usable' => count($teams) >= self::INJURY_MIN_TEAMS, 'teams' => $teams];
        });
    }

    /**
     * @return array{at: string, items: list<array<string, mixed>>}|null
     */
    public function news(string $league): ?array
    {
        return $this->cached("news:{$league}", self::NEWS_SECONDS, function () use ($league) {
            $raw = $this->get($league, 'news', ['limit' => 50]);
            if (! is_array($raw) || ! is_array($raw['articles'] ?? null)) {
                return null;
            }
            $items = [];
            foreach ($raw['articles'] as $article) {
                $headline = self::text(data_get($article, 'headline'), 160);
                if ($headline === '') {
                    continue;
                }
                $description = self::text(data_get($article, 'description'), 240);
                $url = data_get($article, 'links.web.href');
                $items[] = [
                    'headline' => $headline,
                    'description' => $description === $headline ? '' : $description,
                    'published' => self::date(data_get($article, 'published') ?? data_get($article, 'lastModified')),
                    // Only plain https links to espn.com are passed on.
                    'url' => is_string($url) && preg_match('#^https://(www\.)?espn\.com/[^\s"<>]*$#', $url) ? $url : null,
                    'teamIds' => collect(data_get($article, 'categories', []))
                        ->filter(fn ($c) => is_array($c) && ($c['type'] ?? '') === 'team' && isset($c['teamId']))
                        ->map(fn ($c) => (string) $c['teamId'])->unique()->values()->all(),
                ];
            }

            return ['at' => now()->toIso8601String(), 'items' => array_slice($items, 0, 50)];
        });
    }

    /**
     * One game in Rundown's own compact shape, or null when the feed entry is not a normal two-team game.
     *
     * @return array<string, mixed>|null
     */
    public function game(string $league, array $event): ?array
    {
        $competition = data_get($event, 'competitions.0');
        $start = self::date($event['date'] ?? data_get($competition, 'date'));
        $id = (string) ($event['id'] ?? '');
        if (! is_array($competition) || ! $start || ! preg_match('/^\d{1,20}$/', $id)) {
            return null;
        }

        $sides = [];
        foreach ((array) ($competition['competitors'] ?? []) as $c) {
            $side = $c['homeAway'] ?? null;
            if (is_array($c) && in_array($side, ['home', 'away'], true)) {
                $sides[$side] = $this->team($c);
            }
        }
        if (! isset($sides['home'], $sides['away']) || ! $sides['home'] || ! $sides['away']) {
            return null;
        }

        $state = data_get($event, 'status.type.state');
        $state = in_array($state, ['pre', 'in', 'post'], true) ? $state : 'pre';
        $venue = self::text(data_get($competition, 'venue.fullName'), 60);
        $city = self::text(data_get($competition, 'venue.address.city'), 40);

        return [
            'id' => $id,
            'league' => $league,
            'sport' => self::LEAGUES[$league]['sport'],
            'start' => $start,
            'state' => $state,
            'final' => $state === 'post' && data_get($event, 'status.type.completed') === true,
            'statusText' => self::text(data_get($event, 'status.type.shortDetail') ?? data_get($event, 'status.type.description'), 40),
            'neutral' => data_get($competition, 'neutralSite') === true,
            'venue' => trim($venue.($venue && $city ? ', ' : '').$city),
            'tv' => self::text(data_get($competition, 'broadcast'), 30),
            'note' => self::text(data_get($competition, 'notes.0.headline'), 80),
            'home' => $sides['home'],
            'away' => $sides['away'],
            'odds' => $state === 'pre' ? $this->odds(data_get($competition, 'odds.0')) : null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function team(array $c): ?array
    {
        $id = (string) data_get($c, 'team.id', '');
        $abbr = self::text(data_get($c, 'team.abbreviation'), 6);
        $name = self::text(data_get($c, 'team.displayName'), 50);
        if ($id === '' || $abbr === '' || $name === '') {
            return null;
        }
        $records = [];
        foreach ((array) ($c['records'] ?? []) as $r) {
            $type = strtolower((string) ($r['type'] ?? ''));
            $summary = (string) ($r['summary'] ?? '');
            if (PredictionModel::parseRecord($summary)) {
                $records[$type] = $summary;
            }
        }
        $leaders = [];
        $passer = null;
        foreach ((array) ($c['leaders'] ?? []) as $category) {
            $athleteId = (string) data_get($category, 'leaders.0.athlete.id', '');
            if ($athleteId === '') {
                continue;
            }
            if (($category['name'] ?? '') === 'passingLeader') {
                $passer = $athleteId;
            }
            // "rating" is ESPN's own composite; the model only uses plain statistical leaders.
            if (($category['name'] ?? '') !== 'rating') {
                $leaders[] = $athleteId;
            }
        }
        $rank = data_get($c, 'curatedRank.current');
        $color = (string) data_get($c, 'team.color', '');
        $score = $c['score'] ?? null;

        return [
            'id' => $id,
            'abbr' => $abbr,
            'name' => $name,
            'short' => self::text(data_get($c, 'team.shortDisplayName'), 30) ?: $name,
            'color' => preg_match('/^[0-9a-f]{6}$/i', $color) ? '#'.strtolower($color) : null,
            'record' => $records['total'] ?? null,
            'homeRecord' => $records['home'] ?? $records['homerecord'] ?? null,
            'roadRecord' => $records['road'] ?? $records['awayrecord'] ?? null,
            'rank' => is_numeric($rank) && $rank >= 1 && $rank <= 25 ? (int) $rank : null,
            'score' => is_numeric($score) ? (int) $score : null,
            'winner' => ($c['winner'] ?? null) === true,
            'leaders' => array_values(array_unique($leaders)),
            'passer' => $passer,
        ];
    }

    /**
     * The spread is stored from the home team's side: -3.5 means the home team is favoured by 3.5.
     *
     * @return array<string, mixed>|null
     */
    private function odds(mixed $o): ?array
    {
        if (! is_array($o)) {
            return null;
        }
        $spread = self::line(data_get($o, 'pointSpread.home.close.line')) ?? (is_numeric($o['spread'] ?? null) ? (float) $o['spread'] : null);
        $total = is_numeric($o['overUnder'] ?? null) ? (float) $o['overUnder'] : null;
        if ($spread === null && $total === null) {
            return null;
        }

        return [
            'provider' => self::text(data_get($o, 'provider.name'), 30),
            'spreadHome' => $spread !== null && abs($spread) <= 80 ? $spread : null,
            'openSpreadHome' => self::line(data_get($o, 'pointSpread.home.open.line')),
            'total' => $total !== null && $total > 0 && $total < 400 ? $total : null,
            'openTotal' => self::line(ltrim((string) data_get($o, 'total.over.open.line', ''), 'ou')),
            'moneyHome' => self::moneyline(data_get($o, 'moneyline.home.close.odds')),
            'moneyAway' => self::moneyline(data_get($o, 'moneyline.away.close.odds')),
        ];
    }

    private static function line(mixed $value): ?float
    {
        if (is_string($value) && in_array(strtoupper(trim($value)), ['PK', 'PICK', 'EVEN'], true)) {
            return 0.0;
        }

        return is_numeric($value) && abs((float) $value) < 400 ? (float) $value : null;
    }

    private static function moneyline(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^[+-]\d{3,5}$/', $value) ? $value : null;
    }

    private static function athleteId(array $item): string
    {
        // The athlete id is not a field of its own; it is the number in the athlete's ESPN link.
        foreach ((array) data_get($item, 'athlete.links', []) as $link) {
            if (preg_match('#/id/(\d+)#', (string) ($link['href'] ?? ''), $m)) {
                return $m[1];
            }
        }

        return '';
    }

    /** Plain, single-line, length-capped text. */
    public static function text(mixed $value, int $max): string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return '';
        }
        $clean = trim(preg_replace('/\s+/u', ' ', preg_replace('/[\x00-\x1F\x7F]/u', ' ', strip_tags((string) $value)) ?? '') ?? '');

        return mb_strlen($clean) > $max ? rtrim(mb_substr($clean, 0, $max - 1)).'…' : $clean;
    }

    private static function date(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        try {
            return Carbon::parse($value)->utc()->toIso8601String();
        } catch (Throwable) {
            return null;
        }
    }

    /** @param  array<string, scalar>  $query */
    private function get(string $league, string $resource, array $query = []): mixed
    {
        if (! isset(self::LEAGUES[$league])) {
            return null;
        }
        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)->connectTimeout(4)->acceptJson()
                ->get(self::BASE.self::LEAGUES[$league]['path'].'/'.$resource, $query);
        } catch (Throwable) {
            return null;
        }
        if (! $response->successful() || strlen($response->body()) > self::MAX_BYTES) {
            return null;
        }

        return $response->json();
    }

    /** Cache good results for $ttl seconds and failures (null) for a minute. */
    private function cached(string $key, int $ttl, Closure $build): ?array
    {
        $key = 'rundown:'.$key;
        $hit = Cache::get($key);
        if (is_array($hit) && array_key_exists('v', $hit)) {
            return $hit['v'];
        }
        $value = $build();
        Cache::put($key, ['v' => $value], $value === null ? self::FAILURE_SECONDS : $ttl);

        return $value;
    }
}
