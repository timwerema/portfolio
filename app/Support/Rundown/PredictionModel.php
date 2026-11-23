<?php

namespace App\Support\Rundown;

/**
 * Rundown's prediction model: a handful of fixed, documented rules. No machine learning, no hidden inputs.
 *
 * It starts from the market (the posted point spread), then adds small adjustments, each measured in
 * points toward the home team (negative = toward the away team). If the adjustments add up to at least
 * LEAN_THRESHOLD points, the model leans to that side of the spread; otherwise it says "no lean".
 *
 * Every number here is a judgement call, not a fitted value, and the page says so. The weights shown on
 * the page are read from rules() below, so the explanation can never drift from the code.
 */
final class PredictionModel
{
    /** The adjustments must add up to at least this many points before the model leans. */
    public const LEAN_THRESHOLD = 1.0;

    /** How much of a player's weight counts for each injury status. Anything else (Injured Reserve, Active...) counts 0. */
    public const INJURY_STATUS = ['Out' => 1.0, 'Doubtful' => 0.75, 'Questionable' => 0.35, 'Day-To-Day' => 0.35];

    /** Points for one absent player. "Leader" = listed by the feed as one of the team's statistical leaders. */
    public const INJURY_POINTS = [
        'football' => ['qb' => 3.0, 'leader' => 0.8, 'other' => 0.2, 'kicker' => 0.1],
        'basketball' => ['leader' => 1.5, 'other' => 0.25],
    ];

    /** One team's injuries can never move the number by more than this. */
    public const INJURY_CAP = 4.0;

    /** NBA: a team whose previous game started less than this many hours earlier is on a back-to-back. */
    public const BACK_TO_BACK_HOURS = 36;

    public const BACK_TO_BACK_POINTS = 1.0;

    /** NFL: this many days or fewer since the last game is a short week. */
    public const SHORT_WEEK_DAYS = 5;

    public const SHORT_WEEK_POINTS = 0.75;

    public const BYE_POINTS = 0.5;

    /*
     * Form: home/road record, season record and (college) ranking all describe team quality, which the
     * spread already reflects. Their caps add up to 0.75, under LEAN_THRESHOLD on purpose: form alone can
     * never produce a lean. It only tips the scale when injuries, rest or line movement agree with it.
     * For confidence the three count as one factor, because they are not independent.
     */

    /** Home record at home vs away record on the road. */
    public const VENUE_SCALE = 0.5;

    public const VENUE_CAP = 0.3;

    public const VENUE_MIN_GAMES = 3;

    /** Overall season record. */
    public const RECORD_SCALE = 0.5;

    public const RECORD_CAP = 0.25;

    public const RECORD_MIN_GAMES = 4;

    /** College polls. */
    public const RANKED_VS_UNRANKED_POINTS = 0.2;

    public const RANK_GAP = 10;

    public const RANK_GAP_POINTS = 0.1;

    /** The spread has moved at least this far since it opened. */
    public const LINE_MOVE_MIN = 1.5;

    public const LINE_MOVE_POINTS = 0.5;

    /**
     * @param  array<string, mixed>  $game  a normalised game from EspnFeed
     * @param  array{home: ?list<array<string, mixed>>, away: ?list<array<string, mixed>>}  $injuries  null = no injury feed for this league
     * @param  array{home: ?array<string, mixed>, away: ?array<string, mixed>}  $rest  null = schedule data not available
     * @return array<string, mixed>
     */
    public function predict(array $game, array $injuries, array $rest): array
    {
        $odds = $game['odds'] ?? null;
        if (($game['state'] ?? '') !== 'pre' || ! is_array($odds) || ! is_numeric($odds['spreadHome'] ?? null)) {
            return [
                'lean' => null,
                'confidence' => null,
                'adjustment' => null,
                'modelLine' => null,
                'factors' => [],
                'summary' => ($game['state'] ?? '') === 'pre' ? 'No point spread is posted for this game yet, so there is nothing to lean on.' : null,
            ];
        }

        $factors = [
            $this->injuryFactor($game, $injuries),
            $this->restFactor($game, $rest),
            $this->venueFactor($game),
            $this->recordFactor($game),
            $this->rankFactor($game),
            $this->lineMoveFactor($game),
        ];
        $factors = array_values(array_filter($factors));

        $total = round(array_sum(array_column($factors, 'value')), 2);
        $side = abs($total) >= self::LEAN_THRESHOLD ? ($total > 0 ? 'home' : 'away') : null;

        $spreadHome = (float) $odds['spreadHome'];
        $lean = null;
        $confidence = null;
        if ($side) {
            $lean = [
                'side' => $side,
                'team' => $game[$side]['abbr'],
                'line' => $side === 'home' ? $spreadHome : -$spreadHome,
            ];
            $confidence = $this->confidence($factors, $total);
        }

        foreach ($factors as &$f) {
            $f['favors'] = $f['value'] > 0 ? $game['home']['abbr'] : ($f['value'] < 0 ? $game['away']['abbr'] : null);
        }
        unset($f);

        return [
            'lean' => $lean,
            'confidence' => $confidence,
            'adjustment' => $total,
            // The spread the model would post for the home team after its adjustments.
            'modelLine' => round($spreadHome - $total, 2),
            'factors' => $factors,
            'summary' => $this->summary($game, $factors, $total, $lean, $confidence),
        ];
    }

