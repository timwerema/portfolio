/**
 * Read lecture slides in the browser (nothing is uploaded) and turn them into study cards.
 * PowerPoint (.pptx) via JSZip, PDF via pdf.js; both libraries load only when a file is dropped.
 */

export type Slide = { n: number; title: string; lines: string[] };
export type Draft = { term: string; def: string; topic: string; source: string };

/** Slides that rarely hold testable content. */
const SKIP = /^(outline|agenda|overview|today|questions\??|any questions|thank you|thanks|references|sources|announcements?|reminders?)\b/i;

const clean = (s: string) =>
    s
        .replace(/\s+/g, ' ')
        .replace(/^[-*•▪◦●○■□➢►–—]\s*/, '')
        .trim();

export async function readPptx(file: File): Promise<Slide[]> {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const names = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]));
    const slides: Slide[] = [];
    for (const [i, name] of names.entries()) {
        const xml = new DOMParser().parseFromString(await zip.file(name)!.async('text'), 'application/xml');
        let title = '';
        const lines: string[] = [];
        for (const shape of Array.from(xml.getElementsByTagName('p:sp'))) {
            const ph = shape.getElementsByTagName('p:ph')[0]?.getAttribute('type') ?? '';
            const paras = Array.from(shape.getElementsByTagName('a:p'))
                .map((p) =>
                    clean(
                        Array.from(p.getElementsByTagName('a:t'))
                            .map((t) => t.textContent ?? '')
                            .join(''),
                    ),
                )
                .filter(Boolean);
            if (!title && /title/i.test(ph)) title = paras.join(' ');
            else lines.push(...paras);
        }
        if (!title && lines.length) title = lines.shift()!;
        slides.push({ n: i + 1, title, lines });
    }
    return slides;
}

export async function readPdf(file: File): Promise<Slide[]> {
    const pdfjs = await import('pdfjs-dist');
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const slides: Slide[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const content = await page.getTextContent();
        // Group text pieces into lines by their vertical position; remember each line's font size.
        const rows = new Map<number, { x: number; str: string; size: number }[]>();
        for (const item of content.items) {
            if (!('str' in item) || !item.str.trim()) continue;
            const y = Math.round(item.transform[5] / 3);
            const size = Math.abs(item.transform[3]) || item.height;
            rows.set(y, [...(rows.get(y) ?? []), { x: item.transform[4], str: item.str, size }]);
        }
        const lines = [...rows.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([, parts]) => ({
                text: clean(
                    parts
                        .sort((a, b) => a.x - b.x)
                        .map((p) => p.str)
                        .join(' '),
                ),
                size: Math.max(...parts.map((p) => p.size)),
            }))
            .filter((l) => l.text && !/^\d+$/.test(l.text));
        if (!lines.length) {
            slides.push({ n, title: '', lines: [] });
            continue;
        }
        // The biggest text near the top is the slide title.
        const biggest = Math.max(...lines.slice(0, 3).map((l) => l.size));
        const ti = lines.findIndex((l) => l.size === biggest);
        slides.push({ n, title: lines[ti].text, lines: lines.filter((_, i) => i !== ti).map((l) => l.text) });
    }
    return slides;
}

/** One line like "Term: definition", "Term - definition" or "A term is ..." → a card. */
export function lineToCard(line: string): { term: string; def: string } | null {
    const body = line.replace(/^([-*•]|\d+[.)])\s+/, '');
    const m =
        body.match(/^(.{2,70}?)\s*(?::|\s[-–—=]\s)\s*(.{8,})$/) ??
        body.match(/^(?:an?|the)?\s*([\w\s()/-]{2,40}?)\s+(?:is|are|means|refers to)\s+(.{8,})$/i);
    if (!m) return null;
    const term = m[1].trim().replace(/^(an?|the)\s+/i, '');
    if (term.split(/\s+/).length > 6) return null;
    return { term: term.charAt(0).toUpperCase() + term.slice(1), def: m[2].trim().replace(/\.$/, '') };
}

/** Plain notes ("# Topic" headings + "Term: definition" lines) → cards. */
export function notesToCards(text: string, source: string): Draft[] {
    const out: Draft[] = [];
    let topic = 'General';
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        const heading = line.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
            topic = heading[1].trim();
            continue;
        }
        const c = lineToCard(line);
        if (c) out.push({ ...c, topic, source });
    }
    return out;
}

/**
 * Slides → cards. Definition-style lines become their own cards; a slide with none becomes
 * one "explain this slide" card (title → its main points), so nothing the professor showed is lost.
 */
export function slidesToCards(slides: Slide[], lecture: string): Draft[] {
    const out: Draft[] = [];
    for (const s of slides) {
        if (!s.title && !s.lines.length) continue;
        if (SKIP.test(s.title) || (s.n === 1 && s.lines.length < 3)) continue; // title slide, agenda...
        const source = `${lecture} · slide ${s.n}`;
        const topic = s.title || lecture;
        const found = s.lines.map(lineToCard).filter((c): c is { term: string; def: string } => !!c);
        if (found.length) {
            found.forEach((c) => out.push({ ...c, topic, source }));
        } else if (s.title && s.lines.length) {
            const points = s.lines.filter((l) => l.split(' ').length > 1).slice(0, 5);
            if (points.length) out.push({ term: s.title, def: points.join(' • ').slice(0, 320), topic, source });
        }
    }
    return out;
}
