<?php

namespace Tests\Feature;

use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/** The live site runs behind a reverse proxy that handles HTTPS; links must still be https. */
class HttpsBehindProxyTest extends TestCase
{
    public function test_forwarded_https_requests_get_https_asset_links(): void
    {
        $html = $this->get('/', ['X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'timasi.sterango.com', 'X-Forwarded-Port' => '443'])
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString('src="http://', $html);
        $this->assertStringNotContainsString('href="http://timasi', $html);
    }

    public function test_https_app_url_forces_https_links_even_without_proxy_headers(): void
    {
        config(['app.url' => 'https://timasi.sterango.com']);
        (new AppServiceProvider($this->app))->boot();

        $this->assertStringStartsWith('https://', URL::to('/build/assets/app.js'));
        $this->assertStringStartsWith('https://', route('live'));
    }
}
