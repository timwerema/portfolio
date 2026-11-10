/**
 * npm run demo
 *
 * Builds the homepage in "demo mode" (demo banner, noindex, links become #sections, form not live)
 * and packs it into ONE self-contained file: demo/index.html (styles, fonts and images inlined).
 * Upload that file in your dashboard: Previews > New preview > "Upload index.html", then send the link.
 */
import { build } from 'astro';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.demo-build');

process.env.PUBLIC_DEMO = '1';
rmSync(out, { recursive: true, force: true });
await build({ root, outDir: out, logLevel: 'warn' });

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.css': 'text/css', '.js': 'text/javascript' };

/** Turn a site path like /images/hero.jpg into a data: URI, or leave it alone if it is external or missing. */
function dataUri(path) {
    if (!path.startsWith('/') || path.startsWith('//')) return null;
    const file = join(out, decodeURIComponent(path.split(/[?#]/)[0]));
    if (!existsSync(file) || !statSync(file).isFile()) return null;
    const mime = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
    return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

let html = readFileSync(join(out, 'index.html'), 'utf8');

// Fonts: keep only the families this site actually uses, latin subset only (keeps the file small).
const usedFonts = (html.match(/--font-(?:display|body):([^;"]+)/g) ?? []).join(' ');
html = html.replace(/@font-face\{[^}]*\}/g, (block) => {
    const family = block.match(/font-family:\s*["']?([^;"']+)/)?.[1] ?? '';
    const latinOnly = /-latin-(?!ext)[^)]*\.woff2/.test(block);
    return usedFonts.includes(family) && latinOnly ? block : '';
});

// External stylesheets and scripts (if any) go inline.
html = html.replace(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (tag, href) => {
    const file = join(out, href);
    return existsSync(file) ? `<style>${readFileSync(file, 'utf8')}</style>` : tag;
});
html = html.replace(/<script([^>]*) src="([^"]+)"([^>]*)><\/script>/g, (tag, a, src, b) => {
    const file = join(out, src);
    return existsSync(file) ? `<script${a}${b}>${readFileSync(file, 'utf8')}</script>` : tag;
});

// Images and fonts referenced by path become data URIs.
html = html.replace(/url\((["']?)(\/[^)"']+)\1\)/g, (m, q, p) => {
    const uri = dataUri(p);
    return uri ? `url(${uri})` : m;
});
html = html.replace(/(src|href)="(\/[^"]+\.(?:svg|png|jpe?g|webp|avif|gif))"/gi, (m, attr, p) => {
    const uri = dataUri(p);
    return uri ? `${attr}="${uri}"` : m;
});

mkdirSync(join(root, 'demo'), { recursive: true });
const target = join(root, 'demo', 'index.html');
writeFileSync(target, html);
rmSync(out, { recursive: true, force: true });

const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`\nDemo ready: demo/index.html (${kb} KB)`);
if (kb > 5000) console.log('Warning: over 5 MB, the dashboard upload limit. Use smaller photos (compress to ~200 KB each).');
console.log('Upload it in your dashboard: Previews > New preview, then press Send.');