    /**
     * Confidence comes only from how much the factor groups agree. The groups are injuries, rest,
     * form (home/road record + season record + ranking, counted once) and line movement.
     *  high   = at least 2.5 points, 3+ groups on the lean's side, 80%+ of all movement pointing that way
     *  medium = at least 1.5 points, 2+ groups on the lean's side, 60%+ pointing that way
     *  low    = everything else
     *
     * @param  list<array<string, mixed>>  $factors
     */
    public function confidence(array $factors, float $total): string
    {
        $movement = array_sum(array_map(fn ($f) => abs($f['value']), $factors));
        $share = $movement > 0 ? abs($total) / $movement : 0;
        $groups = [];
        foreach ($factors as $f) {
            $group = $f['group'] ?? $f['key'] ?? count($groups);
            $groups[$group] = ($groups[$group] ?? 0) + $f['value'];
        }
        $agreeing = count(array_filter($groups, fn ($v) => round($v, 2) != 0 && ($v > 0) === ($total > 0)));

        return match (true) {
            abs($total) >= 2.5 && $agreeing >= 3 && $share >= 0.8 => 'high',
            abs($total) >= 1.5 && $agreeing >= 2 && $share >= 0.6 => 'medium',
            default => 'low',
        };
    }

    /**
     * Grade a stored lean against a final score. $line is the leaned team's spread (for example +6 or -3.5).
     */
    public static function grade(float $teamScore, float $opponentScore, float $line): string
    {
        $margin = $teamScore - $opponentScore + $line;

        return $margin > 0 ? 'win' : ($margin < 0 ? 'loss' : 'push');
    }

    /** "3-5-1" → wins, losses, ties, games and win share (a tie counts as half a win). */
    public static function parseRecord(?string $summary): ?array
    {
        if (! $summary || ! preg_match('/^(\d{1,3})-(\d{1,3})(?:-(\d{1,3}))?$/', trim($summary), $m)) {
            return null;
        }
        [$w, $l, $t] = [(int) $m[1], (int) $m[2], (int) ($m[3] ?? 0)];
        $games = $w + $l + $t;

        return ['w' => $w, 'l' => $l, 't' => $t, 'games' => $games, 'pct' => $games ? ($w + 0.5 * $t) / $games : 0.0];
    }

    /**
     * The injury weight of one team, in points, and the players behind it.
     *
     * @param  list<array<string, mixed>>  $players
     * @param  list<string>  $leaderIds
     * @return array{points: float, counted: list<string>}
     */
    public function injuryPoints(string $sport, array $players, array $leaderIds, ?string $passerId = null): array
    {
        $table = self::INJURY_POINTS[$sport] ?? self::INJURY_POINTS['basketball'];
        $points = 0.0;
        $counted = [];
        foreach ($players as $p) {
            $status = self::INJURY_STATUS[$p['status'] ?? ''] ?? 0;
            if ($status <= 0) {
                continue;
            }
            $id = (string) ($p['athleteId'] ?? '');
            $pos = strtoupper((string) ($p['pos'] ?? ''));
            $base = match (true) {
                $sport === 'football' && $id !== '' && $id === $passerId => $table['qb'],
                $id !== '' && in_array($id, $leaderIds, true) => $table['leader'],
                $sport === 'football' && in_array($pos, ['PK', 'K', 'P', 'LS'], true) => $table['kicker'],
                default => $table['other'],
            };
            $points += $base * $status;
            if ($base >= ($table['leader'] ?? 1)) {
                $counted[] = trim(($p['name'] ?? 'Player').' ('.($p['status'] ?? '').')');
            }
        }

        return ['points' => round(min($points, self::INJURY_CAP), 2), 'counted' => $counted];
    }

