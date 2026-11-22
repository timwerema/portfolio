<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Symfony\Component\Process\ExecutableFinder;

/**
 * Nightly backup: a consistent snapshot of the database plus uploaded client demos,
 * packed into storage/backups/backup-YYYY-MM-DD-HHMMSS.tar.gz. Old backups beyond
 * --keep days are deleted. Works with SQLite (local) and MySQL/MariaDB (the live box).
 *
 * Restore (with the site in maintenance mode):
 *   mkdir -p /tmp/restore && tar -xzf storage/backups/<file>.tar.gz -C /tmp/restore
 *   SQLite:  cp /tmp/restore/database.sqlite database/database.sqlite
 *   MariaDB: mariadb -u <user> -p <database> < /tmp/restore/database.sql
 *   cp -r /tmp/restore/previews storage/app/private/
 */
class BackupRun extends Command
{
    protected $signature = 'backup:run {--keep=14 : Days of backups to keep}';

    protected $description = 'Back up the database and uploaded demos, and prune old backups';

    public function handle(): int
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if (! in_array($driver, ['sqlite', 'mysql', 'mariadb'], true)) {
            $this->error("backup:run supports SQLite, MySQL and MariaDB databases, not \"{$driver}\".");

            return self::FAILURE;
        }

        $dir = storage_path('backups');
        File::ensureDirectoryExists($dir, 0750);

        $stamp = now()->format('Y-m-d-His');
        $work = $dir.'/tmp-'.$stamp;
        File::ensureDirectoryExists($work);

        try {
            if ($driver === 'sqlite') {
                // VACUUM INTO writes a clean, consistent copy even while the site is in use.
                DB::statement('VACUUM INTO ?', [$work.'/database.sqlite']);
            } elseif ($error = $this->dumpMysql($connection, $work.'/database.sql')) {
                $this->error($error);

                return self::FAILURE;
            }

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

    /**
     * Dump a MySQL/MariaDB database to a .sql file. Returns an error message, or null when it worked.
     * The password goes through the environment, never the command line, so it cannot show up in `ps`.
     */
    private function dumpMysql(string $connection, string $target): ?string
    {
        $c = config("database.connections.{$connection}");
        $finder = new ExecutableFinder;
        $binary = $finder->find('mariadb-dump') ?? $finder->find('mysqldump') ?? 'mysqldump';

        $command = [$binary, '--single-transaction', '--no-tablespaces', '--skip-comments', '--user='.$c['username']];
        if (filled($c['unix_socket'] ?? null)) {
            $command[] = '--socket='.$c['unix_socket'];
        } else {
            $command[] = '--host='.$c['host'];
            $command[] = '--port='.$c['port'];
        }
        $command[] = $c['database'];

        $dump = Process::env(['MYSQL_PWD' => (string) ($c['password'] ?? '')])->timeout(300)->run($command);

        if (! $dump->successful() || trim($dump->output()) === '') {
            return 'Database dump failed: '.(trim($dump->errorOutput()) ?: 'no output. Is mariadb-dump / mysqldump installed?');
        }

        File::put($target, $dump->output());

        return null;
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
