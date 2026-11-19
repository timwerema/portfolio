<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Leads: businesses Timasi has contacted or plans to, and where each one stands. */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('business');
            $table->string('contact_name')->nullable();
            $table->string('channel')->default('Facebook');
            $table->string('contact_info')->nullable();
            $table->string('interest')->default('Website');
            $table->string('status')->default('To contact');
            $table->date('last_contacted_on')->nullable();
            $table->date('follow_up_on')->nullable();
            $table->string('demo_url', 500)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
