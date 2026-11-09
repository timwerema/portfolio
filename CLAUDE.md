# CLAUDE.md

Context for Claude sessions working on this repository. Read this first.

## Who and what

- **Owner:** Timasi Werema (GitHub `timwerema`), a CS student at UT Dallas, building a
  web design and software business on the side. Explain things plainly; when asking him
  to choose, give short multiple-choice options.
- **This repo:** his portfolio **and** the business back office in one Laravel app:
  public portfolio, service pages, resume, demo sites for fictional clients, plus an
  admin dashboard (clients, projects, invoices, expenses, client demo approvals).
- **Live:** https://timasi.sterango.com, running on **timasi-box**, a Docker container
  on his friend Collin's Sterango server. The live app folder is **`~/apps/portfolio`**
  (Apache serves its `public/`). Run `php artisan` from there. See `DEPLOY.md`.
- **Business model:** packages Starter $750 / Business $1,750 / Custom $3,500+, optional
  care plan $79-$149/month. Services: Websites, Software, Growth, AI Agents (task bots).
  Clients may pay with Square, Stripe or PayPal (invoices take any payment link).

## Rules

- **Never touch the firewall or networking on timasi-box.** It's Collin's network;
  he handles HTTPS and traffic. **Don't run `deploy/setup-server.sh` on the box.** It
  is only for a brand-new server of Timasi's own.
- **Never commit or print secrets** (`.env`, API keys, passwords). Timasi types keys
  into `.env` himself.
- **Before pushing,** run `vendor/bin/pint && npm run format && npm run lint`, then
  `npx tsc --noEmit` and `php artisan test`. GitHub Actions runs tests on PHP 8.2 and 8.4
  plus a check-only linter; keep both green.
- Composer is pinned to `platform.php = 8.2` so the lock file installs on 8.2+.
  Keep it that way.
- Public pages and demos are **dark by default** and switch to their light look only when
  the visitor's device is in light mode (`prefers-color-scheme: light`). Hardwood tokens
  live in `resources/css/app.css`; use `border-rule`, `text-strong` and `text-on-navy`
  (not `border-navy`/`text-navy`/`text-maple-light`) so both modes work. Light demos keep
  colours as CSS variables in a `THEME` string on `:root:has(.<demo>)`.
- Public pages must not use AI-looking repeated card grids. Timasi dislikes them.
  Prefer rows, lists, tables and editorial layouts.
- Demo sites are for **fictional** businesses: label them as demos, keep them `noindex`,
  never use fake reviews, and simulate (never collect) passwords or card details.
  Don't copy real clients' code, photos or branding.
- Commit as `Timasi Werema`. Push to `main` only when Timasi asks or has already
  asked for that kind of change.

## Stack

Laravel 12 · Inertia v2 · React 19 + TypeScript · Tailwind v4 · shadcn/ui (admin) ·
SQLite · Vite. Fonts are bundled with `@fontsource` (no external font CDNs).

## Where things live

| What | Where |
|---|---|
| **All portfolio content** (bio, services, packages, projects, experience, demos, alert/reminder settings) | `config/portfolio.php` (edit content here, not in React) |
| Public pages | `resources/js/pages/portfolio.tsx`, `service.tsx`, `resume.tsx` |
| Public layout and theme ("Hardwood": maple, navy, royal blue) | `resources/js/components/site-layout.tsx`, theme tokens at the bottom of `resources/css/app.css` |
| Demo sites | `resources/js/pages/demos/*.tsx`, routes in `routes/web.php`, listed in `config/portfolio.php` → `demos` |
| Admin dashboard (`/dashboard`, login required) | `resources/js/pages/admin/**`, controllers in `app/Http/Controllers/Admin/` |
| Client demo approvals (`/p/{token}`) | `PreviewReviewController`, `resources/js/pages/previews/*`. Uploaded HTML is served sandboxed. |
| Client invoice page (`/i/{token}`) | `PublicInvoiceController`, `resources/js/pages/invoices/public.tsx` |
| Server-rendered SEO and link previews | `app/Support/Seo.php`, `resources/views/app.blade.php` |
| Client emails (friendly failure messages) | `app/Support/ClientMail.php` |
| Health checks and alert emails | `app/Support/HealthChecks.php`, `app/Support/Alerts.php`, `GET /health` |
| Scheduled jobs | `routes/console.php` (times are **UTC**, the box's clock) |
| Routes | `routes/web.php` |
| Tests | `tests/Feature/*` (PHPUnit) |

## Commands

```bash
php artisan test                      # all tests
php artisan serve                     # local dev server (plus `npm run dev` for hot reload)
npm run build                         # build frontend
php artisan user:create               # create an admin login (public sign-up is disabled)
php artisan backup:run                # back up DB + uploaded demos to storage/backups
php artisan health:check              # run health checks (alerts on change)
php artisan invoices:remind --dry-run # see which overdue invoices would get reminders
php artisan business:weekly-summary --show
npm run resume:pdf                    # regenerate public/resume.pdf (needs the site running + Playwright)
npm run brand:assets                  # regenerate og-image.png and favicons from config
```

## Scheduler (needs one cron line on the server; see DEPLOY.md)

| Job | When (UTC) |
|---|---|
| `backup:run` (keeps 14 days) | daily 03:10 |
| `health:check` (heartbeat + alert on change) | every 5 min |
| `invoices:remind` (3 days after due, then weekly, max 3) | daily 09:20 |
| `business:weekly-summary` | Mondays 07:40 |

## Deploying an update

On timasi-box:

```bash
cd ~/apps/portfolio && deploy/deploy.sh
```

It pulls `main`, installs, builds, migrates and rebuilds caches. Then check
`https://timasi.sterango.com/health`.

## Open items (as of Nov 2026)

- Email: **Resend connected** (Nov 2026) with the test sender `onboarding@resend.dev`,
  which only delivers to timasiwerema@gmail.com. Contact-form messages, alerts and the
  weekly summary work. Client emails (invoices, demo links, reminders) are refused until
  a domain is verified in Resend; the dashboard shows a friendly message
  (`app/Support/ClientMail.php`).
- UptimeRobot monitor on `/health` not set up yet.
- Own domain not bought yet (GitHub Student Developer Pack may include one).
- Demos built: Clearcoat (detailing, PPF & wraps), 4th Quarter (gym), Galacticals v3
  (club concept), LATESHIFT (streetwear store), StudyLoop (slides-to-learning),
  Encore (concert finder). Ideas queued: sports stats.
- "Look official" pages live in code: `/start` project questionnaire
  (`ProjectRequestController`, saved as a message with `source = start`), `/privacy`,
  `/terms` (`resources/js/pages/legal.tsx`). Needs a deploy to reach the box.
