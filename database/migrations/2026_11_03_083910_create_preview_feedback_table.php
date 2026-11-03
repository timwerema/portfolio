<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preview_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('preview_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('decision'); // approved | changes_requested
            $table->string('name')->nullable();
            $table->text('comment')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preview_feedback');
    }
};
