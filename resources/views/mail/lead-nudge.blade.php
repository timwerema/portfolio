<x-mail::message>
# Leads to act on today

@if (count($due))
**Follow up** (the date you set has arrived)

@foreach ($dueLines as $line)
- {{ $line }}
@endforeach
@endif

@if (count($toContact))
**Not contacted yet**

@foreach ($toContactLines as $line)
- {{ $line }}
@endforeach
@endif

<x-mail::button :url="$url">
Open the lead tracker
</x-mail::button>

After you message someone, press "Contacted today" so the next follow-up date is set.

To stop these emails set `LEAD_NUDGE=false` in `.env`.
</x-mail::message>
