<?php

namespace Tests\Feature;

use Tests\TestCase;

class HirePageTest extends TestCase
{
    public function test_hire_page_shows_the_engineering_story(): void
    {
        $this->get('/hire')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('hire', false)->has('portfolio.projects')->has('portfolio.experience'))
            ->assertSee(config('portfolio.role'));
    }

    public function test_home_page_is_written_for_clients(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee(config('portfolio.client.title'))
            ->assertInertia(fn ($page) => $page->component('portfolio', false)->has('portfolio.client.facts'));
    }

    public function test_hire_page_is_in_the_sitemap(): void
    {
        $this->get('/sitemap.xml')->assertOk()->assertSee(route('hire'));
    }

    public function test_no_project_links_to_a_site_that_is_not_mine(): void
    {
        // Galacticals SC now runs a different site: the project must not link to it or call it live.
        $galacticals = collect(config('portfolio.projects'))->firstWhere('title', 'Galacticals SC');
        $this->assertNull($galacticals['url']);
        $this->assertNotSame('Live', $galacticals['spec']['Status']);
    }
}