    /** @return array<string, mixed> */
    private function injuryFactor(array $game, array $injuries): array
    {
        if ($injuries['home'] === null || $injuries['away'] === null) {
            return $this->factor('injuries', 'Injuries', 0, 'no_data', 'The feed has no usable injury report for this league, so injuries are not counted.');
        }
        $h = $this->injuryPoints($game['sport'], $injuries['home'], $game['home']['leaders'] ?? [], $game['home']['passer'] ?? null);
        $a = $this->injuryPoints($game['sport'], $injuries['away'], $game['away']['leaders'] ?? [], $game['away']['passer'] ?? null);
        $value = round($a['points'] - $h['points'], 2);

        $part = fn (array $team, array $r) => $team['abbr'].' '.number_format($r['points'], 1).' pts'.($r['counted'] ? ' incl. '.implode(', ', array_slice($r['counted'], 0, 3)) : '');
        $note = $h['points'] == 0 && $a['points'] == 0
            ? 'No one listed as out, doubtful or questionable on either side.'
            : 'Injury weight: '.$part($game['away'], $a).'; '.$part($game['home'], $h).'.';

        return $this->factor('injuries', 'Injuries', $value, $value == 0 ? 'neutral' : 'used', $note);
    }

    /** @return array<string, mixed>|null */
    private function restFactor(array $game, array $rest): ?array
    {
        if (! in_array($game['league'], ['nfl', 'nba'], true)) {
            return $this->factor('rest', 'Rest and schedule', 0, 'no_data', "The college feed only lists games with ranked teams, so a team's previous game can't be checked reliably. Not counted.");
        }
        if ($rest['home'] === null || $rest['away'] === null) {
            return $this->factor('rest', 'Rest and schedule', 0, 'no_data', 'Earlier games could not be loaded, so rest is not counted.');
        }

        $value = 0.0;
        $notes = [];
        foreach (['home' => 1, 'away' => -1] as $side => $sign) {
            $abbr = $game[$side]['abbr'];
            $r = $rest[$side];
            if ($game['league'] === 'nba') {
                if (($r['hours'] ?? null) !== null && $r['hours'] < self::BACK_TO_BACK_HOURS) {
                    $value -= $sign * self::BACK_TO_BACK_POINTS;
                    $notes[] = "{$abbr} played ".round($r['hours']).' hours earlier (back-to-back)';
                }
            } else {
                if (! empty($r['bye'])) {
                    $value += $sign * self::BYE_POINTS;
                    $notes[] = "{$abbr} is coming off a bye week";
                } elseif (($r['days'] ?? null) !== null && $r['days'] <= self::SHORT_WEEK_DAYS) {
                    $value -= $sign * self::SHORT_WEEK_POINTS;
                    $notes[] = "{$abbr} is on a short week ({$r['days']} days of rest)";
                }
            }
        }
        $value = round($value, 2);
        $note = $notes ? implode('; ', $notes).'.' : ($game['league'] === 'nba' ? 'Neither team is on a back-to-back.' : 'Normal rest for both teams.');

        return $this->factor('rest', 'Rest and schedule', $value, $value == 0 ? 'neutral' : 'used', $note);
    }

