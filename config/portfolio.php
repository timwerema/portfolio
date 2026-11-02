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

    // Public sign-up stays off. Create your login with: php artisan user:create
    'allow_registration' => false,

    'education' => [
        [
            'school' => 'The University of Texas at Dallas',
            'degree' => 'B.S. Computer Science',
            'period' => 'Expected May 2027',
        ],
    ],

    // Services you offer. `icon` is one of: websites, software, growth, agents.
    'services' => [
        [
            'icon' => 'websites',
            'title' => 'Websites',
            'description' => 'Sites that load fast, look sharp on every screen, and turn visitors into enquiries, bookings, or sales.',
            'points' => ['Custom design & build', 'Online stores', 'Landing pages'],
        ],
        [
            'icon' => 'software',
            'title' => 'Software',
            'description' => 'Tailor-made web apps for the parts of your business that generic tools can\'t handle.',
            'points' => ['Business web apps', 'Dashboards & portals', 'API integrations'],
        ],
        [
            'icon' => 'growth',
            'title' => 'Growth',
            'description' => 'Getting found and getting chosen - search, ads, and content tracked against real results.',
            'points' => ['SEO', 'Paid campaigns', 'Analytics & reporting'],
        ],
        [
            'icon' => 'agents',
            'title' => 'AI Agents',
            'description' => 'Programmable task bots that take the repetitive, tedious work off your plate - and keep doing it without getting bored.',
            'points' => ['Data entry & form filling', 'Inbox & document processing', 'Scheduled workflows'],
        ],
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
            'subtitle' => 'Soccer Club Web Platform',
            'period' => '2026',
            'description' => 'The club\'s website for events, training sessions, and member information, with Supabase authentication and serverless functions protecting member data.',
            'tags' => ['JavaScript', 'Supabase', 'Netlify Functions'],
            'url' => null,
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
