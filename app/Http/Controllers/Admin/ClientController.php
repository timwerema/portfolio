<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        $clients = Client::withCount('projects')->with('invoices.items')->orderBy('name')->get()
            ->map(fn (Client $c) => [...$c->only('id', 'name', 'company', 'email', 'phone', 'projects_count'), 'balance_cents' => $c->balanceCents()]);

        return Inertia::render('admin/clients/index', ['clients' => $clients]);
    }

    /** Optional ?name=&email= prefill (used by "Add as client" on a contact message). */
    public function create(Request $request): Response
    {
        return Inertia::render('admin/clients/form', [
            'client' => null,
            'prefill' => $request->only('name', 'email', 'notes'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $client = Client::create($this->validated($request));

        return to_route('admin.clients.show', $client)->with('status', 'Client added.');
    }

    public function show(Client $client): Response
    {
        $client->load(['projects', 'invoices.items', 'invoices.project:id,name']);

        return Inertia::render('admin/clients/show', [
            'client' => $client,
            'balance_cents' => $client->balanceCents(),
        ]);
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('admin/clients/form', ['client' => $client, 'prefill' => []]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $client->update($this->validated($request));

        return to_route('admin.clients.show', $client)->with('status', 'Client updated.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return to_route('admin.clients.index')->with('status', 'Client deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }
}
