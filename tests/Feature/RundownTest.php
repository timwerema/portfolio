<?php

namespace Tests\Feature;

use App\Models\RundownPrediction;
use App\Support\Rundown\Board;
use App\Support\Rundown\EspnFeed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RundownTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Carbon::setTestNow('2026-11-23 20:00:00');
    }

    /** A cut-down ESPN scoreboard event with only the fields Rundown reads. */
    private function event(string $id, string $start, array $home, array $away, array $extra = []): array
    {
        $team = fn (array $t, string $side) => [
            'homeAway' => $side,
            'score' => (string) ($t['score'] ?? 0),
            'winner' => $t['winner'] ?? null,
            'curatedRank' => ['current' => $t['rank'] ?? 99],
            'team' => ['id' => $t['id'], 'abbreviation' => $t['abbr'], 'displayName' => $t['name'] ?? $t['abbr'].' Team', 'shortDisplayName' => $t['abbr'], 'color' => $t['color'] ?? '112233', 'logo' => 'https://a.espncdn.com/logo.png'],
            'records' => [
                ['type' => 'total', 'summary' => $t['record'] ?? '5-5'],
                ['type' => $t['homeType'] ?? 'home', 'summary' => $t['homeRecord'] ?? '3-2'],
                ['type' => $t['roadType'] ?? 'road', 'summary' => $t['roadRecord'] ?? '2-3'],
            ],
            'leaders' => [['name' => 'passingLeader', 'leaders' => [['athlete' => ['id' => $t['passer'] ?? '1']]]]],
        ];
        $state = $extra['state'] ?? 'pre';

        return [
            'id' => $id,
            'date' => $start,
            'status' => ['type' => ['state' => $state, 'completed' => $state === 'post', 'shortDetail' => $extra['detail'] ?? 'Scheduled']],
            'competitions' => [[
                'neutralSite' => $extra['neutral'] ?? false,
                'venue' => ['fullName' => 'Test Field', 'address' => ['city' => 'Dallas']],
                'broadcast' => 'ESPN',
                'competitors' => [$team($home, 'home'), $team($away, 'away')],
            ] + (array_key_exists('odds', $extra) ? ['odds' => $extra['odds']] : [])],
        ];
    }

    private function odds(string $homeLine, string $homeOpen, float $total = 44.5): array
    {
        return [[
            'provider' => ['name' => 'DraftKings'],
            'details' => 'X '.$homeLine,
            'spread' => (float) $homeLine,
            'overUnder' => $total,
            'link' => ['href' => 'https://sportsbook.example/bet-now'],
            'pointSpread' => ['home' => ['close' => ['line' => $homeLine, 'link' => ['href' => 'https://sportsbook.example/x']], 'open' => ['line' => $homeOpen]]],
            'moneyline' => ['home' => ['close' => ['odds' => '-150']], 'away' => ['close' => ['odds' => '+130']]],
        ]];
    }

    private function injuryTeams(int $teams, array $first = []): array
    {
        $out = [];
        for ($i = 1; $i <= $teams; $i++) {
            $out[] = ['id' => (string) $i, 'injuries' => $i === 1 ? $first : []];
        }

        return ['injuries' => $out];
    }

    private function injury(string $athleteId, string $name, string $status, string $pos = 'QB', string $comment = 'Hurt.'): array
    {
        return ['status' => $status, 'shortComment' => $comment, 'date' => '2026-11-22T12:00Z', 'athlete' => ['displayName' => $name, 'position' => ['abbreviation' => $pos], 'links' => [['href' => "https://www.espn.com/nfl/player/_/id/{$athleteId}/x"]]]];
    }

    /** Fake every ESPN call by the last part of the path. */
    private function fakeFeeds(array $byResource): void
    {
        Http::fake(function (HttpRequest $request) use ($byResource) {
            $path = parse_url($request->url(), PHP_URL_PATH);
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);
            foreach ($byResource as $match => $response) {
                [$needle, $param] = array_pad(explode('?', $match, 2), 2, null);
                if (str_ends_with($path, $needle) && ($param === null || str_contains(http_build_query($query), $param))) {
                    return is_callable($response) ? $response($request) : $response;
                }
            }

            return Http::response(['events' => [], 'injuries' => [], 'articles' => []]);
        });
    }

    public function test_page_loads_without_calling_the_feed_and_is_noindex(): void
    {
        Http::fake();

        $this->get('/demos/rundown')->assertOk()
            ->assertSee('<meta name="robots" content="noindex, nofollow">', false)
            ->assertInertia(fn ($page) => $page->component('demos/rundown', false)
                ->has('leagues', 4)->has('rules', 6)->where('threshold', 1)
                ->where('record.wins', 0)->where('record.since', null));

        Http::assertNothingSent();
    }

    public function test_nfl_board_normalises_games_and_explains_a_lean(): void
    {
        $this->fakeFeeds([
            'nfl/scoreboard?week=10' => Http::response(['week' => ['number' => 10, 'teamsOnBye' => [['id' => '2']]], 'events' => [
                $this->event('90', '2026-11-15T18:00Z', ['id' => '1', 'abbr' => 'DAL', 'score' => 20], ['id' => '9', 'abbr' => 'NYG', 'score' => 17], ['state' => 'post']),
            ]]),
            'nfl/scoreboard' => Http::response(['season' => ['type' => 2], 'week' => ['number' => 11], 'events' => [
                $this->event('101', '2026-11-27T21:30Z',
                    ['id' => '1', 'abbr' => 'DAL', 'name' => 'Dallas <b>Cowboys</b>', 'record' => '8-2', 'homeRecord' => '5-0', 'passer' => '555'],
                    ['id' => '2', 'abbr' => 'PHI', 'record' => '3-7', 'roadRecord' => '1-4', 'passer' => '777'],
                    ['odds' => $this->odds('-6.5', '-4.5')]),
                $this->event('102', '2026-11-22T18:00Z', ['id' => '3', 'abbr' => 'KC', 'score' => 27, 'winner' => true], ['id' => '4', 'abbr' => 'DEN', 'score' => 24], ['state' => 'post', 'detail' => 'Final', 'odds' => $this->odds('-3', '-3')]),
                ['id' => 'not-a-game'],
            ]]),
            'nfl/injuries' => Http::response($this->injuryTeams(12, [
                $this->injury('555', 'Dak Example', 'Questionable', 'QB', 'Example (ankle) is questionable <script>alert(1)</script>.'),
                $this->injury('600', 'Old News', 'Active'),
            ])),
            'nfl/news' => Http::response(['articles' => [
                ['headline' => 'Cowboys update', 'description' => 'Cowboys update', 'published' => '2026-11-23T10:00Z', 'links' => ['web' => ['href' => 'https://www.espn.com/nfl/story/_/id/1/x']], 'categories' => [['type' => 'team', 'teamId' => 1]]],
                ['headline' => 'Sketchy link', 'links' => ['web' => ['href' => 'javascript:alert(1)']], 'categories' => [['type' => 'team', 'teamId' => 2]]],
                ['headline' => 'Another team entirely', 'categories' => [['type' => 'team', 'teamId' => 30]]],
            ]]),
        ]);

        $data = $this->getJson('/demos/rundown/board/nfl')->assertOk()->json();

        $this->assertTrue($data['ok']);
        $this->assertSame('ok', $data['injuries']['status']);
        $this->assertCount(2, $data['games']);
        $this->assertStringNotContainsString('sportsbook.example', json_encode($data));

        $final = $data['games'][0];
        $this->assertSame(['102', 'post', true, 27, 24], [$final['id'], $final['state'], $final['final'], $final['home']['score'], $final['away']['score']]);
        $this->assertNull($final['odds']);
        $this->assertNull($final['prediction']['lean']);

        $game = $data['games'][1];
        $this->assertSame('Dallas Cowboys', $game['home']['name']);
        $this->assertSame('#112233', $game['home']['color']);
        $this->assertSame(['spreadHome' => -6.5, 'openSpreadHome' => -4.5, 'total' => 44.5, 'moneyHome' => '-150'], array_intersect_key($game['odds'], array_flip(['spreadHome', 'openSpreadHome', 'total', 'moneyHome'])));
        $this->assertArrayNotHasKey('leaders', $game['home']);

        // Injuries: the starting passer is questionable (3.0 x 0.35 against DAL); "Active" entries are dropped; text is cleaned.
        $this->assertCount(1, $game['injuries']['home']);
        $this->assertSame('Example (ankle) is questionable alert(1).', $game['injuries']['home'][0]['comment']);
        $this->assertArrayNotHasKey('athleteId', $game['injuries']['home'][0]);
        $factors = collect($game['prediction']['factors'])->keyBy('key');
        $this->assertEquals(-1.05, $factors['injuries']['value']);
        // Rest: DAL played 12 days earlier (normal), PHI were on a bye last week (+0.5 to PHI).
        $this->assertEquals(-0.5, $factors['rest']['value']);
        $this->assertEquals(0.3, $factors['venue']['value']);
        $this->assertEquals(0.25, $factors['record']['value']);
        $this->assertEquals(0.5, $factors['line']['value']);
        $this->assertSame('DAL', $factors['line']['favors']);
        $this->assertEquals(-0.5, $game['prediction']['adjustment']);
        $this->assertNull($game['prediction']['lean']);

        // Headlines are matched to teams by the feed's own team tags; unsafe links are dropped.
        $this->assertSame(['Cowboys update', 'Sketchy link'], array_column($game['headlines'], 'headline'));
        $this->assertSame('https://www.espn.com/nfl/story/_/id/1/x', $game['headlines'][0]['url']);
        $this->assertSame('', $game['headlines'][0]['description']);
        $this->assertNull($game['headlines'][1]['url']);
    }

    public function test_game_without_odds_gets_no_lean_and_college_injuries_are_not_implied(): void
    {
        $this->fakeFeeds([
            'mens-college-basketball/scoreboard?dates=20261123' => Http::response(['events' => [
                $this->event('201', '2026-11-24T01:00Z', ['id' => '1', 'abbr' => 'KU', 'rank' => 12, 'record' => '5-1', 'homeType' => 'homerecord', 'homeRecord' => '4-0'], ['id' => '2', 'abbr' => 'DEN', 'record' => '1-4', 'roadType' => 'awayrecord', 'roadRecord' => '0-3'], ['odds' => $this->odds('-31.5', '-29.5')]),
            ]]),
            'mens-college-basketball/scoreboard?dates=20261124' => Http::response(['events' => [
                $this->event('202', '2026-11-25T01:00Z', ['id' => '3', 'abbr' => 'MD'], ['id' => '4', 'abbr' => 'TENN', 'rank' => 7], ['neutral' => true]),
            ]]),
            'mens-college-basketball/injuries' => Http::response(['injuries' => []]),
        ]);

        $data = $this->getJson('/demos/rundown/board/ncaab')->assertOk()->json();

        $this->assertSame('not_covered', $data['injuries']['status']);
        [$ku, $md] = $data['games'];
        $this->assertNull($ku['injuries']['home']);
        $factors = collect($ku['prediction']['factors'])->keyBy('key');
        $this->assertSame('no_data', $factors['injuries']['status']);
        $this->assertSame('no_data', $factors['rest']['status']);
        $this->assertEquals(0.2, $factors['rank']['value']);
        $this->assertEquals(0.3, $factors['venue']['value']);
        $this->assertEquals(0.25, $factors['record']['value']);
        $this->assertEquals(0.5, $factors['line']['value']);
        $this->assertSame('low', $ku['prediction']['confidence']);
        $this->assertSame(['side' => 'home', 'team' => 'KU', 'line' => -31.5], $ku['prediction']['lean']);

        $this->assertNull($md['odds']);
        $this->assertNull($md['prediction']['lean']);
        $this->assertSame([], $md['prediction']['factors']);
        $this->assertStringContainsString('No point spread', $md['prediction']['summary']);
        $this->assertSame(7, $md['away']['rank']);
        $this->assertNull($md['home']['rank']);
    }

    public function test_nba_back_to_back_is_found_from_yesterdays_scoreboard(): void
    {
        $this->fakeFeeds([
            'nba/scoreboard?dates=20261122' => Http::response(['events' => [
                $this->event('300', '2026-11-23T00:30Z', ['id' => '5', 'abbr' => 'BOS', 'score' => 110], ['id' => '1', 'abbr' => 'CHA', 'score' => 99], ['state' => 'post']),
            ]]),
            'nba/scoreboard?dates=20261123' => Http::response(['events' => [
                $this->event('301', '2026-11-24T00:00Z', ['id' => '1', 'abbr' => 'CHA'], ['id' => '2', 'abbr' => 'MEM'], ['odds' => $this->odds('+2.5', '+3.5')]),
            ]]),
            'nba/injuries' => Http::response($this->injuryTeams(28)),
        ]);

        $data = $this->getJson('/demos/rundown/board/nba')->assertOk()->json();

        $this->assertCount(1, $data['games']);
        $rest = collect($data['games'][0]['prediction']['factors'])->firstWhere('key', 'rest');
        $this->assertEquals(-1.0, $rest['value']);
        $this->assertStringContainsString('CHA played 24 hours earlier', $rest['note']);
    }

    public function test_failed_or_malformed_feed_shows_unavailable_with_last_good_time_and_no_games(): void
    {
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => [
            $this->event('401', '2026-11-28T17:00Z', ['id' => '1', 'abbr' => 'OSU', 'rank' => 1], ['id' => '2', 'abbr' => 'MICH', 'rank' => 15], ['odds' => $this->odds('-10', '-14')]),
        ]])]);
        $good = $this->getJson('/demos/rundown/board/cfb')->assertOk()->json();
        $this->assertTrue($good['ok']);
        $this->assertSame('2026-11-23T20:00:00+00:00', $good['updatedAt']);

        foreach ([Http::response('Service down', 503), Http::response('<html>not json</html>'), Http::response(['unexpected' => true]), fn () => throw new ConnectionException('timeout')] as $i => $bad) {
            Carbon::setTestNow(Carbon::parse('2026-11-23 20:10:00')->addMinutes($i * 5));
            Cache::forget('rundown:board:cfb');
            Cache::forget('rundown:scoreboard:cfb:');
            Http::swap(new Factory);
            $this->fakeFeeds(['college-football/scoreboard' => $bad]);

            $data = $this->getJson('/demos/rundown/board/cfb')->assertOk()->json();
            $this->assertFalse($data['ok']);
            $this->assertSame([], $data['games']);
            $this->assertNull($data['updatedAt']);
            $this->assertSame('2026-11-23T20:00:00+00:00', $data['lastGoodAt']);
        }

        $this->get('/demos/rundown')->assertOk();
        $this->getJson('/demos/rundown/board/mlb')->assertNotFound();
    }

    public function test_feed_results_are_cached_and_failures_are_retried_after_a_minute(): void
    {
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => []])]);
        $feed = app(EspnFeed::class);

        $this->assertSame([], $feed->scoreboard('cfb')['games']);
        $feed->scoreboard('cfb');
        $feed->injuries('cfb');
        $feed->injuries('cfb');
        Http::assertSentCount(2);

        // Board responses are cached too: two page loads, no extra feed calls.
        $this->getJson('/demos/rundown/board/cfb')->assertOk();
        $this->getJson('/demos/rundown/board/cfb')->assertOk();
        Http::assertSentCount(3); // + news

        $this->travel(EspnFeed::SCOREBOARD_SECONDS + 1)->seconds();
        $feed->scoreboard('cfb');
        Http::assertSentCount(4);

        Cache::flush();
        Http::swap(new Factory);
        $this->fakeFeeds(['college-football/scoreboard' => Http::response('down', 500)]);
        $this->assertNull($feed->scoreboard('cfb'));
        $this->assertNull($feed->scoreboard('cfb'));
        Http::assertSentCount(1);
        $this->travel(EspnFeed::FAILURE_SECONDS + 1)->seconds();
        $feed->scoreboard('cfb');
        Http::assertSentCount(2);
    }

    public function test_leans_are_saved_once_before_kickoff_and_graded_only_after_a_final_score(): void
    {
        $osu = ['id' => '1', 'abbr' => 'OSU', 'rank' => 1, 'record' => '11-0', 'homeType' => 'homerecord', 'homeRecord' => '7-0'];
        $mich = ['id' => '2', 'abbr' => 'MICH', 'record' => '5-6', 'roadType' => 'awayrecord', 'roadRecord' => '1-4'];
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => [
            $this->event('401', '2026-11-28T17:00Z', $osu, $mich, ['odds' => $this->odds('-10', '-8')]),
        ]])]);

        $board = app(Board::class);
        $game = $board->build('cfb')['games'][0];
        $this->assertSame(['side' => 'home', 'team' => 'OSU', 'line' => -10.0], $game['prediction']['lean']);

        $saved = RundownPrediction::sole();
        $this->assertSame(['cfb', '401', 'OSU', -10.0, null], [$saved->league, $saved->event_id, $saved->team, $saved->line, $saved->result]);
        $this->assertTrue($saved->created_at->lt($saved->starts_at));
        $this->assertSame(['wins' => 0, 'losses' => 0, 'pushes' => 0, 'pending' => 1], array_intersect_key($board->record(), array_flip(['wins', 'losses', 'pushes', 'pending'])));

        // The line moves and the game is loaded again: the saved lean does not change.
        Cache::flush();
        Http::swap(new Factory);
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => [
            $this->event('401', '2026-11-28T17:00Z', $osu, $mich, ['odds' => $this->odds('-13', '-14')]),
        ]])]);
        $board->build('cfb');
        $this->assertSame(-10.0, RundownPrediction::sole()->line);

        // In progress: still not graded.
        Carbon::setTestNow('2026-11-28 18:00:00');
        Cache::flush();
        Http::swap(new Factory);
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => [
            $this->event('401', '2026-11-28T17:00Z', $osu + ['score' => 14], $mich + ['score' => 0], ['state' => 'in']),
            // A lean that first appears after kickoff must never be saved.
            $this->event('402', '2026-11-28T17:00Z', ['id' => '3', 'abbr' => 'UGA', 'rank' => 2, 'record' => '11-0', 'homeRecord' => '7-0', 'homeType' => 'homerecord'], ['id' => '4', 'abbr' => 'GT', 'record' => '4-7', 'roadType' => 'awayrecord', 'roadRecord' => '1-4'], ['odds' => $this->odds('-35', '-30')]),
        ]])]);
        $live = $board->build('cfb');
        $this->assertNull($live['games'][0]['prediction']['lean']);
        $this->assertSame(1, RundownPrediction::count());
        $this->assertNull(RundownPrediction::sole()->result);

        // Final 27-20: OSU -10 loses.
        Carbon::setTestNow('2026-11-28 21:00:00');
        Cache::flush();
        Http::swap(new Factory);
        $this->fakeFeeds(['college-football/scoreboard' => Http::response(['events' => [
            $this->event('401', '2026-11-28T17:00Z', $osu + ['score' => 27, 'winner' => true], $mich + ['score' => 20], ['state' => 'post']),
        ]])]);
        $record = $board->build('cfb')['record'];

        $this->assertSame('loss', RundownPrediction::sole()->result);
        $this->assertSame([0, 1, 0, 0], [$record['wins'], $record['losses'], $record['pushes'], $record['pending']]);
        $this->assertSame(['matchup' => 'MICH @ OSU', 'lean' => 'OSU -10', 'score' => '20-27', 'result' => 'loss'], array_intersect_key($record['recent'][0], array_flip(['matchup', 'lean', 'score', 'result'])));
    }
}
