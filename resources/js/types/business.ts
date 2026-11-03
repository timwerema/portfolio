export type ProjectStatus = 'lead' | 'proposal' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export type Client = { id: number; name: string; company: string | null; email: string | null; phone: string | null; notes: string | null };

export type Project = {
    id: number;
    client_id: number;
    client?: { id: number; name: string };
    name: string;
    package: string | null;
    status: ProjectStatus;
    budget_cents: number | null;
    start_date: string | null;
    due_date: string | null;
    notes: string | null;
};

export type InvoiceItem = { id?: number; description: string; quantity: number; unit_price_cents: number };

export type Invoice = {
    id: number;
    number: string;
    client_id: number;
    project_id: number | null;
    client?: Client;
    project?: { id: number; name: string } | null;
    status: InvoiceStatus;
    issue_date: string;
    due_date: string;
    notes: string | null;
    payment_link: string | null;
    sent_at: string | null;
    paid_at: string | null;
    payment_method: string | null;
    items: InvoiceItem[];
    total_cents: number;
    is_overdue: boolean;
    public_url: string;
};
