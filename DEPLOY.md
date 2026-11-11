# Deploying the portfolio

The site runs on **timasi-box**, a Docker container on Collin's Sterango server.
It's already set up and live at **https://timasi.sterango.com**.

> **Don't run `deploy/setup-server.sh` on timasi-box.** That script is only for
> a brand-new server of your own (see [the end of this page](#setting-up-a-brand-new-server)).
> It installs Nginx and a firewall, and the box doesn't need either.

## What the box already has

| | |
|---|---|
| **Access** | `ssh timasi@sterango.com` (your key is on the server and the box). If it asks for a password, send Collin the public key from that machine. |
| **sudo** | Yes, no password needed. |
| **Software** | Apache, PHP 8.4, Node and MariaDB, all started automatically. No Nginx. |
| **HTTPS & traffic** | Collin handles both. Nothing to do with the firewall. |
| **Email** | Outbound port 587 to Resend is open. |
| **Cron** | `crontab -e`. The box runs on **UTC**. |
| **Limits** | 8 GB RAM, 4 CPUs and 20 GB disk. Keep `apt` installs small, and ask Collin if you need more. |
| **Server IP** | `108.205.145.7` |

## Folders

| Path | What it is |
|---|---|
| `~/websites/<name>.timasi.sterango.com/` | Anything in here is **live right away** at `https://<name>.timasi.sterango.com`. |
| `~/projects/` | Where you work: `portfolio/`, `clients/`, `demos/`, `bots/`. Open it in VS Code with Remote - SSH. |

In the commands below, **`APP` means `~/apps/portfolio`**, the folder the live
site runs from (Apache serves `APP/public`). Run every `php artisan` command from
there:

```bash
cd ~/apps/portfolio
```

If you see `Could not open input file: artisan`, you're in the wrong folder.
Your prompt should read `timasi@timasi-box:~/apps/portfolio$`.

## Adding a site or a custom domain

- **New subdomain:** create `~/websites/<name>.timasi.sterango.com/` and it's
  live. For a Laravel app, the web root is its `public/` folder.
- **Your own domain:** at your registrar, add **A records** for `@` and `www`
  pointing to `108.205.145.7`, then ask Claude on the box to point that domain
  at the site's folder. Claude sets up Apache for it. Check DNS with
  `dig +short yourdomain.com`.
- **An app on another port** (a bot dashboard, a Node app and so on): ask
  Claude on the box to pass that port through an Apache subdomain (a reverse
  proxy), for example `bot.timasi.sterango.com` to `localhost:3000`.

When the portfolio gets its own domain, update `APP_URL` in `APP/.env` and run
`php artisan optimize`.

## Email (Resend)

**Connected** (November 2026) using Resend's test sender `onboarding@resend.dev`.

> **Limit until your domain is verified:** the test sender can only deliver to the
> email you signed up to Resend with (timasiwerema@gmail.com). Emails to clients
> (invoices, demo links, payment reminders) are refused. The dashboard shows a
> clear message instead of sending; use **Copy link** and send it yourself.

To verify a domain (once you own one):

1. In Resend, go to **Domains**, then **Add Domain**, and add the DNS records it shows at your registrar.
2. When Resend shows the domain as verified, in `APP` run:
   ```bash
   sed -i 's/^MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS="hello@yourdomain.com"/' .env && php artisan optimize
   ```

To set it up from scratch (a new server, or a new API key), from `APP`:

```bash
sed -i 's/^MAIL_MAILER=.*/MAIL_MAILER=smtp/; s/^MAIL_HOST=.*/MAIL_HOST=smtp.resend.com/; s/^MAIL_PORT=.*/MAIL_PORT=587/; s/^MAIL_USERNAME=.*/MAIL_USERNAME=resend/; s/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/; s/^MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS="onboarding@resend.dev"/' .env
```

```bash
read -rsp "Resend key: " K && sed -i "s|^MAIL_PASSWORD=.*|MAIL_PASSWORD=$K|" .env && unset K && echo " saved"
```

```bash
php artisan optimize
```

The second command hides the key as you paste it and keeps it out of your shell
history. Never paste the key into a chat.

Check and test:

```bash
php artisan tinker --execute='echo config("mail.default"), " | ", config("mail.mailers.smtp.host"), PHP_EOL;'
```

That should print `smtp | smtp.resend.com`. If it prints `log`, `.env` still has
the old lines; check with `grep -n "^MAIL_" .env | grep -v PASSWORD`, where each
setting should appear once.

```bash
php artisan tinker --execute='Mail::raw("Resend works", fn ($m) => $m->to("timasiwerema@gmail.com")->subject("Test from my site"));'
```

Use single quotes as shown: a `!` inside double quotes confuses bash. Also check
that `APP/.env` has `APP_ENV=production`, `APP_DEBUG=false` and
`APP_URL=https://timasi.sterango.com`. `CONTACT_NOTIFY_EMAIL` and `ALERT_EMAIL`
set where contact-form messages and alerts go.

## Scheduler (backups, alerts, reminders)

Add this with `crontab -e`:

```
* * * * * cd APP && php artisan schedule:run >> /dev/null 2>&1
```

Scheduled times in `routes/console.php` are in **UTC**, the box's clock. For
example, the 03:10 backup runs at 03:10 UTC.

## Create your admin login

```bash
cd APP && php artisan user:create
```

Then sign in at `https://timasi.sterango.com/login` to reach `/dashboard`.

## Updating the site later

Push changes to GitHub, then on the box:

```bash
APP/deploy/deploy.sh
```

It pulls `main`, installs dependencies, builds the frontend, migrates and
rebuilds caches. It gives `www-data` (Apache's user) write access to
`storage/`, `bootstrap/cache/` and `database/`.

## Backups

Every night at 03:10 UTC the site saves `storage/backups/backup-<date>.tar.gz`,
containing a snapshot of the database (clients, invoices, messages, previews)
and the uploaded client demos. The last 14 days are kept.

- Back up right now: `php artisan backup:run`
- **Restore** (put the site in maintenance mode first with `php artisan down`):
  ```bash
  mkdir /tmp/restore && tar -xzf storage/backups/<file>.tar.gz -C /tmp/restore
  cp /tmp/restore/database.sqlite database/database.sqlite
  cp -r /tmp/restore/previews storage/app/private/
  php artisan up
  ```
- These backups live on the same box. Once you have real clients, also copy
  them somewhere else every so often, for example to your Mac:
  `scp timasi@sterango.com:APP/storage/backups/<file>.tar.gz ~/Downloads/`

## Monitoring & alerts

The site watches itself and emails you (once email is set up):

- **Errors:** if a page crashes (a 500 error), you get an email with what broke and where.
  The same error emails at most once an hour. 404s don't count.
- **Health:** every 5 minutes it checks the database, storage, disk space, backups and
  scheduler. You get one email when something starts failing and one when it recovers.
- **Health page:** `https://timasi.sterango.com/health` shows the same checks as JSON.

A server that is completely off can't email anyone (for example during a power
outage), so also add a free outside monitor:

1. Sign up at https://uptimerobot.com (free plan).
2. **Add New Monitor**, type **HTTP(s)**, URL `https://timasi.sterango.com/health`, every 5 minutes.
3. Add your email (and the phone app, if you want push alerts).

Alerts go to `ALERT_EMAIL` in `.env`, or your contact email if that's empty.

## Changing content

Edit `config/portfolio.php`, push, and deploy. If you changed resume content,
regenerate the PDF on your own machine first with `npm run resume:pdf` (needs
Playwright) and commit `public/resume.pdf`.

## Setting up a brand-new server

Only for a fresh **Debian 12** or **Ubuntu 22.04 / 24.04** server of your own
(for example a DigitalOcean droplet), **not** timasi-box. Log in as a normal
user with sudo, then:

```bash
curl -fsSLO https://raw.githubusercontent.com/timwerema/portfolio/main/deploy/setup-server.sh
DOMAIN=yourdomain.com CERTBOT_EMAIL=you@example.com RESEND_API_KEY=re_xxx bash setup-server.sh
```

It installs Nginx, PHP, Composer, Node.js, a firewall, HTTPS and the
scheduler, then builds and starts the site in `/var/www/portfolio`. It's safe
to re-run. Without `DOMAIN`, the site is served over plain HTTP at the
server's IP address.

## Encore Live (/live): Spotify + Ticketmaster keys

Both are free. You type the values into `.env` on the box yourself (never paste them in chat).

**Spotify (lets people connect their account):**
1. Go to developer.spotify.com/dashboard, log in, **Create app**.
2. Redirect URI: `https://timasi.sterango.com/live` (for local testing also add `http://127.0.0.1:8000/live`;
   Spotify does not accept `localhost`). Which API: **Web API**. Save.
3. Copy the **Client ID** (not the secret: the site doesn't need it).
4. Settings > **User Management**: add the Spotify email of everyone who should be able to connect
   (yours first). New apps stay in "development mode", which allows up to 25 listed users.
   Everyone else can still type artist names on the page.

**Ticketmaster (finds the shows):**
1. Register at developer.ticketmaster.com, open **My Apps**, copy the **Consumer Key**.

**On the box:**

```bash
cd ~/apps/portfolio && nano .env
```

Add these two lines with your values, save (Ctrl+O, Enter, Ctrl+X):

```
SPOTIFY_CLIENT_ID=your-client-id
TICKETMASTER_KEY=your-consumer-key
```

Then reload the settings:

```bash
php artisan config:cache
```
