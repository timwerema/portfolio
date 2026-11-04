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
body { width: 1200px; height: 630px; background: #f1e4cc; color: #17130e; font-family: Barlow; position: relative; overflow: hidden; }
.court { position: absolute; right: -160px; top: -10px; width: 760px; height: 650px; opacity: .45; }
.wrap { position: absolute; inset: 0; padding: 64px 72px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 16px; }
.dot { width: 64px; height: 64px; border-radius: 50%; background: #0b5fcf; color: #fff; font: 30px Anton; display: flex; align-items: center; justify-content: center; }
.name { font: 700 30px 'Barlow Condensed'; letter-spacing: .06em; text-transform: uppercase; }
h1 { margin-top: 44px; font: 108px/0.92 Anton; text-transform: uppercase; }
h1 span { color: #0b5fcf; }
.tag { margin-top: 24px; max-width: 760px; font-size: 26px; color: #3d3328; font-weight: 500; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 92px; background: #0b2545; display: flex; align-items: center; gap: 56px; padding: 0 72px; color: #f1e4cc; }
.stat b { font: 40px LED; color: #6cb8ff; margin-right: 10px; }
.stat { font: 700 20px 'Barlow Condensed'; letter-spacing: .1em; text-transform: uppercase; color: #c4ccd3; display: flex; align-items: baseline; }
</style></head><body>
<svg class="court" viewBox="0 0 600 600"><g fill="none" stroke="#0b2545" stroke-width="3"><rect x="200" y="160" width="400" height="280"/><circle cx="200" cy="300" r="90"/><path d="M 600 40 L 520 40 A 260 260 0 0 0 520 560 L 600 560"/><circle cx="540" cy="300" r="14"/></g></svg>
<div class="wrap">
  <div class="brand"><div class="dot">TW</div><div class="name">${esc(p.name)} · ${esc(p.role)}</div></div>
  <h1>Built to win your<br><span>next customer.</span></h1>
  <p class="tag">Custom websites &amp; software for businesses · Dallas, TX</p>
</div>
<div class="bar">${(p.stats || []).slice(0, 3).map((s) => `<div class="stat"><b>${esc(s.value)}</b>${esc(s.label)}</div>`).join('')}</div>
</body></html>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#0b5fcf"/><text x="32" y="43" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="30" fill="#fff">TW</text></svg>`;
const icon = (size) => `<!doctype html><html><head><meta charset="utf-8"><style>${css} body{width:${size}px;height:${size}px;background:transparent}
.i{width:${size}px;height:${size}px;border-radius:${size >= 180 ? 0 : '50%'};background:${size >= 180 ? '#0b2545' : '#0b5fcf'};color:#fff;font:${Math.round(size * 0.47)}px Anton;display:flex;align-items:center;justify-content:center}</style></head><body><div class="i">TW</div></body></html>`;

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

writeFileSync('public/favicon.svg', iconSvg);
try {
    execSync('convert public/favicon-16.png public/favicon-32.png public/favicon.ico');
} catch {
    console.warn('ImageMagick not found: kept the existing favicon.ico');
}
rmSync('public/favicon-16.png');
rmSync('public/favicon-32.png');
console.log('Wrote og-image.png, apple-touch-icon.png, favicon.svg, favicon.ico');
