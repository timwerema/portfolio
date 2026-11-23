<?php

namespace Tests\Unit;

use App\Support\Rundown\PredictionModel;
use PHPUnit\Framework\TestCase;

class RundownPredictionModelTest extends TestCase
{
    private function game(array $overrides = []): array
    {
        return array_replace_recursive([
            'id' => '1',
            'league' => 'nfl',
            'sport' => 'football',
            'state' => 'pre',
            'neutral' => false,
            'home' => ['id' => '10', 'abbr' => 'HOM', 'record' => '5-5', 'homeRecord' => '3-2', 'roadRecord' => '2-3', 'rank' => null, 'leaders' => ['100', '101'], 'passer' => '100'],
            'away' => ['id' => '20', 'abbr' => 'AWY', 'record' => '5-5', 'homeRecord' => '3-2', 'roadRecord' => '3-2', 'rank' => null, 'leaders' => ['200', '201'], 'passer' => '200'],
            'odds' => ['spreadHome' => -3.0, 'openSpreadHome' => -3.0, 'total' => 44.5],
        ], $overrides);
    }

    private const NONE = ['home' => [], 'away' => []];

    private const RESTED = ['home' => ['hours' => 168.0, 'days' => 7, 'bye' => false], 'away' => ['hours' => 168.0, 'days' => 7, 'bye' => false]];

    private function factor(array $prediction, string $key): array
    {
        return collect($prediction['factors'])->firstWhere('key', $key);
    }

    public function test_even_game_has_no_lean_and_keeps_the_market_line(): void
    {
        $p = (new PredictionModel)->predict($this->game(), self::NONE, self::RESTED);

        $this->assertNull($p['lean']);
        $this->assertNull($p['confidence']);
        $this->assertSame(0.0, $p['adjustment']);
        $this->assertSame(-3.0, $p['modelLine']);
        $this->assertStringContainsString('no reason to disagree with the market', $p['summary']);
    }

    public function test_no_spread_means_no_prediction(): void
    {
        $p = (new PredictionModel)->predict($this->game(['odds' => null]), self::NONE, self::RESTED);
        $this->assertNull($p['lean']);
        $this->assertSame([], $p['factors']);
        $this->assertStringContainsString('No point spread', $p['summary']);

        $live = (new PredictionModel)->predict($this->game(['state' => 'in']), self::NONE, self::RESTED);
        $this->assertNull($live['lean']);
        $this->assertNull($live['summary']);
    }

    public function test_starting_quarterback_out_moves_the_number_toward_the_other_team(): void
    {
        $injuries = ['home' => [['athleteId' => '100', 'name' => 'Home Passer', 'pos' => 'QB', 'status' => 'Out']], 'away' => []];
        $p = (new PredictionModel)->predict($this->game(), $injuries, self::RESTED);

        $this->assertSame(-3.0, $this->factor($p, 'injuries')['value']);
        $this->assertSame(['side' => 'away', 'team' => 'AWY', 'line' => 3.0], $p['lean']);
        $this->assertSame(0.0, $p['modelLine']);
        // One factor only: confidence stays low however large it is.
        $this->assertSame('low', $p['confidence']);
    }

    public function test_injury_weights_by_status_role_and_cap(): void
    {
        $m = new PredictionModel;
        $backupQb = [['athleteId' => '999', 'name' => 'Backup', 'pos' => 'QB', 'status' => 'Out']];
        $this->assertSame(0.2, $m->injuryPoints('football', $backupQb, ['100'], '100')['points']);

        $questionableStarter = [['athleteId' => '100', 'name' => 'Starter', 'pos' => 'QB', 'status' => 'Questionable']];
        $this->assertSame(1.05, $m->injuryPoints('football', $questionableStarter, ['100'], '100')['points']);

        $ignored = [['athleteId' => '100', 'name' => 'Starter', 'pos' => 'QB', 'status' => 'Injured Reserve'], ['athleteId' => '5', 'name' => 'X', 'pos' => 'WR', 'status' => 'Active']];
        $this->assertSame(0.0, $m->injuryPoints('football', $ignored, ['100'], '100')['points']);

        $nba = [['athleteId' => '7', 'name' => 'Scorer', 'pos' => 'G', 'status' => 'Out'], ['athleteId' => '8', 'name' => 'Bench', 'pos' => 'F', 'status' => 'Day-To-Day']];
        $this->assertSame(1.59, $m->injuryPoints('basketball', $nba, ['7'])['points']);

        $many = array_map(fn ($i) => ['athleteId' => (string) $i, 'name' => "P{$i}", 'pos' => 'G', 'status' => 'Out'], range(1, 6));
        $this->assertSame(PredictionModel::INJURY_CAP, $m->injuryPoints('basketball', $many, ['1', '2', '3', '4', '5', '6'])['points']);
    }

