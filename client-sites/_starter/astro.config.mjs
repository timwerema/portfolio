import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Plain static site: every page is real HTML (fast, good for Google, free to host).
export default defineConfig({
    // Set the real address before launch (also set `url` in src/site.ts).
    site: 'https://example.com',
    // Put CSS inside each page, so the one-file demo build needs no extra files.
    build: { inlineStylesheets: 'always', format: 'directory' },
    vite: { plugins: [tailwindcss()] },
});
