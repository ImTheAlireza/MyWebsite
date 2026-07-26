<?php
// php/handlers/upload.php — File upload and asset management (PHP 5.6+ compatible)

$ALLOWED_EXTS = array(
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico',
    '.mp4', '.webm', '.mov', '.avi', '.mkv',
    '.mp3', '.wav', '.ogg', '.aac', '.flac',
    '.pdf', '.txt', '.rtf'
);

$ALLOWED_MIME_PREFIXES = array('image/', 'video/', 'audio/');
$ALLOWED_MIME_TYPES = array('application/pdf', 'text/plain', 'application/rtf');

// POST /api/upload
function upload_file() {
    global $ALLOWED_EXTS, $ALLOWED_MIME_PREFIXES, $ALLOWED_MIME_TYPES;
    require_auth();

    if (empty($_FILES['file'])) {
        send_error('No file uploaded');
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = array(
            UPLOAD_ERR_INI_SIZE => 'File too large (server limit)',
            UPLOAD_ERR_FORM_SIZE => 'File too large (form limit)',
            UPLOAD_ERR_PARTIAL => 'File partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Server configuration error',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
            UPLOAD_ERR_EXTENSION => 'Upload blocked by extension',
        );
        $msg = isset($errors[$file['error']]) ? $errors[$file['error']] : 'Upload error: ' . $file['error'];
        send_error($msg);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $extWithDot = '.' . $ext;

    if (!in_array($extWithDot, $ALLOWED_EXTS)) {
        send_error('File type not allowed: ' . $extWithDot);
    }

    $mimeOk = false;
    foreach ($ALLOWED_MIME_PREFIXES as $prefix) {
        if (strpos($file['type'], $prefix) === 0) {
            $mimeOk = true;
            break;
        }
    }
    if (!$mimeOk && in_array($file['type'], $ALLOWED_MIME_TYPES)) {
        $mimeOk = true;
    }

    if (!$mimeOk) {
        send_error('MIME type not allowed: ' . $file['type']);
    }

    $newFilename = generate_uuid() . $extWithDot;
    $destPath = __DIR__ . '/../../uploads/' . $newFilename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        send_error('Failed to save file', 500);
    }

    // Magic byte validation
    if (!matches_magic($destPath, $extWithDot)) {
        @unlink($destPath);
        send_error('File content does not match extension');
    }

    send_json(array(
        'url' => '/uploads/' . $newFilename,
        'filename' => $newFilename,
    ));
}

function matches_magic($filepath, $ext) {
    $skip = array('.txt', '.rtf', '.avi', '.flac', '.aac');
    if (in_array($ext, $skip)) return true;

    $fp = fopen($filepath, 'r');
    if (!$fp) return false;
    $buf = fread($fp, 16);
    fclose($fp);

    if (strlen($buf) < 4) return false;

    $bytes = array();
    for ($i = 0; $i < strlen($buf); $i++) {
        $bytes[] = ord($buf[$i]);
    }

    if ($ext === '.webp') {
        return $bytes[0] === 0x52 && $bytes[1] === 0x49 && isset($bytes[8]) && $bytes[8] === 0x57 && $bytes[9] === 0x45;
    }
    if ($ext === '.mp4' || $ext === '.mov') {
        return (isset($bytes[4]) && substr($buf, 4, 4) === 'ftyp') || $bytes[0] === 0x00;
    }
    if ($ext === '.jpg' || $ext === '.jpeg') {
        return $bytes[0] === 0xFF && $bytes[1] === 0xD8 && $bytes[2] === 0xFF;
    }
    if ($ext === '.png') {
        return $bytes[0] === 0x89 && $bytes[1] === 0x50 && $bytes[2] === 0x4E && $bytes[3] === 0x47;
    }
    if ($ext === '.gif') {
        return substr($buf, 0, 3) === 'GIF';
    }
    if ($ext === '.bmp') {
        return $bytes[0] === 0x42 && $bytes[1] === 0x4D;
    }
    if ($ext === '.pdf') {
        return $bytes[0] === 0x25 && $bytes[1] === 0x50 && $bytes[2] === 0x44 && $bytes[3] === 0x46;
    }
    if ($ext === '.webm' || $ext === '.mkv') {
        return $bytes[0] === 0x1A && $bytes[1] === 0x45 && $bytes[2] === 0xDF && $bytes[3] === 0xA3;
    }
    if ($ext === '.mp3') {
        return ($bytes[0] === 0xFF && ($bytes[1] & 0xE0) === 0xE0) || $bytes[0] === 0x49;
    }
    if ($ext === '.wav') {
        return substr($buf, 0, 4) === 'RIFF';
    }
    if ($ext === '.ogg') {
        return substr($buf, 0, 4) === 'OggS';
    }
    if ($ext === '.ico') {
        return $bytes[0] === 0x00 && $bytes[1] === 0x00 && $bytes[2] === 0x01 && $bytes[3] === 0x00;
    }

    return true;
}

