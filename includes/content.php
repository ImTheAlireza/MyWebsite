<?php

function content_path()
{
    return dirname(__DIR__) . '/data/content.json';
}

function content_defaults()
{
    return array(
        'site' => array(
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
        ),
        'nav' => array(
            array('label' => 'Work', 'href' => '#work'),
            array('label' => 'Services', 'href' => '#services'),
            array('label' => 'About', 'href' => '#about'),
            array('label' => 'Contact', 'href' => '#contact'),
        ),
        'works' => array(),
        'services' => array(),
        'about' => array(
            'paragraphs' => array(),
            'portrait_placeholder' => 'Add a portrait or workspace photo',
            'portrait_image' => '',
            'details' => array(),
            'experience' => array(),
            'education' => array(),
        ),
        'contact' => array(
            'intro' => '',
            'form_types' => array(),
        ),
    );
}

function content_deep_merge($defaults, $overrides)
{
    if (!is_array($defaults) || !is_array($overrides)) {
        return $overrides;
    }
    $isAssoc = array_keys($defaults) !== range(0, count($defaults) - 1);
    if (!$isAssoc) {
        return $overrides;
    }
    $result = $defaults;
    foreach ($overrides as $key => $value) {
        if (isset($defaults[$key]) && is_array($defaults[$key]) && is_array($value)) {
            $result[$key] = content_deep_merge($defaults[$key], $value);
        } else {
            $result[$key] = $value;
        }
    }
    return $result;
}

function load_content()
{
    $defaults = content_defaults();
    $path = content_path();
    if (!file_exists($path)) {
        return $defaults;
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return $defaults;
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return $defaults;
    }
    // Merge top-level sections carefully; for lists we take saved value as-is.
    $merged = $defaults;
    foreach ($defaults as $key => $defaultValue) {
        if (array_key_exists($key, $data)) {
            if (is_array($defaultValue) && is_array($data[$key])) {
                $defaultIsList = array_keys($defaultValue) === range(0, count($defaultValue) - 1);
                if ($defaultIsList) {
                    $merged[$key] = $data[$key];
                } else {
                    $merged[$key] = content_deep_merge($defaultValue, $data[$key]);
                }
            } else {
                $merged[$key] = $data[$key];
            }
        }
    }
    // Keep any extra keys
    foreach ($data as $key => $value) {
        if (!array_key_exists($key, $merged)) {
            $merged[$key] = $value;
        }
    }
    return $merged;
}

function save_content($data)
{
    $path = content_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = $path . '.tmp';
    $ok = file_put_contents($tmp, $json, LOCK_EX);
    if ($ok === false) {
        return false;
    }
    return rename($tmp, $path);
}
