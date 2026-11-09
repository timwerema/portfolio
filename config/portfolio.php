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
    'availability' => 'Open to internships & freelance projects',
    'tagline' => 'I build full-stack tools that automate the tedious parts of work - from 5G infrastructure validation at Nokia to AI assistants that find answers fast.',

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
            'summary' => 'A polished site of up to five pages for a small business - mobile-first, contact form, basic SEO, launched on your domain.',
            'featured' => false,
        ],
        [
            'name' => 'Business',
            'price' => '$1,750',
            'summary' => 'A fully custom site with more pages, bookings or a small store, easy content updates and analytics.',
            'featured' => true,
        ],
        [
            'name' => 'Custom',
            'price' => '$3,500+',
            'summary' => 'Custom software - web apps, client portals, dashboards, integrations or AI task bots. Scoped together.',
            'featured' => false,
        ],
    ],

    'care_plan' => [
        'price' => '$79-$149/month',
        'summary' => 'Optional care plan: hosting, updates, backups and small changes.',
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
            'description' => 'The live website for a youth soccer academy: pricing, drop-in schedule, camps and coach profiles, with Square payment links and a private admin editor so the club can update its own content.',
            'tags' => ['React', 'Supabase', 'Netlify Functions', 'Square'],
            'url' => 'https://galacticalssc.com',
            'repo' => null,
            'image' => null,
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
            'description' => 'A chrome-luxury site for a protection and wrap studio: a live wrap colour visualizer, services you add to a quote, a filterable work log and clear policies.',
            'url' => '/demos/clearcoat',
            'package' => 'Business',
        ],
        [
            'title' => '4th Quarter Performance',
            'type' => 'Gym & athletic training',
            'description' => 'A gym site built to fill classes: expandable programs, a weekly class schedule with reservations, monthly/annual pricing and a 3-step free-session booking.',
            'url' => '/demos/fourth-quarter',
            'package' => 'Business',
        ],
        [
            'title' => 'LATESHIFT',
            'type' => 'Streetwear online store',
            'description' => 'A drop-based clothing store: countdown to the next drop, quick view with colours and sizes, a bag with a free-shipping meter, and checkout.',
            'url' => '/demos/lateshift',
            'package' => 'Custom',
        ],
        [
            'title' => 'StudyLoop',
            'type' => 'AI study tool',
            'description' => 'Turns lecture notes into flashcards, a multiple-choice quiz and typed practice, all in the browser. A preview of the AI Agents service.',
            'url' => '/demos/studyloop',
            'package' => 'Custom',
        ],
        [
            'title' => 'Encore',
            'type' => 'Concert finder app',
            'description' => 'Finds upcoming DFW shows by the artists you actually listen to: match scores, distance and price filters, a venue map and add-to-calendar.',
            'url' => '/demos/encore',
            'package' => 'Custom',
        ],
        [
            'title' => 'Rundown',
            'type' => 'League stats site',
            'description' => 'Stats hub for a rec basketball league: scores and box scores, sortable standings and player stats, league leaders, shot charts and head-to-head compare.',
            'url' => '/demos/rundown',
            'package' => 'Custom',
        ],
        [
            'title' => 'Galacticals SC - v3 concept',
            'type' => 'Youth soccer academy',
            'description' => 'A redesign of the club site I built: Apple/Google sign-in, a schedule hub with calendar, upcoming and payment tabs, and one-tap registration.',
            'url' => '/demos/galacticals',
            'package' => 'Custom',
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
