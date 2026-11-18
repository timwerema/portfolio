/**
 * Conversion tracking hooks. NOTHING IS SENT ANYWHERE BY DEFAULT.
 *
 * `track()` fires a browser event (`tw:track`) and, only if an analytics script has been added to the site,
 * forwards it to that script (Plausible's `plausible()` or Google's `gtag()`). With no script installed it is a no-op,
 * so there are no cookies and no outside requests. Never pass names, emails or message text: event names and
 * short labels only.
 *
 * Events used: `cta_click` ({ cta, page }), `inquiry_sent` ({ form }).
 */
type Props = Record<string, string | number | boolean>;
type Analytics = {
    plausible?: (event: string, options?: { props?: Props }) => void;
    gtag?: (command: 'event', event: string, props?: Props) => void;
};

export function track(event: string, props: Props = {}): void {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent('tw:track', { detail: { event, props } }));
        const w = window as unknown as Analytics;
        w.plausible?.(event, { props });
        w.gtag?.('event', event, props);
    } catch {
        // Tracking must never break the page.
    }
}

/** One listener for every element marked `data-cta="name"`. Returns the cleanup function. */
export function trackCtaClicks(): () => void {
    const onClick = (e: MouseEvent) => {
        const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cta]');
        if (el?.dataset.cta) track('cta_click', { cta: el.dataset.cta, page: window.location.pathname });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
}
