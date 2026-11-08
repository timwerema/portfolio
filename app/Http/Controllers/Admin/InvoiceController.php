<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\InvoiceSent;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use App\Support\ClientMail;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');

        $invoices = Invoice::with('items', 'client:id,name')
            ->when(in_array($status, [Invoice::DRAFT, Invoice::SENT, Invoice::PAID, Invoice::VOID], true), fn ($q) => $q->where('status', $status))
            ->latest('issue_date')->latest('id')->get();

        return Inertia::render('admin/invoices/index', ['invoices' => $invoices, 'status' => $status]);
    }

    public function create(Request $request): Response
    {
        $project = $request->integer('project_id') ? Project::find($request->integer('project_id')) : null;

        return Inertia::render('admin/invoices/form', [
            ...$this->formProps(),
            'invoice' => null,
            'nextNumber' => Invoice::nextNumber(),
            'prefill' => [
                'client_id' => $project?->client_id ?? ($request->integer('client_id') ?: null),
                'project_id' => $project?->id,
                // Pre-fill one line from the project's package/budget so a typical invoice takes seconds.
                'items' => $project ? [['description' => trim(($project->package ? "{$project->package} package - " : '').$project->name), 'quantity' => 1, 'unit_price' => $project->budget_cents ? $project->budget_cents / 100 : '']] : null,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        [$data, $items] = $this->validated($request);

        $invoice = DB::transaction(function () use ($data, $items) {
            $invoice = Invoice::create($data);
            $invoice->items()->createMany($items);

            return $invoice;
        });

        return to_route('admin.invoices.show', $invoice)->with('status', "Invoice {$invoice->number} created as a draft.");
    }

    public function show(Invoice $invoice): Response
    {
        return Inertia::render('admin/invoices/show', ['invoice' => $invoice->load('items', 'client', 'project:id,name')]);
    }

    public function edit(Invoice $invoice): Response
    {
        return Inertia::render('admin/invoices/form', [...$this->formProps(), 'invoice' => $invoice->load('items'), 'nextNumber' => $invoice->number, 'prefill' => []]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === Invoice::PAID) {
            throw ValidationException::withMessages(['status' => 'Paid invoices can\'t be edited. Mark it unpaid first.']);
        }

        [$data, $items] = $this->validated($request);

        DB::transaction(function () use ($invoice, $data, $items) {
            $invoice->update($data);
            $invoice->items()->delete();
            $invoice->items()->createMany($items);
        });

        return to_route('admin.invoices.show', $invoice)->with('status', 'Invoice updated.');
    }

    /** Email the invoice link to the client and mark it as sent. */
    public function send(Invoice $invoice): RedirectResponse
    {
        $invoice->loadMissing('client', 'items');

        if (! $invoice->client->email) {
            throw ValidationException::withMessages(['status' => 'Add an email address to '.$invoice->client->name.' first.']);
        }
        if (in_array($invoice->status, [Invoice::PAID, Invoice::VOID], true)) {
            throw ValidationException::withMessages(['status' => 'This invoice is already '.$invoice->status.'.']);
        }

        if ($error = ClientMail::send($invoice->client->email, $invoice->client->name, new InvoiceSent($invoice))) {
            throw ValidationException::withMessages(['status' => $error]);
        }
        $invoice->forceFill(['status' => Invoice::SENT, 'sent_at' => now()])->save();

        return back()->with('status', "Invoice emailed to {$invoice->client->email}.");
    }

    /** Change status by hand: sent (without emailing), paid, unpaid, void. */
    public function status(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([Invoice::DRAFT, Invoice::SENT, Invoice::PAID, Invoice::VOID])],
            'payment_method' => ['nullable', 'string', 'max:60'],
            'paid_at' => ['nullable', 'date'],
        ]);

        $invoice->forceFill([
            'status' => $data['status'],
            'sent_at' => $data['status'] === Invoice::SENT ? ($invoice->sent_at ?? now()) : $invoice->sent_at,
            'paid_at' => $data['status'] === Invoice::PAID ? ($data['paid_at'] ?? now()) : null,
            'payment_method' => $data['status'] === Invoice::PAID ? ($data['payment_method'] ?? null) : null,
        ])->save();

        return back()->with('status', "Invoice marked {$data['status']}.");
    }

    /** Pause or resume automatic payment reminders for one invoice. */
    public function reminders(Request $request, Invoice $invoice): RedirectResponse
    {
        $paused = $request->validate(['paused' => ['required', 'boolean']])['paused'];
        $invoice->forceFill(['reminders_paused' => $paused])->save();

        return back()->with('status', $paused ? 'Reminders paused for this invoice.' : 'Reminders turned back on.');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        $invoice->delete();

        return to_route('admin.invoices.index')->with('status', 'Invoice deleted.');
    }

    private function formProps(): array
    {
        return [
            'clients' => Client::orderBy('name')->get(['id', 'name', 'email']),
            'projects' => Project::orderBy('name')->get(['id', 'name', 'client_id']),
        ];
    }

    /** @return array{0: array, 1: array} invoice fields and line items (cents) */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'project_id' => ['nullable', Rule::exists('projects', 'id')->where('client_id', $request->input('client_id'))],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'payment_link' => ['nullable', 'url:https', 'max:2048'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:100000'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:10000000'],
        ], [
            'project_id.exists' => 'That project belongs to a different client.',
            'items.required' => 'Add at least one line item.',
        ]);

        $items = collect($data['items'])->values()->map(fn ($item, $i) => [
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'unit_price_cents' => Money::toCents($item['unit_price']),
            'position' => $i,
        ])->all();
        unset($data['items']);

        return [$data, $items];
    }
}
