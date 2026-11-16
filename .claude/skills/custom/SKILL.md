---
name: custom
description: Start a Custom package ($3,500+) software project - paid planning-phase scope, a proposal message, then a clickable single-file prototype for client approval, then the build plan. Use when Timasi types /custom, or asks to scope or prototype a web app, portal, dashboard, integration or AI task bot for a client.
argument-hint: "<client + what they want, or pasted request> [prototype|build]"
---

# /custom: Custom software project ($3,500+)

Input: `$ARGUMENTS`. The client and what they asked for (often a pasted LinkedIn message or
Dashboard > Messages request). A trailing **prototype** or **build** jumps to that stage.

Read first: `client-sites/PACKAGES.md` → "Custom". `CLAUDE.md` rules apply: never collect real
passwords or card details, never commit secrets, no fake reviews or numbers.

## Stage 1: Scope (planning phase, ~$300-$500, credited to the build)

1. **Size it honestly.** In 3-5 bullets: what is easy, what is hard, what existing tools could do
   instead (a Shopify app, Square, Zapier, a Starter or Business site). If an off-the-shelf tool covers
   most of it, say so: a smaller honest job beats a big risky one.
2. **Write `client-sites/<slug>/SCOPE.md`** (folder name from the client name, lowercase-hyphenated):
   - The problem, in the client's words
   - Who uses it (roles) and the 3-5 key tasks each does
   - Must have now / later
   - Integrations and accounts the client must provide (APIs, payment, email)
   - Data and privacy: what personal data, who can see it, backups
   - Milestones (each shippable), rough timeline, price range, care plan
   - Open questions
3. **Draft the reply** Timasi can paste to the client: a short summary, the planning-phase price,
   and 3-5 questions. Plain English, no jargon.
4. Tell Timasi: add the client and a project in the dashboard; invoice the planning phase up front.

## Stage 2: Clickable prototype (after the planning phase is paid)

1. Build **one self-contained file**, `client-sites/<slug>/prototype/index.html`: inline CSS and JS,
   no outside scripts, fonts or images (system fonts are fine), sample data that is clearly fake,
   a visible "Prototype" label, and simulated logins/payments that never collect anything real.
2. Show the 3-5 key tasks from `SCOPE.md` end to end with clicks (screens switch, lists filter,
   forms validate). Design: clean and calm, rows and tables over card grids, works on a phone.
3. Screenshot it at 1440 and 390 wide with Playwright and check every screen.
4. SendUserFile the file; upload steps: Dashboard > Previews > New preview > upload > Send.

## Stage 3: Build plan (after prototype approval)

1. **Stack:** default Laravel 12 + Inertia + React + TypeScript + Tailwind, SQLite to start (same as
   this portfolio, so Timasi knows it). Content-heavy with a little data: Astro + Supabase.
2. **New repo** for the client (e.g. `timwerema/<slug>`); ask before creating anything on GitHub.
3. Turn the milestones into a checklist with tests for anything that touches money, logins or data.
4. Invoice per milestone (50% to start each). Remind him about the care plan for hosting and upkeep.
