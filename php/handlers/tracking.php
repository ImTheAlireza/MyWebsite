<?php
// php/handlers/tracking.php — Tracking handlers (PHP 5.6+ compatible)

function hash_ip($ip) {
    return substr(hash('sha256', $ip . '|' . JWT_SECRET), 0, 16);
}

// POST /api/track
function track_event() {
    $input = get_json_input();
    $type = arr_get($input, 'type', '');

    if (!$type || !is_string($type)) send_error('type required');

    $allowed = array('pageview', 'heartbeat', 'resume_download', 'project_click');
    if (!in_array($type, $allowed)) send_error('invalid type');

    $sessionId = isset($input['sessionId']) ? sanitize(substr((string)$input['sessionId'], 0, 80)) : 'anon';
    $visitorId = arr_get($input, 'visitorId', '');
    $page = isset($input['page']) ? sanitize(substr((string)$input['page'], 0, 200)) : '';
    $projectId = isset($input['projectId']) ? sanitize(substr((string)$input['projectId'], 0, 80)) : null;
    $location = isset($input['location']) ? sanitize(substr((string)$input['location'], 0, 120)) : '';

    $ip = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
    $ipHash = hash_ip($ip);

    $data = json_read('tracking.json');
    $events = arr_get($data, 'events', array());
    $visitors = arr_get($data, 'visitors', array());

    // Deduplicate: skip if same event within 10 seconds
    $now = time();
    $recentKey = $type . ':' . $sessionId;
    $deduped = false;
    foreach ($events as $e) {
        $eType = arr_get($e, 'type', '');
        $eSid = arr_get($e, 'sessionId', 'anon');
        $eKey = $eType . ':' . $eSid;
        $eTs = arr_get($e, 'timestamp', '');
        if ($eKey === $recentKey && ($now - strtotime($eTs)) < 10) {
            $deduped = true;
            break;
        }
    }

    if (!$deduped || $type === 'heartbeat') {
        $event = array(
            'type' => $type,
            'page' => $page,
            'projectId' => $projectId,
            'sessionId' => $sessionId,
            'location' => $location,
            'visitorHash' => $ipHash,
            'timestamp' => date('c'),
        );

        if (!$deduped) {
            $events[] = $event;
        }

        // Track visitor
        if ($ipHash) {
            $visitors[$ipHash] = date('c');
        }

        // Prune old data (30 days)
        $cutoff = time() - (30 * 24 * 60 * 60);
        $newVisitors = array();
        foreach ($visitors as $k => $ts) {
            if (strtotime($ts) > $cutoff) $newVisitors[$k] = $ts;
        }
        $visitors = $newVisitors;

        $newEvents = array();
        foreach ($events as $e) {
            if (strtotime(arr_get($e, 'timestamp', '')) > $cutoff) $newEvents[] = $e;
        }
        $events = $newEvents;

        // Hard cap
        if (count($events) > 20000) {
            $events = array_slice($events, -15000);
        }

        json_write('tracking.json', array(
            'events' => $events,
            'visitors' => $visitors,
        ));
    }

    send_json(array('success' => true));
}

// POST /api/tracking/reset
function reset_tracking() {
    require_auth();
    json_write('tracking.json', array('events' => array(), 'visitors' => array()));
    json_write('likes.json', array('likes' => array()));
    send_json(array('success' => true, 'message' => 'Analytics reset'));
}

// GET /api/tracking/export
function export_tracking() {
    require_auth();

    $tracking = json_read('tracking.json');
    $likesData = json_read('likes.json');
    $projects = json_read('projects.json');
    $messages = json_read('messages.json');

    $totalLikes = 0;
    $likesArr = arr_get($likesData, 'likes', array());
    if (is_array($likesArr)) {
        foreach ($likesArr as $visitors) {
            if (is_array($visitors)) $totalLikes += count($visitors);
        }
    }

    $exportData = array(
        'exportedAt' => date('c'),
        'summary' => array(
            'totalEvents' => count(arr_get($tracking, 'events', array())),
            'uniqueVisitors' => count(arr_get($tracking, 'visitors', array())),
            'totalLikes' => $totalLikes,
            'totalProjects' => count(arr_get($projects, 'projects', array())),
            'totalMessages' => count(arr_get($messages, 'messages', array())),
        ),
        'events' => arr_get($tracking, 'events', array()),
        'likes' => $likesArr,
        'projects' => array_map(function($p) {
            return array('id' => $p['id'], 'title' => $p['title'], 'category' => arr_get($p, 'category', ''), 'year' => arr_get($p, 'year', ''));
        }, arr_get($projects, 'projects', array())),
        'messages' => array_map(function($m) {
            return array(
                'id' => $m['id'], 'name' => $m['name'], 'email' => $m['email'],
                'message' => $m['message'], 'read' => $m['read'], 'createdAt' => $m['createdAt'],
            );
        }, arr_get($messages, 'messages', array())),
    );

    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="portfolio-analytics-' . date('Y-m-d') . '.json"');
    echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
