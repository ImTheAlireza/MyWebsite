<?php
// php/handlers/settings.php — Settings handlers (PHP 5.6+ compatible)

$DEFAULT_SETTINGS = array(
    'siteName' => 'Alireza Shabanzadeh',
    // Persian page (fa.html). Empty mirrors fall back to the English value.
    'siteNameFa' => 'علیرضا شابان‌زاده',
    'siteTitleFa' => 'موشن گرافیک و ویدیوی توضیحی',
    'heroSubtitleFa' => 'ایدهٔ محصول و آموزش را به حرکت تبدیل می‌کنم: ویدیوی توضیحی، موشن رابط کاربری و کات‌های شبکه‌های اجتماعی.',
    'heroEyebrowFa' => 'موشن گرافیک و ویدیوی توضیحی',
    'heroFirstNameFa' => 'علیرضا',
    'heroLastNameFa' => 'شابان‌زاده',
    'heroAvailabilityFa' => 'آمادهٔ پروژه‌های جدید',
    'heroCtaTextFa' => 'دیدن نمونه‌کارها',
    'heroStat1LabelFa' => 'ابزارهای کار',
    'heroStat2ValueFa' => 'رشت، ایران',
    'heroStat2LabelFa' => 'محل کار',
    'heroStat3ValueFa' => '',
    'heroStat3LabelFa' => '',
    'aboutTextFa' => '',
    'aboutSkillsFa' => '',
    'servicesTitleFa' => 'چه کاری برایت می‌کنم',
    'servicesIntroFa' => '',
    'servicesFa' => array(),
    'experienceFa' => array(),
    'educationFa' => array(),
    'footerCopyFa' => '© ۱۴۰۵ علیرضا شابان‌زاده',
    'footerNoteFa' => 'موشن گرافیک · رشت، ایران · آمادهٔ دورکاری',
    'locationFa' => 'رشت، ایران',
    'heroPromiseFa' => 'هدف و مهلت را بگو — در جواب، تعریف کار، قیمت و زمان‌بندی می‌گیری.',
    'telegram' => '',
    'whatsapp' => '',
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
    'heroSubtitle' => 'I turn product ideas into clear motion — explainers, social cuts and UI animation, with the scope and timeline agreed before we start.',
    'heroAvailability' => 'Open for freelance projects',
    // Stats are facts, not decoration. Nothing here is a number the owner
    // cannot back up; empty values hide the stat (see js/main.js).
    'heroStat1Value' => 'Ae · Ps · Pr',
    'heroStat1Label' => 'Tools I use',
    'heroStat2Value' => 'Rasht, Iran',
    'heroStat2Label' => 'Based in',
    'heroStat3Value' => '',
    'heroStat3Label' => '',
    'heroPromise' => 'Tell me the goal and the deadline — you get a scope, a price and a timeline in reply.',
    'heroCtaText' => 'See selected work',
    'heroCtaLink' => '#work',
    'heroShowreelUrl' => '',
    // "What you get": empty by default. Each row stays hidden on the site until
    // the owner puts a real number here.
    'offerTitle' => 'What you get',
    'offerIntro' => '',
    'offerReply' => '',
    'offerTimeline' => '',
    'offerFormat' => '',
    'offerRevisions' => '',
    'offerTerms' => '',
    'offerReplyFa' => '',
    'offerTimelineFa' => '',
    'offerFormatFa' => '',
    'offerRevisionsFa' => '',
    'offerTermsFa' => '',
    'offerTitleFa' => 'چه می‌گیری',
    'offerIntroFa' => '',
    'offerFrom' => '',
    'offerFromFa' => '',
    'offerAvailability' => '',
    'offerAvailabilityFa' => '',
    // Scope guard: what a quote does NOT include, one item per line.
    'scopeTitle' => "What's not included",
    'scopeItems' => '',
    'scopeTitleFa' => 'چه چیزی شامل نمی‌شود',
    'scopeItemsFa' => '',
    'heroPortraitDark' => '',
    'heroPortraitDarkOpacity' => 0.18,
    'heroPortraitDarkScale' => 1,
    'heroPortraitLight' => '',
    'heroPortraitLightOpacity' => 0.12,
    'heroPortraitLightScale' => 1,
    'aboutImage' => '',
    'aboutText' => "I design motion that explains things: explainer videos that make one feature obvious, social cuts that survive a scroll, and UI animation that makes an interface feel responsive.", 
    'aboutSkills' => 'Motion Design, Explainer Videos, Social Content, UI Animation, After Effects',
    'aboutResumeUrl' => '',
    'categories' => array(),
    'projectLayout' => '2col',
    'footerCopy' => '© 2026 Alireza Shabanzadeh',
    'footerNote' => 'Freelance motion designer · Rasht, Iran · open to remote work',
    'experience' => array(),
    'education' => array(),
    'servicesTitle' => 'What I do',
    'servicesIntro' => 'Three ways I help teams get motion shipped — each one starts with a clear scope, not a pitch.',
    'services' => array(
        array('icon' => 'play', 'title' => 'Explainer Videos', 'desc' => 'Script shaping, storyboard, then a finished product animation — delivered in the aspect ratios you need (16:9, 1:1, 9:16).'),
        array('icon' => 'share', 'title' => 'Social Content', 'desc' => 'Short, legible animations built for Instagram, LinkedIn and TikTok: strong first frame, readable captions, correct safe areas.'),
        array('icon' => 'monitor', 'title' => 'UI Animation', 'desc' => 'Transitions, onboarding moments and empty states for apps and websites — delivered in the format your developers prefer.'),
    ),
    'processTitle' => 'How I work',
    'processIntro' => 'A transparent, collaborative workflow that keeps you in the loop — no surprises, just great motion.',
    'process' => array(
        array('title' => 'Brief & Strategy', 'desc' => 'We align on goals, audience, message and deliverables before any pixel moves.'),
        array('title' => 'Storyboard & Style', 'desc' => 'I sketch the flow and define the visual language — colors, typography, motion mood.'),
        array('title' => 'Motion & Design', 'desc' => 'The core craft. Animation, timing, sound design — iterating with you via frame previews.'),
        array('title' => 'Delivery & Support', 'desc' => 'Optimized exports for every platform, plus the source files. Revision rounds are agreed before we start.'),
    ),
    'testimonialsTitle' => 'Client thoughts',
    'testimonialsIntro' => 'Words from clients — shown only when a real client agrees to be quoted.',
    // Deliberately empty: the section stays hidden until real, attributable
    // quotes are added in the admin panel.
    'testimonials' => array(),
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

        if ($key === 'experience' || $key === 'education' || $key === 'experienceFa' || $key === 'educationFa') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'date' => clean_content_text((string)arr_get($item, 'date', '')),
                    'title' => clean_content_text((string)arr_get($item, 'title', '')),
                    'subtitle' => clean_content_text((string)arr_get($item, 'subtitle', '')),
                    'desc' => clean_content_text((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'services' || $key === 'servicesFa') {
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
