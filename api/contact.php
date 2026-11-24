<?php

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'error' => 'Method not allowed'));
    exit;
}

require_once dirname(__DIR__) . '/includes/env.php';
load_env(dirname(__DIR__) . '/.env');

function json_response($ok, $message, $code)
{
    http_response_code($code);
    echo json_encode(array('ok' => $ok, 'message' => $message));
    exit;
}

function get_field($key)
{
    if (isset($_POST[$key])) return trim((string) $_POST[$key]);
    $raw = file_get_contents('php://input');
    if ($raw) {
        $data = json_decode($raw, true);
        if (is_array($data) && isset($data[$key])) return trim((string) $data[$key]);
    }
    return '';
}

$name = get_field('name');
$email = get_field('email');
$type = get_field('type');
$message = get_field('message');

if ($name === '' || $email === '' || $message === '') {
    json_response(false, 'Please fill in all required fields.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Please enter a valid email address.', 422);
}
if (strlen($name) > 200 || strlen($email) > 200 || strlen($type) > 200 || strlen($message) > 5000) {
    json_response(false, 'Input is too long.', 422);
}

$token = env_get('TELEGRAM_BOT_TOKEN', '');
$chatId = env_get('TELEGRAM_CHAT_ID', '');
if ($token === '' || $chatId === '') {
    json_response(false, 'Telegram is not configured on the server.', 500);
}

$text = "New website message\n\n";
$text .= "Name: " . $name . "\n";
$text .= "Email: " . $email . "\n";
$text .= "Type: " . $type . "\n\n";
$text .= "Message:\n" . $message;

$payload = array(
    'chat_id' => $chatId,
    'text' => $text,
);

$url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
$ok = false;
$responseBody = '';
$httpCode = 0;
$curlErr = '';

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    $responseBody = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($responseBody !== false && $httpCode >= 200 && $httpCode < 300) {
        $decoded = json_decode($responseBody, true);
        $ok = is_array($decoded) && !empty($decoded['ok']);
    }
} else {
    $context = stream_context_create(array(
        'http' => array(
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query($payload),
            'timeout' => 15,
            'ignore_errors' => true,
        )
    ));
    $responseBody = @file_get_contents($url, false, $context);
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (preg_match('#HTTP/\S+\s+(\d+)#', $h, $m)) {
                $httpCode = (int) $m[1];
            }
        }
    }
    if ($responseBody !== false) {
        $decoded = json_decode($responseBody, true);
        $ok = is_array($decoded) && !empty($decoded['ok']);
    } else {
        $curlErr = 'HTTP request failed';
    }
}

if ($ok) {
    json_response(true, 'Message sent successfully.', 200);
}

$detail = 'Failed to send message to Telegram.';
if ($curlErr !== '') {
    $detail .= ' Curl error: ' . $curlErr;
}
if ($httpCode) {
    $detail .= ' HTTP ' . $httpCode;
}
if ($responseBody) {
    $decoded = json_decode($responseBody, true);
    if (is_array($decoded) && isset($decoded['description'])) {
        $detail .= ' - ' . $decoded['description'];
    }
}
error_log('[contact] Telegram send failed: ' . $detail . ' body=' . substr((string) $responseBody, 0, 500));
json_response(false, $detail, 502);
