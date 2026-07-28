<?php
// php/helpers.php — Shared helper functions (PHP 5.6+ compatible)

function clean_content_text($value) {
    // Store content as plain UTF-8, not pre-escaped HTML. Every UI already
    // escapes or uses textContent, and pre-escaping corrupts labels and URLs.
    if (is_array($value) || is_object($value)) return '';
    $text = html_entity_decode((string)$value, ENT_QUOTES, 'UTF-8');
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
    return trim($text);
}

function normalize_category_list($values) {
    if (!is_array($values)) return array();
    $result = array();
    $seen = array();
    foreach ($values as $value) {
        $category = clean_content_text($value);
        if ($category === '') continue;
        if (function_exists('mb_substr')) $category = mb_substr($category, 0, 80, 'UTF-8');
        else $category = substr($category, 0, 80);
        $key = strtolower(preg_replace('/\s+/', '', $category));
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $result[] = $category;
    }
    return $result;
}

function normalize_project($raw) {
    $tools = array();
    if (isset($raw['tools'])) {
        if (is_array($raw['tools'])) {
            $tools = array_map(function($t) { return clean_content_text($t); }, $raw['tools']);
            $tools = array_filter($tools);
        } else {
            $tools = array_map('trim', explode(',', (string)$raw['tools']));
            $tools = array_map('clean_content_text', $tools);
            $tools = array_filter($tools);
        }
    }

    $gallery = array();
    if (isset($raw['gallery']) && is_array($raw['gallery'])) {
        $gallery = array_map(function($u) { return clean_content_text($u); }, $raw['gallery']);
        $gallery = array_filter($gallery);
        $gallery = array_slice($gallery, 0, 20);
    }

    $order = isset($raw['order']) && is_numeric($raw['order']) ? intval($raw['order']) : 0;

    return array(
        'id' => isset($raw['id']) ? $raw['id'] : generate_uuid(),
        'title' => clean_content_text(arr_get($raw, 'title', '')),
        'brand' => clean_content_text(arr_get($raw, 'brand', arr_get($raw, 'category', ''))),
        'category' => clean_content_text(arr_get($raw, 'category', '')), // legacy compatibility
        'year' => clean_content_text(arr_get($raw, 'year', '')),
        'description' => clean_content_text(arr_get($raw, 'description', '')),
        'role' => clean_content_text(arr_get($raw, 'role', '')),
        'tools' => array_values($tools),
        'video' => clean_content_text(arr_get($raw, 'video', '')),
        'thumbnail' => clean_content_text(arr_get($raw, 'thumbnail', '')),
        'gallery' => array_values($gallery),
        'published' => isset($raw['published']) ? ($raw['published'] !== false && $raw['published'] !== 'false') : true,
        'featured' => isset($raw['featured']) ? ($raw['featured'] === true || $raw['featured'] === 'true') : false,
        'order' => $order,
        'createdAt' => isset($raw['createdAt']) ? $raw['createdAt'] : date('c'),
        'updatedAt' => isset($raw['updatedAt']) ? $raw['updatedAt'] : null,
    );
}

function sort_projects($list) {
    usort($list, function($a, $b) {
        $fa = $a['featured'] ? 1 : 0;
        $fb = $b['featured'] ? 1 : 0;
        $fo = $fb - $fa;
        if ($fo !== 0) return $fo;
        $oo = ($a['order'] ? intval($a['order']) : 0) - ($b['order'] ? intval($b['order']) : 0);
        if ($oo !== 0) return $oo;
        return strcmp(arr_get($b, 'createdAt', ''), arr_get($a, 'createdAt', ''));
    });
    return $list;
}

function collect_used_upload_urls() {
    $used = array();
    $add = function($url) use (&$used) {
        if (!$url || !is_string($url)) return;
        if (preg_match('!/uploads/([^/?]+)!', $url, $m)) {
            $used[] = $m[1];
        }
    };

    $projectsData = json_read('projects.json');
    $projectsList = arr_get($projectsData, 'projects', array());
    foreach ($projectsList as $p) {
        $add(arr_get($p, 'thumbnail', ''));
        $add(arr_get($p, 'video', ''));
        $gallery = arr_get($p, 'gallery', array());
        if (is_array($gallery)) {
            foreach ($gallery as $g) $add($g);
        }
    }

    $settings = json_read('settings.json');
    if (!is_array($settings)) $settings = array();
    foreach (array('heroPortraitDark', 'heroPortraitLight', 'aboutImage', 'aboutResumeUrl') as $k) {
        if (isset($settings[$k])) $add($settings[$k]);
    }

    return $used;
}
