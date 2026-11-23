<?php

namespace App\Support\Rundown;

use App\Models\RundownPrediction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Puts one league's page data together: games from the feed, the model's lean for each upcoming game,
 * the injury report and headlines for each team, and the stored track record.
 */
class Board
{
    public const CACHE_SECONDS = 60;

    public function __construct(private EspnFeed $feed, private PredictionModel $model) {}

    /** @return array<string, mixed> */
    public function for(string $league): array
    {
        return Cache::remember("rundown:board:{$league}", self::CACHE_SECONDS, fn () => $this->build($league));
    }

    /** @return array<string, mixed> */
    public function build(string $league): array
    {
        $meta = EspnFeed::LEAGUES[$league];
        $notes = [];
        [$slate, $earlier, $byeTeamIds, $restKnown, $at] = $this->slate($league, $notes);

        $lastGoodKey = "rundown:last-good:{$league}";
        if ($slate === null) {
            return [
                'league' => $league,
                'ok' => false,
                'updatedAt' => null,
                'lastGoodAt' => Cache::get($lastGoodKey),
                'games' => [],
                'headlines' => [],
                'injuries' => ['status' => 'unavailable', 'updatedAt' => null],
                'notes' => [],
                'slateNote' => $this->slateNote($league),
                'record' => $this->record($league),
            ];
        }
        Cache::forever($lastGoodKey, $at);

        $injuries = $this->feed->injuries($league);
        $news = $this->feed->news($league);
        $injuriesUsable = $injuries !== null && $injuries['usable'];
        if ($news === null) {
            $notes[] = 'Headlines could not be loaded right now.';
        }

        $all = array_merge($earlier, $slate);
        $games = [];
        foreach ($slate as $game) {
            $teamInjuries = ['home' => null, 'away' => null];
            if ($injuriesUsable) {
                $teamInjuries = [
                    'home' => $injuries['teams'][$game['home']['id']] ?? [],
                    'away' => $injuries['teams'][$game['away']['id']] ?? [],
                ];
            }
            $rest = ['home' => null, 'away' => null];
            if ($restKnown) {
                $rest = ['home' => $this->rest($game, 'home', $all, $byeTeamIds), 'away' => $this->rest($game, 'away', $all, $byeTeamIds)];
            }

            $prediction = $this->model->predict($game, $teamInjuries, $rest);
            $headlines = [];
            foreach ($news['items'] ?? [] as $item) {
                if (array_intersect($item['teamIds'], [$game['home']['id'], $game['away']['id']])) {
                    $headlines[] = $item;
                }
            }

            // The browser does not need the ids the model matched on.
            foreach (['home', 'away'] as $side) {
                unset($game[$side]['leaders'], $game[$side]['passer']);
            }
            $strip = fn (?array $list) => $list === null ? null : array_map(fn ($p) => array_diff_key($p, ['athleteId' => 1]), $list);
            $games[] = $game + [
                'prediction' => $prediction,
                'injuries' => ['home' => $strip($teamInjuries['home']), 'away' => $strip($teamInjuries['away'])],
                'headlines' => array_slice($headlines, 0, 4),
            ];
        }

        $this->store($games);
        $this->gradeFinals($all);

        return [
            'league' => $league,
            'ok' => true,
            'updatedAt' => $at,
            'lastGoodAt' => $at,
            'games' => $games,
            'headlines' => array_slice($news['items'] ?? [], 0, 8),
            'injuries' => [
                'status' => $injuries === null ? 'unavailable' : ($injuriesUsable ? 'ok' : 'not_covered'),
                'updatedAt' => $injuries['at'] ?? null,
            ],
            'notes' => $notes,
            'slateNote' => $this->slateNote($league),
            'record' => $this->record($league),
        ];
    }

    /**
     * Which scoreboards make up a league's slate, and which earlier ones are only used to work out rest.
     *
     * @param  list<string>  $notes
     * @return array{0: ?list<array<string, mixed>>, 1: list<array<string, mixed>>, 2: list<string>, 3: bool, 4: ?string}
     */
    private function slate(string $league, array &$notes): array
    {
        $day = fn (int $offset) => Carbon::now('America/New_York')->addDays($offset)->format('Ymd');

        if ($league === 'nfl' || $league === 'cfb') {
            $week = $this->feed->scoreboard($league);
            if ($week === null) {
                return [null, [], [], false, null];
            }
            if ($league === 'cfb' || ! $week['week'] || $week['week'] < 2) {
                return [$week['games'], [], [], false, $week['at']];
            }
            $query = ['week' => $week['week'] - 1] + ($week['seasonType'] ? ['seasontype' => $week['seasonType']] : []);
            $previous = $this->feed->scoreboard($league, $query, EspnFeed::FINISHED_SECONDS);

            return [$week['games'], $previous['games'] ?? [], $previous['byeTeamIds'] ?? [], $previous !== null, $week['at']];
        }

        // Basketball is listed day by day (US Eastern): today and tomorrow, plus yesterday for back-to-backs.
        $today = $this->feed->scoreboard($league, ['dates' => $day(0)]);
        if ($today === null) {
            return [null, [], [], false, null];
        }
        $tomorrow = $this->feed->scoreboard($league, ['dates' => $day(1)]);
        if ($tomorrow === null) {
            $notes[] = "Tomorrow's games could not be loaded right now.";
        }
        $yesterday = $this->feed->scoreboard($league, ['dates' => $day(-1)], EspnFeed::SCOREBOARD_SECONDS * 5);
        $late = array_values(array_filter($yesterday['games'] ?? [], fn ($g) => $g['state'] === 'in'));
        $slate = collect(array_merge($late, $today['games'], $tomorrow['games'] ?? []))->unique('id')->values()->all();
        $earlier = array_values(array_filter($yesterday['games'] ?? [], fn ($g) => $g['state'] !== 'in'));

        return [$slate, $earlier, [], $yesterday !== null, $today['at']];
    }

