<?php

namespace App\Support;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * Two-step login with an authenticator app (TOTP) and one-time recovery codes.
 */
class TwoFactor
{
    public static function newSecret(): string
    {
        return (new Google2FA)->generateSecretKey(32);
    }

    /** Check a 6-digit code. Each code works once, so a code seen over someone's shoulder cannot be replayed. */
    public static function verify(User $user, string $code): bool
    {
        $code = preg_replace('/\D/', '', $code) ?? '';
        if (strlen($code) !== 6 || blank($user->two_factor_secret)) {
            return false;
        }

        $engine = new Google2FA;
        $lastUsed = Cache::get(self::replayKey($user));
        // Allows one 30-second step either side for clock drift; returns the matched time step, or false.
        $step = $engine->verifyKeyNewer($user->two_factor_secret, $code, $lastUsed, 1);

        if ($step === false) {
            return false;
        }

        Cache::put(self::replayKey($user), is_int($step) ? $step : $engine->getTimestamp(), now()->addMinutes(5));

        return true;
    }

    /** Use up a recovery code. Returns false when it is not one of the user's unused codes. */
    public static function useRecoveryCode(User $user, string $code): bool
    {
        $code = Str::lower(trim($code));
        $codes = $user->two_factor_recovery_codes ?? [];

        foreach ($codes as $i => $stored) {
            if (hash_equals($stored, $code)) {
                unset($codes[$i]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    public static function newRecoveryCodes(): array
    {
        return array_map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)), range(1, 8));
    }

    /** The QR code for the authenticator app, as an SVG data URI (safe to use as an <img> source). */
    public static function qrDataUri(User $user, string $secret): string
    {
        $url = (new Google2FA)->getQRCodeUrl(config('app.name'), $user->email, $secret);
        $svg = (new Writer(new ImageRenderer(new RendererStyle(220, 2), new SvgImageBackEnd)))->writeString($url);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    private static function replayKey(User $user): string
    {
        return 'two-factor-last-step:'.$user->getKey();
    }
}
