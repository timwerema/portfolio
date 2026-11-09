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
            case 'start':
                $meta['title'] = "Start a project · {$name}";
                $meta['description'] = 'Tell me what you need in about two minutes. Every website project starts with a free demo homepage you approve before paying.';
                break;
            case 'legal':
                $doc = $props['doc'] ?? 'privacy';
                $meta['title'] = ($doc === 'terms' ? 'Terms of service' : 'Privacy policy')." · {$name}";
                $meta['description'] = $doc === 'terms' ? 'Plain-English terms for working together.' : 'What information this site collects and how it is used.';
                break;
            case 'resume':
                $meta['title'] = "Resume · {$name}";
                $meta['description'] = $p['summary'] ?? $meta['description'];
                break;
            case 'demos/clearcoat':
                $meta['title'] = 'Clearcoat (demo site)';
                $meta['description'] = "A demo website for a fictional ceramic coating, PPF and wrap studio, built by {$name}.";
                break;
            case 'demos/fourth-quarter':
                $meta['title'] = '4th Quarter Performance (demo site)';
                $meta['description'] = "A demo website for a fictional gym and athletic training studio, built by {$name}.";
                break;
            case 'demos/lateshift':
                $meta['title'] = 'LATESHIFT (demo store)';
                $meta['description'] = "A demo online store for a fictional streetwear brand, built by {$name}.";
                break;
            case 'demos/studyloop':
                $meta['title'] = 'StudyLoop (demo app)';
                $meta['description'] = "A demo study app that turns notes into flashcards and quizzes, built by {$name}.";
                break;
            case 'demos/deskbot':
                $meta['title'] = 'Deskbot (demo AI agent)';
                $meta['description'] = "A demo office-helper AI agent for a fictional business, built by {$name}.";
                break;
            case 'demos/rundown':
                $meta['title'] = 'Rundown (demo app)';
                $meta['description'] = "A demo stats site for a fictional basketball league, built by {$name}.";
                break;
            case 'demos/encore':
                $meta['title'] = 'Encore (demo app)';
                $meta['description'] = "A demo concert-finder app with sample data, built by {$name}.";
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
