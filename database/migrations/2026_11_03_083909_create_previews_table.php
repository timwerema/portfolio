<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('previews', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();      // secret part of the client's review link
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('title');                    // e.g. "Homepage concept"
            $table->text('note')->nullable();           // message shown to the client above the demo
            $table->string('demo_url')->nullable();     // external demo, OR...
            $table->string('html_path')->nullable();    // ...an uploaded index.html (stored privately)
            $table->unsignedInteger('version')->default(1);
            $table->string('status')->default('pending'); // pending | approved | changes_requested
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('previews');
    }
};
