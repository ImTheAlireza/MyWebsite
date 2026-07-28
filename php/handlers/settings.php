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
);

function normalize_categories($values) {
    return normalize_category_list($values);
}

function get_settings() {
    global $DEFAULT_SETTINGS;
    $data = json_read('settings.json');
    $settings = array_merge($DEFAULT_SETTINGS, is_array($data) ? $data : array());
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
                    'date' => sanitize((string)arr_get($item, 'date', '')),
                    'title' => sanitize((string)arr_get($item, 'title', '')),
                    'subtitle' => sanitize((string)arr_get($item, 'subtitle', '')),
                    'desc' => sanitize((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'categories') {
            if (!is_array($value)) continue;
            $patch[$key] = normalize_categories($value);
        } elseif (substr($key, -7) === 'Opacity' || substr($key, -5) === 'Scale') {
            $n = floatval($value);
            if (is_finite($n)) $patch[$key] = $n;
        } else {
            $patch[$key] = is_string($value) ? sanitize($value) : $value;
        }
    }

    $current = json_read('settings.json');
    if (!is_array($current)) $current = array();
    $settings = array_merge($DEFAULT_SETTINGS, $current, $patch);
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    json_write('settings.json', $settings);
    send_json($settings);
}
