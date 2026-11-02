<?php

namespace Tests\Feature;

use Tests\TestCase;

class ServicePagesTest extends TestCase
{
    public function test_every_service_has_a_detail_page(): void
    {
        $services = config('portfolio.services');
        $this->assertNotEmpty($services);

        foreach ($services as $service) {
            $this->get("/services/{$service['slug']}")
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('service', false)
                    ->where('service.slug', $service['slug'])
                    ->where('service.title', $service['title']));
        }
    }

    public function test_service_slugs_are_unique_and_url_safe(): void
    {
        $slugs = array_column(config('portfolio.services'), 'slug');

        $this->assertSame(count($slugs), count(array_unique($slugs)), 'Duplicate service slug');
        foreach ($slugs as $slug) {
            $this->assertMatchesRegularExpression('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug);
        }
    }

    public function test_unknown_service_returns_404(): void
    {
        $this->get('/services/does-not-exist')->assertNotFound();
    }

    public function test_service_page_contact_form_accepts_its_own_service(): void
    {
        $title = config('portfolio.services.0.title');

        $this->post('/contact', [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'service' => $title,
            'message' => 'Interested in this service, please get in touch.',
        ])->assertSessionHasNoErrors();
    }
}
