<x-mail::message>
# New enquiry from your portfolio

**Name:** {{ $contactMessage->name }}<br>
**Email:** {{ $contactMessage->email }}<br>
@if ($contactMessage->service)
**Interested in:** {{ $contactMessage->service }}<br>
@endif
**Received:** {{ $contactMessage->created_at->format('M j, Y g:i A') }}

<x-mail::panel>
{{ $contactMessage->message }}
</x-mail::panel>

Hit reply to answer {{ $contactMessage->name }} directly.

<x-mail::button :url="url('/dashboard/messages')">
View all messages
</x-mail::button>
</x-mail::message>
