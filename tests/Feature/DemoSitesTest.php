<?php

namespace Tests\Feature;

use Tests\TestCase;

class DemoSitesTest extends TestCase
{
    public function test_every_listed_demo_page_loads(): void
    {
        foreach (config('portfolio.demos') as $demo) {
            $this->get($demo['url'])->assertOk();
        }
    }

    public function test_home_page_lists_demos(): void
    {
        $this->get('/')->assertInertia(fn ($page) => $page->component('portfolio', false)->has('portfolio.demos', count(config('portfolio.demos'))));
    }
}
