# Package baselines

What each package includes, how it looks, and what "done" means. The `/starter`, `/business` and
`/custom` shortcuts (Claude skills in `.claude/skills/`) follow this file, so change a baseline
here and the shortcut changes with it. Prices match `config/portfolio.php` → `packages`.

## At a glance

| | Starter · $750 | Business · $1,750 | Custom · $3,500+ |
|---|---|---|---|
| **Built with** | Astro starter (`_starter/`) | Astro starter (`_starter/`) | Web app (see Custom below) |
| **Pages** | Up to 5 (Home + 4) | Up to 10 | Scoped together |
| **Homepage** | The type's core sections | Core + pricing/menu, location, FAQ, testimonials | Clickable prototype first |
| **Booking / store** | Booking link only if they already have one | Booking button; small store via Square or Stripe payment links | Real accounts, payments, data |
| **Analytics** | No | Cloudflare Web Analytics | Built in |
| **Content updates** | Through the care plan | Through the care plan, plus a short "how to change" guide | Admin screens |
| **Demo turnaround** | Same or next day | 1-2 days | Prototype in about a week, after a paid planning phase |
| **Build time after approval** | About 1 week | 2-3 weeks | Milestones, usually 4-8 weeks |
| **Revision rounds** | 1 on the demo, 1 before launch | 2 on the demo, 1 before launch | One per milestone |
| **Deposit** | 50% | 50% | Planning phase paid up front, then 50% per milestone plan |

Care plan ($79-$149/month) is optional for all three: hosting, updates, backups, small changes.

## The look (pick by business type)

| Business | Type | Style preset | Mode |
|---|---|---|---|
| Trades, cleaners, lawn care, movers, auto | `services` | `bold` | `light` (dark for auto/detailing) |
| Restaurants, cafes, food trucks | `restaurant` | `classic` | `light` (dark for bars and late-night spots) |
| Salons, barbers, spas, clinics, gyms | `studio` | `minimal` (gyms: `bold`, `dark`) | `light` |
| Law, accounting, real estate, consultants | `services` | `classic` | `light` |

Colors: `brand` from their logo (main buttons), `accent` a second logo color or a warm highlight.
If they have no logo, use a deep color that suits the trade (green for lawn, navy for trades,
warm red for food) and say so in the summary.

## Starter · $750: "a polished site that brings in calls"

- **Homepage sections** (set by `--package starter`):
  - services: hero, services, how it works, about, recent work, contact
  - restaurant: hero, menu, about, location & hours, contact
  - studio: hero, services, about, location & hours, contact
- **Pages:** Home + up to 4 from `nav` (Services, About, Our work / Menu, Contact).
- **Always:** tap-to-call bar, hours and service area in the footer, SEO titles, Google business
  info, sitemap, contact form (connected at launch), scroll motion on.
- **Not included:** pricing tables, announcement bar, analytics, extra pages. Those are Business.
- **Done means:** the 5 pages filled with the client's real details and photos, form connected,
  domain live, `_starter/CHECKLIST.md` passed.

## Business · $1,750: "the site runs part of the business"

Everything in Starter, plus:

- **Homepage sections** (set by `--package business`):
  - services: hero, services, how it works, pricing, about, recent work, testimonials, FAQ, location, contact
  - restaurant: hero, menu, about, recent work, testimonials, FAQ, location, contact
  - studio: hero, pricing, services, about, recent work, testimonials, FAQ, location, contact
- **Booking button:** their Calendly / Square Appointments / Booksy / OpenTable link in `booking.url`.
- **Small store:** up to ~10 products as Square or Stripe payment links on the Services or
  Pricing page. Anything bigger is Custom.
- **Analytics:** Cloudflare Web Analytics token in `analytics.cloudflareToken` (free, no cookie banner).
- **Announcement bar** set up for holiday hours or specials.
- **Up to 10 pages:** add pages for each main service or location when it helps Google.
- **Hand-off guide:** a short `HOW-TO-UPDATE.md` in their folder (what to send you, what changes are covered).
- **Done means:** all of Starter's, plus booking tested, analytics showing visits, payment links tested.

## Custom · $3,500+: "software shaped around how they work"

Web apps, client portals, dashboards, integrations, AI task bots. Not the Astro starter.

1. **Planning phase (paid, ~$300-$500, credited to the build):** a one-page `SCOPE.md`: the problem,
   who uses it, must-have vs later features, integrations, data and privacy, milestones, price range.
2. **Clickable prototype:** one self-contained `prototype/index.html` (no outside scripts or fonts,
   fake sample data, a visible "Prototype" label) uploaded to Dashboard > Previews for approval.
3. **Build:** its own repo. Default stack, the same as this portfolio: Laravel + Inertia + React +
   TypeScript + Tailwind, SQLite to start. Use Astro + a form or Supabase only for content-heavy
   sites that need a little data.
4. **Milestones:** each one shippable and invoiced. Tests for anything that touches money or data.
- **Never:** collect real passwords or card numbers in a prototype; store client data without a
  plan for backups and access; take on store integrations (Amazon, Walmart...) without the
  planning phase.