    private function slateNote(string $league): string
    {
        return match ($league) {
            'nfl' => "This week's NFL games.",
            'cfb' => "This week's college football games that involve a ranked team (that is what ESPN's public feed lists).",
            'nba' => "Today's and tomorrow's NBA games (US Eastern days).",
            default => "Today's and tomorrow's men's college basketball games that involve a ranked team (that is what ESPN's public feed lists).",
        };
    }

    /**
     * Time since a team's previous game, from the scoreboards already loaded.
     *
     * @param  list<array<string, mixed>>  $all
     * @param  list<string>  $byeTeamIds
     * @return array{hours: ?float, days: ?int, bye: bool}
     */
    private function rest(array $game, string $side, array $all, array $byeTeamIds): array
    {
        $teamId = $game[$side]['id'];
        $start = Carbon::parse($game['start']);
        $last = null;
        foreach ($all as $other) {
            if ($other['id'] === $game['id'] || ! in_array($teamId, [$other['home']['id'], $other['away']['id']], true)) {
                continue;
            }
            $otherStart = Carbon::parse($other['start']);
            if ($otherStart->lt($start) && ($last === null || $otherStart->gt($last))) {
                $last = $otherStart;
            }
        }
        $hours = $last ? round($last->diffInMinutes($start) / 60, 1) : null;

        return ['hours' => $hours, 'days' => $hours !== null ? (int) floor($hours / 24) : null, 'bye' => in_array($teamId, $byeTeamIds, true)];
    }

    /**
     * Save each new lean once, and only before the game starts, so the track record cannot be rewritten later.
     *
     * @param  list<array<string, mixed>>  $games
     */
    private function store(array $games): void
    {
        try {
            $rows = [];
            foreach ($games as $game) {
                $lean = $game['prediction']['lean'] ?? null;
                if ($game['state'] !== 'pre' || ! $lean || ! Carbon::parse($game['start'])->isFuture()) {
                    continue;
                }
                $rows[] = [
                    'league' => $game['league'],
                    'event_id' => $game['id'],
                    'starts_at' => Carbon::parse($game['start'])->utc()->toDateTimeString(),
                    'home' => $game['home']['abbr'],
                    'away' => $game['away']['abbr'],
                    'side' => $lean['side'],
                    'team' => $lean['team'],
                    'line' => $lean['line'],
                    'adjustment' => $game['prediction']['adjustment'],
                    'confidence' => $game['prediction']['confidence'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if ($rows) {
                RundownPrediction::query()->insertOrIgnore($rows);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** @param  list<array<string, mixed>>  $games */
    private function gradeFinals(array $games): void
    {
        try {
            $finals = collect($games)->filter(fn ($g) => $g['final'] && $g['home']['score'] !== null && $g['away']['score'] !== null)->keyBy('id');
            if ($finals->isEmpty()) {
                return;
            }
            $league = $finals->first()['league'];
            $open = RundownPrediction::query()->where('league', $league)->whereNull('result')->whereIn('event_id', $finals->keys())->get();
            foreach ($open as $prediction) {
                $game = $finals[$prediction->event_id];
                $mine = $game[$prediction->side]['score'];
                $theirs = $game[$prediction->side === 'home' ? 'away' : 'home']['score'];
                $prediction->update([
                    'home_score' => $game['home']['score'],
                    'away_score' => $game['away']['score'],
                    'result' => PredictionModel::grade($mine, $theirs, $prediction->line),
                    'graded_at' => now(),
                ]);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /**
     * The track record, counted only from stored leans. $league null = all four leagues.
     *
     * @return array<string, mixed>
     */
    public function record(?string $league = null): array
    {
        try {
            $query = fn () => RundownPrediction::query()->when($league, fn ($q) => $q->where('league', $league));
            $counts = $query()->selectRaw('result, count(*) as n')->groupBy('result')->pluck('n', 'result');
            $recent = $query()->whereNotNull('result')->orderByDesc('graded_at')->limit(12)->get()->map(fn (RundownPrediction $p) => [
                'league' => $p->league,
                'matchup' => "{$p->away} @ {$p->home}",
                'lean' => $p->team.' '.PredictionModel::signed($p->line, true),
                'confidence' => $p->confidence,
                'score' => "{$p->away_score}-{$p->home_score}",
                'result' => $p->result,
                'savedAt' => $p->created_at?->toIso8601String(),
                'startsAt' => $p->starts_at?->toIso8601String(),
            ])->all();

            return [
                'wins' => (int) ($counts['win'] ?? 0),
                'losses' => (int) ($counts['loss'] ?? 0),
                'pushes' => (int) ($counts['push'] ?? 0),
                'pending' => (int) ($counts[''] ?? $counts[null] ?? 0),
                'since' => $query()->min('created_at') ? Carbon::parse($query()->min('created_at'))->toIso8601String() : null,
                'recent' => $recent,
            ];
        } catch (Throwable $e) {
            report($e);

            return ['wins' => 0, 'losses' => 0, 'pushes' => 0, 'pending' => 0, 'since' => null, 'recent' => []];
        }
    }
}
