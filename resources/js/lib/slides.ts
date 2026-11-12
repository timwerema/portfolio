/**
 * Read lecture slides in the browser (nothing is uploaded) and turn them into study cards.
 * PowerPoint (.pptx) via JSZip, PDF via pdf.js; both libraries load only when a file is dropped.
 */

export type Slide = { n: number; title: string; lines: string[] };
export type Draft = { term: string; def: string; topic: string; source: string };

/** Labels that are not terms worth a card of their own. */
const GENERIC =
    /^(problem|solution|note|example|assume|where|overall|advantages?|disadvantages?|steps?|recall|question|answer|summary|hint|but|so|then|first access|second access)$/i;

/** Slides that rarely hold testable content. */
const SKIP =
    /^(outline|agenda|overview|today|questions\??|any questions|thank you|thanks|references|sources|announcements?|reminders?|.*: an illustration|.*hardware$|two memory accesses)$/i;

const clean = (s: string) =>
    s
        .replace(/\s+/g, ' ')
        .replace(/^[-*•▪◦●○■□➢►–—]\s*/, '')
        .replace(/^\d+\s+(?=[A-Z])/, '') // "1 First-Fit: ..." numbering from LaTeX decks
        .trim();

/** Footers and running headers that LaTeX/Beamer decks repeat on every slide. */
const FOOTER =
    /^(\d+\s*\/\s*\d+|(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}, \d{4}|[A-Z][a-z]+ [A-Z][a-z]+ \(.*\)|\d+)$/i;

/** Lines that are only diagram labels (numbers, 1-2 short tokens, single letters). */
const LABEL = /^([\d.,]+[A-Za-z]{0,2}|[A-Za-z]\d?|[a-z]{1,3}|\w+\s\d+|(P|B|H|segment|frame|page|process)\s?\d+)$/i;

/**
 * Tidy the slides a deck reader produced:
 *  - drop repeated footers/headers (author, date, "31 / 150", section breadcrumbs that repeat on every slide)
 *  - merge "build" slides (LaTeX Beamer reveals one bullet per slide: keep only the fullest version)
 *  - drop diagram-only slides whose text is just labels
 */
export function tidySlides(raw: Slide[]): Slide[] {
    const slides = raw.map((s) => ({ ...s, title: clean(s.title), lines: s.lines.map(clean).filter((l) => l && !FOOTER.test(l)) }));
    const total = slides.length;
    // Any line that shows up on more than a quarter of the slides is furniture: the deck title, the author,
    // the section breadcrumbs. Count every line, not just the top ones, since readers put them in different places.
    const seen = new Map<string, number>();
    for (const s of slides) for (const l of new Set([s.title, ...s.lines])) if (l) seen.set(l, (seen.get(l) ?? 0) + 1);
    const running = new Set([...seen].filter(([, n]) => n > Math.max(3, total * 0.12)).map(([l]) => l));
    // A frequent glued header ("Section Subsection") means both halves are headers too, even if one is rarer alone.
    for (const header of [...running]) {
        const words = header.split(' ');
        for (let cut = 1; cut < words.length; cut++) {
            const left = words.slice(0, cut).join(' ');
            const right = words.slice(cut).join(' ');
            if (seen.has(left) && seen.has(right)) {
                running.add(left);
                running.add(right);
            }
        }
    }
    // Section names show on many slides, and sometimes glued together ("Section Subsection"): strip every combination.
    const isRunning = (l: string): boolean => {
        if (running.has(l)) return true;
        const words = l.split(' ');
        for (let cut = 1; cut < words.length; cut++)
            if (running.has(words.slice(0, cut).join(' ')) && isRunning(words.slice(cut).join(' '))) return true;
        return false;
    };
    for (const s of slides) {
        const body = [...(s.title ? [s.title] : []), ...s.lines].filter((l) => !isRunning(l));
        s.title = body[0] ?? '';
        s.lines = body.slice(1);
    }
    // Merge build steps (Beamer reveals one bullet per slide): keep the fullest slide with a given title in a run.
    const merged: Slide[] = [];
    for (const cur of slides) {
        const prev = merged[merged.length - 1];
        if (prev && prev.title === cur.title) {
            const a = new Set(prev.lines);
            const b = new Set(cur.lines);
            if ([...a].every((l) => b.has(l)))
                merged[merged.length - 1] = cur; // cur is a superset: keep it
            else if ([...b].every((l) => a.has(l)))
                continue; // cur is a subset: drop it
            else merged.push(cur);
        } else merged.push(cur);
    }
    // Drop diagram-only slides.
    return merged.filter((s) => s.lines.some((l) => !LABEL.test(l) && l.split(' ').length >= 4));
}

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
    return tidySlides(slides);
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
    return tidySlides(slides);
}

/** One line like "Term: definition", "Term - definition" or "A term is ..." → a card. */
export function lineToCard(line: string): { term: string; def: string } | null {
    const body = line.replace(/^([-*•]|\d+[.)])\s+/, '');
    const m =
        body.match(/^(.{2,70}?)\s*(?::|\s[-–—=]\s)\s*(.{8,})$/) ??
        body.match(/^(?:an?|the)?\s*([\w\s()/-]{2,40}?)\s+(?:is|are)\s+(?:an?|the)\s+(.{8,})$/i) ?? // "A mutex is a lock..." (needs an article: skips "Memory is partitioned...")
        body.match(/^(?:an?|the)?\s*([\w\s()/-]{2,40}?)\s+(?:means|refers to)\s+(.{8,})$/i) ??
        // "The maximal contiguous block of free memory is called a hole." → Hole: the maximal contiguous block...
        (() => {
            const m2 = body.match(/^(.{8,})\s+(?:is|are)\s+(?:called|known as|referred to as)\s+(?:an?\s+|the\s+)?([\w\s()/-]{2,40}?)\.?$/i);
            return m2 ? [m2[0], m2[2], m2[1]] : null;
        })();
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
        const found = s.lines
            .map(lineToCard)
            .filter(
                (c): c is { term: string; def: string } => !!c && !GENERIC.test(c.term) && c.def.split(' ').length >= 3 && !/[(×+=-]$/.test(c.def),
            );
        if (found.length) {
            found.forEach((c) => out.push({ ...c, topic, source }));
        }
        // Also keep the slide as a whole when it has 2+ real sentences the definitions didn't cover (comparisons, steps, pros/cons).
        const covered = new Set(found.map((c) => c.def));
        const points = s.lines.filter((l) => l.split(' ').length >= 4 && !covered.has(l) && !LABEL.test(l)).slice(0, 6);
        if (s.title && points.length >= (found.length ? 2 : 1) && !found.some((c) => c.term === s.title)) {
            out.push({ term: s.title, def: points.join(' • ').slice(0, 420), topic, source });
        }
    }
    return out;
}
