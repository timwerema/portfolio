<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Project;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $year = $request->integer('year') ?: now()->year;
        $expenses = Expense::with('project:id,name')->whereYear('date', $year)->orderByDesc('date')->get();

        return Inertia::render('admin/expenses/index', [
            'expenses' => $expenses,
            'year' => $year,
            'total_cents' => (int) $expenses->sum('amount_cents'),
            'by_category' => $expenses->groupBy('category')->map->sum('amount_cents')->sortDesc(),
            'categories' => Expense::CATEGORIES,
            'projects' => Project::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'vendor' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(Expense::CATEGORIES)],
            'amount' => ['required', 'numeric', 'gt:0', 'max:10000000'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $data['amount_cents'] = Money::toCents($data['amount']);
        unset($data['amount']);

        Expense::create($data);

        return back()->with('status', 'Expense added.');
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back()->with('status', 'Expense deleted.');
    }
}
