<?php
// api.php — Single entry point for all API requests
// Works without mod_rewrite on any hosting

$base = __DIR__;

require_once $base . '/php/db.php';
require_once $base . '/php/auth.php';
require_once $base . '/php/response.php';
require_once $base . '/php/helpers.php';

// Initialize default data
init_default_data();

// Parse route — use _query parameter (works on any hosting)
$path = isset($_GET['_query']) ? $_GET['_query'] : '/';
$path = '/' . ltrim($path, '/');

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

// ============================================
// ROUTES
// ============================================

// AUTH
if ($path === '/auth/login' && $method === 'POST') {
    require $base . '/php/handlers/auth.php';
    login(); return;
}
if ($path === '/auth/logout' && $method === 'POST') {
    require $base . '/php/handlers/auth.php';
    logout_handler(); return;
}
if ($path === '/auth/check' && $method === 'GET') {
    require $base . '/php/handlers/auth.php';
    check_auth(); return;
}
if ($path === '/auth/password' && $method === 'POST') {
    require $base . '/php/handlers/auth.php';
    change_password(); return;
}

// PROJECTS
if ($path === '/projects' && $method === 'GET') {
    require $base . '/php/handlers/projects.php';
    list_projects(); return;
}
if ($path === '/brands' && $method === 'POST') { require $base . '/php/handlers/brands.php'; create_brand(); return; }
if (preg_match('#^/brands/([a-f0-9-]+)$#i', $path, $m) && $method === 'PUT') { require $base . '/php/handlers/brands.php'; update_brand($m[1]); return; }
if (preg_match('#^/brands/([a-f0-9-]+)$#i', $path, $m) && $method === 'DELETE') { require $base . '/php/handlers/brands.php'; delete_brand($m[1]); return; }

if ($path === '/projects' && $method === 'POST') {
    require $base . '/php/handlers/projects.php';
    create_project(); return;
}
if ($path === '/projects/reorder' && $method === 'PUT') {
    require $base . '/php/handlers/projects.php';
    reorder_projects(); return;
}
if (preg_match('#^/projects/([a-f0-9-]+)$#i', $path, $m) && $method === 'PUT') {
    require $base . '/php/handlers/projects.php';
    update_project($m[1]); return;
}
if (preg_match('#^/projects/([a-f0-9-]+)$#i', $path, $m) && $method === 'DELETE') {
    require $base . '/php/handlers/projects.php';
    delete_project($m[1]); return;
}

// LIKES
if (preg_match('#^/projects/([a-f0-9-]+)/likes$#i', $path, $m) && $method === 'GET') {
    require $base . '/php/handlers/likes.php';
    get_likes($m[1]); return;
}
if (preg_match('#^/projects/([a-f0-9-]+)/like$#i', $path, $m) && $method === 'POST') {
    require $base . '/php/handlers/likes.php';
    toggle_like($m[1]); return;
}

// SETTINGS
if ($path === '/settings' && $method === 'GET') {
    require $base . '/php/handlers/settings.php';
    get_settings(); return;
}
if ($path === '/settings' && $method === 'PUT') {
    require $base . '/php/handlers/settings.php';
    update_settings(); return;
}

// MESSAGES
if ($path === '/messages' && $method === 'GET') {
    require $base . '/php/handlers/messages.php';
    list_messages(); return;
}
if ($path === '/messages' && $method === 'POST') {
    require $base . '/php/handlers/messages.php';
    create_message(); return;
}
if ($path === '/messages' && $method === 'DELETE') {
    require $base . '/php/handlers/messages.php';
    clear_all_messages(); return;
}
if (preg_match('#^/messages/([a-f0-9-]+)/read$#i', $path, $m) && $method === 'PUT') {
    require $base . '/php/handlers/messages.php';
    mark_read($m[1]); return;
}
if (preg_match('#^/messages/([a-f0-9-]+)$#i', $path, $m) && $method === 'DELETE') {
    require $base . '/php/handlers/messages.php';
    delete_message($m[1]); return;
}

// STATISTICS
if ($path === '/statistics' && $method === 'GET') {
    require $base . '/php/handlers/statistics.php';
    get_statistics(); return;
}

// TRACKING
if ($path === '/track' && $method === 'POST') {
    require $base . '/php/handlers/tracking.php';
    track_event(); return;
}
if ($path === '/tracking/reset' && $method === 'POST') {
    require $base . '/php/handlers/tracking.php';
    reset_tracking(); return;
}
if ($path === '/tracking/export' && $method === 'GET') {
    require $base . '/php/handlers/tracking.php';
    export_tracking(); return;
}

// UPLOAD
if ($path === '/upload' && $method === 'POST') {
    require $base . '/php/handlers/upload.php';
    upload_file(); return;
}
if (preg_match('#^/upload/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    require $base . '/php/handlers/upload.php';
    delete_file(urldecode($m[1])); return;
}

// ASSETS
if ($path === '/assets' && $method === 'GET') {
    require $base . '/php/handlers/upload.php';
    list_assets(); return;
}
if ($path === '/assets/purge-orphans' && $method === 'POST') {
    require $base . '/php/handlers/upload.php';
    purge_orphans(); return;
}

// BACKUP
if ($path === '/backup' && $method === 'GET') {
    require $base . '/php/handlers/backup.php';
    download_backup(); return;
}
if ($path === '/backup/restore' && $method === 'POST') {
    require $base . '/php/handlers/backup.php';
    restore_backup(); return;
}

// No match
send_error('Not found', 404);
