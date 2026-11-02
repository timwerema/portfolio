// Renders /resume to public/resume.pdf using Playwright (Chromium).
// Usage: start the app (php artisan serve), then: npm run resume:pdf
// Override the URL with RESUME_URL=http://host:port/resume
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

// Use a project-local Playwright if installed, otherwise a global one (npm i -g playwright).
const require = createRequire(import.meta.url);
let playwright;
try {
    playwright = require('playwright');
} catch {
    playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const { chromium } = playwright;

const url = process.env.RESUME_URL ?? 'http://127.0.0.1:8000/resume';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.emulateMedia({ media: 'print', colorScheme: 'light' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.pdf({ path: 'public/resume.pdf', format: 'Letter', preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`Saved public/resume.pdf from ${url}`);
