export type Project = {
    title: string;
    subtitle?: string | null;
    period?: string | null;
    description: string;
    tags: string[];
    url: string | null;
    repo: string | null;
    image: string | null;
    on_resume?: boolean;
    bullets: string[];
};

export type Service = {
    slug: string;
    icon: 'websites' | 'software' | 'growth' | 'agents';
    title: string;
    description: string;
    points: string[];
    headline: string;
    intro: string;
    for: string[];
    deliverables: { title: string; description: string }[];
    process: { title: string; description: string }[];
    faq: { q: string; a: string }[];
    related_tags: string[];
};

export type Experience = {
    role: string;
    company: string;
    period: string;
    summary: string;
    bullets: string[];
};

export type Education = {
    school: string;
    degree: string;
    period: string;
};

export type Portfolio = {
    name: string;
    first_name: string;
    role: string;
    location: string;
    availability: string | null;
    tagline: string;
    about: string[];
    summary: string;
    resume_url: string | null;
    links: { email?: string | null; github?: string | null; linkedin?: string | null; phone?: string | null };
    education: Education[];
    services: Service[];
    skills: Record<string, string[]>;
    projects: Project[];
    experience: Experience[];
};
