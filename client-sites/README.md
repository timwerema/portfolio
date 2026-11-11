# Client sites

Every website you sell starts as a copy of **`_starter/`** (the baseline). Each client gets
their own folder here (`client-sites/<business-name>/`) until it launches; then it moves to its
own GitHub repo so the client can own it (see "Launch & handover").

## What the baseline includes

Built with **Astro** (plain, fast HTML pages; free to host; great for Google) and Tailwind.

| Part | What you get |
|---|---|
| **One content file** | `src/site.ts`: business name, phone, hours, service area, services and prices, about, photos, FAQ, colors, style. Edit it and every page updates. |
| **Pages** | Home, Services, About, Our work, Contact (the Starter package's 5), plus Pricing and Menu when needed, and a 404 page. Pick which ones show in `nav` in `site.ts`. |
| **Homepage builder** | `home` in `site.ts` lists the homepage sections in order: `hero`, `services`, `pricing`, `menu`, `steps`, `about`, `work`, `testimonials`, `faq`, `location`, `contact`. |
| **Business types** | `--type services` (trades, cleaners, lawn care), `restaurant` (menu, location, "Reserve a table"), `studio` (salons, gyms, clinics: pricing table, "Book now"). |
| **Booking button** | Paste a Calendly / Square Appointments / Booksy / OpenTable link in `booking.url`: a Book button appears in the header, hero and phone bar. |
| **Pricing table** | Plans with price, features and a "Most popular" highlight (`pricing` in `site.ts`). |
| **Menu** | Sections, prices, dotted leaders, diet tags (V, VG, GF, S) with a key, jump links (`menu` in `site.ts`). |
| **Location** | Address, hours table, "Get directions" (opens Google Maps, no embedded map). |
| **Scroll movement** | Sections fade and slide in, headings rise into view, the `bold` hero photo drifts. `motion: true` in `theme`; automatically off for visitors who ask for reduced motion. |
| **Announcement bar** | One line at the top for holiday hours, specials or "Now hiring" (`announcement`). |
| **3 style presets** | `classic` (serif headings, photo beside the text), `bold` (big uppercase over a full photo), `minimal` (clean and centered). Plus `mode: 'light' \| 'dark'` and two brand colors. |
| **Sections** | Hero, services and prices list, how it works, about, recent work photos, real testimonials (hidden when empty), FAQ, contact form. |
| **Built for local businesses** | Tap-to-call bar on phones, hours and service area in the footer, click-to-call everywhere. |
| **SEO** | Titles and descriptions per page, link previews, Google business info (LocalBusiness), `sitemap.xml`, `robots.txt`. |
| **Contact form** | Works with any form service (Formspree, Web3Forms...). Until connected, it says so politely and sends nothing. |
| **Fast & accessible** | Fonts bundled (no outside font services), keyboard focus styles, skip link, works without JavaScript. |
| **One-file demo** | `npm run demo` packs the homepage into `demo/index.html` (styles, fonts, photos included) with a "Demo" banner, ready to upload to your dashboard. |

## Quick-turnaround demo: request to approval in a day

1. **Request comes in.** The client fills out *Start a project* (`/start`). It lands in
   Dashboard > Messages. Click **Add as client**.
2. **Make the folder** (on your computer, or ask Claude to do steps 2-4):
   ```bash
   npm run client:new -- "Lone Star Lawn Care" --style bold --brand "#2e7d32" --phone "(972) 555-0100"
   npm run client:new -- "Casa Verde Tacos" --type restaurant
   npm run client:new -- "Glow Nail Studio" --type studio --style minimal
   ```
   The sample text is for a home-repair company: replace it all in `site.ts`.
3. **Fill in `src/site.ts`** from their request and their current website or Google listing:
   name, services and prices, hours, area, colors from their logo. Put 3-5 of their photos
   in `public/images/` (compress to ~200 KB each, e.g. squoosh.app). Preview live with `npm run dev`.
4. **Build the demo:** `npm run demo` → `demo/index.html`.
5. **Send it:** Dashboard > Previews > New preview > upload `demo/index.html` > **Send**.
   The client opens their private link, leaves comments, and approves.
6. **Changes?** Edit `site.ts`, `npm run demo` again, upload as a new version. Same link.
7. **Approved:** send the deposit invoice (Dashboard > Invoices), then finish the other pages.

**From your phone:** start a Claude session on this repo and say, for example,
*"Make a demo for the Lone Star Lawn Care request: bold style, green, use their services from the message."*
Claude creates the folder, fills `site.ts`, builds the demo and sends you the file to upload.

Tips for speed:
- Pick the preset that matches the business: trades and gyms → `bold`, salons and clinics → `minimal`, law, real estate and restaurants → `classic`.
- Use the client's real photos from their Google listing or social pages (with permission). Placeholders are fine for a first demo.
- Never invent reviews, awards or numbers. Leave `testimonials` empty unless the client gives you real quotes.

## Launch & handover

1. Copy the folder into its own GitHub repo (e.g. `timwerema/site-lone-star-lawn`).
2. Connect the repo to **Cloudflare Pages** (free): build command `npm run build`, output folder `dist`.
3. Add the client's domain in Cloudflare Pages and update `url` in `site.ts` and `site` in `astro.config.mjs`.
4. Connect the form (`form.action` in `site.ts`) and send a test message.
5. Run the checklist in `_starter/CHECKLIST.md`.
6. Care plan clients: you keep the repo and make updates. Otherwise, transfer the repo to the client after the final payment.

## Updating the baseline

Improve `_starter/` when you find something every client needs. Existing client folders don't
change automatically, so copy improvements over by hand if a client needs them.
