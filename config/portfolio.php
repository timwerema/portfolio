<?php

/*
|--------------------------------------------------------------------------
| Portfolio content
|--------------------------------------------------------------------------
|
| Everything shown on the public portfolio page lives here. Edit the values
| below and refresh the page - no frontend changes needed.
|
*/

return [

    'name' => 'Timasi',
    'role' => 'Full-Stack Developer',
    'location' => 'Your City, Country',
    'tagline' => 'I build fast, clean web applications with Laravel, React and TypeScript.',

    'about' => [
        'I\'m a developer who enjoys turning ideas into polished, reliable products. '
            .'I work across the stack - from designing databases and APIs in Laravel to crafting '
            .'interfaces in React with Tailwind and shadcn/ui.',
        'Replace this paragraph with a bit about your background, what you care about, '
            .'and the kind of work you\'re looking for.',
    ],

    // Optional: path inside /public, e.g. '/resume.pdf'. Set to null to hide the button.
    'resume_url' => null,

    'links' => [
        'email' => 'you@example.com',
        'github' => 'https://github.com/your-username',
        'linkedin' => 'https://www.linkedin.com/in/your-username',
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
        'Backend' => ['PHP', 'Laravel', 'MySQL', 'REST APIs'],
        'Frontend' => ['TypeScript', 'React', 'Inertia.js', 'Tailwind CSS', 'shadcn/ui'],
        'Tools' => ['Git', 'Linux', 'Vite', 'Docker'],
    ],

    'projects' => [
        [
            'title' => 'Project One',
            'description' => 'A short description of what this project does, the problem it solves, and your role in it.',
            'tags' => ['Laravel', 'React', 'TypeScript'],
            'url' => null,
            'repo' => 'https://github.com/your-username/project-one',
            'image' => null, // e.g. '/images/project-one.png' (place file in /public/images)
        ],
        [
            'title' => 'Project Two',
            'description' => 'Highlight something interesting: a tricky technical challenge, a measurable result, or a design you\'re proud of.',
            'tags' => ['Inertia.js', 'Tailwind CSS'],
            'url' => 'https://example.com',
            'repo' => null,
            'image' => null,
        ],
        [
            'title' => 'Project Three',
            'description' => 'Keep each description to two or three sentences. Link to a live demo whenever you can.',
            'tags' => ['PHP', 'MySQL'],
            'url' => null,
            'repo' => null,
            'image' => null,
        ],
    ],

    'experience' => [
        [
            'role' => 'Web Developer',
            'company' => 'Company Name',
            'period' => '2024 - Present',
            'summary' => 'What you built, owned, or improved. Numbers help: "cut page load time by 40%".',
        ],
        [
            'role' => 'Junior Developer',
            'company' => 'Previous Company',
            'period' => '2022 - 2024',
            'summary' => 'A sentence or two about your responsibilities and wins.',
        ],
    ],

];
