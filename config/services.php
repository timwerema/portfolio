<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    // Encore Live (/live): Spotify login happens in the browser (PKCE), so only the public client ID is needed.
    'spotify' => [
        'client_id' => env('SPOTIFY_CLIENT_ID'),
    ],

    // Client sites whose health the dashboard shows (server-side only: tokens must never reach the browser,
    // so they live here and NOT in config/portfolio.php, which is sent to public pages).
    'client_sites' => [
        'maanet' => [
            'name' => 'Maanet Gardens',
            'kind' => 'Hotel booking site · demo copy',
            'url' => env('MAANET_DEMO_URL'), // e.g. https://maanet-demo.example.com (no trailing slash needed)
            'token' => env('MAANET_HEALTH_TOKEN'), // the HEALTH_TOKEN set in that site's .env
        ],
    ],

    // Ticketmaster Discovery API key (free at developer.ticketmaster.com). Used server-side only.
    'ticketmaster' => [
        'key' => env('TICKETMASTER_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
