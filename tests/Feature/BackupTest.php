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

    public function test_backup_dumps_a_mysql_database_without_the_password_on_the_command_line(): void
    {
        config(['database.default' => 'mysql', 'database.connections.mysql' => [
            'driver' => 'mysql', 'host' => '127.0.0.1', 'port' => '3306', 'database' => 'portfolio', 'username' => 'portfolio', 'password' => 'not-a-real-secret',
        ]]);
        Process::fake(['*--single-transaction*' => Process::result('CREATE TABLE users (id int);')]);

        $this->artisan('backup:run')->assertSuccessful();

        Process::assertRan(function ($process) {
            $command = implode(' ', (array) $process->command);
            if (! str_contains($command, '--single-transaction')) {
                return false;
            }

            return str_contains($command, '--user=portfolio') && ! str_contains($command, 'not-a-real-secret')
                && ($process->environment['MYSQL_PWD'] ?? null) === 'not-a-real-secret';
        });

        $files = File::glob($this->dir.'/backup-*.tar.gz');
        $this->assertCount(1, $files);
        $out = sys_get_temp_dir().'/backup-extract-'.uniqid();
        mkdir($out);
        exec('tar -xzf '.escapeshellarg($files[0]).' -C '.escapeshellarg($out));
        $this->assertStringContainsString('CREATE TABLE users', file_get_contents($out.'/database.sql'));
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
