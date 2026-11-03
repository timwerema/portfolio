<x-mail::message>
# Hi {{ $invoice->client->name }},

Here's invoice **{{ $invoice->number }}** for **{{ $total }}**, due **{{ $invoice->due_date->format('F j, Y') }}**.

<x-mail::table>
| Item | Amount |
|:-----|-------:|
@foreach ($invoice->items as $item)
| {{ $item->description }}@if ($item->quantity != 1) × {{ rtrim(rtrim(number_format($item->quantity, 2), '0'), '.') }}@endif | {{ \App\Support\Money::format($item->amountCents()) }} |
@endforeach
| **Total** | **{{ $total }}** |
</x-mail::table>

<x-mail::button :url="$invoice->public_url">
View{{ $invoice->payment_link ? ' & pay' : '' }} invoice
</x-mail::button>

Thank you for your business!<br>
{{ $studio }}
</x-mail::message>
