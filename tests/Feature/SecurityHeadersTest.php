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

    public function test_pages_send_a_content_security_policy_with_a_fresh_nonce(): void
    {
        $first = $this->get('/');
        $csp = $first->headers->get('Content-Security-Policy');

        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
        $this->assertStringNotContainsString("script-src 'self' 'unsafe-inline'", $csp);
        $this->assertMatchesRegularExpression("/script-src 'self' 'nonce-([A-Za-z0-9]{20,})'/", $csp, 'scripts need the nonce');

        preg_match("/'nonce-([^']+)'/", $csp, $m);
        $first->assertSee('nonce="'.$m[1].'"', false);

        $this->refreshApplication();
        $this->assertNotSame($csp, $this->get('/')->headers->get('Content-Security-Policy'));
    }

    public function test_the_dashboard_is_closed_to_guests(): void
    {
        foreach (['/dashboard', '/dashboard/leads', '/dashboard/clients', '/dashboard/invoices'] as $path) {
            $this->get($path)->assertRedirect('/login');
        }
    }
}
