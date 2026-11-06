<?php

use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\PreviewController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\PreviewReviewController;
use App\Http\Controllers\PublicInvoiceController;
use App\Models\ContactMessage;
use App\Support\HealthChecks;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('portfolio', [
        'portfolio' => config('portfolio'),
    ]);
})->name('home');

Route::get('/services/{slug}', function (string $slug) {
    $service = collect(config('portfolio.services'))->firstWhere('slug', $slug);

    abort_unless($service, 404);

    return Inertia::render('service', [
        'portfolio' => config('portfolio'),
        'service' => $service,
    ]);
})->name('services.show');

// Health check for an outside uptime monitor (e.g. UptimeRobot): 200 when healthy, 503 when not.
Route::get('/health', function () {
    $checks = HealthChecks::run();
    $healthy = HealthChecks::healthy($checks);

    return response()->json([
        'status' => $healthy ? 'ok' : 'fail',
        'checks' => $checks,
        'time' => now()->toIso8601String(),
    ], $healthy ? 200 : 503, ['Cache-Control' => 'no-store', 'X-Robots-Tag' => 'noindex']);
})->middleware('throttle:30,1')->name('health');

// Search engines: generated from config so they stay current.
Route::get('/robots.txt', function () {
    $lines = [
        'User-agent: *',
        'Disallow: /dashboard',
        'Disallow: /settings',
        'Disallow: /login',
        'Disallow: /p/',      // client demo reviews
        'Disallow: /i/',      // client invoices
        '',
        'Sitemap: '.url('/sitemap.xml'),
    ];

    return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
})->name('robots');

Route::get('/sitemap.xml', function () {
    $urls = [url('/'), route('resume')];
    foreach (config('portfolio.services') as $service) {
        $urls[] = route('services.show', $service['slug']);
    }
    $lastmod = date('Y-m-d', (int) filemtime(config_path('portfolio.php')));

    $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
    foreach ($urls as $u) {
        $xml .= '  <url><loc>'.e($u).'</loc><lastmod>'.$lastmod.'</lastmod></url>'."\n";
    }
    $xml .= '</urlset>'."\n";

    return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
})->name('sitemap');

// Demo sites for fictional businesses, to show prospective clients what's possible.
Route::get('/demos/clearcoat', fn () => Inertia::render('demos/clearcoat'))->name('demos.clearcoat');
Route::get('/demos/galacticals', fn () => Inertia::render('demos/galacticals'))->name('demos.galacticals');
Route::get('/demos/fourth-quarter', fn () => Inertia::render('demos/fourth-quarter'))->name('demos.fourth-quarter');
Route::get('/demos/lateshift', fn () => Inertia::render('demos/lateshift'))->name('demos.lateshift');

Route::get('/resume', function () {
    return Inertia::render('resume', [
        'portfolio' => config('portfolio'),
        'pdfAvailable' => file_exists(public_path('resume.pdf')),
    ]);
})->name('resume');

Route::post('/contact', [ContactMessageController::class, 'store'])->name('contact.store');

// Client's view of an invoice (drafts stay hidden).
Route::get('/i/{token}', [PublicInvoiceController::class, 'show'])->where('token', '[A-Za-z0-9]{40}')->name('invoices.public');

// Demo approval portal - client side. The token in the link is the only "password".
Route::controller(PreviewReviewController::class)->where(['token' => '[A-Za-z0-9]{40}'])->group(function () {
    Route::get('/p/{token}', 'show')->name('previews.review');
    Route::get('/p/{token}/demo', 'demo')->name('previews.demo');
    Route::post('/p/{token}/decision', 'decide')->name('previews.decide');
});

Route::middleware(['auth'])->group(function () {
    // Demo approval portal - your side.
    Route::prefix('dashboard/previews')->name('admin.previews.')->controller(PreviewController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{preview}', 'show')->name('show');
        Route::post('/{preview}', 'update')->name('update'); // POST so file uploads work
        Route::post('/{preview}/send', 'send')->name('send');
        Route::delete('/{preview}', 'destroy')->name('destroy');
    });

    Route::get('dashboard', [DashboardController::class, 'overview'])->name('dashboard');
    Route::get('dashboard/messages', [DashboardController::class, 'messages'])->name('admin.messages');

    Route::patch('dashboard/messages/{message}/read', function (ContactMessage $message) {
        $message->forceFill(['read_at' => $message->read_at ? null : now()])->save();

        return back();
    })->name('messages.toggle-read');

    // Business: clients, projects, invoices, expenses.
    Route::prefix('dashboard')->name('admin.')->group(function () {
        Route::resource('clients', ClientController::class);
        Route::resource('projects', ProjectController::class)->except('show');
        Route::patch('projects/{project}/status', [ProjectController::class, 'status'])->name('projects.status');
        Route::resource('invoices', InvoiceController::class);
        Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send'])->name('invoices.send');
        Route::patch('invoices/{invoice}/status', [InvoiceController::class, 'status'])->name('invoices.status');
        Route::patch('invoices/{invoice}/reminders', [InvoiceController::class, 'reminders'])->name('invoices.reminders');
        Route::resource('expenses', ExpenseController::class)->only(['index', 'store', 'destroy']);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
