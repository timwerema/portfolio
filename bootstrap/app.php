<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Support\Alerts;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // The site sits behind a reverse proxy that handles HTTPS (see DEPLOY.md): trust its
        // X-Forwarded-* headers so Laravel knows visitors are on https and builds https links.
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Email the site owner about real errors (throttled; 404s and validation errors are never reported).
        $exceptions->report(function (Throwable $e) {
            Alerts::exception($e);
        });
    })->create();
