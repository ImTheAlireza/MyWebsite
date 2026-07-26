<?php
// php/handlers/backup.php — Backup and restore handlers (PHP 5.6+ compatible)

// GET /api/backup
function download_backup() {
    require_auth();

    $bundle = array(
        'version' => 1,
        'exportedAt' => date('c'),
        'projects' => json_read('projects.json'),
        'settings' => json_read('settings.json'),
        'messages' => json_read('messages.json'),
        'tracking' => json_read('tracking.json'),
        'likes' => json_read('likes.json'),
    );

    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="portfolio-backup-' . date('Y-m-d') . '.json"');
    echo json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// POST /api/backup/restore
function restore_backup() {
    require_auth();
    $input = get_json_input();

    if (empty($input['projects']) && empty($input['settings'])) {
        send_error('Invalid backup payload');
    }

    if (!empty($input['projects'])) {
        $projects = isset($input['projects']['projects']) ? $input['projects']['projects'] : $input['projects'];
        if (is_array($projects)) {
            $normalized = array_map('normalize_project', $projects);
            json_write('projects.json', array('projects' => $normalized));
        }
    }

    if (!empty($input['settings']) && is_array($input['settings'])) {
        global $DEFAULT_SETTINGS;
        $settings = array_merge($DEFAULT_SETTINGS, $input['settings']);
        json_write('settings.json', $settings);
    }

    if (!empty($input['messages']) && is_array($input['messages'])) {
        $messages = isset($input['messages']['messages']) ? $input['messages']['messages'] : $input['messages'];
        json_write('messages.json', array('messages' => $messages));
    }

    if (!empty($input['likes']) && is_array($input['likes'])) {
        $likes = isset($input['likes']['likes']) ? $input['likes']['likes'] : $input['likes'];
        json_write('likes.json', array('likes' => $likes));
    }

    if (!empty($input['tracking']) && is_array($input['tracking'])) {
        json_write('tracking.json', array(
            'events' => isset($input['tracking']['events']) ? $input['tracking']['events'] : array(),
            'visitors' => isset($input['tracking']['visitors']) ? $input['tracking']['visitors'] : array(),
        ));
    }

    send_json(array('success' => true, 'message' => 'Backup restored'));
}
