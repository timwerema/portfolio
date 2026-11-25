<?php

namespace Tests\Feature;

use App\Mail\LeadNudge;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LeadNudgeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['portfolio.alerts.email' => 'owner@example.com', 'portfolio.lead_nudge' => true]);
    }

    private function lead(array $over = []): Lead
    {
        return Lead::create(array_merge(['business' => 'Test Business', 'channel' => 'Facebook', 'status' => 'Contacted'], $over));
    }

    public function test_nothing_is_sent_on_a_day_with_no_leads_to_act_on(): void
    {
        $this->lead(['follow_up_on' => today()->addDays(3)]);
        $this->lead(['business' => 'Closed deal', 'status' => 'Won', 'follow_up_on' => today()->subDays(2)]);
        $this->lead(['business' => 'Said no', 'status' => 'Not interested', 'follow_up_on' => today()]);

        $this->artisan('leads:nudge')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_due_follow_ups_and_uncontacted_leads_are_emailed_to_the_owner(): void
    {
        $this->lead(['business' => 'Due Today Co', 'follow_up_on' => today(), 'last_contacted_on' => today()->subDays(5)]);
        $this->lead(['business' => 'Late Tacos', 'status' => 'Concept sent', 'follow_up_on' => today()->subDays(3)]);
        $this->lead(['business' => 'Later Lawn', 'follow_up_on' => today()->addDay()]);
        $this->lead(['business' => 'New Barber', 'status' => 'To contact']);

        $this->artisan('leads:nudge')->assertSuccessful();

        Mail::assertSent(LeadNudge::class, function (LeadNudge $mail) {
            $html = $mail->render();

            return $mail->hasTo('owner@example.com')
                && array_column($mail->due, 'business') === ['Late Tacos', 'Due Today Co']
                && $mail->due[0]['days_late'] === 3
                && array_column($mail->toContact, 'business') === ['New Barber']
                && $mail->envelope()->subject === 'Leads today: 2 follow-ups due · 1 to contact'
                && str_contains($html, 'Late Tacos') && str_contains($html, '3 days late')
                && ! str_contains($html, 'Later Lawn');
        });
    }

    public function test_it_can_be_switched_off_and_previewed_without_sending(): void
    {
        $this->lead(['business' => 'Due Today Co', 'follow_up_on' => today()]);

        config(['portfolio.lead_nudge' => false]);
        $this->artisan('leads:nudge')->assertSuccessful();
        $this->artisan('leads:nudge --show')->expectsOutputToContain('Due Today Co')->assertSuccessful();

        Mail::assertNothingSent();
    }
}
