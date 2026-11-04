<x-mail::message>
Hi {{ $invoice->client->name }},

@if ($reminderNumber === 1)
Just a friendly reminder that invoice **{{ $invoice->number }}** for **{{ $total }}** was due on **{{ $invoice->due_date->format('F j') }}**. If it's already on its way, thank you, and please ignore this note.
@elseif (! $final)
I'm following up on invoice **{{ $invoice->number }}** for **{{ $total }}**, which is now {{ $invoice->daysOverdue() }} days past due (it was due {{ $invoice->due_date->format('F j') }}). Could you let me know when I can expect payment?
@else
This is a final reminder about invoice **{{ $invoice->number }}** for **{{ $total }}**, now {{ $invoice->daysOverdue() }} days past due. Please arrange payment, or reply to this email so we can work something out together.
@endif

<x-mail::button :url="$invoice->public_url">
View{{ $invoice->payment_link ? ' & pay' : '' }} invoice
</x-mail::button>

If you have any questions about this invoice, just reply. I'm happy to help.

Thanks,<br>
{{ $studio }}
</x-mail::message>
