<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadTrackerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_see_or_change_leads(): void
    {
        $lead = Lead::create(['business' => 'Sample Shop']);

        $this->get('/dashboard/leads')->assertRedirect('/login');
        $this->post('/dashboard/leads', ['business' => 'X'])->assertRedirect('/login');
        $this->patch("/dashboard/leads/{$lead->id}", ['status' => 'Won'])->assertRedirect('/login');
        $this->delete("/dashboard/leads/{$lead->id}")->assertRedirect('/login');
        $this->assertSame('To contact', $lead->fresh()->status);
    }

    public function test_a_lead_can_be_added_updated_and_deleted(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/dashboard/leads', [
            'business' => 'Sample Taco Truck', 'contact_name' => 'Sam', 'channel' => 'Facebook', 'interest' => 'Website',
            'demo_url' => 'https://example.com/p/abc', 'notes' => 'No website',
        ])->assertSessionHasNoErrors();

        $lead = Lead::firstOrFail();
        $this->assertSame('To contact', $lead->status);

        // "Contacted today" sends only the fields that change.
        $this->actingAs($admin)->patch("/dashboard/leads/{$lead->id}", [
            'status' => 'Contacted', 'last_contacted_on' => '2026-11-19', 'follow_up_on' => '2026-11-24',
        ])->assertSessionHasNoErrors();
        $lead->refresh();
        $this->assertSame('Contacted', $lead->status);
        $this->assertSame('2026-11-24', $lead->follow_up_on->toDateString());
        $this->assertSame('Sample Taco Truck', $lead->business);

        $this->actingAs($admin)->delete("/dashboard/leads/{$lead->id}")->assertSessionHasNoErrors();
        $this->assertSame(0, Lead::count());
    }

    public function test_bad_values_are_rejected(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/dashboard/leads', ['business' => '', 'channel' => 'Carrier pigeon', 'interest' => 'Website'])
            ->assertSessionHasErrors(['business', 'channel']);
        $this->actingAs($admin)->post('/dashboard/leads', ['business' => 'X', 'channel' => 'Email', 'interest' => 'Website', 'demo_url' => 'javascript:alert(1)'])
            ->assertSessionHasErrors('demo_url');
        $this->assertSame(0, Lead::count());
    }

    public function test_the_list_puts_follow_ups_that_are_due_first_and_counts_them(): void
    {
        $admin = User::factory()->create();
        $this->travelTo('2026-11-19 12:00:00');
        Lead::create(['business' => 'Won already', 'status' => 'Won', 'follow_up_on' => '2026-11-01']);
        Lead::create(['business' => 'Later', 'status' => 'Contacted', 'follow_up_on' => '2026-12-01']);
        Lead::create(['business' => 'Due now', 'status' => 'Contacted', 'follow_up_on' => '2026-11-18']);

        $this->actingAs($admin)->get('/dashboard/leads')->assertOk()->assertInertia(fn ($page) => $page
            ->component('admin/leads/index', false)
            ->where('leads.0.business', 'Due now')
            ->where('leads.2.business', 'Won already')
            ->where('counts.open', 2)
            ->where('counts.due', 1)
            ->where('counts.won', 1));
    }
}
