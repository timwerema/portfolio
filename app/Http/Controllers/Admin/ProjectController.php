<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/projects/index', [
            'projects' => Project::with('client:id,name')->latest()->get(),
            'statuses' => Project::STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/projects/form', $this->formProps(null, $request->integer('client_id') ?: null));
    }

    public function store(Request $request): RedirectResponse
    {
        $project = Project::create($this->validated($request));

        return to_route('admin.clients.show', $project->client_id)->with('status', 'Project added.');
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('admin/projects/form', $this->formProps($project, $project->client_id));
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $project->update($this->validated($request));

        return to_route('admin.clients.show', $project->client_id)->with('status', 'Project updated.');
    }

    /** Quick status change from the projects list. */
    public function status(Request $request, Project $project): RedirectResponse
    {
        $project->update($request->validate(['status' => ['required', Rule::in(Project::STATUSES)]]));

        return back();
    }

    public function destroy(Project $project): RedirectResponse
    {
        $clientId = $project->client_id;
        $project->delete();

        return to_route('admin.clients.show', $clientId)->with('status', 'Project deleted.');
    }

    private function formProps(?Project $project, ?int $clientId): array
    {
        return [
            'project' => $project,
            'clientId' => $clientId,
            'clients' => Client::orderBy('name')->get(['id', 'name']),
            'statuses' => Project::STATUSES,
            'packages' => Project::PACKAGES,
        ];
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:160'],
            'package' => ['nullable', Rule::in(Project::PACKAGES)],
            'status' => ['required', Rule::in(Project::STATUSES)],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $data['budget_cents'] = Money::toCents($data['budget'] ?? null);
        unset($data['budget']);

        return $data;
    }
}
