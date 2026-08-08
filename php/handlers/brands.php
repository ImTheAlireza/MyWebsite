<?php
// php/handlers/brands.php — Brand CRUD handlers (PHP 5.6+ compatible)

function validate_brand_input($input, $isUpdate) {
    if (!$isUpdate || isset($input['name'])) {
        if (!trim(clean_content_text(arr_get($input, 'name', '')))) {
            send_error('Brand name is required');
        }
    }

    if (!$isUpdate || isset($input['thumbnail'])) {
        if (!trim(clean_content_text(arr_get($input, 'thumbnail', '')))) {
            send_error('Brand cover image is required');
        }
    }

    $mode = clean_content_text(arr_get($input, 'mode', 'projects'));
    if ($mode !== 'projects' && $mode !== 'gallery') {
        send_error('Invalid brand display type');
    }

    if ($mode === 'gallery') {
        $gallery = arr_get($input, 'gallery', array());
        if (!is_array($gallery) || count(array_filter($gallery)) === 0) {
            send_error('Add at least one image or video to a gallery brand');
        }
    }
}

function create_brand() {
    require_auth();
    $input = get_json_input();
    validate_brand_input($input, false);

    $data = json_read('projects.json');
    $brands = arr_get($data, 'brands', array());
    $brand = normalize_brand($input);
    $brand['order'] = count($brands);
    $brands[] = $brand;
    $data['brands'] = $brands;

    json_write('projects.json', $data);
    send_json($brand);
}

function update_brand($id) {
    require_auth();
    $input = get_json_input();

    $data = json_read('projects.json');
    $brands = arr_get($data, 'brands', array());
    $found = false;
    $result = null;

    foreach ($brands as $index => $brand) {
        if ((string)arr_get($brand, 'id', '') !== (string)$id) continue;

        $merged = array_merge($brand, $input);
        validate_brand_input($merged, true);
        $merged['id'] = arr_get($brand, 'id', $id);
        $merged['order'] = arr_get($brand, 'order', $index);
        $brands[$index] = normalize_brand($merged);
        $result = $brands[$index];
        $found = true;
        break;
    }

    if (!$found) send_error('Brand not found', 404);

    $data['brands'] = $brands;
    json_write('projects.json', $data);
    send_json($result);
}

function delete_brand($id) {
    require_auth();
    $data = json_read('projects.json');
    $data['brands'] = array_values(array_filter(
        arr_get($data, 'brands', array()),
        function($brand) use ($id) {
            return (string)arr_get($brand, 'id', '') !== (string)$id;
        }
    ));

    $projects = arr_get($data, 'projects', array());
    foreach ($projects as &$project) {
        if ((string)arr_get($project, 'brand', '') === (string)$id) {
            $project['brand'] = '';
        }
    }
    unset($project);
    $data['projects'] = $projects;

    json_write('projects.json', $data);
    send_json(array('success' => true));
}