    public function test_missing_injury_feed_is_reported_as_no_data_not_as_healthy(): void
    {
        $p = (new PredictionModel)->predict($this->game(['league' => 'cfb']), ['home' => null, 'away' => null], ['home' => null, 'away' => null]);

        $this->assertSame('no_data', $this->factor($p, 'injuries')['status']);
        $this->assertSame('no_data', $this->factor($p, 'rest')['status']);
        $this->assertSame(0.0, $this->factor($p, 'injuries')['value']);
    }

    public function test_rest_rules(): void
    {
        $m = new PredictionModel;
        $nba = $this->game(['league' => 'nba', 'sport' => 'basketball']);
        $b2b = $m->predict($nba, self::NONE, ['home' => ['hours' => 24.0, 'days' => 1, 'bye' => false], 'away' => ['hours' => 48.0, 'days' => 2, 'bye' => false]]);
        $this->assertSame(-1.0, $this->factor($b2b, 'rest')['value']);

        $both = $m->predict($nba, self::NONE, ['home' => ['hours' => 24.0, 'days' => 1, 'bye' => false], 'away' => ['hours' => 25.0, 'days' => 1, 'bye' => false]]);
        $this->assertSame(0.0, $this->factor($both, 'rest')['value']);

        $nfl = $m->predict($this->game(), self::NONE, ['home' => ['hours' => 100.0, 'days' => 4, 'bye' => false], 'away' => ['hours' => null, 'days' => null, 'bye' => true]]);
        $this->assertSame(-1.25, $this->factor($nfl, 'rest')['value']);

        $unknown = $m->predict($this->game(), self::NONE, ['home' => null, 'away' => null]);
        $this->assertSame('no_data', $this->factor($unknown, 'rest')['status']);
    }

    public function test_venue_and_record_rules_respect_minimum_games_caps_and_neutral_sites(): void
    {
        $m = new PredictionModel;
        $p = $m->predict($this->game(['home' => ['record' => '9-1', 'homeRecord' => '5-0'], 'away' => ['record' => '1-9', 'roadRecord' => '0-5']]), self::NONE, self::RESTED);
        $this->assertSame(PredictionModel::VENUE_CAP, $this->factor($p, 'venue')['value']);
        $this->assertSame(PredictionModel::RECORD_CAP, $this->factor($p, 'record')['value']);

        $early = $m->predict($this->game(['home' => ['record' => '2-0', 'homeRecord' => '2-0'], 'away' => ['record' => '0-2', 'roadRecord' => '0-1']]), self::NONE, self::RESTED);
        $this->assertSame('no_data', $this->factor($early, 'venue')['status']);
        $this->assertSame('no_data', $this->factor($early, 'record')['status']);

        $neutral = $m->predict($this->game(['neutral' => true, 'home' => ['homeRecord' => '5-0'], 'away' => ['roadRecord' => '0-5']]), self::NONE, self::RESTED);
        $this->assertSame(0.0, $this->factor($neutral, 'venue')['value']);

        $this->assertSame(['w' => 3, 'l' => 5, 't' => 1, 'games' => 9, 'pct' => 3.5 / 9], PredictionModel::parseRecord('3-5-1'));
        $this->assertNull(PredictionModel::parseRecord('n/a'));
    }

    public function test_ranking_only_applies_to_college(): void
    {
        $m = new PredictionModel;
        $this->assertNull(collect($m->predict($this->game(), self::NONE, self::RESTED)['factors'])->firstWhere('key', 'rank'));

        $college = fn (?int $home, ?int $away) => $this->factor($m->predict($this->game(['league' => 'ncaab', 'sport' => 'basketball', 'home' => ['rank' => $home], 'away' => ['rank' => $away]]), self::NONE, self::RESTED), 'rank')['value'];
        $this->assertSame(0.2, $college(8, null));
        $this->assertSame(-0.2, $college(null, 8));
        $this->assertSame(-0.1, $college(20, 3));
        $this->assertSame(0.0, $college(5, 9));
        $this->assertSame(0.0, $college(null, null));
    }