// DELETE /api/upload/:filename
function delete_file($filename) {
    require_auth();

    $safeName = basename($filename);
    if ($safeName !== $filename) send_error('Invalid filename');

    $filepath = __DIR__ . '/../../uploads/' . $safeName;
    $realPath = realpath($filepath);
    $uploadsRoot = realpath(__DIR__ . '/../../uploads');

    if ($realPath === false || $uploadsRoot === false || strpos($realPath, $uploadsRoot) !== 0) {
        send_error('Invalid path');
    }

    if (file_exists($realPath)) {
        unlink($realPath);
        send_json(array('success' => true));
    } else {
        send_error('File not found', 404);
    }
}

// GET /api/assets
function list_assets() {
    require_auth();

    $uploadsDir = __DIR__ . '/../../uploads';
    if (!is_dir($uploadsDir)) {
        send_json(array('files' => array()));
        return;
    }

    $used = collect_used_upload_urls();
    $files = array();
    $entries = array_values(array_diff(scandir($uploadsDir), array('.', '..')));

    foreach ($entries as $filename) {
        $filePath = $uploadsDir . '/' . $filename;
        if (!is_file($filePath)) continue;

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $stat = stat($filePath);
        $size = $stat['size'];

        $type = 'other';
        if (in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'))) $type = 'image';
        elseif (in_array($ext, array('mp4', 'webm', 'mov', 'avi', 'mkv'))) $type = 'video';
        elseif (in_array($ext, array('mp3', 'wav', 'ogg', 'aac', 'flac'))) $type = 'audio';
        elseif (in_array($ext, array('pdf', 'doc', 'docx', 'txt', 'rtf'))) $type = 'document';
        elseif (in_array($ext, array('psd', 'ai', 'sketch', 'fig'))) $type = 'design';
        elseif (in_array($ext, array('zip', 'rar', '7z'))) $type = 'archive';

        $sizeFormatted = $size < 1024 ? $size . ' B'
            : ($size < 1024 * 1024 ? round($size / 1024, 1) . ' KB' : round($size / (1024 * 1024), 1) . ' MB');

        $isUsed = in_array($filename, $used);

        $files[] = array(
            'filename' => $filename,
            'url' => '/uploads/' . $filename,
            'ext' => '.' . $ext,
            'size' => $size,
            'sizeFormatted' => $sizeFormatted,
            'modified' => date('c', $stat['mtime']),
            'type' => $type,
            'used' => $isUsed,
            'orphan' => !$isUsed,
        );
    }

    usort($files, function($a, $b) {
        return strtotime($b['modified']) - strtotime($a['modified']);
    });

    send_json(array('files' => $files));
}

// POST /api/assets/purge-orphans
function purge_orphans() {
    require_auth();

    $uploadsDir = __DIR__ . '/../../uploads';
    if (!is_dir($uploadsDir)) {
        send_json(array('deleted' => 0));
        return;
    }

    $used = collect_used_upload_urls();
    $deleted = 0;
    $entries = array_values(array_diff(scandir($uploadsDir), array('.', '..')));

    foreach ($entries as $filename) {
        if (!in_array($filename, $used)) {
            $fp = __DIR__ . '/../../uploads/' . basename($filename);
            $realPath = realpath($fp);
            $uploadsRoot = realpath($uploadsDir);
            if ($realPath && $uploadsRoot && strpos($realPath, $uploadsRoot) === 0 && file_exists($realPath)) {
                unlink($realPath);
                $deleted++;
            }
        }
    }

    send_json(array('success' => true, 'deleted' => $deleted));
}
