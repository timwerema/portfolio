<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Preview;
use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** Business overview: money in/out, work in progress, things waiting on you. */
    public function overview(): Response
    {
        $invoices = Invoice::with('items', 'client:id,name')->get();
        $sent = $invoices->where('status', Invoice::SENT);
        $paid = $invoices->where('status', Invoice::PAID);
        $year = now()->year;

        $paidThisYear = $paid->filter(fn ($i) => $i->paid_at?->year === $year)->sum->totalCents();
        $expensesThisYear = (int) Expense::whereYear('date', $year)->sum('amount_cents');

        return Inertia::render('admin/overview', [
            'stats' => [
                'outstanding_cents' => $sent->sum->totalCents(),
                'overdue_cents' => $sent->filter->is_overdue->sum->totalCents(),
                'overdue_count' => $sent->filter->is_overdue->count(),
                'paid_this_month_cents' => $paid->filter(fn ($i) => $i->paid_at?->isSameMonth(now()))->sum->totalCents(),
                'paid_this_year_cents' => $paidThisYear,
                'expenses_this_year_cents' => $expensesThisYear,
                'profit_this_year_cents' => $paidThisYear - $expensesThisYear,
                'active_projects' => Project::whereIn('status', ['proposal', 'in_progress', 'review'])->count(),
                'leads' => Project::where('status', 'lead')->count(),
                'unread_messages' => ContactMessage::whereNull('read_at')->count(),
                'previews_pending' => Preview::where('status', Preview::PENDING)->count(),
                'year' => $year,
            ],
            'recentInvoices' => $invoices->sortByDesc('issue_date')->take(5)->values(),
            'activeProjects' => Project::with('client:id,name')->whereIn('status', ['proposal', 'in_progress', 'review'])->orderBy('due_date')->take(6)->get(),
        ]);
    }

    public function messages(): Response
    {
        return Inertia::render('admin/messages', [
            'messages' => ContactMessage::latest()->limit(50)->get(),
            'unread' => ContactMessage::whereNull('read_at')->count(),
        ]);
    }
}
