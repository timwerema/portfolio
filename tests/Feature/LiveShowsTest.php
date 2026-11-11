<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LiveShowsTest extends TestCase
{
    private function event(string $id, string $name, array $performers, string $date = '2026-12-05', array $extra = []): array
    {
        return array_merge([
            'id' => $id,
            'name' => $name,
            'url' => "https://www.ticketmaster.com/event/{$id}",
            'dates' => ['start' => ['localDate' => $date, 'localTime' => '20:00:00'], 'status' => ['code' => 'onsale']],
            'images' => [['ratio' => '16_9', 'width' => 640, 'url' => "https://img.example/{$id}.jpg"]],
            'priceRanges' => [['min' => 45.5, 'max' => 120, 'currency' => 'USD']],
            'distance' => 4.2,
            '_embedded' => [
                'venues' => [['name' => 'House of Blues', 'city' => ['name' => 'Dallas'], 'state' => ['stateCode' => 'TX']]],
                'attractions' => array_map(fn ($p) => ['name' => $p], $performers),
            ],
        ], $extra);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_page_renders_with_config_flags(): void
    {
        config(['services.spotify.client_id' => 'abc123', 'services.ticketmaster.key' => null]);

        $this->get('/live')->assertOk()->assertInertia(fn ($page) => $page
            ->component('live', false)
            ->where('spotifyClientId', 'abc123')
            ->where('showsConfigured', false)
            ->where('redirectUri', url('/live')));
    }

    public function test_shows_says_when_not_configured(): void
    {
        config(['services.ticketmaster.key' => null]);
        Http::fake();

        $this->getJson('/live/shows?artists[]=SZA')->assertStatus(503)->assertJson(['error' => 'not_configured']);
        Http::assertNothingSent();
    }

    public function test_matches_artists_on_the_bill_and_adds_nearby_rnb(): void
    {
        config(['services.ticketmaster.key' => 'tm-key']);
        Http::fake(function (HttpRequest $request) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $q);
            if (($q['genreId'] ?? null) === 'KnvZfZ7vAee') {
                return Http::response(['_embedded' => ['events' => [
                    $this->event('E1', 'Brent Faiyaz Live', ['Brent Faiyaz']),
                    $this->event('E3', 'Quiet Storm Night', ['DJ Slow'], '2026-11-20'),
                ]]]);
            }

            return Http::response(['_embedded' => ['events' => [
                $this->event('E1', 'Brent Faiyaz Live', ['Brent Faiyaz']),
                // Keyword hit, but the artist isn't on the bill: must be dropped.
                $this->event('E2', 'Brent Faiyaz Tribute Night', ['Cover Band']),
                $this->event('E4', 'Cancelled show', ['Brent Faiyaz'], '2026-12-09', ['dates' => ['start' => ['localDate' => '2026-12-09'], 'status' => ['code' => 'cancelled']]]),
            ]]]);
        });

        $res = $this->getJson('/live/shows?artists[]=brent faiyaz&zip=75201&radius=50')->assertOk();

        $res->assertJsonCount(1, 'yours')
            ->assertJsonPath('yours.0.id', 'E1')
            ->assertJsonPath('yours.0.matched', 'brent faiyaz')
            ->assertJsonPath('yours.0.city', 'Dallas, TX')
            ->assertJsonPath('yours.0.price.min', 45.5);
        // Nearby R&B excludes shows already in "yours".
        $res->assertJsonCount(1, 'more')->assertJsonPath('more.0.id', 'E3');

        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), 'postalCode=75201') && str_contains($r->url(), 'apikey=tm-key') && str_contains($r->url(), 'radius=50'));
    }

    public function test_results_are_cached_and_upstream_errors_are_survived(): void
    {
        config(['services.ticketmaster.key' => 'tm-key']);
        Http::fake(['*' => Http::response('nope', 500)]);

        $this->getJson('/live/shows?artists[]=SZA')->assertOk()->assertJson(['yours' => [], 'more' => []]);
        $this->getJson('/live/shows?artists[]=SZA')->assertOk();

        Http::assertSentCount(2); // one artist search + one nearby search; the second call came from cache
    }

    public function test_validates_input(): void
    {
        config(['services.ticketmaster.key' => 'tm-key']);
        Http::fake();

        $this->getJson('/live/shows?zip=abc')->assertStatus(422);
        $this->getJson('/live/shows?lat=200&lng=1')->assertStatus(422);
        $this->getJson('/live/shows?'.http_build_query(['artists' => array_fill(0, 16, 'x')]))->assertStatus(422);
    }
}
