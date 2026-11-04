# Deploying the portfolio

Works on **Debian 12** or **Ubuntu 22.04 / 24.04**. That covers both the
Sterango VM (Debian 12) and a DigitalOcean droplet.

## 1. Get a server you have `sudo` on

- **DigitalOcean:** create a Droplet with Ubuntu 24.04 and the cheapest Basic
  plan, and add your SSH key (`~/.ssh/id_ed25519.pub`) during setup. Log in as
  `root` once and create a normal user:
  ```bash
  adduser timasi && usermod -aG sudo timasi && rsync -a ~/.ssh /home/timasi/ && chown -R timasi: /home/timasi/.ssh
  ```
  Then log in as that user: `ssh timasi@YOUR_DROPLET_IP`
- **Sterango VM:** run `sudo -v`. If it says you're not in sudoers, ask
  Sterango for sudo, or use DigitalOcean instead. Also ask them how web
  traffic (ports 80/443) reaches your VM. Run the script with
  `SKIP_FIREWALL=1` so it doesn't change their network setup.

## 2. Point your domain at the server

At your domain registrar (Namecheap, Cloudflare, etc.) add two **A records**:

| Type | Name  | Value            |
|------|-------|------------------|
| A    | `@`   | your server's IP |
| A    | `www` | your server's IP |

DNS can take a few minutes to an hour to update. Check it with `dig +short yourdomain.com`.

## 3. Get a Resend API key (for contact-form emails)

1. Sign up at https://resend.com **using the email you want enquiries sent to**.
2. API Keys, then Create API Key (Sending access), and copy the `re_...` key.
3. Later: Domains, then Add Domain, and add the DNS records Resend shows you. Then set
   `MAIL_FROM_ADDRESS="hello@yourdomain.com"` in `/var/www/portfolio/.env` and
   run `php artisan optimize`.

## 4. Run the setup script on the server

```bash
curl -fsSLO https://raw.githubusercontent.com/timwerema/portfolio/main/deploy/setup-server.sh
DOMAIN=yourdomain.com CERTBOT_EMAIL=you@example.com RESEND_API_KEY=re_xxx bash setup-server.sh
```

It installs Nginx, PHP, Composer, Node.js, a firewall and a free HTTPS
certificate, then builds and starts the site. It is safe to re-run, for
example after DNS finishes updating.

No domain yet? Leave out `DOMAIN` and `CERTBOT_EMAIL`. The site is then served
over plain HTTP at the server's IP address.

## 5. Create your admin login

```bash
cd /var/www/portfolio && php artisan user:create
```

Then visit `https://yourdomain.com/login` to read contact messages.

## Backups

Every night at 3:10am the site saves `storage/backups/backup-<date>.tar.gz`,
containing a snapshot of the database (clients, invoices, messages, previews)
and the uploaded client demos. The last 14 days are kept.

- Back up right now: `php artisan backup:run`
- The setup script installs the scheduler for you. If you set things up by hand, add this
  with `crontab -e`:
  ```
  * * * * * cd /var/www/portfolio && php artisan schedule:run >> /dev/null 2>&1
  ```
- **Restore** (put the site in maintenance mode first with `php artisan down`):
  ```bash
  mkdir /tmp/restore && tar -xzf storage/backups/<file>.tar.gz -C /tmp/restore
  cp /tmp/restore/database.sqlite database/database.sqlite
  cp -r /tmp/restore/previews storage/app/private/
  php artisan up
  ```
- These backups live on the same server. Once you have real clients, also copy them
  somewhere else every so often, for example download one to your Mac:
  `scp timasi@sterango.com:/var/www/portfolio/storage/backups/<file>.tar.gz ~/Downloads/`

## Updating the site later

Push changes to GitHub, then on the server:

```bash
/var/www/portfolio/deploy/deploy.sh
```

## Changing content

Edit `config/portfolio.php`, push, and deploy. If you changed resume content,
regenerate the PDF on your own machine first with `npm run resume:pdf` (needs
Playwright) and commit `public/resume.pdf`.
