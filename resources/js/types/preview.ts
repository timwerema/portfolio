export type PreviewStatus = 'pending' | 'approved' | 'changes_requested';

export type PreviewFeedback = {
    id: number;
    version: number;
    decision: Exclude<PreviewStatus, 'pending'>;
    name: string | null;
    comment: string | null;
    created_at: string;
};

export type Preview = {
    id: number;
    client_name: string;
    client_email: string | null;
    title: string;
    note: string | null;
    demo_url: string | null;
    has_upload: boolean;
    version: number;
    status: PreviewStatus;
    decided_at: string | null;
    sent_at: string | null;
    created_at: string;
    review_url: string;
    feedback_count?: number;
    feedback?: PreviewFeedback[];
};
