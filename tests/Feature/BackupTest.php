<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class BackupTest extends TestCase
{
    private string $dir;

    private string $dbPath;

    protected function setUp(): void
    {
        parent::setUp();
        // Use a real SQLite file (the test suite normally uses :memory:, which can't be VACUUMed INTO a file).
        $this->dbPath = sys_get_temp_dir().'/backup-test-'.uniqid().'.sqlite';
        touch($this->dbPath);
        config(['database.connections.sqlite.database' => $this->dbPath]);
        $this->app['db']->purge('sqlite');
        $this->artisan('migrate', ['--force' => true]);

        $this->dir = storage_path('backups');
        File::ensureDirectoryExists($this->dir);
        foreach (File::glob($this->dir.'/backup-*.tar.gz') as $f) {
            File::delete($f);
        }
    }

    protected function tearDown(): void
    {
        foreach (File::glob($this->dir.'/backup-*.tar.gz') as $f) {
            File::delete($f);
        }
        @unlink($this->dbPath);
        parent::tearDown();
    }

    public function test_backup_creates_an_archive_with_the_database(): void
    {
        $this->artisan('backup:run')->assertSuccessful();

        $files = File::glob($this->dir.'/backup-*.tar.gz');
        $this->assertCount(1, $files);

        $out = sys_get_temp_dir().'/backup-extract-'.uniqid();
        mkdir($out);
        exec('tar -xzf '.escapeshellarg($files[0]).' -C '.escapeshellarg($out), result_code: $code);
        $this->assertSame(0, $code);
        $this->assertFileExists($out.'/database.sqlite');

        $pdo = new \PDO('sqlite:'.$out.'/database.sqlite');
        $this->assertSame('ok', $pdo->query('PRAGMA integrity_check')->fetchColumn());
        $this->assertGreaterThan(0, (int) $pdo->query('select count(*) from migrations')->fetchColumn());

        File::deleteDirectory($out);
    }

    public function test_backup_dumps_a_mysql_database_using_only_its_own_private_options_file(): void
    {
        config(['database.default' => 'mysql', 'database.connections.mysql' => [
            'driver' => 'mysql', 'host' => '127.0.0.1', 'port' => '3306', 'database' => 'portfolio', 'username' => 'portfolio', 'password' => 'p#a ss"w\\o$rd',
        ]]);
        $seen = [];
        Process::fake(['*--single-transaction*' => function ($process) use (&$seen) {
            $command = (array) $process->command;
            $file = substr($command[1], strlen('--defaults-file='));
            $seen = ['command' => implode(' ', $command), 'first' => $command[1], 'options' => file_get_contents($file), 'mode' => substr(sprintf('%o', fileperms($file)), -3), 'file' => $file];

            return Process::result('CREATE TABLE users (id int);');
        }]);

        $this->artisan('backup:run')->assertSuccessful();

        // --defaults-file must come first: it makes the tool ignore ~/.my.cnf and server-wide client files.
        $this->assertStringStartsWith('--defaults-file=', $seen['first']);
        $this->assertStringNotContainsString('w\\o$rd', $seen['command'], 'the password is never on the command line');
        $this->assertStringContainsString('user="portfolio"', $seen['options']);
        $this->assertStringContainsString('password="p#a ss\\"w\\\\o$rd"', $seen['options']);
        $this->assertStringContainsString('host="127.0.0.1"', $seen['options']);
        $this->assertSame('600', $seen['mode']);
        $this->assertFileDoesNotExist($seen['file'], 'the options file is deleted afterwards');

        $files = File::glob($this->dir.'/backup-*.tar.gz');
        $this->assertCount(1, $files);
        $out = sys_get_temp_dir().'/backup-extract-'.uniqid();
        mkdir($out);
        exec('tar -xzf '.escapeshellarg($files[0]).' -C '.escapeshellarg($out));
        $this->assertStringContainsString('CREATE TABLE users', file_get_contents($out.'/database.sql'));
        $this->assertFileDoesNotExist($out.'/.dump.cnf', 'the password file never ends up in the backup');
        File::deleteDirectory($out);
    }

    public function test_a_failed_database_dump_fails_the_backup_and_leaves_no_archive(): void
    {
        config(['database.default' => 'mysql', 'database.connections.mysql' => [
            'driver' => 'mysql', 'host' => '127.0.0.1', 'port' => '3306', 'database' => 'portfolio', 'username' => 'portfolio', 'password' => 'x',
        ]]);
        Process::fake(['*--single-transaction*' => Process::result('', 'Access denied', 2)]);

        $this->artisan('backup:run')->assertFailed();
        $this->assertCount(0, File::glob($this->dir.'/backup-*.tar.gz'));
        $this->assertCount(0, File::glob($this->dir.'/tmp-*'));
    }

    public function test_an_empty_database_is_refused_instead_of_saved_as_a_backup(): void
    {
        // SQLite file with no tables at all.
        $empty = sys_get_temp_dir().'/backup-empty-'.uniqid().'.sqlite';
        touch($empty);
        config(['database.connections.sqlite.database' => $empty]);
        $this->app['db']->purge('sqlite');

        $this->artisan('backup:run')->assertFailed();
        $this->assertCount(0, File::glob($this->dir.'/backup-*.tar.gz'));
        @unlink($empty);

        // MySQL dump that "worked" but holds no tables.
        config(['database.default' => 'mysql', 'database.connections.mysql' => [
            'driver' => 'mysql', 'host' => '127.0.0.1', 'port' => '3306', 'database' => 'portfolio', 'username' => 'portfolio', 'password' => 'x',
        ]]);
        Process::fake(['*--single-transaction*' => Process::result("/*!40101 SET NAMES utf8mb4 */;\n")]);

        $this->artisan('backup:run')->assertFailed();
        $this->assertCount(0, File::glob($this->dir.'/backup-*.tar.gz'));
        $this->assertCount(0, File::glob($this->dir.'/tmp-*'));
    }

    public function test_old_backups_are_pruned(): void
    {
        $old = $this->dir.'/backup-2000-01-01-000000.tar.gz';
        File::put($old, 'old');
        touch($old, now()->subDays(30)->getTimestamp());

        $this->artisan('backup:run', ['--keep' => 14])->assertSuccessful();

        $this->assertFileDoesNotExist($old);
        $this->assertCount(1, File::glob($this->dir.'/backup-*.tar.gz'));
    }
}
