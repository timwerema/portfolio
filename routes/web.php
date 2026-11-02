<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('portfolio', [
        'portfolio' => config('portfolio'),
    ]);
})->name('home');

Route::get('/resume', function () {
    return Inertia::render('resume', [
        'portfolio' => config('portfolio'),
        'pdfAvailable' => file_exists(public_path('resume.pdf')),
    ]);
})->name('resume');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
