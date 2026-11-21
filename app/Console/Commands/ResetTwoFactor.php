<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ResetTwoFactor extends Command
{
    protected $signature = 'user:reset-2fa {email : The login email}';

    protected $description = 'Switch off two-step login for an account (for a lost phone; run on the server)';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('No account with that email.');

            return self::FAILURE;
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $this->info('Two-step login is off for '.$user->email.'. Sign in and set it up again under Settings.');

        return self::SUCCESS;
    }
}
