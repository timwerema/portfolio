<?php

use App\Http\Controllers\Admin\PreviewController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\PreviewReviewController;
use App\Models\ContactMessage;
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

// Demo sites for fictional businesses, to show prospective clients what's possible.
Route::get('/demos/clearcoat', fn () => Inertia::render('demos/clearcoat'))->name('demos.clearcoat');

Route::get('/resume', function () {
    return Inertia::render('resume', [
        'portfolio' => config('portfolio'),
        'pdfAvailable' => file_exists(public_path('resume.pdf')),
    ]);
})->name('resume');

Route::post('/contact', [ContactMessageController::class, 'store'])->name('contact.store');

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

    Route::get('dashboard', function () {
        return Inertia::render('dashboard', [
            'messages' => ContactMessage::latest()->limit(50)->get(),
            'unread' => ContactMessage::whereNull('read_at')->count(),
        ]);
    })->name('dashboard');

    Route::patch('dashboard/messages/{message}/read', function (ContactMessage $message) {
        $message->forceFill(['read_at' => $message->read_at ? null : now()])->save();

        return back();
    })->name('messages.toggle-read');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
