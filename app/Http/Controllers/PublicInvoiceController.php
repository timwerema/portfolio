<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;
use Inertia\Response;

/** The client's view of an invoice: /i/{token}. Drafts aren't visible until sent. */
class PublicInvoiceController extends Controller
{
    public function show(string $token): Response
    {
        $invoice = Invoice::with('items', 'client:id,name,company,email')->where('token', $token)->firstOrFail();

        abort_if($invoice->status === Invoice::DRAFT, 404);

        return Inertia::render('invoices/public', [
            'invoice' => [
                ...$invoice->only('number', 'status', 'notes', 'payment_link', 'total_cents', 'is_overdue'),
                'issue_date' => $invoice->issue_date->toDateString(),
                'due_date' => $invoice->due_date->toDateString(),
                'paid_at' => $invoice->paid_at?->toDateString(),
                'client' => $invoice->client->only('name', 'company'),
                'items' => $invoice->items->map(fn ($i) => [
                    'description' => $i->description,
                    'quantity' => $i->quantity,
                    'unit_price_cents' => $i->unit_price_cents,
                    'amount_cents' => $i->amountCents(),
                ]),
            ],
            'studio' => [
                'name' => config('portfolio.name'),
                'email' => config('portfolio.links.email'),
                'location' => config('portfolio.location'),
            ],
        ]);
    }
}
