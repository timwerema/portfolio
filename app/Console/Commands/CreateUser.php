<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateUser extends Command
{
    protected $signature = 'user:create';

    protected $description = 'Create a login for the dashboard (public sign-up is disabled)';

    public function handle(): int
    {
        $name = text('Name', required: true);
        $email = text('Email', required: true, validate: fn ($v) => Validator::make(['email' => $v], [
            'email' => ['email', 'unique:users,email'],
        ])->errors()->first('email') ?: null);
        $password = password('Password (min 8 characters)', required: true, validate: fn ($v) => strlen($v) < 8 ? 'Use at least 8 characters.' : null);

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        $this->info("Created {$email}. Log in at ".url('/login'));

        return self::SUCCESS;
    }
}
