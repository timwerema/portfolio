// Generates the link-preview image and icons in the Hardwood style:
//   public/og-image.png (1200x630), public/favicon.svg, public/favicon.ico,
//   public/apple-touch-icon.png (180x180)
// Usage: npm run brand:assets   (re-run after changing your name/role/tagline)
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try {
    playwright = require('playwright');
} catch {
    playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const root = process.cwd();
// The "Ball seams" logo (public/logo-mark.svg) is the source for every icon and the preview card.
const mark = readFileSync(path.join(root, 'public/logo-mark.svg'), 'utf8');
const markUri = 'data:image/svg+xml;base64,' + Buffer.from(mark).toString('base64');
// Fonts are inlined as data URIs: pages created with setContent() can't load file:// fonts.
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(path.join(root, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;

// Pull name/role/tagline/stats from the Laravel config so the card stays in sync.
const p = JSON.parse(execSync(`php artisan tinker --execute="echo json_encode(config('portfolio'));"`, { cwd: root }).toString());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const css = `
@font-face { font-family: Anton; src: url(${font('anton', 'anton-latin-400-normal.woff2')}); }
@font-face { font-family: Barlow; font-weight: 500; src: url(${font('barlow', 'barlow-latin-500-normal.woff2')}); }
@font-face { font-family: Barlow; font-weight: 600; src: url(${font('barlow', 'barlow-latin-600-normal.woff2')}); }
@font-face { font-family: 'Barlow Condensed'; font-weight: 700; src: url(${font('barlow-condensed', 'barlow-condensed-latin-700-normal.woff2')}); }
@font-face { font-family: LED; src: url(${font('share-tech-mono', 'share-tech-mono-latin-400-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
`;

const og = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
@font-face { font-family: 'Inter Tight'; src: url(${font('../@fontsource-variable/inter-tight', 'inter-tight-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: Mono; src: url(${font('../@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}); font-weight: 100 800; }
body { width: 1200px; height: 630px; background: #0a0908; color: #ece6d8; font-family: 'Inter Tight'; position: relative; overflow: hidden; }
.wrap { position: absolute; inset: 0; padding: 60px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.top, .bot { display: flex; justify-content: space-between; align-items: center; font: 500 13px Mono; letter-spacing: .14em; text-transform: uppercase; color: #8a8478; }
.top b { color: #86b6f0; font-weight: 500; }
.brand { display: flex; align-items: center; gap: 14px; color: #ece6d8; }
.dot { width: 44px; height: 44px; background: url(${markUri}) center/contain no-repeat; }
h1 { font-size: 92px; line-height: 1.02; letter-spacing: -.03em; font-weight: 500; margin: 0; }
h1 span { color: #8a8478; }
.tag { margin-top: 26px; max-width: 760px; font-size: 24px; color: #b9b2a3; }
.rule { position: absolute; left: 72px; right: 72px; top: 118px; height: 1px; background: #26231f; }
</style></head><body>
<div class="rule"></div>
<div class="wrap">
  <div class="top"><div class="brand"><div class="dot"></div><span>${esc(p.name)}</span></div><span><b>FIG. 01 /</b> ${esc(p.role)} · Dallas, TX</span></div>
  <div><h1>Built to win<br><span>your next customer.</span></h1><p class="tag">Websites, software &amp; AI task bots for businesses. Every website starts with a free demo homepage.</p></div>
  <div class="bot"><span>timasi.sterango.com</span><span>${(p.stats || []).slice(0, 3).map((s) => `${esc(s.value)} ${esc(s.label)}`).join('   ·   ')}</span></div>
</div>
</body></html>`;

// Apple touch icon: square navy tile with the mark; small icons: the round mark itself.
const icon = (size) => `<!doctype html><html><head><meta charset="utf-8"><style>* { margin: 0 } body{width:${size}px;height:${size}px;background:${size >= 180 ? '#0a0908' : 'transparent'};display:flex;align-items:center;justify-content:center}
img{width:${size >= 180 ? Math.round(size * 0.82) : size}px;height:auto}</style></head><body><img src="${markUri}"></body></html>`;

const browser = await playwright.chromium.launch();
const shoot = async (html, w, h, out, transparent = false) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out, omitBackground: transparent });
    await page.close();
};

await shoot(og, 1200, 630, 'public/og-image.png');
await shoot(icon(180), 180, 180, 'public/apple-touch-icon.png');
await shoot(icon(32), 32, 32, 'public/favicon-32.png', true);
await shoot(icon(16), 16, 16, 'public/favicon-16.png', true);
await browser.close();

writeFileSync('public/favicon.svg', mark);
try {
    execSync('convert public/favicon-16.png public/favicon-32.png public/favicon.ico');
} catch {
    console.warn('ImageMagick not found: kept the existing favicon.ico');
}
rmSync('public/favicon-16.png');
rmSync('public/favicon-32.png');
console.log('Wrote og-image.png, apple-touch-icon.png, favicon.svg, favicon.ico');
