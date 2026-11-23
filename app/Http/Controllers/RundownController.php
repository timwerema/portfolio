<?php

namespace App\Http\Controllers;

use App\Support\Rundown\Board;
use App\Support\Rundown\EspnFeed;
use App\Support\Rundown\PredictionModel;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Rundown: game analysis for the NFL, NBA, college football and men's college basketball.
 *
 * Live data comes from ESPN's public feeds through App\Support\Rundown\EspnFeed (server-side, cached).
 * The leans come from the fixed rules in PredictionModel. It is analysis, not betting advice:
 * no sportsbook links, no affiliate anything.
 */
class RundownController extends Controller
{
    public function page(Board $board): Response
    {
        return Inertia::render('demos/rundown', [
            'leagues' => collect(EspnFeed::LEAGUES)->map(fn ($l, $key) => ['key' => $key, 'label' => $l['label'], 'name' => $l['name']])->values(),
            'rules' => PredictionModel::rules(),
            'threshold' => PredictionModel::LEAN_THRESHOLD,
            'record' => $board->record(),
        ]);
    }

    public function board(Board $board, string $league): JsonResponse
    {
        abort_unless(isset(EspnFeed::LEAGUES[$league]), 404);

        return response()->json($board->for($league))->header('Cache-Control', 'no-store');
    }
}
