/**
 * EVERYTHING about this client's site lives in this one file.
 * Edit the text, colors and style here; every page updates.
 *
 * Rules:
 *  - Only real details from the client (no made-up awards, numbers or reviews).
 *  - `testimonials` must be real quotes the client gave you, with permission. Leave empty otherwise.
 *  - Leave `form.action` empty until the form is connected; the form then politely says it is not live yet.
 */

export type Style = 'classic' | 'bold' | 'minimal';
export type Section = 'hero' | 'services' | 'pricing' | 'menu' | 'steps' | 'about' | 'work' | 'testimonials' | 'faq' | 'location' | 'contact';

export const site = {
    business: {
        name: 'Northline Home Services',
        tagline: 'Honest repairs, on time, every time.',
        description: 'Family-run home repair company serving North Dallas. Plumbing, electrical and handyman work with upfront pricing.',
        phone: '(214) 555-0142',
        email: 'hello@example.com',
        address: { street: '', city: 'Dallas', region: 'TX', postal: '' },
        serviceArea: ['Dallas', 'Richardson', 'Plano', 'Garland'],
        hours: [
            { days: 'Mon-Fri', open: '7:00 AM', close: '6:00 PM' },
            { days: 'Sat', open: '8:00 AM', close: '2:00 PM' },
        ],
        // schema.org openingHours format, used for Google: "Mo-Fr 07:00-18:00"
        openingHoursSchema: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
        founded: '',
        social: { facebook: '', instagram: '', google: '' },
    },

    /** Look and feel. Pick a style preset, then brand colors. */
    theme: {
        style: 'classic' as Style, // 'classic' (serif headings, split hero) | 'bold' (big uppercase, image hero) | 'minimal' (clean, centered)
        mode: 'light' as 'light' | 'dark',
        brand: '#1f5f8b', // main color: buttons, links
        accent: '#f2a541', // highlights
        motion: true, // gentle scroll movement (sections fade/slide in, hero photo drifts). Off for visitors who ask for reduced motion.
    },

    /** Website address once live (used for SEO and the sitemap). */
    url: 'https://example.com',

    hero: {
        eyebrow: 'Serving North Dallas since day one',
        title: 'Home repairs done right the first time.',
        text: 'Licensed pros, upfront prices and a 1-year warranty on our work. Call now or book online in under a minute.',
        primary: { label: 'Get a free quote', href: 'contact' },
        secondary: { label: 'Call us', href: 'tel' },
        image: '/images/hero.svg',
        imageAlt: 'A technician at work',
    },

    services: [
        { name: 'Plumbing', price: 'From $95', text: 'Leaks, clogs, water heaters and fixture installs.' },
        { name: 'Electrical', price: 'From $120', text: 'Outlets, lighting, ceiling fans and panel checks.' },
        { name: 'Handyman', price: 'From $75/hr', text: 'Drywall, doors, shelves, TV mounting and small fixes.' },
        { name: 'Maintenance plans', price: '$19/mo', text: 'Seasonal checkups so small problems never get big.' },
    ],

    steps: [
        { title: 'Tell us what is wrong', text: 'Call, text or use the form. We reply within one business hour.' },
        { title: 'Get an upfront price', text: 'No surprises: you approve the price before we start.' },
        { title: 'We fix it', text: 'On time, cleaned up after, and backed by our warranty.' },
    ],

    about: {
        title: 'Local, licensed and easy to reach',
        text: [
            'Northline is a small team of licensed technicians who live in the neighborhoods we serve.',
            'We answer the phone, show up when we say we will, and explain the fix in plain English.',
        ],
        image: '/images/about.svg',
        imageAlt: 'The Northline team',
        highlights: ['Licensed & insured', '1-year warranty', 'Upfront pricing'],
    },

    work: [
        { title: 'Water heater replacement', place: 'Richardson', image: '/images/work-1.svg' },
        { title: 'Kitchen lighting upgrade', place: 'Plano', image: '/images/work-2.svg' },
        { title: 'Bathroom remodel repairs', place: 'Dallas', image: '/images/work-3.svg' },
    ],

    /** Real quotes only, with the customer's permission. Empty = section hidden. */
    testimonials: [] as { quote: string; name: string; detail?: string }[],

    faq: [
        { q: 'Do you charge for estimates?', a: 'No. Estimates are free anywhere in our service area.' },
        { q: 'Are you licensed and insured?', a: 'Yes, fully licensed and insured in Texas.' },
        { q: 'How soon can you come out?', a: 'Usually within 1-2 business days, and same-day for emergencies when we can.' },
    ],

    contact: {
        title: 'Get a free quote',
        text: 'Tell us what you need and we will get back to you within one business hour.',
    },

    /** Contact form. Paste a form endpoint (e.g. Formspree, Web3Forms, or your own) when going live. */
    form: { action: '' },

    /** Online booking link (Calendly, Square Appointments, Booksy, OpenTable...). Empty = no booking button. */
    booking: { url: '', label: 'Book online' },

    /** Optional bar at the very top, e.g. "Holiday hours: closed Dec 25". Empty = hidden. */
    announcement: { text: '', link: '' },

    /** Location section: "Get directions" opens Google Maps for this search (address or business name + city). */
    location: {
        title: 'Visit us',
        mapsQuery: '', // empty = uses the business name + address/city above
        note: 'Free parking out front.',
    },

    /** Price table, for plans and packages (gyms, salons, cleaners, maintenance plans...). */
    pricing: {
        title: 'Simple, upfront pricing',
        text: 'No contracts. Cancel anytime.',
        plans: [
            { name: 'Basic', price: '$19', period: '/month', features: ['2 seasonal checkups a year', '10% off repairs'], featured: false },
            { name: 'Plus', price: '$39', period: '/month', features: ['4 seasonal checkups a year', '15% off repairs', 'Priority scheduling'], featured: true },
            { name: 'One-time visit', price: '$95', period: '', features: ['Single diagnostic visit', 'Upfront repair quote'], featured: false },
        ],
        note: 'Prices include labor for the checkup. Parts are quoted before any work.',
    },

    /** Menu, for restaurants, cafes and food trucks. Tags: V = vegetarian, VG = vegan, GF = gluten-free, S = spicy. */
    menu: {
        title: 'Menu',
        note: 'Please tell us about any allergies. Prices include tax.',
        sections: [
            {
                name: 'Starters',
                items: [
                    { name: 'Street corn', text: 'Grilled corn, lime crema, cotija, chili.', price: '$7', tags: ['V', 'GF'] },
                    { name: 'Chips & salsa trio', text: 'House chips with roja, verde and mango salsa.', price: '$8', tags: ['VG'] },
                ],
            },
            {
                name: 'Mains',
                items: [
                    { name: 'Brisket tacos', text: '12-hour smoked brisket, pickled onion, salsa verde. Three per order.', price: '$15', tags: ['GF'] },
                    { name: 'Chipotle chicken bowl', text: 'Rice, black beans, roasted peppers, chipotle chicken.', price: '$14', tags: ['S'] },
                    { name: 'Garden bowl', text: 'Rice, black beans, grilled vegetables, avocado.', price: '$12', tags: ['VG', 'GF'] },
                ],
            },
        ],
    },

    /** Homepage sections, top to bottom. Add or remove names to change the homepage (also what the demo shows). */
    home: ['hero', 'services', 'steps', 'about', 'work', 'testimonials', 'faq', 'contact'] as Section[],

    /** Pages in the menu. Remove one to hide it everywhere (the page file can stay).
     *  Available pages: services, pricing, menu, about, work, contact. */
    nav: [
        { label: 'Services', page: 'services' },
        { label: 'About', page: 'about' },
        { label: 'Our work', page: 'work' },
        { label: 'Contact', page: 'contact' },
    ],

    /** Shown on the demo build only. */
    demo: { by: 'Timasi Werema', link: 'https://timasi.sterango.com' },
};

export type Site = typeof site;
