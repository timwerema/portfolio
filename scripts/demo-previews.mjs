// Screenshots every demo listed on the homepage into public/images/previews/<name>.jpg,
// used for the hover preview in the "Demo sites" list.
// Usage: start the app (php artisan serve), then: npm run demo:previews
// Override the site with SITE_URL=http://host:port
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try {
    playwright = require('playwright');
} catch {
    playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const { chromium } = playwright;

const site = (process.env.SITE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const out = path.join(import.meta.dirname, '..', 'public', 'images', 'previews');
mkdirSync(out, { recursive: true });

// The homepage's Inertia data lists the demos.
const html = await (await fetch(site + '/')).text();
const json = html.match(/data-page="([^"]+)"/)?.[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const demos = JSON.parse(json).props.portfolio.demos;

const browser = await chromium.launch();
// Half-scale screenshot of a 1280x800 window = a light 640x400 image.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'dark' });
for (const d of demos) {
    const name = d.url.split('/').filter(Boolean).pop();
    await page.goto(site + d.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 72 });
    console.log(`✓ ${name}.jpg`);
}
await browser.close();