    /** @return array<string, mixed> */
    private function venueFactor(array $game): array
    {
        if (! empty($game['neutral'])) {
            return $this->factor('venue', 'Home and road form', 0, 'neutral', 'Neutral site, so home and road records are not counted.');
        }
        $home = self::parseRecord($game['home']['homeRecord'] ?? null);
        $away = self::parseRecord($game['away']['roadRecord'] ?? null);
        if (! $home || ! $away || $home['games'] < self::VENUE_MIN_GAMES || $away['games'] < self::VENUE_MIN_GAMES) {
            return $this->factor('venue', 'Home and road form', 0, 'no_data', 'Fewer than '.self::VENUE_MIN_GAMES.' home or road games so far. Not counted.');
        }
        $value = round(max(-self::VENUE_CAP, min(self::VENUE_CAP, ($home['pct'] - $away['pct']) * self::VENUE_SCALE)), 2);
        $note = "{$game['home']['abbr']} are {$game['home']['homeRecord']} at home; {$game['away']['abbr']} are {$game['away']['roadRecord']} on the road.";

        return $this->factor('venue', 'Home and road form', $value, $value == 0 ? 'neutral' : 'used', $note);
    }

    /** @return array<string, mixed> */
    private function recordFactor(array $game): array
    {
        $home = self::parseRecord($game['home']['record'] ?? null);
        $away = self::parseRecord($game['away']['record'] ?? null);
        if (! $home || ! $away || $home['games'] < self::RECORD_MIN_GAMES || $away['games'] < self::RECORD_MIN_GAMES) {
            return $this->factor('record', 'Season record', 0, 'no_data', 'Fewer than '.self::RECORD_MIN_GAMES.' games played by one of the teams. Not counted.');
        }
        $value = round(max(-self::RECORD_CAP, min(self::RECORD_CAP, ($home['pct'] - $away['pct']) * self::RECORD_SCALE)), 2);
        $note = "{$game['away']['abbr']} {$game['away']['record']}, {$game['home']['abbr']} {$game['home']['record']}.";

        return $this->factor('record', 'Season record', $value, $value == 0 ? 'neutral' : 'used', $note);
    }

    /** @return array<string, mixed>|null */
    private function rankFactor(array $game): ?array
    {
        if (! in_array($game['league'], ['cfb', 'ncaab'], true)) {
            return null;
        }
        $h = $game['home']['rank'] ?? null;
        $a = $game['away']['rank'] ?? null;
        $value = 0.0;
        if ($h && ! $a) {
            $value = self::RANKED_VS_UNRANKED_POINTS;
            $note = "{$game['home']['abbr']} are ranked #{$h}; {$game['away']['abbr']} are unranked.";
        } elseif ($a && ! $h) {
            $value = -self::RANKED_VS_UNRANKED_POINTS;
            $note = "{$game['away']['abbr']} are ranked #{$a}; {$game['home']['abbr']} are unranked.";
        } elseif ($h && $a) {
            if (abs($h - $a) >= self::RANK_GAP) {
                $value = $h < $a ? self::RANK_GAP_POINTS : -self::RANK_GAP_POINTS;
            }
            $note = "{$game['away']['abbr']} #{$a}, {$game['home']['abbr']} #{$h}.";
        } else {
            $note = 'Neither team is ranked.';
        }

        return $this->factor('rank', 'Ranking', $value, $value == 0 ? 'neutral' : 'used', $note);
    }

    /** @return array<string, mixed> */
    private function lineMoveFactor(array $game): array
    {
        $now = $game['odds']['spreadHome'];
        $open = $game['odds']['openSpreadHome'] ?? null;
        if (! is_numeric($open)) {
            return $this->factor('line', 'Line movement', 0, 'no_data', 'The feed has no opening spread for this game.');
        }
        // The home line dropping (say -3 to -5) means the market moved toward the home team.
        $move = round((float) $open - (float) $now, 2);
        if (abs($move) < self::LINE_MOVE_MIN) {
            return $this->factor('line', 'Line movement', 0, 'neutral', 'The spread has moved less than '.self::LINE_MOVE_MIN.' points since it opened.');
        }
        $toward = $move > 0 ? $game['home']['abbr'] : $game['away']['abbr'];
        $value = $move > 0 ? self::LINE_MOVE_POINTS : -self::LINE_MOVE_POINTS;

        return $this->factor('line', 'Line movement', $value, 'used', 'The spread has moved '.rtrim(rtrim(number_format(abs($move), 1), '0'), '.')." points toward {$toward} since it opened.");
    }

