<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends an email to a client and turns a failure into a plain-English message
 * instead of an error page (e.g. Resend refusing client addresses before the
 * sending domain is verified).
 */
class ClientMail
{
    /** @return string|null null when sent, otherwise a message to show the site owner */
    public static function send(string $to, ?string $name, Mailable $mail): ?string
    {
        try {
            Mail::to($to, $name)->send($mail);

            return null;
        } catch (Throwable $e) {
            Log::warning('Client email failed', ['to' => $to, 'mailable' => $mail::class, 'error' => $e->getMessage()]);

            $message = "Couldn't email {$to}.";
            if (str_ends_with((string) config('mail.from.address'), '@resend.dev')) {
                $message .= ' You\'re still using Resend\'s test sender, which can only email your own address. Verify your domain in Resend (Domains), then set MAIL_FROM_ADDRESS to an address on it. For now, use Copy link and send the link yourself.';
            } else {
                $message .= ' The email service said: '.str($e->getMessage())->squish()->limit(160).' Use Copy link and send the link yourself.';
            }

            return $message;
        }
    }
}
