<?php

namespace App\Support;

/**
 * Server-rendered <head> metadata for each Inertia page. Link previews (LinkedIn,
 * iMessage, Slack) and search engines read this HTML without running JavaScript,
 * so it can't rely on the React <Head> tags alone.
 */
class Seo
{
    /** Page components that must never appear in search results. */
    private const PRIVATE_PREFIXES = ['admin/', 'auth/', 'settings/', 'previews/', 'invoices/', 'demos/'];

    /** @return array{title: string, description: string, url: string, image: string, noindex: bool, jsonLd: ?array} */
    public static function forPage(array $page): array
    {
        $p = config('portfolio');
        $component = $page['component'] ?? '';
        $props = $page['props'] ?? [];
        $name = $p['name'];

        $meta = [
            'title' => "{$name} · {$p['role']}",
            'description' => $p['tagline'],
            'url' => url()->current(),
            'image' => asset('og-image.png'),
            'noindex' => false,
            'jsonLd' => null,
        ];

        foreach (self::PRIVATE_PREFIXES as $prefix) {
            if (str_starts_with($component, $prefix)) {
                $meta['noindex'] = true;
            }
        }

        switch ($component) {
            case 'portfolio':
                $meta['url'] = url('/');
                $meta['jsonLd'] = self::homeJsonLd($p);
                break;
            case 'service':
                $service = $props['service'] ?? [];
                $meta['title'] = ($service['title'] ?? 'Services')." · {$name}";
                $meta['description'] = $service['description'] ?? $meta['description'];
                break;
            case 'resume':
                $meta['title'] = "Resume · {$name}";
                $meta['description'] = $p['summary'] ?? $meta['description'];
                break;
            case 'demos/clearcoat':
                $meta['title'] = 'Clearcoat Detailing (demo site)';
                $meta['description'] = "A demo website for a fictional car detailing business, built by {$name}.";
                break;
            case 'demos/galacticals':
                $meta['title'] = 'Galacticals SC · concept redesign';
                $meta['description'] = "A concept redesign of a youth soccer academy website by {$name}.";
                break;
            default:
                if ($meta['noindex']) {
                    $meta['title'] = $name;
                }
        }

        return $meta;
    }

    private static function homeJsonLd(array $p): array
    {
        $sameAs = array_values(array_filter([$p['links']['github'] ?? null, $p['links']['linkedin'] ?? null]));

        return [
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Person',
                    '@id' => url('/#person'),
                    'name' => $p['name'],
                    'jobTitle' => $p['role'],
                    'url' => url('/'),
                    'email' => isset($p['links']['email']) ? 'mailto:'.$p['links']['email'] : null,
                    'sameAs' => $sameAs,
                    'alumniOf' => isset($p['education'][0]) ? ['@type' => 'CollegeOrUniversity', 'name' => $p['education'][0]['school']] : null,
                    'address' => ['@type' => 'PostalAddress', 'addressLocality' => 'Dallas', 'addressRegion' => 'TX', 'addressCountry' => 'US'],
                ],
                [
                    '@type' => 'ProfessionalService',
                    'name' => $p['name'].' - Web & Software',
                    'url' => url('/'),
                    'image' => asset('og-image.png'),
                    'founder' => ['@id' => url('/#person')],
                    'areaServed' => 'Dallas-Fort Worth, TX',
                    'description' => $p['tagline'],
                    'makesOffer' => array_map(fn ($s) => [
                        '@type' => 'Offer',
                        'itemOffered' => ['@type' => 'Service', 'name' => $s['title'], 'description' => $s['description'], 'url' => route('services.show', $s['slug'])],
                    ], $p['services'] ?? []),
                ],
            ],
        ];
    }
}
