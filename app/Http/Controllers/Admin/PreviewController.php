<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\PreviewReadyForReview;
use App\Models\Preview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Your side of the demo approval portal: create previews, send links, read feedback. */
class PreviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('previews/index', [
            'previews' => Preview::withCount('feedback')->latest()->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('previews/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, creating: true);

        $preview = Preview::create($data);

        if ($request->hasFile('html_file')) {
            $preview->storeHtml($request->file('html_file')->get());
            $preview->save();
        }

        if ($request->boolean('send_now') && $preview->client_email) {
            $this->sendToClient($preview);
        }

        return to_route('admin.previews.show', $preview)->with('status', 'Preview created.');
    }

    public function show(Preview $preview): Response
    {
        return Inertia::render('previews/show', [
            'preview' => $preview->load('feedback'),
        ]);
    }

    /** Edit details and/or upload a new version (a new demo resets the status to pending). */
    public function update(Request $request, Preview $preview): RedirectResponse
    {
        $data = $this->validated($request, creating: false);
        $newVersion = $request->hasFile('html_file') || ($data['demo_url'] ?? null) !== $preview->demo_url;

        $preview->fill($data);

        if ($newVersion) {
            $preview->version++;
            $preview->status = Preview::PENDING;
            $preview->decided_at = null;
        }

        if ($request->hasFile('html_file')) {
            $preview->storeHtml($request->file('html_file')->get());
        }

        $preview->save();

        if ($request->boolean('send_now') && $preview->client_email) {
            $this->sendToClient($preview);
        }

        return back()->with('status', $newVersion ? "Version {$preview->version} saved." : 'Details saved.');
    }

    public function send(Preview $preview): RedirectResponse
    {
        if (! $preview->client_email) {
            throw ValidationException::withMessages(['client_email' => 'Add the client\'s email address first.']);
        }

        $this->sendToClient($preview);

        return back()->with('status', 'Link emailed to '.$preview->client_email.'.');
    }

    public function destroy(Preview $preview): RedirectResponse
    {
        $preview->delete();

        return to_route('admin.previews.index');
    }

    private function sendToClient(Preview $preview): void
    {
        Mail::to($preview->client_email, $preview->client_name)->send(new PreviewReadyForReview($preview));
        $preview->forceFill(['sent_at' => now()])->save();
    }

    private function validated(Request $request, bool $creating): array
    {
        $hasExistingUpload = ! $creating && $request->route('preview')?->html_path;

        return $request->validate([
            'client_name' => ['required', 'string', 'max:120'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'title' => ['required', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:2000'],
            // Either a link to a hosted demo, or an uploaded single-file index.html.
            'demo_url' => [$creating || ! $hasExistingUpload ? 'required_without:html_file' : 'nullable', 'nullable', 'url:http,https', 'max:2048'],
            'html_file' => ['nullable', 'file', 'extensions:html,htm', 'max:5120'],
        ], [
            'demo_url.required_without' => 'Add a link to the demo or upload an index.html file.',
            'html_file.extensions' => 'Upload a single .html file.',
        ]);
    }
}
