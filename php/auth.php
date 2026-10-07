<?php
// php/auth.php — JWT implementation + auth helpers (PHP 5.6+ compatible)

// Load config from .env file or use defaults
$env_file = __DIR__ . '/../.env';
$env = array();
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
}

/**
 * Signing secret for the admin session token.
 *
 * It must never be guessable: this repository is public, so a hard-coded
 * default would let anyone mint a valid admin token. Resolution order:
 *   1. JWT_SECRET in .env (recommended for production)
 *   2. a random secret generated once and stored in data/.jwt-secret
 *      (blocked from the web by data/.htaccess, kept out of git)
 *   3. the old fallback, only if the data directory is not writable
 */
if (!defined('JWT_SECRET')) {
    $configuredSecret = isset($env['JWT_SECRET']) ? trim($env['JWT_SECRET']) : '';
    if ($configuredSecret === '' || $configuredSecret === 'fallback-secret-change-me') {
        $secretFile = __DIR__ . '/../data/.jwt-secret';
        $storedSecret = '';
        if (file_exists($secretFile)) {
            $storedSecret = trim((string)@file_get_contents($secretFile));
        }
        if (strlen($storedSecret) < 32) {
            if (function_exists('random_bytes')) {
                $fresh = bin2hex(random_bytes(32));
            } elseif (function_exists('openssl_random_pseudo_bytes')) {
                $fresh = bin2hex(openssl_random_pseudo_bytes(32));
            } else {
                $fresh = hash('sha256', uniqid((string)mt_rand(), true) . microtime(true));
            }
            if (@file_put_contents($secretFile, $fresh, LOCK_EX) !== false) {
                @chmod($secretFile, 0600);
                $storedSecret = $fresh;
            }
        }
        $configuredSecret = $storedSecret !== '' ? $storedSecret : 'fallback-secret-change-me';
    }
    define('JWT_SECRET', $configuredSecret);
}
if (!defined('ADMIN_USER')) {
    define('ADMIN_USER', isset($env['ADMIN_USER']) ? $env['ADMIN_USER'] : 'admin');
}
if (!defined('ADMIN_PASS')) {
    define('ADMIN_PASS', isset($env['ADMIN_PASS']) ? $env['ADMIN_PASS'] : 'admin123');
}

define('JWT_ALGO', 'HS256');

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload) {
    $header = json_encode(array('typ' => 'JWT', 'alg' => JWT_ALGO));
    $payload['iat'] = time();
    $payload['exp'] = time() + (60 * 60 * 24); // 24 hours
    $payload = json_encode($payload);

    $base64Header = base64url_encode($header);
    $base64Payload = base64url_encode($payload);
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = base64url_encode($signature);

    return "$base64Header.$base64Payload.$base64Signature";
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    $header = $parts[0];
    $payload = $parts[1];
    $signature = $parts[2];

    $expected = hash_hmac('sha256', "$header.$payload", JWT_SECRET, true);
    $actual = base64url_decode($signature);

    if (!hash_equals($expected, $actual)) return null;

    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return null;

    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

function try_auth() {
    $token = isset($_COOKIE['token']) ? $_COOKIE['token'] : null;
    if (!$token) return null;
    return jwt_decode($token);
}

function require_auth() {
    $user = try_auth();
    if (!$user) {
        send_error('Unauthorized', 401);
    }
    return $user;
}

function optional_auth() {
    return try_auth();
}

function set_auth_cookie($token) {
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    if (PHP_VERSION_ID >= 70300) {
        // SameSite=Lax stops the session cookie from riding along on
        // cross-site form posts (CSRF).
        setcookie('token', $token, array(
            'expires' => time() + (60 * 60 * 24),
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ));
        return;
    }
    setcookie('token', $token, time() + (60 * 60 * 24), '/', '', $secure, true);
}

function clear_auth_cookie() {
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    if (PHP_VERSION_ID >= 70300) {
        setcookie('token', '', array(
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ));
        return;
    }
    setcookie('token', '', time() - 3600, '/', '', $secure, true);
}

// Initialize default data on first run
function init_default_data() {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    if (!is_dir(__DIR__ . '/../uploads')) mkdir(__DIR__ . '/../uploads', 0755, true);

    if (!file_exists(DATA_DIR . '/users.json')) {
        $hash = password_hash(ADMIN_PASS, PASSWORD_BCRYPT, array('cost' => 10));
        json_write('users.json', array(
            'users' => array(array('id' => 1, 'username' => ADMIN_USER, 'password' => $hash, 'role' => 'admin'))
        ));
    }

    if (!file_exists(DATA_DIR . '/projects.json')) {
        json_write('projects.json', array('projects' => array()));
    }

    if (!file_exists(DATA_DIR . '/messages.json')) {
        json_write('messages.json', array('messages' => array()));
    }

    if (!file_exists(DATA_DIR . '/tracking.json')) {
        json_write('tracking.json', array('events' => array(), 'visitors' => array()));
    }

    if (!file_exists(DATA_DIR . '/likes.json')) {
        json_write('likes.json', array('likes' => array()));
    }
}
