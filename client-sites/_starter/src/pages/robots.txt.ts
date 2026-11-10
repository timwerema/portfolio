import { site } from '../site';

export function GET() {
    return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', site.url).toString()}\n`, {
        headers: { 'Content-Type': 'text/plain' },
    });
}