    public function test_line_movement_follows_the_side_the_spread_moved_to(): void
    {
        $m = new PredictionModel;
        $toHome = $m->predict($this->game(['odds' => ['spreadHome' => -5.0, 'openSpreadHome' => -3.0]]), self::NONE, self::RESTED);
        $this->assertSame(0.5, $this->factor($toHome, 'line')['value']);
        $this->assertSame('HOM', $this->factor($toHome, 'line')['favors']);

        $toAway = $m->predict($this->game(['odds' => ['spreadHome' => 6.0, 'openSpreadHome' => 1.5]]), self::NONE, self::RESTED);
        $this->assertSame(-0.5, $this->factor($toAway, 'line')['value']);

        $small = $m->predict($this->game(['odds' => ['spreadHome' => -3.5, 'openSpreadHome' => -3.0]]), self::NONE, self::RESTED);
        $this->assertSame(0.0, $this->factor($small, 'line')['value']);

        $noOpen = $m->predict($this->game(['odds' => ['openSpreadHome' => null]]), self::NONE, self::RESTED);
        $this->assertSame('no_data', $this->factor($noOpen, 'line')['status']);
    }

    public function test_confidence_comes_from_agreement_between_factors(): void
    {
        $m = new PredictionModel;
        $f = fn (array ...$pairs) => array_map(fn ($p) => ['group' => $p[0], 'value' => $p[1]], $pairs);

        $this->assertSame('high', $m->confidence($f(['injuries', 1.5], ['rest', 0.75], ['line', 0.5]), 2.75));
        $this->assertSame('medium', $m->confidence($f(['injuries', 1.0], ['rest', 0.75]), 1.75));
        // Big number, but the factors pull against each other.
        $this->assertSame('low', $m->confidence($f(['injuries', 3.0], ['line', 0.5], ['rest', -1.0], ['form', -0.5]), 2.0));
        $this->assertSame('low', $m->confidence($f(['injuries', 3.0]), 3.0));
        // Home/road record, season record and ranking describe the same thing, so they count once.
        $this->assertSame('medium', $m->confidence($f(['form', 0.3], ['form', 0.25], ['form', 0.2], ['injuries', 0.8]), 1.55));

        $game = $this->game([
            'home' => ['record' => '9-1', 'homeRecord' => '5-0'],
            'away' => ['record' => '2-8', 'roadRecord' => '1-4'],
            'odds' => ['spreadHome' => -7.5, 'openSpreadHome' => -6.0],
        ]);
        // Form alone (0.3 + 0.25) plus a 0.5 line move is 1.05: a lean, but a low-confidence one.
        $p = $m->predict($game, self::NONE, self::RESTED);
        $this->assertSame(1.05, $p['adjustment']);
        $this->assertSame(['side' => 'home', 'team' => 'HOM', 'line' => -7.5], $p['lean']);
        $this->assertSame('low', $p['confidence']);
        $this->assertSame(-8.55, $p['modelLine']);

        // Add the away team's starting passer being out and the home team's opponent on a short week: three groups agree.
        $p = $m->predict($game, ['home' => [], 'away' => [['athleteId' => '200', 'name' => 'Away Passer', 'pos' => 'QB', 'status' => 'Out']]], ['home' => self::RESTED['home'], 'away' => ['hours' => 100.0, 'days' => 4, 'bye' => false]]);
        $this->assertSame(4.8, $p['adjustment']);
        $this->assertSame('high', $p['confidence']);
    }

    public function test_form_alone_can_never_produce_a_lean(): void
    {
        $max = PredictionModel::VENUE_CAP + PredictionModel::RECORD_CAP + PredictionModel::RANKED_VS_UNRANKED_POINTS;
        $this->assertLessThan(PredictionModel::LEAN_THRESHOLD, $max);

        $game = $this->game(['league' => 'cfb', 'home' => ['record' => '11-0', 'homeRecord' => '7-0', 'rank' => 1], 'away' => ['record' => '0-11', 'roadRecord' => '0-5']]);
        $p = (new PredictionModel)->predict($game, ['home' => null, 'away' => null], ['home' => null, 'away' => null]);
        $this->assertSame(0.75, $p['adjustment']);
        $this->assertNull($p['lean']);
    }

    public function test_grading_a_lean_against_the_final_score(): void
    {
        $this->assertSame('win', PredictionModel::grade(20, 24, 6.0));
        $this->assertSame('push', PredictionModel::grade(20, 26, 6.0));
        $this->assertSame('loss', PredictionModel::grade(20, 27, 6.0));
        $this->assertSame('loss', PredictionModel::grade(27, 24, -3.5));
        $this->assertSame('win', PredictionModel::grade(28, 24, -3.5));
    }

    public function test_rules_text_is_built_from_the_same_numbers_the_model_uses(): void
    {
        $rules = PredictionModel::rules();
        $this->assertCount(6, $rules);
        $this->assertStringContainsString((string) PredictionModel::INJURY_POINTS['football']['qb'], $rules[0]['rule']);
        $this->assertStringContainsString((string) PredictionModel::BACK_TO_BACK_HOURS, $rules[1]['rule']);
    }
}
