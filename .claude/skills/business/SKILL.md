---
name: business
description: Build a Business package ($1,750) client website from the Astro baseline - richer demo homepage (pricing or menu, booking, location, FAQ), then the finished site with analytics, payment links and a how-to-update guide. Use when Timasi types /business, or asks for a "business site" or "business package" for a client.
argument-hint: "<business name or pasted request> [finish]"
---

# /business: Business package website ($1,750)

Input: `$ARGUMENTS`. A business name plus what Timasi knows, or a pasted request from
Dashboard > Messages. If it ends with **finish**, skip to "Finish the site".

Read first: `client-sites/PACKAGES.md` (baseline, look table) and `client-sites/README.md`.
`CLAUDE.md` rules apply: no fake reviews, awards or numbers; never commit or print secrets.

## Make the demo (target: 1-2 days)

1. **Collect the facts:** name, type, area, phone, hours, services and prices, plus the Business extras:
   booking tool they use (or would use), plans/packages or menu, address, FAQs customers really ask,
   any products to sell. Missing facts become `[bracketed]` placeholders. Ask at most one short
   multiple-choice question, only if the business type is unclear.
2. **Pick the look** from `PACKAGES.md`. For Business, go one step richer: real photos in the hero,
   `accent` used on the featured pricing plan, `announcement` set to something true and useful
   (e.g. "Now booking spring appointments") or left empty. Say which look you picked and why.
3. **Create the folder:**
   ```bash
   npm run client:new -- "<Name>" --type <services|restaurant|studio> --style <classic|bold|minimal> --brand "<#hex>" --phone "<phone>" --package business
   ```
4. **Fill `site.ts`:** replace all sample content, including `pricing` (their real plans or prices) or
   `menu`, `faq`, `location`, `steps`. `booking.url`: their real link if known, else empty (the button
   hides) and note it. `testimonials`: real quotes only, else empty.
5. **Photos:** the client's own (resize to ~1600px, ~200 KB, into `public/images/`), else placeholders
   plus a list of shots to ask for (storefront, team, 3-6 jobs or dishes).
5b. **Design pass (do not skip):** same as step 5b in the `/starter` skill: a custom home page drawn from the
   client's own look, never the plain template.
6. **Build and check:** `cd client-sites/<slug> && npm run build && npm run demo`. Screenshot the demo
   at 1440 and 390 wide with Playwright, look at every section, fix anything that looks unfinished.
7. **Hand it over:** SendUserFile `demo/index.html` plus a phone screenshot; upload steps
   (Dashboard > Previews > New preview > upload > Send).
8. **Summary:** the look, placeholders, questions for the client, and next: **$875 deposit (50%)**
   via Dashboard > Invoices once approved.

Do not commit the client folder unless Timasi asks.

## Finish the site (after approval and deposit)

1. Apply the preview comments Timasi pastes.
2. Fill every page in `nav`; add pages for main services or locations if it helps (max 10 total).
3. **Booking:** set `booking.url`, click through it once in a screenshot run.
4. **Store (if any):** up to ~10 products as Square or Stripe payment links on Services or Pricing.
   Timasi or the client creates the links in their own account; never handle card details.
5. **Analytics:** the client (or Timasi) adds the site in Cloudflare > Web Analytics and pastes the
   token into `analytics.cloudflareToken`.
6. **Form:** endpoint in `form.action` (Timasi pastes it).
7. **Write `client-sites/<slug>/HOW-TO-UPDATE.md`:** one page for the client: what to send Timasi for
   changes, what the care plan covers, how to see visitor stats.
8. Build, screenshot every page at both sizes, run `_starter/CHECKLIST.md`, then the launch steps in
   `client-sites/README.md`. Remind him: final invoice ($875) and the care plan.
