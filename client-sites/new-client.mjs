/**
 * Start a new client site from the baseline.
 *
 *   npm run client:new -- "Lone Star Lawn Care"
 *   npm run client:new -- "Lone Star Lawn Care" --style bold --brand "#2e7d32" --phone "(972) 555-0100"
 *
 * Copies client-sites/_starter to client-sites/<slug>, fills in the name (and any options given),
 * then installs packages. Next: edit client-sites/<slug>/src/site.ts and run `npm run demo` there.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const name = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));
const opt = (key) => {
    const i = args.indexOf(`--${key}`);
    return i >= 0 ? args[i + 1] : undefined;
};

if (!name) {
    console.log('Usage: npm run client:new -- "Business Name" [--style classic|bold|minimal] [--brand "#hex"] [--phone "(214) 555-0100"] [--no-install]');
    process.exit(1);
}

const slug = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const target = join(here, slug);
if (existsSync(target)) {
    console.log(`client-sites/${slug} already exists. Pick another name or delete that folder first.`);
    process.exit(1);
}

const skip = new Set(['node_modules', 'dist', 'demo', '.demo-build', '.astro']);
cpSync(join(here, '_starter'), target, { recursive: true, filter: (src) => !skip.has(basename(src)) });

const sitePath = join(target, 'src', 'site.ts');
let site = readFileSync(sitePath, 'utf8');
const esc = (v) => v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
site = site.replace(/name: 'Northline Home Services'/, `name: '${esc(name)}'`);
site = site.replace(/Northline/g, esc(name));
if (opt('style')) site = site.replace(/style: '[a-z]+' as Style/, `style: '${opt('style')}' as Style`);
if (opt('brand')) site = site.replace(/brand: '#[0-9a-fA-F]{3,8}'/, `brand: '${opt('brand')}'`);
if (opt('phone')) site = site.replace(/phone: '[^']*'/, `phone: '${esc(opt('phone'))}'`);
writeFileSync(sitePath, site);

const pkgPath = join(target, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = slug;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');

console.log(`Created client-sites/${slug}`);
if (!args.includes('--no-install')) {
    console.log('Installing packages (about a minute)...');
    execSync('npm install --no-audit --no-fund', { cwd: target, stdio: 'inherit' });
}
console.log(`
Next:
  1. Edit client-sites/${slug}/src/site.ts (text, colors, style, photos in public/images)
  2. cd client-sites/${slug} && npm run dev     (live preview while you edit)
  3. npm run demo                                (makes demo/index.html for the dashboard)
`);
