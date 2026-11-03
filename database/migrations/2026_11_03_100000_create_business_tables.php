<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Clients, projects, invoices (+ line items) and expenses for the admin dashboard. Money is stored in cents. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('package')->nullable();          // Starter | Business | Custom | Care plan | Other
            $table->string('status')->default('lead');      // lead | proposal | in_progress | review | completed | on_hold
            $table->unsignedBigInteger('budget_cents')->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number')->unique();             // INV-0001
            $table->string('token', 64)->unique();          // secret part of the client's invoice link
            $table->string('status')->default('draft');     // draft | sent | paid | void
            $table->date('issue_date');
            $table->date('due_date');
            $table->text('notes')->nullable();
            $table->string('payment_link')->nullable();     // e.g. a Stripe Payment Link
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('vendor');
            $table->string('category');                     // Hosting | Domains | Software | Equipment | Marketing | Other
            $table->unsignedBigInteger('amount_cents');
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('clients');
    }
};
