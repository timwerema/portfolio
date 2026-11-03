const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 175050 -> "$1,750.50" */
export const money = (cents: number | null | undefined) => usd.format((cents ?? 0) / 100);

/** "2026-11-03" or ISO -> "Nov 3, 2026" (date-only strings are treated as local dates). */
export const date = (value: string | null | undefined) => {
    if (!value) return '—';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export const labelize = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
