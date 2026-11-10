# Launch checklist

Go through this before a site goes live.

## Content
- [ ] Every placeholder replaced: name, phone, email, hours, address, service area
- [ ] Real photos (no "replace with a real photo" images left), each compressed under ~300 KB
- [ ] Prices and services confirmed by the client in writing
- [ ] No made-up reviews, awards or numbers; testimonials are real and approved
- [ ] Spelling checked; phone number and email tested by tapping them

## Setup
- [ ] `url` in `src/site.ts` and `site` in `astro.config.mjs` set to the real domain
- [ ] Contact form connected (`form.action`) and a test message received by the client
- [ ] Domain connected in Cloudflare Pages, HTTPS working
- [ ] Unused pages removed from `nav`

## Google
- [ ] Site added to Google Search Console, `sitemap.xml` submitted
- [ ] Google Business Profile links to the new site
- [ ] Page titles and descriptions read well (check the link preview by texting yourself the URL)

## Quality
- [ ] Checked on a phone and a laptop, light and dark
- [ ] PageSpeed Insights (pagespeed.web.dev) mobile score 90+
- [ ] Every button and menu link works; 404 page shows for a wrong address

## Handover
- [ ] Client knows how to request changes (care plan) or has repo access
- [ ] Final invoice sent; project marked launched in the dashboard
