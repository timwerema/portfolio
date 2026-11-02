<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled()
    {
        $this->get('/register')->assertNotFound();

        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();

        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_user_can_be_created_from_the_command_line()
    {
        $this->artisan('user:create')
            ->expectsQuestion('Name', 'Timasi')
            ->expectsQuestion('Email', 'me@example.com')
            ->expectsQuestion('Password (min 8 characters)', 'secret-password')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', ['email' => 'me@example.com']);
    }
}
