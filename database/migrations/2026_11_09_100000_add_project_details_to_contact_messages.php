<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Extra details captured by the "Start a project" questionnaire (all optional). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->string('source')->default('contact');   // contact | start
            $table->json('services')->nullable();
            $table->string('package')->nullable();
            $table->string('budget')->nullable();
            $table->string('timeline')->nullable();
            $table->string('business')->nullable();
            $table->string('business_website')->nullable();
            $table->string('phone')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropColumn(['source', 'services', 'package', 'budget', 'timeline', 'business', 'business_website', 'phone']);
        });
    }
};
