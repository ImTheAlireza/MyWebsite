<?php
// php/handlers/settings.php — Settings handlers (PHP 5.6+ compatible)

$DEFAULT_SETTINGS = array(
    'siteName' => 'Alireza Shabanzadeh',
    'siteTitle' => 'Motion Graphics Designer',
    'tagline' => 'Crafting motion that communicates, engages, and inspires.',
    'email' => 'alirezashabanzadeh01@gmail.com',
    'phone' => '+98 911 694 7375',
    'location' => 'Rasht, Guilan, Iran',
    'linkedin' => '',
    'behance' => '',
    'instagram' => '',
    'heroEyebrow' => 'Motion Graphics Designer',
    'heroFirstName' => 'Alireza',
    'heroLastName' => 'Shabanzadeh',
    'heroSubtitle' => 'Crafting motion that communicates, engages, and inspires.',
    'heroAvailability' => 'Available for work',
    'heroStat1Value' => '5+',
    'heroStat1Label' => 'Years Exp.',
    'heroStat2Value' => '50+',
    'heroStat2Label' => 'Projects',
    'heroStat3Value' => 'Rasht',
    'heroStat3Label' => 'Based in',
    'heroCtaText' => 'View Projects',
    'heroCtaLink' => '#work',
    'heroShowreelUrl' => '',
    'heroPortraitDark' => '',
    'heroPortraitDarkOpacity' => 0.18,
    'heroPortraitDarkScale' => 1,
    'heroPortraitLight' => '',
    'heroPortraitLightOpacity' => 0.12,
    'heroPortraitLightScale' => 1,
    'aboutImage' => '',
    'aboutText' => "I'm a motion graphics designer with a passion for transforming complex ideas into clear, compelling visual stories.",
    'aboutSkills' => 'Motion Design, Explainer Videos, Social Content, UI Animation, After Effects',
    'aboutResumeUrl' => '',
    'categories' => array(),
    'projectLayout' => '2col',
    'footerCopy' => '© 2026 Alireza Shabanzadeh',
    'footerNote' => 'Crafted with motion & care',
    'experience' => array(),
    'education' => array(),
    'servicesTitle' => 'What I do',
    'servicesIntro' => 'Motion that moves people — from idea to final frame.',
    'services' => array(
        array('icon' => 'play', 'title' => 'Explainer Videos', 'desc' => 'Complex ideas distilled into clear, engaging stories that convert viewers into customers.'),
        array('icon' => 'share', 'title' => 'Social Content', 'desc' => 'Scroll-stopping animations crafted for Instagram, LinkedIn and TikTok feeds.'),
        array('icon' => 'monitor', 'title' => 'UI Animation', 'desc' => 'Bring interfaces to life with purposeful, polished motion that improves usability.'),
    ),
    'processTitle' => 'How I work',
    'processIntro' => 'A transparent, collaborative workflow that keeps you in the loop — no surprises, just great motion.',
    'process' => array(
        array('title' => 'Brief & Strategy', 'desc' => 'We align on goals, audience, message and deliverables before any pixel moves.'),
        array('title' => 'Storyboard & Style', 'desc' => 'I sketch the flow and define the visual language — colors, typography, motion mood.'),
        array('title' => 'Motion & Design', 'desc' => 'The core craft. Animation, timing, sound design — iterating with you via frame previews.'),
        array('title' => 'Delivery & Support', 'desc' => 'Optimized exports for every platform, plus source files and 7 days of quick revisions.'),
    ),
    'testimonialsTitle' => 'Client thoughts',
    'testimonialsIntro' => 'A few words from teams I’ve helped bring to motion.',
    'testimonials' => array(
        array('quote' => 'Alireza turned a complex product into a story our customers instantly got. Our demo video doubled our trial sign-ups.', 'name' => 'Sarah K.', 'role' => 'Marketing Lead'),
        array('quote' => 'Fast, thoughtful, and incredibly detailed. The social pack he made still outperforms everything else we post.', 'name' => 'Mehdi R.', 'role' => 'Founder'),
    ),
);

function normalize_categories($values) {
    return normalize_category_list($values);
}

function deep_clean_text($value) {
    if (is_array($value)) {
        $cleaned = array();
        foreach ($value as $k => $v) {
            $cleaned[$k] = deep_clean_text($v);
        }
        return $cleaned;
    }
    if (is_string($value)) {
        return clean_content_text($value);
    }
    return $value;
}

function get_settings() {
    global $DEFAULT_SETTINGS;
    $data = json_read('settings.json');
    $settings = array_merge($DEFAULT_SETTINGS, is_array($data) ? $data : array());
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    // Decode any previously html-encoded entities (e.g. I&#039;ve) so panel shows correct text
    $settings = deep_clean_text($settings);
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    send_json($settings);
}

function update_settings() {
    global $DEFAULT_SETTINGS;
    require_auth();
    $input = get_json_input();

    $SETTINGS_KEYS = array();
    foreach (array_keys($DEFAULT_SETTINGS) as $k) {
        $SETTINGS_KEYS[$k] = true;
    }
    $patch = array();

    foreach ($input as $key => $value) {
        if (!isset($SETTINGS_KEYS[$key])) continue;

        if ($key === 'experience' || $key === 'education') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'date' => clean_content_text((string)arr_get($item, 'date', '')),
                    'title' => clean_content_text((string)arr_get($item, 'title', '')),
                    'subtitle' => clean_content_text((string)arr_get($item, 'subtitle', '')),
                    'desc' => clean_content_text((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'services') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'icon' => clean_content_text((string)arr_get($item, 'icon', 'play')),
                    'title' => clean_content_text((string)arr_get($item, 'title', '')),
                    'desc' => clean_content_text((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'process') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'title' => clean_content_text((string)arr_get($item, 'title', '')),
                    'desc' => clean_content_text((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'testimonials') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'quote' => clean_content_text((string)arr_get($item, 'quote', '')),
                    'name' => clean_content_text((string)arr_get($item, 'name', '')),
                    'role' => clean_content_text((string)arr_get($item, 'role', '')),
                );
            }, $value);
        } elseif ($key === 'categories') {
            if (!is_array($value)) continue;
            $patch[$key] = normalize_categories($value);
        } elseif (substr($key, -7) === 'Opacity' || substr($key, -5) === 'Scale') {
            $n = floatval($value);
            if (is_finite($n)) $patch[$key] = $n;
        } else {
            // Use clean_content_text for all textual content to preserve apostrophes and quotes
            // Only keep raw for already sanitized URLs which are handled via clean_content_text as well
            $patch[$key] = is_string($value) ? clean_content_text($value) : $value;
        }
    }

    $current = json_read('settings.json');
    if (!is_array($current)) $current = array();
    $settings = array_merge($DEFAULT_SETTINGS, $current, $patch);
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    json_write('settings.json', $settings);
    send_json($settings);
}
