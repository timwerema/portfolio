<?php

namespace Tests\Feature;

use App\Mail\PreviewDecisionReceived;
use App\Mail\PreviewReadyForReview;
use App\Models\Preview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PreviewPortalTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function htmlFile(string $body = '<h1>Joe\'s Barbershop</h1>'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('index.html', "<!doctype html><html><body>{$body}</body></html>");
    }

    private function makePreview(array $attrs = []): Preview
    {
        return Preview::create(array_merge([
            'client_name' => 'Joe',
            'client_email' => 'joe@example.com',
            'title' => 'Homepage concept',
            'demo_url' => 'https://example.com/demo',
        ], $attrs));
    }

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_admin_pages_require_login(): void
    {
        $this->get('/dashboard/previews')->assertRedirect('/login');
        $this->post('/dashboard/previews', [])->assertRedirect('/login');
    }

    public function test_admin_can_create_a_preview_with_an_uploaded_html_file_and_email_it(): void
    {
        Mail::fake();

        $this->actingAs($this->admin())->post('/dashboard/previews', [
            'client_name' => 'Joe',
            'client_email' => 'joe@example.com',
            'title' => 'Homepage concept',
            'html_file' => $this->htmlFile(),
            'send_now' => '1',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $preview = Preview::sole();
        $this->assertSame(40, strlen($preview->token));
        $this->assertNotNull($preview->html_path);
        Storage::disk('local')->assertExists($preview->html_path);
        $this->assertNotNull($preview->sent_at);
        Mail::assertSent(PreviewReadyForReview::class, fn ($m) => $m->hasTo('joe@example.com'));
    }

    public function test_a_demo_link_or_file_is_required(): void
    {
        $this->actingAs($this->admin())->post('/dashboard/previews', ['client_name' => 'Joe', 'title' => 'Concept'])
            ->assertSessionHasErrors('demo_url');
    }

    public function test_only_html_files_can_be_uploaded(): void
    {
        $this->actingAs($this->admin())->post('/dashboard/previews', [
            'client_name' => 'Joe',
            'title' => 'Concept',
            'html_file' => UploadedFile::fake()->create('payload.php', 1),
        ])->assertSessionHasErrors('html_file');
    }

    public function test_client_can_open_the_review_page_with_the_token_only(): void
    {
        $preview = $this->makePreview();

        $this->get("/p/{$preview->token}")->assertOk()->assertInertia(fn ($page) => $page
            ->component('previews/review', false)
            ->where('preview.title', 'Homepage concept')
            ->missing('preview.client_email')
            ->missing('preview.id'));

        $this->get('/p/'.str_repeat('a', 40))->assertNotFound();
    }

    public function test_uploaded_demo_is_served_sandboxed(): void
    {
        $preview = $this->makePreview(['demo_url' => null]);
        $preview->storeHtml('<!doctype html><script>document.cookie</script><h1>Hi</h1>');
        $preview->save();

        $response = $this->get("/p/{$preview->token}/demo")->assertOk();
        $this->assertStringContainsString('sandbox', $response->headers->get('Content-Security-Policy'));
        $this->assertStringNotContainsString('allow-same-origin', $response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString('<h1>Hi</h1>', $response->getContent());
    }

    public function test_client_can_approve_and_admin_is_emailed(): void
    {
        Mail::fake();
        $preview = $this->makePreview();

        $this->post("/p/{$preview->token}/decision", ['decision' => 'approved', 'name' => 'Joe'])->assertSessionHasNoErrors();

        $preview->refresh();
        $this->assertSame(Preview::APPROVED, $preview->status);
        $this->assertNotNull($preview->decided_at);
        $this->assertDatabaseHas('preview_feedback', ['preview_id' => $preview->id, 'decision' => 'approved', 'version' => 1]);
        Mail::assertSent(PreviewDecisionReceived::class, fn ($m) => $m->hasTo(config('portfolio.links.email')));
    }

    public function test_requesting_changes_needs_a_comment(): void
    {
        $preview = $this->makePreview();

        $this->post("/p/{$preview->token}/decision", ['decision' => 'changes_requested'])->assertSessionHasErrors('comment');
        $this->post("/p/{$preview->token}/decision", ['decision' => 'something_else'])->assertSessionHasErrors('decision');

        $this->post("/p/{$preview->token}/decision", ['decision' => 'changes_requested', 'comment' => 'Darker header please'])->assertSessionHasNoErrors();
        $this->assertSame(Preview::CHANGES_REQUESTED, $preview->fresh()->status);
    }

    public function test_uploading_a_new_version_resets_the_status(): void
    {
        $preview = $this->makePreview();
        $preview->forceFill(['status' => Preview::CHANGES_REQUESTED, 'decided_at' => now()])->save();

        $this->actingAs($this->admin())->post("/dashboard/previews/{$preview->id}", [
            'client_name' => 'Joe',
            'title' => 'Homepage concept',
            'html_file' => $this->htmlFile('<h1>v2</h1>'),
        ])->assertSessionHasNoErrors();

        $preview->refresh();
        $this->assertSame(2, $preview->version);
        $this->assertSame(Preview::PENDING, $preview->status);
        $this->assertNull($preview->decided_at);
        $this->assertStringContainsString('v2', Storage::disk('local')->get($preview->html_path));
    }

    public function test_editing_details_only_keeps_the_version(): void
    {
        $preview = $this->makePreview();

        $this->actingAs($this->admin())->post("/dashboard/previews/{$preview->id}", [
            'client_name' => 'Joe Smith',
            'title' => 'Homepage concept',
            'demo_url' => 'https://example.com/demo',
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, $preview->fresh()->version);
        $this->assertSame('Joe Smith', $preview->fresh()->client_name);
    }

    public function test_deleting_a_preview_removes_the_file_and_link(): void
    {
        $preview = $this->makePreview(['demo_url' => null]);
        $preview->storeHtml('<h1>x</h1>');
        $preview->save();
        $path = $preview->html_path;

        $this->actingAs($this->admin())->delete("/dashboard/previews/{$preview->id}")->assertRedirect('/dashboard/previews');

        Storage::disk('local')->assertMissing($path);
        $this->get("/p/{$preview->token}")->assertNotFound();
    }
}
