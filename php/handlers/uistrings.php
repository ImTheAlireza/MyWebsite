<?php
// php/handlers/uistrings.php — UI strings (data/ui-strings.json) editor
// The public site fetches this file directly (js/i18n.js) and the Persian
// page is built from it (tools/build-fa-page.py). The panel edits it here so
// form labels, buttons and nav text are CMS-editable like everything else.

function get_uistrings() {
    $data = json_read('ui-strings.json');
    if (!is_array($data)) $data = array('en' => array(), 'fa' => array());
    send_json($data);
}

function update_uistrings() {
    require_auth();
    $input = get_json_input();
    if (!is_array($input) || !isset($input['en']) || !isset($input['fa'])) {
        send_error('Expected {en: {...}, fa: {...}}', 400);
    }
    $clean = json_read('ui-strings.json');
    if (!is_array($clean) || !isset($clean['en']) || !isset($clean['fa'])) {
        send_error('UI text file could not be read', 500);
    }
    foreach (array('en', 'fa') as $lang) {
        if (!is_array($input[$lang])) continue;
        foreach ($input[$lang] as $key => $value) {
            if (!is_string($key) || !array_key_exists($key, $clean[$lang])) continue;
            if (!is_string($value)) continue;
            $clean[$lang][$key] = clean_content_text($value);
        }
    }
    json_write('ui-strings.json', $clean);
    send_json($clean);
}
