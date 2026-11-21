<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_send_baseline_security_headers(): void
    {
        foreach (['/', '/hire', '/demos/clearcoat', '/login'] as $path) {
            $this->get($path)
                ->assertOk()
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
                ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
                ->assertHeader('Permissions-Policy');
        }
    }

    public function test_the_dashboard_is_closed_to_guests(): void
    {
        foreach (['/dashboard', '/dashboard/leads', '/dashboard/clients', '/dashboard/invoices'] as $path) {
            $this->get($path)->assertRedirect('/login');
        }
    }
}
