<?php

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'");
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443);
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(array(
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ));
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $isHttps, true);
}
session_start();

require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/env.php';
require_once dirname(__DIR__) . '/includes/content.php';

load_env(dirname(__DIR__) . '/.env');

function admin_data_path($file)
{
    return dirname(__DIR__) . '/data/' . $file;
}

function admin_ensure_default()
{
    $path = admin_data_path('admin.json');
    if (file_exists($path)) {
        return;
    }
    // Provision credentials explicitly through .env; never create a known password.
    return;
}

function admin_load()
{
    $path = admin_data_path('admin.json');
    if (!file_exists($path)) {
        admin_ensure_default();
    }
    if (!file_exists($path)) {
        return array('username' => 'admin', 'salt' => '', 'password_hash' => '');
    }
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : array('username' => 'admin', 'salt' => '', 'password_hash' => '');
}

function admin_save($data)
{
    $path = admin_data_path('admin.json');
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ok = file_put_contents($path, $json, LOCK_EX) !== false;
    if ($ok) @chmod($path, 0600);
    return $ok;
}

function admin_hash_password($password, $salt)
{
    return password_hash((string) $password, PASSWORD_DEFAULT);
}

function admin_env_credentials()
{
    $user = env_get('ADMIN_USERNAME', null);
    $pass = env_get('ADMIN_PASSWORD', null);
    if ($user === null || $pass === null || $pass === '') {
        return null;
    }
    return array('username' => (string) $user, 'password' => (string) $pass);
}

function admin_using_env()
{
    return admin_env_credentials() !== null;
}

function admin_verify($username, $password)
{
    $env = admin_env_credentials();
    if ($env !== null) {
        if (strlen($env['password']) < 12 || in_array($env['password'], array('admin1234', 'change_me_strong_password'), true)) return false;
        return hash_equals((string) $env['username'], (string) $username)
            && hash_equals((string) $env['password'], (string) $password);
    }

    $admin = admin_load();
    if (!isset($admin['username']) || $admin['username'] !== $username) {
        return false;
    }
    $salt = isset($admin['salt']) ? $admin['salt'] : '';
    $hash = isset($admin['password_hash']) ? $admin['password_hash'] : '';
    if ($hash === '' || $password === 'admin1234') return false;
    $legacy = substr($hash, 0, 1) !== '$';
    $valid = $legacy ? hash_equals($hash, hash('sha256', $salt . (string) $password)) : password_verify($password, $hash);
    if ($valid && ($legacy || password_needs_rehash($hash, PASSWORD_DEFAULT))) {
        $admin['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        $admin['salt'] = '';
        admin_save($admin);
    }
    return $valid;
}

function admin_logged_in()
{
    if (empty($_SESSION['admin_logged_in'])) return false;
    $now = time();
    if (empty($_SESSION['login_time']) || empty($_SESSION['last_activity']) || $now - $_SESSION['last_activity'] > 1800 || $now - $_SESSION['login_time'] > 28800) {
        $_SESSION = array();
        session_regenerate_id(true);
        return false;
    }
    $_SESSION['last_activity'] = $now;
    return true;
}

function admin_require_login()
{
    if (!admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

function csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = function_exists('random_bytes') ? bin2hex(random_bytes(16)) : md5(uniqid(mt_rand(), true));
    }
    return $_SESSION['csrf_token'];
}

function csrf_check()
{
    $token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
    if (!is_string($token) || !$token || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(400);
        echo 'Invalid CSRF token.';
        exit;
    }
}

function admin_redirect($url)
{
    header('Location: ' . $url);
    exit;
}
