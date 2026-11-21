<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\TwoFactor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private function userWithTwoFactor(): User
    {
        $user = User::factory()->create();
        $user->forceFill([
            'two_factor_secret' => TwoFactor::newSecret(),
            'two_factor_recovery_codes' => ['aaaaa-bbbbb', 'ccccc-ddddd'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        return $user;
    }

    private function codeFor(User $user): string
    {
        return (new Google2FA)->getCurrentOtp($user->two_factor_secret);
    }

    public function test_setup_needs_the_password_then_a_valid_code(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/settings/two-factor', ['current_password' => 'wrong'])
            ->assertSessionHasErrors('current_password');
        $this->assertNull($user->fresh()->two_factor_secret);

        $this->actingAs($user)->post('/settings/two-factor', ['current_password' => 'password'])
            ->assertRedirect('/settings/two-factor');
        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertFalse($user->hasTwoFactor());

        $this->actingAs($user)->post('/settings/two-factor/confirm', ['code' => '000000'])
            ->assertSessionHasErrors('code');
        $this->assertFalse($user->fresh()->hasTwoFactor());

        $this->actingAs($user)->post('/settings/two-factor/confirm', ['code' => $this->codeFor($user)])
            ->assertRedirect('/settings/two-factor')
            ->assertSessionHas('recovery_codes');
        $this->assertTrue($user->fresh()->hasTwoFactor());
        $this->assertCount(8, $user->fresh()->two_factor_recovery_codes);
    }

    public function test_the_secret_is_encrypted_at_rest_and_never_sent_to_the_page(): void
    {
        $user = $this->userWithTwoFactor();

        $raw = \DB::table('users')->where('id', $user->id)->value('two_factor_secret');
        $this->assertNotSame($user->two_factor_secret, $raw);

        $this->actingAs($user)->get('/settings/two-factor')
            ->assertOk()
            ->assertDontSee($user->two_factor_secret)
            ->assertDontSee('aaaaa-bbbbb');
    }

    public function test_password_alone_does_not_sign_in_when_two_factor_is_on(): void
    {
        $user = $this->userWithTwoFactor();

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/two-factor-challenge');
        $this->assertGuest();
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_a_valid_code_completes_login_and_cannot_be_replayed(): void
    {
        $user = $this->userWithTwoFactor();
        $code = $this->codeFor($user);

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['code' => $code])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['code' => $code])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_wrong_codes_are_refused_and_rate_limited(): void
    {
        $user = $this->userWithTwoFactor();
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/two-factor-challenge', ['code' => '000000'])->assertSessionHasErrors('code');
        }

        // Even the right code is refused while locked out.
        $this->post('/two-factor-challenge', ['code' => $this->codeFor($user)])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_a_recovery_code_works_once(): void
    {
        $user = $this->userWithTwoFactor();

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['recovery_code' => 'AAAAA-BBBBB'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertSame(['ccccc-ddddd'], $user->fresh()->two_factor_recovery_codes);

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->post('/two-factor-challenge', ['recovery_code' => 'aaaaa-bbbbb'])->assertSessionHasErrors('recovery_code');
        $this->assertGuest();
    }

    public function test_the_challenge_cannot_be_reached_without_the_password_step(): void
    {
        $this->userWithTwoFactor();

        $this->get('/two-factor-challenge')->assertRedirect('/login');
        $this->post('/two-factor-challenge', ['code' => '123456'])->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_the_dashboard_is_closed_until_two_factor_is_set_up_when_required(): void
    {
        config(['auth.two_factor_required' => true]);
        $user = User::factory()->create();

        foreach (['/dashboard', '/dashboard/leads', '/dashboard/clients', '/dashboard/invoices', '/dashboard/previews', '/dashboard/messages'] as $path) {
            $this->actingAs($user)->get($path)->assertRedirect('/settings/two-factor');
        }
        $this->actingAs($user)->get('/settings/two-factor')->assertOk();

        $this->actingAs($this->userWithTwoFactor())->get('/dashboard')->assertOk();
    }

    public function test_switching_off_and_new_codes_need_the_password(): void
    {
        $user = $this->userWithTwoFactor();

        $this->actingAs($user)->delete('/settings/two-factor', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->actingAs($user)->post('/settings/two-factor/recovery-codes', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->assertTrue($user->fresh()->hasTwoFactor());
        $this->assertCount(2, $user->fresh()->two_factor_recovery_codes);

        $this->actingAs($user)->post('/settings/two-factor/recovery-codes', ['current_password' => 'password'])->assertSessionHas('recovery_codes');
        $this->assertCount(8, $user->fresh()->two_factor_recovery_codes);

        $this->actingAs($user)->delete('/settings/two-factor', ['current_password' => 'password']);
        $this->assertFalse($user->fresh()->hasTwoFactor());
        $this->assertNull($user->fresh()->two_factor_secret);
    }

    public function test_the_lost_phone_command_switches_it_off(): void
    {
        $user = $this->userWithTwoFactor();

        $this->artisan('user:reset-2fa', ['email' => $user->email])->assertSuccessful();
        $this->assertFalse($user->fresh()->hasTwoFactor());
        $this->artisan('user:reset-2fa', ['email' => 'nobody@example.com'])->assertFailed();
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}
