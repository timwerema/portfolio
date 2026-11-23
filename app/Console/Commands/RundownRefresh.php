<?php

namespace App\Console\Commands;

use App\Support\Rundown\Board;
use App\Support\Rundown\EspnFeed;
use Illuminate\Console\Command;

class RundownRefresh extends Command
{
    protected $signature = 'rundown:refresh';

    protected $description = 'Rundown demo: load each league from the ESPN feeds, save new leans before kickoff and grade finished games';

    public function handle(Board $board): int
    {
        foreach (array_keys(EspnFeed::LEAGUES) as $league) {
            $data = $board->build($league);
            $leans = collect($data['games'])->filter(fn ($g) => $g['prediction']['lean'] ?? null)->count();
            $this->line(sprintf('%-6s %s', strtoupper($league), $data['ok'] ? count($data['games'])." games, {$leans} leans" : 'feed unavailable'));
        }
        $record = $board->record();
        $this->line("Track record: {$record['wins']}-{$record['losses']}-{$record['pushes']} (W-L-P), {$record['pending']} waiting on a final score.");

        return self::SUCCESS;
    }
}
