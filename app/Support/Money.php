<?php

namespace App\Support;

class Money
{
    /** "1,750.50" or 1750.5 -> 175050 */
    public static function toCents(mixed $dollars): ?int
    {
        if ($dollars === null || $dollars === '') {
            return null;
        }

        return (int) round(((float) str_replace([',', '$'], '', (string) $dollars)) * 100);
    }

    public static function format(int $cents): string
    {
        return '$'.number_format($cents / 100, 2);
    }
}
