---
name: starter
description: Build a Starter package ($750) client website from the Astro baseline - demo homepage first, then the finished 5-page site. Use when Timasi types /starter, or asks for a "starter site" or "starter demo" for a client.
argument-hint: "<business name or pasted request> [finish]"
---

# /starter: Starter package website ($750)

Input: `$ARGUMENTS`. Usually a business name plus whatever Timasi knows (type, city, phone, colors),
or a pasted request from Dashboard > Messages. If it ends with **finish**, skip to "Finish the site".

Read first: `client-sites/PACKAGES.md` (the baseline and the look table) and `client-sites/README.md`.
The rules in `CLAUDE.md` apply: no fake reviews, awards or numbers; never commit secrets.

## Make the demo (target: same day)

1. **Collect the facts.** From the input, and if it names a business, from what Timasi pasted
   (their Google listing, old site or request). Need: name, business type, city/area, phone,
   services (with prices if known), hours. Anything missing stays as an obvious placeholder in
   `[brackets]`. Ask at most one short multiple-choice question, only if the business type is unclear.
2. **Pick the look** from the table in `PACKAGES.md`: `--type`, `--style`, `mode`, `brand` and `accent`.
   Say in one line which you picked and why.
3. **Create the folder:**
   ```bash
   npm run client:new -- "<Name>" --type <services|restaurant|studio> --style <classic|bold|minimal> --brand "<#hex>" --phone "<phone>" --package starter
   ```
4. **Fill `client-sites/<slug>/src/site.ts`:** replace every sample line (search for "Northline",
   "example.com", the sample services, menu, FAQ, steps and work). Write in plain, friendly English for
   their customers. Set `theme.mode` and `theme.accent`. Keep `testimonials` empty unless the client
   gave real quotes. Keep `home` and `nav` as the package set them (Starter = up to 3 pages, 1 revision round).
5. **Photos:** the client's own photos if Timasi provided them (resize to ~1600px wide, ~200 KB, into
   `public/images/`). Otherwise keep the placeholders and list the photos to ask for.
5b. **Design pass (do not skip).** The starter sections with the client's colors look like a template, and
   Timasi rejected a demo for that. Before building, load the `frontend-design:frontend-design` skill if it
   is available and give the home page a look that comes from the client's own world: their truck, sign,
   flyers, logo lettering, materials. Write a custom `src/pages/index.astro` for the client (own fonts via
   `@fontsource`, own layout) that still reads all text from `site.ts`. Keep it one clear idea, mobile first,
   no card grids. For the demo packer to keep the fonts, list the font families in `--font-display` /
   `--font-body` on `<html>`. Example: `client-sites/la-tacotrona` (chalkboard menu, taped photos, banner flags).
6. **Build and check:**
   ```bash
   cd client-sites/<slug> && npm run build && npm run demo
   ```
   Screenshot `demo/index.html` at desktop (1440 wide) and phone (390 wide) with Playwright and look at
   them: text fits, nothing sample-looking left, contrast fine in the chosen mode.
7. **Hand it over:** send Timasi `client-sites/<slug>/demo/index.html` with SendUserFile, plus a
   phone screenshot. Then the steps: Dashboard > Previews > New preview > upload the file > Send.
8. **Summary for Timasi** (short): the look, what is a placeholder, 3-5 questions to ask the client,
   and next: once approved, Dashboard > Invoices for the **$375 deposit (50%)**.

Do not commit the client folder unless Timasi asks (it holds client details).

## Finish the site (only after a signed agreement and the deposit)

1. Apply the client's comments from the preview page (Timasi pastes them).
2. Fill every page in `nav` (Services, About, Our work or Menu, Contact): real text and photos.
3. Contact form: ask Timasi for the form endpoint (Formspree or Web3Forms, created with the client's
   email). He pastes it into `form.action` himself if it is a secret-looking key.
4. `npm run build`, screenshot each page at both sizes, fix anything off.
5. Walk through `client-sites/_starter/CHECKLIST.md` and report each item as done or open.
6. Launch steps from `client-sites/README.md` → "Launch & handover" (own repo, Cloudflare Pages,
   domain, `url` in `site.ts`). Remind him of the final invoice ($375) and the optional care plan.