    /** @return array<string, mixed> */
    private function factor(string $key, string $label, float $value, string $status, string $note): array
    {
        $group = in_array($key, ['venue', 'record', 'rank'], true) ? 'form' : $key;

        return ['key' => $key, 'group' => $group, 'label' => $label, 'value' => $value, 'status' => $status, 'note' => $note];
    }

    /** @param  list<array<string, mixed>>  $factors */
    private function summary(array $game, array $factors, float $total, ?array $lean, ?string $confidence): string
    {
        if (! $lean) {
            return 'The adjustments add up to '.self::signed($total).' points, under the '.number_format(self::LEAN_THRESHOLD, 1).'-point bar. The model has no reason to disagree with the market here.';
        }
        $with = array_filter($factors, fn ($f) => $f['value'] != 0 && ($f['value'] > 0) === ($total > 0));
        usort($with, fn ($x, $y) => abs($y['value']) <=> abs($x['value']));
        $names = implode(', ', array_map(fn ($f) => strtolower($f['label']), $with));

        return "Leans {$lean['team']} ".self::signed($lean['line'], true)." with {$confidence} confidence: ".number_format(abs($total), 1)." points of adjustment toward {$lean['team']} from {$names}.";
    }

    public static function signed(float $n, bool $pickEm = false): string
    {
        if ($pickEm && $n == 0) {
            return 'PK';
        }
        $s = rtrim(rtrim(number_format(abs($n), 2), '0'), '.');

        return ($n > 0 ? '+' : ($n < 0 ? '-' : '')).$s;
    }

    /**
     * The rules in plain words, for the "How this works" section. Built from the constants above.
     *
     * @return list<array{name: string, rule: string, max: string}>
     */
    public static function rules(): array
    {
        $fb = self::INJURY_POINTS['football'];
        $bb = self::INJURY_POINTS['basketball'];
        $st = self::INJURY_STATUS;

        return [
            [
                'name' => 'Injuries',
                'rule' => "Each listed player counts by status (Out {$st['Out']}, Doubtful {$st['Doubtful']}, Questionable or Day-To-Day {$st['Questionable']}) times a weight. Football: the team's leading passer {$fb['qb']} pts, another statistical leader {$fb['leader']}, kickers {$fb['kicker']}, anyone else {$fb['other']}. Basketball: a team leader in points, rebounds or assists {$bb['leader']} pts, anyone else {$bb['other']}. Injured Reserve is listed but not counted (long-term absences are already in the record and the line).",
                'max' => self::INJURY_CAP.' pts per team',
            ],
            [
                'name' => 'Rest and schedule',
                'rule' => 'NBA: a team whose last game started under '.self::BACK_TO_BACK_HOURS.' hours earlier gives up '.self::BACK_TO_BACK_POINTS.' pt. NFL: '.self::SHORT_WEEK_DAYS.' days of rest or fewer gives up '.self::SHORT_WEEK_POINTS.' pts; coming off a bye gains '.self::BYE_POINTS.'. College: not counted (the feed does not list every team\'s previous game).',
                'max' => '1.5 pts',
            ],
            [
                'name' => 'Home and road form',
                'rule' => "Home team's win share at home minus the away team's win share on the road, times ".self::VENUE_SCALE.'. Needs '.self::VENUE_MIN_GAMES.'+ games each. Skipped at neutral sites.',
                'max' => self::VENUE_CAP.' pt',
            ],
            [
                'name' => 'Season record',
                'rule' => 'Difference in overall win share, times '.self::RECORD_SCALE.'. Needs '.self::RECORD_MIN_GAMES.'+ games each.',
                'max' => self::RECORD_CAP.' pts',
            ],
            [
                'name' => 'Ranking (college only)',
                'rule' => 'Ranked team against an unranked one: '.self::RANKED_VS_UNRANKED_POINTS.' pts. Both ranked and '.self::RANK_GAP.'+ places apart: '.self::RANK_GAP_POINTS.' to the higher-ranked team.',
                'max' => self::RANKED_VS_UNRANKED_POINTS.' pts',
            ],
            [
                'name' => 'Line movement',
                'rule' => 'If the spread has moved '.self::LINE_MOVE_MIN.'+ points since it opened, '.self::LINE_MOVE_POINTS.' pts toward the side it moved to.',
                'max' => self::LINE_MOVE_POINTS.' pts',
            ],
        ];
    }
}
