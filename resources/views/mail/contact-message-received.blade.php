<x-mail::message>
@if ($contactMessage->source === 'start')
# New project request
@else
# New enquiry from your portfolio
@endif

**Name:** {{ $contactMessage->name }}<br>
**Email:** {{ $contactMessage->email }}<br>
@if ($contactMessage->phone)
**Phone:** {{ $contactMessage->phone }}<br>
@endif
@if ($contactMessage->business)
**Business:** {{ $contactMessage->business }}@if ($contactMessage->business_website) ({{ $contactMessage->business_website }})@endif<br>
@endif
@if ($contactMessage->service)
**Interested in:** {{ $contactMessage->service }}<br>
@endif
@if ($contactMessage->package)
**Package:** {{ $contactMessage->package }}<br>
@endif
@if ($contactMessage->budget)
**Budget:** {{ $contactMessage->budget }}<br>
@endif
@if ($contactMessage->timeline)
**Timeline:** {{ $contactMessage->timeline }}<br>
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
