<?php

/*
|--------------------------------------------------------------------------
| Portfolio + resume content
|--------------------------------------------------------------------------
|
| Single source of truth for the portfolio page (/) and the resume page
| (/resume). Edit the values below and refresh - no frontend changes needed.
| After changing resume content, regenerate the PDF:  npm run resume:pdf
|
*/

return [

    'name' => 'Timasi Werema',
    'first_name' => 'Timasi',
    'role' => 'Software Engineer',
    'location' => 'Dallas, TX',
    'availability' => 'Open to full-time, internships & freelance',
    'tagline' => 'I build full-stack tools that automate the tedious parts of work - from 5G infrastructure validation at Nokia to AI assistants that find answers fast.',

    // Home page (for business owners). The engineering/recruiter story lives on /hire.
    'client' => [
        'title' => 'Websites & software for local businesses',
        'eyebrow' => 'Taking new projects',
        'tagline' => 'I build websites and business software for Dallas-Fort Worth businesses, designed to make it easier for your customers to ask a question, request a quote or book.',
        'typing' => [
            'websites that make it easy to reach you',
            'booking pages that are easy to use',
            'dashboards that save hours a week',
            'AI helpers that do the busywork',
            'software shaped around how you work',
        ],
        // Spec rows beside the headline.
        'facts' => [
            ['First step', 'A free 15-minute call'],
            ['Launch in', '1-4 weeks'],
            ['Websites from', '$750'],
            ['After launch', 'Optional care plan'],
            ['Based in', 'Dallas, TX'],
        ],
        // Verified background only: UT Dallas CS, Nokia internship, full-stack, cloud infrastructure, automation.
        'about' => [
            'I\'m Timasi Werema, a software engineer studying Computer Science at the University of Texas at Dallas. You work with me directly: I plan, design, build and look after your site myself, so nothing gets lost between people.',
            'During my internship at Nokia I built a full-stack tool that automated checks on cloud infrastructure, replacing work engineers had been doing by hand. I bring the same habits to small-business sites: clear structure, fast pages, and automation wherever it saves you time.',
        ],
        'about_facts' => [
            ['Studying', 'Computer Science, UT Dallas'],
            ['Internship', 'Nokia'],
            ['Works across', 'Front end, back end, cloud'],
            ['Based in', 'Dallas-Fort Worth'],
        ],
    ],

    'about' => [
        'I\'m a Computer Science student at the University of Texas at Dallas, graduating in May 2027. '
            .'I like building software that removes busywork. At Nokia, I built a full-stack portal that automated '
            .'validation of virtualized 5G RAN deployments and cut manual validation time by 65%.',
        'Since 2022 I\'ve also kept the payment systems running at the American Airlines Center through '
            .'sold-out games and concerts - which taught me to debug calmly when everything is on the line. '
            .'Lately I\'m focused on AI: retrieval-augmented assistants and programmable task bots that handle '
            .'repetitive work so people don\'t have to.',
    ],

    // Shown at the top of the resume (/resume).
    'summary' => 'Computer Science student (B.S., May 2027) with internship experience building full-stack automation '
        .'at Nokia and four years supporting production payment systems at a major sports and entertainment venue. '
        .'Works across Node.js, JavaScript, cloud infrastructure (AWS, Kubernetes, OpenShift), and retrieval-augmented AI.',

    // Link for the "Resume" button in the hero. Null hides it.
    'resume_url' => '/resume',

    'links' => [
        'email' => 'timasiwerema@gmail.com',
        'github' => 'https://github.com/timwerema',
        'linkedin' => 'https://www.linkedin.com/in/timasi-werema/',
        // Set a phone number to show it on the resume (it is public once deployed).
        'phone' => null,
    ],

    'contact' => [
        // Where contact-form emails go. Defaults to links.email above.
        'notify_email' => env('CONTACT_NOTIFY_EMAIL'),
    ],

    // Automatic payment reminders for overdue invoices (php artisan invoices:remind, daily).
    'reminders' => [
        'enabled' => env('INVOICE_REMINDERS', true),
        'days_after_due' => 3,      // first reminder 3 days after the due date
        'repeat_every_days' => 7,   // then weekly
        'max' => 3,                 // never more than 3 per invoice
    ],

    // Monday-morning business summary email to you.
    'weekly_summary' => env('WEEKLY_SUMMARY', true),

    'alerts' => [
        // Where site problem alerts go. Defaults to contact.notify_email, then links.email.
        'email' => env('ALERT_EMAIL'),
        // Email you when the site crashes (500 errors). On by default in production only.
        'errors' => env('ALERT_ON_ERRORS', env('APP_ENV') === 'production'),
    ],

    // Public sign-up stays off. Create your login with: php artisan user:create
    'allow_registration' => false,

    'education' => [
        [
            'school' => 'The University of Texas at Dallas',
            'degree' => 'B.S. Computer Science',
            'period' => 'Expected May 2027',
        ],
    ],

    // Services you offer. Each one gets a detail page at /services/{slug}.
    // `icon` is one of: websites, software, growth, agents.
    // `related_tags`: projects with any of these tags are shown on the service page.
    'services' => [
        [
            'slug' => 'websites',
            'icon' => 'websites',
            'title' => 'Websites',
            'description' => 'Sites that load fast, look sharp on every screen, and turn visitors into enquiries, bookings, or sales.',
            'points' => ['Custom design & build', 'Online stores', 'Landing pages'],
            'headline' => 'A website that works as hard as you do.',
            'intro' => 'Your website is often the first conversation a customer has with you. I design and build fast, modern sites that explain what you do in seconds, look great on phones, and make it easy for people to call, book, or buy.',
            'for' => ['Small businesses', 'Clubs & non-profits', 'Freelancers & creators', 'Local service providers'],
            'deliverables' => [
                ['title' => 'Custom design', 'description' => 'A look built around your brand - not a template everyone else is using.'],
                ['title' => 'Mobile-first build', 'description' => 'Pages that load fast and read well on any screen size.'],
                ['title' => 'Online store', 'description' => 'Product pages, cart and checkout when you need to sell online.'],
                ['title' => 'Easy updates', 'description' => 'Change text, photos, and events yourself without touching code.'],
                ['title' => 'Search-ready', 'description' => 'Clean structure, page titles and metadata so Google understands your site.'],
                ['title' => 'Hosting & HTTPS', 'description' => 'Set up on reliable hosting with a secure certificate and your domain.'],
            ],
            'process' => [
                ['title' => 'Discovery call', 'description' => 'We talk through your goals, audience, and the sites you like.'],
                ['title' => 'Design', 'description' => 'You see the layout and style before any code is written.'],
                ['title' => 'Build', 'description' => 'I build the site and share a preview link so you can follow along.'],
                ['title' => 'Launch & handover', 'description' => 'We go live on your domain and I show you how to keep it updated.'],
            ],
            'faq' => [
                ['q' => 'How long does a website take?', 'a' => 'A simple site usually takes two to four weeks, depending on how many pages you need and how quickly content comes together.'],
                ['q' => 'Do I need to write all the content myself?', 'a' => 'No. Send me what you have - even rough notes - and I\'ll help shape it into clear page copy.'],
                ['q' => 'Can I update the site after launch?', 'a' => 'Yes. I can set up an easy way to edit common content, or handle updates for you.'],
            ],
            'related_tags' => ['JavaScript', 'Supabase', 'Netlify Functions', 'Tailwind CSS'],
        ],
        [
            'slug' => 'software',
            'icon' => 'software',
            'title' => 'Software',
            'description' => 'Tailor-made web apps for the parts of your business that generic tools can\'t handle.',
            'points' => ['Business web apps', 'Dashboards & portals', 'API integrations'],
            'headline' => 'Software shaped around how you actually work.',
            'intro' => 'When spreadsheets and off-the-shelf apps stop fitting, custom software can. I build web applications, internal dashboards, and integrations that match your workflow - like the validation portal I built at Nokia that cut manual checks by 65%.',
            'for' => ['Teams outgrowing spreadsheets', 'Businesses with manual processes', 'Startups building an MVP', 'Organisations connecting multiple tools'],
            'deliverables' => [
                ['title' => 'Web applications', 'description' => 'Secure, browser-based apps with user accounts and roles.'],
                ['title' => 'Dashboards & portals', 'description' => 'One place to see status, run checks, and act on the results.'],
                ['title' => 'APIs & integrations', 'description' => 'Connect your tools so data flows between them automatically.'],
                ['title' => 'Databases', 'description' => 'Well-structured data storage in MySQL, PostgreSQL, or SQLite.'],
                ['title' => 'Cloud deployment', 'description' => 'Deployed on AWS, a VPS, or containers - whatever suits the project.'],
                ['title' => 'Documentation', 'description' => 'Clear notes so your team (or the next developer) can maintain it.'],
            ],
            'process' => [
                ['title' => 'Map the workflow', 'description' => 'We walk through the process today and where it hurts.'],
                ['title' => 'Plan the build', 'description' => 'A short written plan covering features, data, and timeline.'],
                ['title' => 'Build in milestones', 'description' => 'Working pieces delivered early so you can give feedback as we go.'],
                ['title' => 'Launch & support', 'description' => 'Deploy, train your team, and fix anything that comes up.'],
            ],
            'faq' => [
                ['q' => 'What technologies do you use?', 'a' => 'Usually Laravel or Node.js on the backend and React with TypeScript on the frontend, but I choose what fits your project and team.'],
                ['q' => 'Can you work with our existing systems?', 'a' => 'Yes - connecting to existing tools and APIs is often the most valuable part of a project.'],
                ['q' => 'Who owns the code?', 'a' => 'You do. The code and data are yours, hosted on accounts you control.'],
            ],
            'related_tags' => ['Node.js', 'Express', 'Kubernetes', 'OpenShift', 'PostgreSQL', 'Supabase'],
        ],
        [
            'slug' => 'growth',
            'icon' => 'growth',
            'title' => 'Growth',
            'description' => 'Getting found and getting chosen - search, ads, and content tracked against real results.',
            'points' => ['SEO', 'Paid campaigns', 'Analytics & reporting'],
            'headline' => 'Get found by the people looking for you.',
            'intro' => 'A great site only helps if people find it. I help you show up in search, run focused ad campaigns, and set up tracking so you can see which efforts bring in real enquiries - not just clicks.',
            'for' => ['New websites with little traffic', 'Local businesses', 'Anyone running ads without tracking', 'Launches & events'],
            'deliverables' => [
                ['title' => 'Technical SEO', 'description' => 'Speed, structure, and metadata fixes so search engines can read your site.'],
                ['title' => 'Local search', 'description' => 'Google Business Profile setup so you appear in local results and maps.'],
                ['title' => 'Paid campaigns', 'description' => 'Search and social ads aimed at the customers you actually want.'],
                ['title' => 'Content', 'description' => 'Pages and posts that answer the questions your customers search for.'],
                ['title' => 'Analytics', 'description' => 'Tracking for calls, form submissions, and sales - not just page views.'],
                ['title' => 'Monthly reports', 'description' => 'A short, plain-English summary of what\'s working and what\'s next.'],
            ],
            'process' => [
                ['title' => 'Audit', 'description' => 'Review your site, search presence, and any current campaigns.'],
                ['title' => 'Set up tracking', 'description' => 'Measure the actions that matter before spending more.'],
                ['title' => 'Improve & launch', 'description' => 'Fix the biggest gaps first, then launch content and campaigns.'],
                ['title' => 'Measure & adjust', 'description' => 'Review results regularly and shift effort to what works.'],
            ],
            'faq' => [
                ['q' => 'How soon will I see results?', 'a' => 'Ads can bring traffic within days. SEO is slower - usually a few months - but keeps working long after.'],
                ['q' => 'Do I need a new website first?', 'a' => 'Not always. We start with an audit; sometimes a few fixes to your current site are enough.'],
                ['q' => 'How do I know it\'s working?', 'a' => 'We agree on the numbers that matter - calls, bookings, sales - and track them from day one.'],
            ],
            'related_tags' => [],
        ],
        [
            'slug' => 'ai-agents',
            'icon' => 'agents',
            'title' => 'AI Agents',
            'description' => 'Programmable task bots that take the repetitive, tedious work off your plate - and keep doing it without getting bored.',
            'points' => ['Data entry & form filling', 'Inbox & document processing', 'Scheduled workflows'],
            'headline' => 'Hand the boring work to a bot.',
            'intro' => 'Copying data between systems, filling in the same forms, sorting emails, pulling numbers into weekly reports - if it\'s repetitive and follows rules, a task bot can probably do it. I build AI agents that run these jobs reliably, on a schedule or on demand, and ask a human when something looks off.',
            'for' => ['Office & admin teams', 'Small businesses without IT staff', 'Anyone doing the same task every week', 'Teams drowning in email or documents'],
            'deliverables' => [
                ['title' => 'Data entry & form filling', 'description' => 'Move information between websites, spreadsheets, and systems automatically.'],
                ['title' => 'Inbox triage', 'description' => 'Read, label, and route emails - and draft replies for common questions.'],
                ['title' => 'Document processing', 'description' => 'Pull key details out of invoices, PDFs, and forms into structured data.'],
                ['title' => 'Scheduled reports', 'description' => 'Gather numbers from your tools and deliver a summary every morning or week.'],
                ['title' => 'Knowledge assistants', 'description' => 'Ask questions about your own documents and get answers with sources.'],
                ['title' => 'Human in the loop', 'description' => 'Bots flag anything unusual for review instead of guessing.'],
            ],
            'process' => [
                ['title' => 'Pick the task', 'description' => 'We find the repetitive job that costs you the most time each week.'],
                ['title' => 'Map the steps', 'description' => 'Document exactly how a person does it today, including the edge cases.'],
                ['title' => 'Build & test', 'description' => 'The bot runs alongside you first, so you can check its work.'],
                ['title' => 'Automate & monitor', 'description' => 'Once it\'s trusted, it runs on its own - with logs and alerts if something fails.'],
            ],
            'faq' => [
                ['q' => 'What kinds of tasks can a bot handle?', 'a' => 'Anything repetitive that follows clear rules: data entry, form filling, sorting emails, renaming files, compiling reports, and looking things up in your documents.'],
                ['q' => 'Is my data safe?', 'a' => 'Bots only get the access they need, run on infrastructure you control where possible, and keep logs of every action.'],
                ['q' => 'What happens when the bot isn\'t sure?', 'a' => 'It stops and asks. Like the SOP assistant I worked on, it\'s designed to say "I don\'t have enough information" rather than guess.'],
            ],
            'related_tags' => ['AWS Bedrock', 'RAG', 'AI', 'Automation'],
        ],
    ],

    // Pricing packages shown on the home page. 'featured' highlights one.
    'packages' => [
        [
            'name' => 'Starter',
            'price' => '$750',
            'summary' => 'A clean, fast site of up to three pages that tells people what you do and how to reach you.',
            // What the price covers (shown under each package; keep in step with client-sites/PACKAGES.md).
            'includes' => ['Up to 3 responsive pages', 'Design based on your brand', 'Contact form and tap-to-call', 'Basic on-page SEO', '1 revision round', 'Launch support'],
            'best_for' => 'New businesses that need a professional home online.',
            'featured' => false,
        ],
        [
            'name' => 'Business', // the name used in forms and the dashboard
            'label' => 'Business Website', // the name shown on the home page
            'price' => '$1,750',
            'summary' => 'The full website most established local businesses need: every key page, built around getting inquiries and bookings.',
            'includes' => [
                'Up to 5 responsive pages',
                'Contact or quote-request form',
                'Basic on-page SEO',
                'Visitor analytics set up',
                '2 revision rounds',
                'Launch support',
                '14-day defect warranty',
            ],
            'best_for' => 'Established businesses that want more inquiries and bookings from their site.',
            'featured' => true,
        ],
        [
            'name' => 'Custom',
            'price' => '$3,500+',
            'summary' => 'Business software: web apps, client portals, dashboards, integrations or AI task bots. Scoped together.',
            'includes' => ['Paid planning phase first (credited to the build)', 'Clickable prototype you approve', 'Built in milestones you can see', 'Logins, payments and data handled carefully', 'Tests on anything that touches money'],
            'best_for' => 'Work that off-the-shelf tools do not fit.',
            'featured' => false,
        ],
    ],

    // Shown under the packages so nobody is surprised later.
    'package_notes' => [
        'included' => 'Design, build, testing on phones and desktops, and launch on your domain.',
        'not_included' => [
            ['Domain name', 'You buy and own it (about $12-$20 a year). I help you set it up.'],
            ['Hosting and maintenance', 'Covered by the optional care plan, or you host it yourself.'],
            ['Copywriting', 'You provide the wording; I tidy it up. Writing it from scratch is quoted separately.'],
            ['Photography', 'You provide photos, or we use ones you have the rights to.'],
            ['Advanced integrations', 'Online stores, customer accounts, custom booking systems and software connections are Custom work.'],
        ],
        'warranty' => 'The 14-day defect warranty means I fix anything that does not work as agreed, free, for 14 days after launch. New features and content changes are separate.',
    ],

    'care_plan' => [
        'price' => '$79-$149/month',
        'summary' => 'Optional care plan: hosting, updates, backups and small changes each month. Not part of the package price.',
    ],

    // Shown on the home page scoreboard.
    'stats' => [
        ['value' => '65%', 'label' => 'Validation time cut', 'note' => 'Nokia portal'],
        ['value' => '40%', 'label' => 'Fewer verification errors', 'note' => 'Node.js backend'],
        ['value' => '3+', 'label' => 'Infra environments', 'note' => 'EKS-A · OpenShift · Wind River'],
        ['value' => '04', 'label' => 'Seasons at the arena', 'note' => 'American Airlines Center'],
    ],

    'skills' => [
        'Languages' => ['Java', 'Python', 'C/C++', 'JavaScript', 'SQL (MySQL, PostgreSQL)', 'HTML/CSS'],
        'Frameworks & Tools' => ['Node.js', 'Express', 'React Native', 'REST APIs', 'Git', 'Docker', 'Linux', 'SSH', 'Firebase', 'Supabase'],
        'Cloud & AI' => ['AWS (Bedrock, S3)', 'Kubernetes', 'OpenShift', 'Containerized network functions', 'RAG', 'Netlify'],
    ],

    // `bullets` appear on the resume; `description` appears on the portfolio card.
    // Set 'on_resume' => false to show a project only on the portfolio.
    'projects' => [
        [
            'title' => '5G RAN Validation Portal',
            'subtitle' => 'Nokia · Internship project',
            'period' => '2025',
            'description' => 'A full-stack portal that runs automated checks against virtualized 5G RAN deployments over SSH and shows the results in real time - cutting manual validation time by 65%.',
            'tags' => ['Node.js', 'Express', 'Kubernetes', 'OpenShift', 'SSH'],
            'url' => null,
            'repo' => null,
            'image' => null,
            'on_resume' => false, // already covered under Experience
            // Spec rows on the home page (label => value).
            'spec' => ['Type' => 'Internal web tool', 'Built for' => 'Nokia 5G RAN engineers', 'Status' => 'Delivered'],
            'bullets' => [],
        ],
        [
            'title' => 'Good Days',
            'subtitle' => 'AI SOP Assistant · Capstone',
            'period' => '2026',
            'description' => 'A retrieval-augmented assistant that helps staff find approved standard operating procedures, built on Amazon Bedrock Knowledge Bases with S3-backed vector storage.',
            'tags' => ['AWS Bedrock', 'S3', 'RAG', 'PostgreSQL'],
            'url' => null,
            'repo' => null,
            'image' => null,
            // Spec rows on the home page (label => value).
            'spec' => ['Type' => 'AI assistant (RAG)', 'Built for' => 'Capstone team', 'Status' => 'In development'],
            'bullets' => [
                'Contributed to a retrieval-augmented generation (RAG) assistant that surfaces approved SOP guidance using Amazon Bedrock Knowledge Bases and S3-backed vector storage.',
                'Built and evaluated keyword-query tests and "insufficient evidence" responses so the assistant declines rather than guesses when sources are missing.',
                'Investigated PostgreSQL-backed session history and fallback-model options to keep follow-up conversations reliable.',
            ],
        ],
        [
            'title' => 'Galacticals SC',
            'subtitle' => 'Youth soccer academy website · Frisco, TX',
            'period' => '2026',
            // The club now runs a simpler site that is not mine: no link, and say so plainly.
            'description' => 'A website I built for a youth soccer academy: pricing, drop-in schedule, camps and coach profiles, with Square payment links and a private editor for the club. The club later went with a simpler site, which taught me to keep things simple for the people who run them.',
            'tags' => ['React', 'Supabase', 'Netlify Functions', 'Square'],
            'url' => null,
            'repo' => null,
            'image' => null,
            // Spec rows on the home page (label => value).
            'spec' => ['Type' => 'Client website', 'Built for' => 'Soccer club in Frisco', 'Status' => 'Built 2026'],
            'bullets' => [
                'Built and refined a JavaScript club website for events, training sessions, and member information, with Supabase-backed authentication and data.',
                'Moved protected data access into Netlify Functions, separating client authentication from club data.',
                'Hardened event displays with safe fallback handling so pages stay usable when data is missing.',
            ],
        ],
        [
            'title' => 'AI Code Review & Automation Toolkit',
            'subtitle' => 'Development project',
            'period' => null,
            'description' => 'AI-assisted workflows that review code and generate tests, flagging security, logic, and style issues before they reach a human reviewer.',
            'tags' => ['AI', 'Automation', 'Testing'],
            'url' => null,
            'repo' => null,
            'image' => null,
            // Spec rows on the home page (label => value).
            'spec' => ['Type' => 'Developer tooling', 'Built for' => 'Code reviewers', 'Status' => 'Ongoing'],
            'bullets' => [
                'Created AI-assisted code review and test-generation workflows that surface security, logic, and style issues.',
                'Documented reusable quality checks and review patterns for developers.',
            ],
        ],
    ],

    // Demo sites for fictional businesses (shown under "Demo sites" on the home page).
    'demos' => [
        [
            'title' => 'Clearcoat',
            'type' => 'Ceramic, PPF & wraps studio',
            'description' => 'A site for a car protection and wrap studio. Visitors try wrap colours on a car, add services to a quote and see clear policies before they call.',
            'url' => '/demos/clearcoat',
            'package' => 'Business',
            'goal' => 'Make a premium service feel worth its price, and turn browsing into a quote request.',
            'fictional' => true,
        ],
        [
            'title' => '4th Quarter Performance',
            'type' => 'Gym & athletic training',
            'description' => 'A gym site built around booking. Programs open up for detail, the weekly schedule takes reservations, and pricing switches between monthly and annual.',
            'url' => '/demos/fourth-quarter',
            'package' => 'Business',
            'goal' => 'Get a first-time visitor from the homepage to a booked free session in three steps.',
            'fictional' => true,
        ],
        [
            'title' => 'LATESHIFT',
            'type' => 'Streetwear online store',
            'description' => 'A clothing store that sells in limited drops: a countdown to the next release, quick view with colours and sizes, a bag with a free-shipping meter, and a simulated checkout.',
            'url' => '/demos/lateshift',
            'package' => 'Custom',
            'goal' => 'Show a small online store with a clear path from product to checkout.',
            'fictional' => true,
        ],
        [
            'title' => 'StudyLoop',
            'type' => 'AI study tool',
            'description' => 'Drop in lecture slides (PowerPoint or PDF) and get a study plan that adapts to the exam: closed notes, one cheat sheet or open notes, multiple choice or written. Tracks trouble spots, pop-quiz drills, printable cheat sheet. I use it for my own classes.',
            'url' => '/demos/studyloop',
            'package' => 'Custom',
            'goal' => 'Show working software, not just a design: a tool I built and use for my own classes.',
            'fictional' => false,
        ],
        [
            'title' => 'Encore Live',
            'type' => 'Spotify + Ticketmaster app',
            'description' => 'Connect Spotify and it finds upcoming shows near you from the R&B artists you actually play, with tickets and add-to-calendar.',
            'url' => '/live',
            'package' => 'Custom',
            'goal' => 'Show a real integration with two outside services (Spotify and Ticketmaster).',
            'fictional' => false,
        ],
        [
            'title' => 'Rundown',
            'type' => 'League stats site',
            'description' => 'Stats hub for a rec basketball league: scores and box scores, sortable standings and player stats, league leaders, shot charts and head-to-head compare.',
            'url' => '/demos/rundown',
            'package' => 'Custom',
            'goal' => 'Make a lot of numbers easy to read on a phone.',
            'fictional' => true,
        ],
        [
            'title' => 'Deskbot',
            'type' => 'AI agent (task bot)',
            'description' => 'A pixel-art office robot that chases invoices, books jobs and answers emails, walking to each tool. Built safe: it asks before anything goes out, follows a visible permissions table and catches scam emails that try to trick it.',
            'url' => '/demos/deskbot',
            'package' => 'Custom',
            'goal' => 'Explain what an AI helper would do for an office, and how it stays safe, without jargon.',
            'fictional' => true,
        ],
        [
            'title' => 'Hardwood Performance Lab',
            'type' => 'Basketball training facility',
            'description' => 'Maple court, navy and LED scoreboard: programs, a facility tour, a scroll-driven game plan, memberships and a free-evaluation form. The original look of this portfolio, kept for sports and fitness clients.',
            'url' => '/demos/hardwood',
            'package' => 'Business',
            'goal' => 'Give a sports business a bold identity while keeping the sign-up path obvious.',
            'fictional' => true,
        ],
        [
            'title' => 'Orbit City FC',
            'type' => 'Youth soccer club',
            'description' => 'A club site parents can run from their phone: Apple/Google sign-in, a schedule hub with calendar, upcoming and payment tabs, and one-tap registration.',
            'url' => '/demos/orbit-city',
            'package' => 'Custom',
            'goal' => 'Let parents see the schedule, register and pay from a phone in under a minute.',
            'fictional' => true,
        ],
    ],

    'experience' => [
        [
            'role' => 'AI RAN Intern',
            'company' => 'Nokia',
            'period' => 'May 2025 - Aug 2025',
            'summary' => 'Built a full-stack validation portal for virtualized 5G RAN components that cut manual validation time by 65% and verification errors by 40%.',
            'bullets' => [
                'Built a full-stack validation portal for virtualized 5G RAN components (vCU/vDU) across EKS-A, OpenShift, and Wind River, reducing manual validation time by 65%.',
                'Engineered a Node.js/Express backend that runs shell-based checks over SSH, parses infrastructure diagnostics, and returns structured JSON - reducing verification errors by 40%.',
                'Designed a responsive HTML/CSS/JavaScript interface with node-specific workflows, expandable diagnostics, real-time status indicators, and input validation.',
                'Partnered with 5G RAN engineers to validate containerized network function deployments - Kubernetes services, networking, monitoring, and storage - across 3+ infrastructure environments.',
            ],
        ],
        [
            'role' => 'POS Technician',
            'company' => 'Levy at American Airlines Center',
            'period' => 'Nov 2022 - Present',
            'summary' => 'Keep concession payment systems running during high-volume sports and concert events.',
            'bullets' => [
                'Install, configure, and maintain concession POS terminals and peripherals - payment readers, barcode scanners, and receipt printers - during high-volume sports and concert events.',
                'Diagnose hardware, software, and network incidents on site and remotely; document fixes in ticketing workflows and restore devices to service quickly to limit disruption.',
            ],
        ],
    ],

];
