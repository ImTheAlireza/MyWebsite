<?php

session_start();

require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/content.php';

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
    $salt = function_exists('random_bytes') ? bin2hex(random_bytes(16)) : md5(uniqid(mt_rand(), true));
    $data = array(
        'username' => 'admin',
        'salt' => $salt,
        'password_hash' => admin_hash_password('admin1234', $salt),
    );
    admin_save($data);
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
    return file_put_contents($path, $json, LOCK_EX) !== false;
}

function admin_hash_password($password, $salt)
{
    return hash('sha256', $salt . (string) $password);
}

function admin_verify($username, $password)
{
    $admin = admin_load();
    if (!isset($admin['username']) || $admin['username'] !== $username) {
        return false;
    }
    $salt = isset($admin['salt']) ? $admin['salt'] : '';
    $hash = isset($admin['password_hash']) ? $admin['password_hash'] : '';
    return hash_equals($hash, admin_hash_password($password, $salt));
}

function admin_logged_in()
{
    return !empty($_SESSION['admin_logged_in']);
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
    if (!$token || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
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
