<?php
// php/helpers.php — Shared helper functions (PHP 5.6+ compatible)

function normalize_project($raw) {
    $tools = array();
    if (isset($raw['tools'])) {
        if (is_array($raw['tools'])) {
            $tools = array_map(function($t) { return sanitize((string)$t); }, $raw['tools']);
            $tools = array_filter($tools);
        } else {
            $tools = array_map('trim', explode(',', (string)$raw['tools']));
            $tools = array_map('sanitize', $tools);
            $tools = array_filter($tools);
        }
    }

    $gallery = array();
    if (isset($raw['gallery']) && is_array($raw['gallery'])) {
        $gallery = array_map(function($u) { return sanitize((string)$u); }, $raw['gallery']);
        $gallery = array_filter($gallery);
        $gallery = array_slice($gallery, 0, 20);
    }

    $order = isset($raw['order']) && is_numeric($raw['order']) ? intval($raw['order']) : 0;

    return array(
        'id' => isset($raw['id']) ? $raw['id'] : generate_uuid(),
        'title' => sanitize((string)arr_get($raw, 'title', '')),
        'category' => sanitize((string)arr_get($raw, 'category', '')),
        'year' => sanitize((string)arr_get($raw, 'year', '')),
        'description' => sanitize((string)arr_get($raw, 'description', '')),
        'role' => sanitize((string)arr_get($raw, 'role', '')),
        'tools' => array_values($tools),
        'video' => sanitize((string)arr_get($raw, 'video', '')),
        'thumbnail' => sanitize((string)arr_get($raw, 'thumbnail', '')),
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
