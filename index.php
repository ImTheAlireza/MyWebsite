<?php
// index.php — Handles both static pages and API routes

$uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
$path = parse_url($uri, PHP_URL_PATH);

// Route /api/* to api.php
if (preg_match('#^/api(/.*)?$#', $path, $m)) {
    $subpath = isset($m[1]) ? $m[1] : '/';
    $_GET['_query'] = $subpath;
    require __DIR__ . '/api.php';
    exit;
}

// Route /api.php to api.php
if ($path === '/api.php') {
    require __DIR__ . '/api.php';
    exit;
}

// Everything else: serve index.html
readfile(__DIR__ . '/index.html');
