<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rundown demo: every lean the model publishes, saved before the game starts,
     * then graded once the final score is in. This is the only source for the track record on the page.
     */
    public function up(): void
    {
        Schema::create('rundown_predictions', function (Blueprint $table) {
            $table->id();
            $table->string('league', 10);
            $table->string('event_id', 20);
            $table->dateTime('starts_at');
            $table->string('home', 10);
            $table->string('away', 10);
            $table->string('side', 4);
            $table->string('team', 10);
            $table->decimal('line', 5, 1);
            $table->decimal('adjustment', 5, 2);
            $table->string('confidence', 10);
            $table->unsignedSmallInteger('home_score')->nullable();
            $table->unsignedSmallInteger('away_score')->nullable();
            $table->string('result', 5)->nullable();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();
            $table->unique(['league', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rundown_predictions');
    }
};
