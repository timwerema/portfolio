<?php

namespace Tests\Feature;

use App\Models\Preview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_home_page_has_link_preview_tags_and_structured_data(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringContainsString('<meta property="og:title" content="'.e(config('portfolio.name')), $html);
        $this->assertStringContainsString('og-image.png', $html);
        $this->assertStringContainsString('<link rel="canonical"', $html);
        $this->assertStringContainsString('application/ld+json', $html);
        $this->assertStringContainsString('"@type":"ProfessionalService"', $html);
        $this->assertStringNotContainsString('noindex', $html);
    }

    public function test_service_pages_get_their_own_title(): void
    {
        $service = config('portfolio.services.0');

        $this->get('/services/'.$service['slug'])->assertSee('<meta property="og:title" content="'.e($service['title']), false);
    }

    public function test_private_and_demo_pages_are_noindex(): void
    {
        $preview = Preview::create(['client_name' => 'Joe', 'title' => 'Concept', 'demo_url' => 'https://example.com']);

        foreach (['/demos/clearcoat', '/demos/galacticals', '/login', "/p/{$preview->token}"] as $url) {
            $this->get($url)->assertOk()->assertSee('<meta name="robots" content="noindex, nofollow">', false);
        }
    }

    public function test_robots_txt_blocks_private_areas_and_points_to_sitemap(): void
    {
        $this->get('/robots.txt')->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /dashboard')
            ->assertSee('Disallow: /p/')
            ->assertSee('Disallow: /i/')
            ->assertSee('Sitemap: '.url('/sitemap.xml'));
    }

    public function test_sitemap_lists_public_pages_only(): void
    {
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('<loc>'.url('/').'</loc>', $xml);
        $this->assertStringContainsString(route('resume'), $xml);
        foreach (config('portfolio.services') as $s) {
            $this->assertStringContainsString(route('services.show', $s['slug']), $xml);
        }
        $this->assertStringNotContainsString('/demos/', $xml);
        $this->assertStringNotContainsString('/dashboard', $xml);
        $this->assertNotFalse(simplexml_load_string($xml));
    }
}
