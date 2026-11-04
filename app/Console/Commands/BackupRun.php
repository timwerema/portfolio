<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

/**
 * Nightly backup: a consistent snapshot of the SQLite database plus uploaded
 * client demos, packed into storage/backups/backup-YYYY-MM-DD-HHMMSS.tar.gz.
 * Old backups beyond --keep days are deleted.
 *
 * Restore (with the site in maintenance mode):
 *   tar -xzf storage/backups/<file>.tar.gz -C /tmp/restore
 *   cp /tmp/restore/database.sqlite database/database.sqlite
 *   cp -r /tmp/restore/previews storage/app/private/
 */
class BackupRun extends Command
{
    protected $signature = 'backup:run {--keep=14 : Days of backups to keep}';

    protected $description = 'Back up the database and uploaded demos, and prune old backups';

    public function handle(): int
    {
        if (config('database.default') !== 'sqlite') {
            $this->error('backup:run only supports the SQLite database this site uses by default.');

            return self::FAILURE;
        }

        $dir = storage_path('backups');
        File::ensureDirectoryExists($dir, 0750);

        $stamp = now()->format('Y-m-d-His');
        $work = $dir.'/tmp-'.$stamp;
        File::ensureDirectoryExists($work);

        try {
            // VACUUM INTO writes a clean, consistent copy even while the site is in use.
            DB::statement('VACUUM INTO ?', [$work.'/database.sqlite']);

            $previews = storage_path('app/private/previews');
            if (File::isDirectory($previews)) {
                File::copyDirectory($previews, $work.'/previews');
            }

            File::put($work.'/README.txt', 'Backup of '.config('app.url').' taken '.now()->toDateTimeString()."\nSee app/Console/Commands/BackupRun.php for restore steps.\n");

            $archive = "{$dir}/backup-{$stamp}.tar.gz";
            $tar = Process::path($work)->run(['tar', '-czf', $archive, '.']);
            if (! $tar->successful()) {
                $this->error('tar failed: '.$tar->errorOutput());

                return self::FAILURE;
            }
            chmod($archive, 0640);
        } finally {
            File::deleteDirectory($work);
        }

        $pruned = $this->prune($dir, (int) $this->option('keep'));

        $this->info(sprintf('Saved %s (%s). Removed %d old backup(s).', basename($archive), $this->size(filesize($archive)), $pruned));

        return self::SUCCESS;
    }

    private function prune(string $dir, int $keepDays): int
    {
        $cutoff = now()->subDays(max(1, $keepDays))->getTimestamp();
        $removed = 0;

        foreach (File::glob($dir.'/backup-*.tar.gz') as $file) {
            if (filemtime($file) < $cutoff) {
                File::delete($file);
                $removed++;
            }
        }

        return $removed;
    }

    private function size(int $bytes): string
    {
        return $bytes > 1048576 ? round($bytes / 1048576, 1).' MB' : round($bytes / 1024, 1).' KB';
    }
}
