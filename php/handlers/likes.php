<?php
// php/handlers/likes.php — Likes handlers (PHP 5.6+ compatible)
// Format: { likes: { projectId: [visitorId, ...] } }

// GET /api/projects/:id/likes
function get_likes($id) {
    $data = json_read('likes.json');
    $likes = arr_get($data, 'likes', array());
    $count = (is_array($likes) && isset($likes[$id]) && is_array($likes[$id])) ? count($likes[$id]) : 0;
    send_json(array('count' => $count));
}

// POST /api/projects/:id/like
function toggle_like($id) {
    $input = get_json_input();
    $visitorId = arr_get($input, 'visitorId', '');

    if (!$visitorId || !is_string($visitorId) || strlen($visitorId) > 80) {
        send_error('visitorId required');
    }

    $visitorId = sanitize($visitorId);

    $data = json_read('likes.json');
    $likes = arr_get($data, 'likes', array());

    if (!is_array($likes)) $likes = array();
    if (!isset($likes[$id])) $likes[$id] = array();

    $idx = array_search($visitorId, $likes[$id]);
    if ($idx !== false) {
        // Unlike
        array_splice($likes[$id], $idx, 1);
        $liked = false;
    } else {
        // Like
        $likes[$id][] = $visitorId;
        $liked = true;
    }

    $count = count($likes[$id]);

    json_write('likes.json', array('likes' => $likes));
    send_json(array('count' => $count, 'liked' => $liked));
}
