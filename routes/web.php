<?php

use App\Http\Controllers\ContactMessageController;
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

Route::middleware(['auth'])->group(function () {
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
