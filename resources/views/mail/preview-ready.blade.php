<x-mail::message>
# Hi {{ $preview->client_name }},

Your demo **{{ $preview->title }}** is ready for you to look at.

@if ($preview->note)
<x-mail::panel>
{{ $preview->note }}
</x-mail::panel>
@endif

Open it, take a look around, then click **Approve** or **Request changes** at the bottom of the page.

<x-mail::button :url="$preview->review_url">
Review your demo
</x-mail::button>

Questions? Just reply to this email.

Thanks,<br>
{{ $studio }}
</x-mail::message>
