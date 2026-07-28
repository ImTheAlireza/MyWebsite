<?php
// php/response.php — JSON response helpers (PHP 5.6+ compatible)

function send_json($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function send_error($message, $statusCode = 400) {
    send_json(array('error' => $message), $statusCode);
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return array();
    $data = json_decode($raw, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        send_error('Invalid JSON');
    }
    return $data ? $data : array();
}

function sanitize($str) {
    if (!is_string($str)) return $str;
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

function sanitize_obj($obj) {
    if (is_string($obj)) return sanitize($obj);
    if (is_array($obj)) return array_map('sanitize_obj', $obj);
    if (is_object($obj)) {
        $out = new stdClass();
        foreach ($obj as $k => $v) {
            $out->{sanitize($k)} = sanitize_obj($v);
        }
        return $out;
    }
    return $obj;
}

// Helper to safely get array value with default
function arr_get($array, $key, $default = null) {
    return isset($array[$key]) ? $array[$key] : $default;
}
