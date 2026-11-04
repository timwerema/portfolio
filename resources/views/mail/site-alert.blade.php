<x-mail::message>
# {{ $alertSubject }}

@foreach ($lines as $line)
- {{ $line }}
@endforeach

<x-mail::button :url="route('health')">
Open the health page
</x-mail::button>
</x-mail::message>
