import { site } from '../site';

export function GET() {
    const pages = ['', ...site.nav.map((n) => `${n.page}/`)];
    const urls = pages.map((p) => `<url><loc>${new URL(p, site.url).toString()}</loc></url>`).join('');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
        headers: { 'Content-Type': 'application/xml' },
    });
}
