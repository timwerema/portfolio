<x-mail::message>
# Your week in business

<x-mail::table>
| | |
|:--|--:|
| Paid in the last 7 days | **{{ $money($data['paid_last_week_cents']) }}** |
| Outstanding (sent, unpaid) | {{ $money($data['outstanding_cents']) }} |
| Expenses this month | {{ $money($data['expenses_month_cents']) }} |
| New messages this week | {{ $data['new_messages'] }}{{ $data['unread_messages'] ? ' ('.$data['unread_messages'].' unread)' : '' }} |
| Demos waiting on clients | {{ $data['previews_pending'] }} |
| Open leads | {{ $data['leads'] }} |
</x-mail::table>

@if (count($data['overdue']))
## Overdue invoices
@foreach ($data['overdue'] as $i)
- **{{ $i['number'] }}** · {{ $i['client'] }} · {{ $money($i['total_cents']) }} · {{ $i['days'] }} days late · {{ $i['reminders'] }} reminder{{ $i['reminders'] === 1 ? '' : 's' }} sent
@endforeach
@endif

@if (count($data['due_soon']))
## Projects due in the next 2 weeks
@foreach ($data['due_soon'] as $p)
- **{{ $p['name'] }}** · {{ $p['client'] }} · due {{ $p['due'] }}
@endforeach
@endif

@if (! count($data['overdue']) && ! count($data['due_soon']) && ! $data['unread_messages'])
Nothing urgent this week. 👍
@endif

<x-mail::button :url="route('dashboard')">
Open your dashboard
</x-mail::button>
</x-mail::message>
