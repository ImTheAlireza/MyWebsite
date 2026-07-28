<?php
// php/db.php — JSON file read/write with file locking (PHP 5.6+ compatible)

define('DATA_DIR', __DIR__ . '/../data');

function json_read($filename) {
    $path = DATA_DIR . '/' . $filename;
    if (!file_exists($path)) return null;
    $content = file_get_contents($path);
    $data = json_decode($content, true);
    return $data;
}

function json_write($filename, $data) {
    $path = DATA_DIR . '/' . $filename;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        send_error('Failed to encode data', 500);
    }
    $fp = fopen($path, 'c');
    if (!$fp) {
        send_error('Failed to write data file', 500);
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function generate_uuid() {
    // random_bytes() only exists in PHP 7+. Keep uploads working on the
    // PHP 5.6 hosts supported by this project by using OpenSSL when needed.
    if (function_exists('random_bytes')) {
        $data = random_bytes(16);
    } elseif (function_exists('openssl_random_pseudo_bytes')) {
        $data = openssl_random_pseudo_bytes(16);
    } else {
        // Last-resort compatibility fallback for hosts without OpenSSL.
        $seed = uniqid((string)mt_rand(), true) . microtime(true);
        $data = substr(hash('sha256', $seed, true), 0, 16);
    }

    if ($data === false || strlen($data) < 16) {
        $seed = uniqid((string)mt_rand(), true) . microtime(true);
        $data = substr(hash('sha256', $seed, true), 0, 16);
    }

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s', str_split(bin2hex($data), 4));
}
