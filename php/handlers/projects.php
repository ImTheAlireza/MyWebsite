<?php
// php/handlers/projects.php — Projects CRUD handlers (PHP 5.6+ compatible)

// GET /api/projects
function list_projects() {
    $user = optional_auth();
    $data = json_read('projects.json');
    $projects = arr_get($data, 'projects', array());

    $projects = array_map('normalize_project', $projects);

    if (!$user) {
        $projects = array_values(array_filter($projects, function($p) {
            return $p['published'] !== false;
        }));
    }

    $projects = sort_projects($projects);
    send_json(array('projects' => $projects));
}

// POST /api/projects
function create_project() {
    require_auth();
    $input = get_json_input();

    if (empty($input['title']) || !trim($input['title'])) {
        send_error('Title is required');
    }

    $data = json_read('projects.json');
    $projects = arr_get($data, 'projects', array());

    $maxOrder = -1;
    foreach ($projects as $p) {
        $o = isset($p['order']) ? intval($p['order']) : 0;
        if ($o > $maxOrder) $maxOrder = $o;
    }

    $input['id'] = generate_uuid();
    $input['order'] = isset($input['order']) ? $input['order'] : $maxOrder + 1;
    $input['createdAt'] = date('c');
    $input['updatedAt'] = null;
    $created = normalize_project($input);

    $projects[] = $created;
    json_write('projects.json', array('projects' => $projects));
    send_json($created);
}

// PUT /api/projects/reorder
function reorder_projects() {
    require_auth();
    $input = get_json_input();
    $ids = arr_get($input, 'ids', array());

    if (!is_array($ids) || empty($ids)) {
        send_error('ids array required');
    }

    $data = json_read('projects.json');
    $projects = arr_get($data, 'projects', array());

    $map = array();
    foreach ($projects as $idx => &$p) {
        $map[(string)$p['id']] = $idx;
    }
    unset($p);

    foreach ($ids as $index => $id) {
        $key = (string)$id;
        if (isset($map[$key])) {
            $projects[$map[$key]]['order'] = $index;
            $projects[$map[$key]]['updatedAt'] = date('c');
        }
    }

    json_write('projects.json', array('projects' => $projects));
    send_json(array('success' => true));
}

// PUT /api/projects/:id
function update_project($id) {
    require_auth();
    $input = get_json_input();

    $data = json_read('projects.json');
    $projects = arr_get($data, 'projects', array());
    $found = false;
    $result = null;

    foreach ($projects as $idx => &$p) {
        if ((string)$p['id'] === (string)$id) {
            $merged = array_merge($p, $input);
            $merged['id'] = $p['id'];
            $merged['createdAt'] = arr_get($p, 'createdAt', date('c'));
            $merged['updatedAt'] = date('c');
            $p = normalize_project($merged);
            $result = $p;
            $found = true;
            break;
        }
    }
    unset($p);

    if (!$found) send_error('Project not found', 404);

    json_write('projects.json', array('projects' => $projects));
    send_json($result);
}

// DELETE /api/projects/:id
function delete_project($id) {
    require_auth();

    $data = json_read('projects.json');
    $projects = arr_get($data, 'projects', array());
    $found = false;
    $removed = null;
    $newProjects = array();

    foreach ($projects as $p) {
        if ((string)$p['id'] === (string)$id) {
            $removed = $p;
            $found = true;
        } else {
            $newProjects[] = $p;
        }
    }

    if (!$found) send_error('Project not found', 404);

    json_write('projects.json', array('projects' => $newProjects));

    // Clean likes for this project
    $likesData = json_read('likes.json');
    $likes = arr_get($likesData, 'likes', array());
    if (is_array($likes) && isset($likes[$id])) {
        unset($likes[$id]);
        json_write('likes.json', array('likes' => $likes));
    }

    // Remove orphaned thumbnail
    if (!empty($removed['thumbnail'])) {
        $used = collect_used_upload_urls();
        if (preg_match('#/uploads/([^/?#]+)#', $removed['thumbnail'], $m)) {
            if (!in_array($m[1], $used)) {
                $fp = __DIR__ . '/../../uploads/' . basename($m[1]);
                if (file_exists($fp)) @unlink($fp);
            }
        }
    }

    send_json(array('success' => true));
}
