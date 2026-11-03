<x-mail::message>
@if ($feedback->decision === \App\Models\Preview::APPROVED)
# Approved ✓
{{ $preview->client_name }} approved **{{ $preview->title }}** (version {{ $feedback->version }}).
@else
# Changes requested
{{ $preview->client_name }} asked for changes to **{{ $preview->title }}** (version {{ $feedback->version }}).
@endif

@if ($feedback->name)
**From:** {{ $feedback->name }}
@endif

@if ($feedback->comment)
<x-mail::panel>
{{ $feedback->comment }}
</x-mail::panel>
@endif

<x-mail::button :url="route('admin.previews.show', $preview)">
Open in dashboard
</x-mail::button>
</x-mail::message>
