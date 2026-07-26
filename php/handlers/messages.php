<?php
// php/handlers/messages.php — Messages handlers (PHP 5.6+ compatible)

// GET /api/messages
function list_messages() {
    require_auth();
    $data = json_read('messages.json');
    send_json($data ? $data : array('messages' => array()));
}

// POST /api/messages
function create_message() {
    $input = get_json_input();
    $name = arr_get($input, 'name', '');
    $email = arr_get($input, 'email', '');
    $message = arr_get($input, 'message', '');

    if (!$name || !$email || !$message) {
        send_error('Name, email, and message are required');
    }

    $emailOk = preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email);
    if (!$emailOk) send_error('Invalid email');

    if (strlen($message) > 5000) send_error('Message too long');

    $data = json_read('messages.json');
    $messages = arr_get($data, 'messages', array());

    $msg = array(
        'id' => generate_uuid(),
        'name' => sanitize(substr($name, 0, 200)),
        'email' => sanitize(substr($email, 0, 200)),
        'message' => sanitize(substr($message, 0, 5000)),
        'read' => false,
        'createdAt' => date('c'),
    );

    array_unshift($messages, $msg);

    // Cap at 500
    if (count($messages) > 500) {
        $messages = array_slice($messages, 0, 500);
    }

    json_write('messages.json', array('messages' => $messages));
    send_json(array('success' => true));
}

// PUT /api/messages/:id/read
function mark_read($id) {
    require_auth();

    $data = json_read('messages.json');
    $messages = arr_get($data, 'messages', array());
    $found = false;

    foreach ($messages as &$m) {
        if ((string)$m['id'] === (string)$id) {
            $m['read'] = true;
            $found = true;
            break;
        }
    }
    unset($m);

    if (!$found) send_error('Message not found', 404);

    json_write('messages.json', array('messages' => $messages));
    send_json(array('success' => true));
}

// DELETE /api/messages/:id
function delete_message($id) {
    require_auth();

    $data = json_read('messages.json');
    $messages = arr_get($data, 'messages', array());
    $newMessages = array();
    $found = false;

    foreach ($messages as $m) {
        if ((string)$m['id'] === (string)$id) {
            $found = true;
        } else {
            $newMessages[] = $m;
        }
    }

    if (!$found) send_error('Message not found', 404);

    json_write('messages.json', array('messages' => $newMessages));
    send_json(array('success' => true));
}

// DELETE /api/messages (clear all)
function clear_all_messages() {
    require_auth();
    json_write('messages.json', array('messages' => array()));
    send_json(array('success' => true));
}
