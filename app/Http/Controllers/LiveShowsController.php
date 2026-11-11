<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Encore Live: R&B shows near you, based on the artists you listen to.
 *
 * Spotify login and listening history stay in the visitor's browser. Only artist names
 * (and a location) reach this controller, which searches Ticketmaster with a server-side key.
 * Nothing is stored except a short cache of Ticketmaster search results.
 */
class LiveShowsController extends Controller
{
    private const API = 'https://app.ticketmaster.com/discovery/v2/events.json';

    /** Ticketmaster genre id for R&B. */
    private const RNB_GENRE = 'KnvZfZ7vAee';

    /** Downtown Dallas, used when no location is given. */
    private const DEFAULT_LATLONG = '32.7767,-96.7970';

    public function page(): Response
    {
        return Inertia::render('live', [
            'spotifyClientId' => config('services.spotify.client_id') ?: null,
            'redirectUri' => url('/live'),
            'showsConfigured' => (bool) config('services.ticketmaster.key'),
        ]);
    }

    public function shows(Request $request): JsonResponse
    {
        $data = $request->validate([
            'artists' => ['array', 'max:15'],
            'artists.*' => ['string', 'max:80'],
            'lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:lng'],
            'lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:lat'],
            'zip' => ['nullable', 'regex:/^\d{5}$/'],
            'radius' => ['nullable', 'integer', 'between:10,250'],
        ]);

        if (! config('services.ticketmaster.key')) {
            return response()->json(['error' => 'not_configured', 'message' => 'Show search is not set up yet.'], 503);
        }

        $where = isset($data['lat'])
            ? ['latlong' => round((float) $data['lat'], 2).','.round((float) $data['lng'], 2)]
            : (isset($data['zip']) ? ['postalCode' => $data['zip'], 'countryCode' => 'US'] : ['latlong' => self::DEFAULT_LATLONG]);
        $where += ['radius' => $data['radius'] ?? 75, 'unit' => 'miles'];

        $artists = collect($data['artists'] ?? [])->map(fn ($a) => trim($a))->filter()->unique(fn ($a) => Str::lower($a))->values();

        $yours = [];
        foreach ($artists as $artist) {
            foreach ($this->search($where + ['keyword' => $artist, 'classificationName' => 'music', 'size' => 10]) as $event) {
                // Keyword search is loose; keep only events where this artist is actually on the bill.
                $onBill = collect($event['performers'])->contains(fn ($p) => Str::lower($p) === Str::lower($artist));
                if ($onBill && ! isset($yours[$event['id']])) {
                    $yours[$event['id']] = $event + ['matched' => $artist];
                }
            }
        }

        $more = collect($this->search($where + ['genreId' => self::RNB_GENRE, 'classificationName' => 'music', 'size' => 30]))
            ->reject(fn ($e) => isset($yours[$e['id']]))
            ->values();

        $byDate = fn ($e) => $e['date'].' '.($e['time'] ?? '23:59');

        return response()->json([
            'yours' => collect($yours)->sortBy($byDate)->values(),
            'more' => $more->sortBy($byDate)->values()->take(20),
        ]);
    }

    /**
     * One Ticketmaster search, cached for 6 hours (the free key allows 5,000 calls a day).
     *
     * @param  array<string, mixed>  $params
     * @return list<array<string, mixed>>
     */
    private function search(array $params): array
    {
        $params += ['sort' => 'date,asc', 'locale' => '*'];
        ksort($params);

        return Cache::remember('tm:'.md5(json_encode($params)), now()->addHours(6), function () use ($params) {
            try {
                $response = Http::timeout(8)->acceptJson()->get(self::API, $params + ['apikey' => config('services.ticketmaster.key')]);
            } catch (Throwable) {
                return [];
            }
            if (! $response->successful()) {
                return [];
            }

            return collect($response->json('_embedded.events', []))->map(fn (array $e) => $this->normalize($e))->filter()->values()->all();
        });
    }

    /**
     * @param  array<string, mixed>  $e
     * @return array<string, mixed>|null
     */
    private function normalize(array $e): ?array
    {
        $date = data_get($e, 'dates.start.localDate');
        if (! $date || data_get($e, 'dates.status.code') === 'cancelled') {
            return null;
        }
        $venue = data_get($e, '_embedded.venues.0', []);
        $image = collect($e['images'] ?? [])->filter(fn ($i) => ($i['ratio'] ?? '') === '16_9')->sortBy('width')->first(fn ($i) => ($i['width'] ?? 0) >= 500);
        $price = data_get($e, 'priceRanges.0');

        return [
            'id' => (string) $e['id'],
            'name' => (string) ($e['name'] ?? ''),
            'performers' => collect(data_get($e, '_embedded.attractions', []))->pluck('name')->filter()->values()->all(),
            'date' => $date,
            'time' => data_get($e, 'dates.start.localTime'),
            'venue' => data_get($venue, 'name'),
            'city' => trim(data_get($venue, 'city.name', '').', '.data_get($venue, 'state.stateCode', ''), ', '),
            'distance' => isset($e['distance']) ? round((float) $e['distance']) : null,
            'url' => $e['url'] ?? null,
            'image' => $image['url'] ?? null,
            'price' => $price ? ['min' => $price['min'] ?? null, 'max' => $price['max'] ?? null, 'currency' => $price['currency'] ?? 'USD'] : null,
        ];
    }
}
