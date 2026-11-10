import { site } from '../site';

/** Is this the one-file demo build? (set by `npm run demo`) */
export const DEMO = import.meta.env.PUBLIC_DEMO === '1';

/** Link to a page. In the one-file demo every page is a section of the homepage, so links become #anchors. */
export function href(page: string): string {
    if (page === 'tel') return `tel:${site.business.phone.replace(/[^\d+]/g, '')}`;
    if (page === 'book') return site.booking.url || href('contact');
    if (page === 'directions') return mapsUrl();
    if (page === 'home' || page === '') return DEMO ? '#top' : '/';
    return DEMO ? `#${page}` : `/${page}/`;
}

/** Google Maps search link for "Get directions" (no embedded map, so no tracking or extra loading). */
export function mapsUrl(): string {
    const b = site.business;
    const q = site.location.mapsQuery || [b.name, b.address.street, b.address.city, b.address.region].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** External links (booking, maps) open in a new tab. */
export const external = (url: string) => (/^https?:/.test(url) ? { target: '_blank', rel: 'noopener' } : {});

const FONTS = {
    classic: { display: "'Fraunces Variable', Georgia, serif", body: "'Inter Variable', system-ui, sans-serif" },
    bold: { display: "'Archivo Variable', Impact, sans-serif", body: "'Inter Variable', system-ui, sans-serif" },
    minimal: { display: "'Inter Variable', system-ui, sans-serif", body: "'Inter Variable', system-ui, sans-serif" },
};

/** CSS variables for the chosen colors, mode and style preset (set on <html>). */
export function themeVars(): string {
    const { brand, accent, mode, style } = site.theme;
    const dark = mode === 'dark';
    const vars: Record<string, string> = {
        '--brand': brand,
        '--accent': accent,
        '--paper': dark ? '#0f1216' : '#ffffff',
        '--surface': dark ? '#171b21' : '#f5f6f8',
        '--ink': dark ? '#eef1f5' : '#14171c',
        '--muted': dark ? '#a3acb9' : '#555d69',
        '--line': dark ? '#2a313b' : '#e1e4e9',
        '--radius': style === 'bold' ? '0px' : style === 'minimal' ? '14px' : '6px',
        '--font-display': FONTS[style].display,
        '--font-body': FONTS[style].body,
    };
    return Object.entries(vars)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
}

export const style = site.theme.style;
