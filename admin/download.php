<?php
require_once __DIR__ . '/init.php';
admin_require_login();

function safe_rel_path_dl($path)
{
    $path = str_replace('\\', '/', (string) $path);
    $path = preg_replace('#/+#', '/', $path);
    $parts = array();
    foreach (explode('/', $path) as $part) {
        if ($part === '' || $part === '.') continue;
        if ($part === '..') return null;
        $parts[] = $part;
    }
    return implode('/', $parts);
}

$rel = isset($_GET['file']) ? safe_rel_path_dl($_GET['file']) : null;
if ($rel === null) {
    http_response_code(400);
    exit('Invalid file.');
}

$base = dirname(__DIR__) . '/uploads';
$full = $base . '/' . $rel;
$realBase = realpath($base);
$realFull = realpath($full);

if (!$realBase || !$realFull || strpos($realFull, $realBase) !== 0 || !is_file($realFull)) {
    http_response_code(404);
    exit('File not found.');
}

$name = basename($realFull);
$size = filesize($realFull);
$finfoType = function_exists('mime_content_type') ? mime_content_type($realFull) : 'application/octet-stream';

header('Content-Description: File Transfer');
header('Content-Type: ' . $finfoType);
header('Content-Disposition: attachment; filename="' . rawurlencode($name) . '"');
header('Content-Length: ' . $size);
header('X-Content-Type-Options: nosniff');
readfile($realFull);
exit;
