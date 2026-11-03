<?php

namespace Tests\Feature;

use App\Mail\InvoiceSent;
use App\Models\Client;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BusinessDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    private function client(array $attrs = []): Client
    {
        return Client::create(array_merge(['name' => 'Joe', 'email' => 'joe@example.com'], $attrs));
    }

    private function invoiceFor(Client $client, array $items = [['description' => 'Website', 'quantity' => 1, 'unit_price' => '1750']], array $attrs = []): Invoice
    {
        $this->actingAs($this->admin)->post('/dashboard/invoices', array_merge([
            'client_id' => $client->id,
            'issue_date' => '2026-11-01',
            'due_date' => '2026-11-15',
            'items' => $items,
        ], $attrs))->assertSessionHasNoErrors();

        return Invoice::latest('id')->first();
    }

    public function test_every_admin_page_requires_login(): void
    {
        foreach (['/dashboard', '/dashboard/messages', '/dashboard/clients', '/dashboard/projects', '/dashboard/invoices', '/dashboard/expenses'] as $url) {
            $this->get($url)->assertRedirect('/login');
        }
    }

    public function test_every_admin_page_loads(): void
    {
        $client = $this->client();
        $invoice = $this->invoiceFor($client);
        $project = Project::create(['client_id' => $client->id, 'name' => 'Site', 'status' => 'lead']);

        foreach (['/dashboard', '/dashboard/messages', '/dashboard/clients', '/dashboard/clients/create', "/dashboard/clients/{$client->id}", "/dashboard/clients/{$client->id}/edit",
            '/dashboard/projects', '/dashboard/projects/create', "/dashboard/projects/{$project->id}/edit",
            '/dashboard/invoices', '/dashboard/invoices/create', "/dashboard/invoices/{$invoice->id}", "/dashboard/invoices/{$invoice->id}/edit", '/dashboard/expenses'] as $url) {
            $this->actingAs($this->admin)->get($url)->assertOk();
        }
    }

    public function test_client_can_be_created_from_a_contact_message_prefill(): void
    {
        $this->actingAs($this->admin)->get('/dashboard/clients/create?name=Jane&email=jane@example.com')
            ->assertInertia(fn ($page) => $page->where('prefill.name', 'Jane')->where('prefill.email', 'jane@example.com'));

        $this->actingAs($this->admin)->post('/dashboard/clients', ['name' => 'Jane', 'email' => 'jane@example.com'])->assertRedirect();
        $this->assertDatabaseHas('clients', ['email' => 'jane@example.com']);
    }

    public function test_project_budget_is_stored_in_cents(): void
    {
        $client = $this->client();

        $this->actingAs($this->admin)->post('/dashboard/projects', [
            'client_id' => $client->id, 'name' => 'Website', 'status' => 'proposal', 'package' => 'Business', 'budget' => '1750.50',
        ])->assertSessionHasNoErrors();

        $this->assertSame(175050, Project::sole()->budget_cents);
    }

    public function test_invoice_numbers_increment_and_totals_add_up(): void
    {
        $client = $this->client();
        $first = $this->invoiceFor($client, [
            ['description' => 'Website', 'quantity' => 1, 'unit_price' => '1750'],
            ['description' => 'Extra page', 'quantity' => 2, 'unit_price' => '125.50'],
        ]);
        $second = $this->invoiceFor($client);

        $this->assertSame('INV-0001', $first->number);
        $this->assertSame('INV-0002', $second->number);
        $this->assertSame(200100, $first->fresh()->load('items')->total_cents);
        $this->assertSame(Invoice::DRAFT, $first->status);
    }

    public function test_invoice_validation(): void
    {
        $client = $this->client();
        $other = $this->client(['name' => 'Other']);
        $otherProject = Project::create(['client_id' => $other->id, 'name' => 'Theirs', 'status' => 'lead']);

        $this->actingAs($this->admin)->post('/dashboard/invoices', [
            'client_id' => $client->id, 'project_id' => $otherProject->id, 'issue_date' => '2026-11-10', 'due_date' => '2026-11-01',
            'payment_link' => 'javascript:alert(1)', 'items' => [['description' => '', 'quantity' => 0, 'unit_price' => '-5']],
        ])->assertSessionHasErrors(['project_id', 'due_date', 'payment_link', 'items.0.description', 'items.0.quantity', 'items.0.unit_price']);
    }

    public function test_drafts_are_hidden_from_clients_until_sent(): void
    {
        Mail::fake();
        $invoice = $this->invoiceFor($this->client());

        $this->get("/i/{$invoice->token}")->assertNotFound();

        $this->actingAs($this->admin)->post("/dashboard/invoices/{$invoice->id}/send")->assertSessionHasNoErrors();
        Mail::assertSent(InvoiceSent::class, fn ($m) => $m->hasTo('joe@example.com'));
        $this->assertSame(Invoice::SENT, $invoice->fresh()->status);

        auth()->logout();
        $this->get("/i/{$invoice->token}")->assertOk()->assertInertia(fn ($page) => $page
            ->component('invoices/public', false)
            ->where('invoice.total_cents', 175000)
            ->missing('invoice.id')
            ->missing('invoice.client.email'));
    }

    public function test_cannot_email_invoice_without_client_email(): void
    {
        $invoice = $this->invoiceFor($this->client(['email' => null]));

        $this->actingAs($this->admin)->post("/dashboard/invoices/{$invoice->id}/send")->assertSessionHasErrors('status');
        $this->assertSame(Invoice::DRAFT, $invoice->fresh()->status);
    }

    public function test_recording_a_payment_and_the_overview_numbers(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 20));
        $client = $this->client();

        $paid = $this->invoiceFor($client, [['description' => 'Site', 'quantity' => 1, 'unit_price' => '1000']]);
        $this->actingAs($this->admin)->patch("/dashboard/invoices/{$paid->id}/status", ['status' => 'paid', 'payment_method' => 'Zelle', 'paid_at' => '2026-11-18']);

        $overdue = $this->invoiceFor($client, [['description' => 'Care plan', 'quantity' => 1, 'unit_price' => '100']], ['due_date' => '2026-11-15']);
        $this->actingAs($this->admin)->patch("/dashboard/invoices/{$overdue->id}/status", ['status' => 'sent']);

        $notYetDue = $this->invoiceFor($client, [['description' => 'Extra', 'quantity' => 1, 'unit_price' => '50']], ['due_date' => '2026-12-01']);
        $this->actingAs($this->admin)->patch("/dashboard/invoices/{$notYetDue->id}/status", ['status' => 'sent']);

        $this->invoiceFor($client, [['description' => 'Draft', 'quantity' => 1, 'unit_price' => '999']]); // drafts don't count

        Expense::create(['date' => '2026-11-02', 'vendor' => 'DigitalOcean', 'category' => 'Hosting', 'amount_cents' => 600]);

        $this->assertSame('Zelle', $paid->fresh()->payment_method);

        $this->actingAs($this->admin)->get('/dashboard')->assertInertia(fn ($page) => $page
            ->component('admin/overview', false)
            ->where('stats.outstanding_cents', 15000)
            ->where('stats.overdue_cents', 10000)
            ->where('stats.overdue_count', 1)
            ->where('stats.paid_this_month_cents', 100000)
            ->where('stats.paid_this_year_cents', 100000)
            ->where('stats.expenses_this_year_cents', 600)
            ->where('stats.profit_this_year_cents', 99400));
    }

    public function test_paid_invoices_cannot_be_edited(): void
    {
        $invoice = $this->invoiceFor($this->client());
        $this->actingAs($this->admin)->patch("/dashboard/invoices/{$invoice->id}/status", ['status' => 'paid']);

        $this->actingAs($this->admin)->put("/dashboard/invoices/{$invoice->id}", [
            'client_id' => $invoice->client_id, 'issue_date' => '2026-11-01', 'due_date' => '2026-11-15',
            'items' => [['description' => 'Changed', 'quantity' => 1, 'unit_price' => '1']],
        ])->assertSessionHasErrors('status');

        $this->assertSame('Website', $invoice->fresh()->items->first()->description);
    }

    public function test_expenses_are_added_in_cents_and_listed_by_year(): void
    {
        $this->actingAs($this->admin)->post('/dashboard/expenses', ['date' => '2026-03-01', 'vendor' => 'Namecheap', 'category' => 'Domains', 'amount' => '12.98'])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post('/dashboard/expenses', ['date' => '2025-03-01', 'vendor' => 'Old', 'category' => 'Domains', 'amount' => '10'])->assertSessionHasNoErrors();

        $this->actingAs($this->admin)->get('/dashboard/expenses?year=2026')->assertInertia(fn ($page) => $page->has('expenses', 1)->where('total_cents', 1298));
    }

    public function test_deleting_a_client_removes_their_projects_and_invoices(): void
    {
        $client = $this->client();
        Project::create(['client_id' => $client->id, 'name' => 'Site', 'status' => 'lead']);
        $this->invoiceFor($client);

        $this->actingAs($this->admin)->delete("/dashboard/clients/{$client->id}")->assertRedirect('/dashboard/clients');

        $this->assertDatabaseCount('projects', 0);
        $this->assertDatabaseCount('invoices', 0);
        $this->assertDatabaseCount('invoice_items', 0);
    }
}
