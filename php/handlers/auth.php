<?php
// php/handlers/auth.php — Authentication handlers (PHP 5.6+ compatible)

// POST /api/auth/login
function login() {
    $input = get_json_input();
    $username = arr_get($input, 'username', '');
    $password = arr_get($input, 'password', '');

    if (!$username || !$password) {
        send_error('Username and password required');
    }

    $data = json_read('users.json');
    $users = arr_get($data, 'users', array());
    $found = null;

    foreach ($users as $user) {
        if ($user['username'] === $username) {
            $found = $user;
            break;
        }
    }

    if (!$found || !password_verify($password, $found['password'])) {
        send_error('Invalid credentials', 401);
    }

    $token = jwt_encode(array(
        'id' => $found['id'],
        'username' => $found['username'],
        'role' => arr_get($found, 'role', 'admin'),
    ));

    set_auth_cookie($token);
    send_json(array('success' => true, 'username' => $found['username']));
}

// POST /api/auth/logout
function logout_handler() {
    clear_auth_cookie();
    send_json(array('success' => true));
}

// GET /api/auth/check
function check_auth() {
    $user = require_auth();
    send_json(array(
        'authenticated' => true,
        'user' => array(
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => arr_get($user, 'role', 'admin'),
        ),
    ));
}

// POST /api/auth/password
function change_password() {
    $user = require_auth();
    $input = get_json_input();
    $currentPassword = arr_get($input, 'currentPassword', '');
    $newPassword = arr_get($input, 'newPassword', '');

    if (!$currentPassword || !$newPassword) {
        send_error('Current and new password required');
    }
    if (strlen($newPassword) < 8) {
        send_error('New password must be at least 8 characters');
    }
    if (strlen($newPassword) > 128) {
        send_error('Password too long');
    }

    $data = json_read('users.json');
    $users = arr_get($data, 'users', array());
    $found = false;

    foreach ($users as $idx => &$u) {
        if ($u['id'] == $user['id'] || $u['username'] === $user['username']) {
            if (!password_verify($currentPassword, $u['password'])) {
                send_error('Current password is incorrect', 401);
            }
            $u['password'] = password_hash($newPassword, PASSWORD_BCRYPT, array('cost' => 12));
            $found = true;
            break;
        }
    }
    unset($u);

    if (!$found) send_error('User not found', 404);

    json_write('users.json', array('users' => $users));
    send_json(array('success' => true, 'message' => 'Password updated'));
}
