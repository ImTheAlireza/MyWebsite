<?php
declare(strict_types=1);

$site = [
    'lang' => 'en',
    'title' => 'Alireza Shabanzadeh – Motion and graphic designer',
    'description' => 'Alireza Shabanzadeh is a motion and graphic designer based in Iran, working in After Effects and Photoshop.',
    'name' => 'Alireza Shabanzadeh',
    'first_name' => 'Alireza',
    'last_name' => 'Shabanzadeh',
    'role' => 'Motion and graphic designer based in Iran.',
    'intro' => 'I make motion graphics and static design for brands in Iran and abroad, working in After Effects and Photoshop.',
    'email' => 'hello@alirezashabanzadeh.ir',
    'linkedin_url' => 'https://www.linkedin.com/in/your-profile',
    'footer_tagline' => 'Motion and graphic design',
    'copyright_year' => '2026',
];

$nav = [
    ['label' => 'Work', 'href' => '#work'],
    ['label' => 'Services', 'href' => '#services'],
    ['label' => 'About', 'href' => '#about'],
    ['label' => 'Contact', 'href' => '#contact'],
];

$works = [
    [
        'title' => 'Project title',
        'meta' => 'Motion · Client name',
        'media' => null, // ['type' => 'image'|'video', 'src' => '...', 'alt' => '...']
        'placeholder' => 'Add image or video',
    ],
    [
        'title' => 'Project title',
        'meta' => 'Poster · Client name',
        'media' => null,
        'placeholder' => 'Add image or video',
    ],
    [
        'title' => 'Project title',
        'meta' => 'Motion · IDmelon',
        'media' => null,
        'placeholder' => 'Add image or video',
    ],
    [
        'title' => 'Project title',
        'meta' => 'Static design · Client name',
        'media' => null,
        'placeholder' => 'Add image or video',
    ],
];

$services = [
    [
        'title' => 'Motion graphics',
        'description' => 'Animated pieces for brands and products, designed and built in After Effects.',
    ],
    [
        'title' => 'Static graphic design',
        'description' => 'Layouts and visuals for print and screen, designed in Photoshop.',
    ],
    [
        'title' => 'Small web tools',
        'description' => 'WordPress plugins and simple tools, built with AI for specific needs.',
    ],
];

$about = [
    'paragraphs' => [
        "I'm a graphic designer working mostly in motion. I've designed for print and screen for over six years, and I like work where the idea is clear before the animation starts.",
        'Most of my clients are in Iran, and I also work with IDmelon. I prefer to work independently and keep communication in writing. On the side, I build small web tools and WordPress plugins with AI.',
    ],
    'portrait_placeholder' => 'Add a portrait or workspace photo',
    'details' => [
        ['label' => 'Focus', 'value' => 'Motion graphics, static design'],
        ['label' => 'Tools', 'value' => 'After Effects, Photoshop'],
        ['label' => 'Clients', 'value' => 'IDmelon, plus Iranian brands <!-- TODO: add 2–3 client names you can show -->', 'raw' => true],
        ['label' => 'Based in', 'value' => 'Iran, working remotely'],
    ],
    'experience' => [
        ['when' => 'Years', 'what' => 'Role, company', 'detail' => 'One line on what you did there.'],
        ['when' => 'Years', 'what' => 'Role, company', 'detail' => 'One line on what you did there.'],
    ],
    'education' => [
        ['when' => 'Years', 'what' => 'Degree or course, institution', 'detail' => null],
    ],
];

$contact = [
    'intro' => 'Tell me what you\'re making, the format and the deadline. You can also find me on ',
    'form_types' => [
        'Motion graphics',
        'Static graphic design',
        'Small web tool',
        'Something else',
    ],
];
