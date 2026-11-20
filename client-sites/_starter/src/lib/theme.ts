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

/** Black or white, whichever is easier to read on the given colour (so a yellow brand gets dark button text). */
function readableOn(hex: string): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(full.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Contrast against white is (1.05)/(lum+0.05); against near-black it is (lum+0.05)/0.06.
    return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.06 ? '#ffffff' : '#111111';
}

/** CSS variables for the chosen colors, mode and style preset (set on <html>). */
export function themeVars(): string {
    const { brand, accent, mode, style } = site.theme;
    const dark = mode === 'dark';
    const vars: Record<string, string> = {
        '--brand': brand,
        '--accent': accent,
        '--on-brand': readableOn(brand),
        '--on-accent': readableOn(accent),
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

/** The pattern band under the hero (site.theme.pattern). */
export const pattern = site.theme.pattern;

export const style = site.theme.style;
