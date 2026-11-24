<?php
require_once __DIR__ . '/init.php';
admin_require_login();

$message = '';
$error = '';

function uploads_base_dir()
{
    return dirname(__DIR__) . '/uploads';
}

function is_allowed_media_ext($ext)
{
    $allowed = array('jpg','jpeg','png','gif','webp','svg','mp4','webm','mov','m4v','pdf');
    return in_array(strtolower($ext), $allowed, true);
}

function safe_rel_path($path)
{
    $path = str_replace('\\', '/', (string) $path);
    $path = preg_replace('#/+#', '/', $path);
    $parts = array();
    foreach (explode('/', $path) as $part) {
        if ($part === '' || $part === '.' ) continue;
        if ($part === '..') return null;
        $parts[] = $part;
    }
    return implode('/', $parts);
}

function list_upload_files()
{
    $base = uploads_base_dir();
    $files = array();
    if (!is_dir($base)) return $files;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, RecursiveDirectoryIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if (!$file->isFile()) continue;
        $ext = strtolower($file->getExtension());
        if (!is_allowed_media_ext($ext)) continue;
        $full = $file->getPathname();
        $rel = str_replace('\\', '/', substr($full, strlen($base) + 1));
        $rel = safe_rel_path($rel);
        if ($rel === null) continue;
        $files[] = array(
            'rel' => $rel,
            'name' => basename($rel),
            'ext' => $ext,
            'size' => $file->getSize(),
            'mtime' => $file->getMTime(),
        );
    }
    usort($files, function ($a, $b) {
        return $b['mtime'] - $a['mtime'];
    });
    return $files;
}

function format_bytes($bytes)
{
    $bytes = (float) $bytes;
    if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
    if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
    return (int) $bytes . ' B';
}

function site_base_url()
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    $scheme = $https ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $script = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
    // /admin/media.php -> /
    $root = rtrim(str_replace('\\', '/', dirname(dirname($script))), '/');
    return $scheme . '://' . $host . ($root === '' ? '' : $root);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = isset($_POST['action']) ? trim($_POST['action']) : '';

    if ($action === 'upload') {
        $subdir = isset($_POST['subdir']) ? trim($_POST['subdir']) : 'library';
        $subdir = safe_rel_path($subdir);
        if ($subdir === null || $subdir === '') $subdir = 'library';
        // only allow uploads inside uploads/ (no leading dot tricks)
        $targetDir = uploads_base_dir() . '/' . $subdir;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        $uploadedCount = 0;
        if (isset($_FILES['files']) && is_array($_FILES['files']['name'])) {
            $count = count($_FILES['files']['name']);
            for ($i = 0; $i < $count; $i++) {
                if (!isset($_FILES['files']['error'][$i]) || $_FILES['files']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
                if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) continue;
                $name = $_FILES['files']['name'][$i];
                $tmp = $_FILES['files']['tmp_name'][$i];
                $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                if (!is_allowed_media_ext($ext)) continue;
                $baseName = pathinfo($name, PATHINFO_FILENAME);
                $baseName = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $baseName);
                $baseName = trim($baseName, '-_.');
                if ($baseName === '') $baseName = 'file';
                $filename = $baseName . '-' . uniqid() . '.' . $ext;
                $dest = $targetDir . '/' . $filename;
                if (move_uploaded_file($tmp, $dest)) {
                    $uploadedCount++;
                }
            }
        }
        if ($uploadedCount > 0) {
            $message = $uploadedCount . ' file(s) uploaded successfully.';
        } else {
            $error = 'No files were uploaded. Check file format or size.';
        }
    } elseif ($action === 'delete') {
        $rel = isset($_POST['file']) ? safe_rel_path($_POST['file']) : null;
        if ($rel === null) {
            $error = 'Invalid file path.';
        } else {
            $full = uploads_base_dir() . '/' . $rel;
            $realBase = realpath(uploads_base_dir());
            $realFull = realpath($full);
            if ($realBase && $realFull && strpos($realFull, $realBase) === 0 && is_file($realFull)) {
                if (unlink($realFull)) {
                    $message = 'File deleted.';
                } else {
                    $error = 'Failed to delete file.';
                }
            } else {
                $error = 'File not found.';
            }
        }
    } elseif ($action === 'rename') {
        $rel = isset($_POST['file']) ? safe_rel_path($_POST['file']) : null;
        $newName = isset($_POST['new_name']) ? trim((string) $_POST['new_name']) : '';
        if ($rel === null || $newName === '') {
            $error = 'Invalid file name.';
        } else {
            $full = uploads_base_dir() . '/' . $rel;
            $realBase = realpath(uploads_base_dir());
            $realFull = realpath($full);
            if (!$realBase || !$realFull || strpos($realFull, $realBase) !== 0 || !is_file($realFull)) {
                $error = 'File not found.';
            } else {
                $oldExt = strtolower(pathinfo($realFull, PATHINFO_EXTENSION));
                $newBase = pathinfo($newName, PATHINFO_FILENAME);
                $newExt = strtolower(pathinfo($newName, PATHINFO_EXTENSION));
                $newBase = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $newBase);
                $newBase = trim($newBase, '-_.');
                if ($newBase === '') {
                    $error = 'Invalid file name.';
                } else {
                    // keep original extension unless explicitly same type
                    if ($newExt === '' || $newExt !== $oldExt) {
                        $newExt = $oldExt;
                    }
                    $dir = dirname($realFull);
                    $newFilename = $newBase . '.' . $newExt;
                    $newFull = $dir . '/' . $newFilename;
                    $newRealDir = realpath($dir);
                    if (!$newRealDir || strpos($newRealDir, $realBase) !== 0) {
                        $error = 'Invalid target path.';
                    } elseif (file_exists($newFull) && realpath($newFull) !== $realFull) {
                        $error = 'A file with this name already exists.';
                    } elseif (rename($realFull, $newFull)) {
                        $oldPublic = 'uploads/' . $rel;
                        $newRel = safe_rel_path(substr($newFull, strlen(realpath(uploads_base_dir())) + 1));
                        $newPublic = 'uploads/' . $newRel;
                        // Update references in content.json
                        $content = load_content();
                        $changed = false;
                        $contentJson = json_encode($content);
                        if ($contentJson !== false && strpos($contentJson, $oldPublic) !== false) {
                            $contentJson = str_replace(json_encode($oldPublic), json_encode($newPublic), $contentJson);
                            $updated = json_decode($contentJson, true);
                            if (is_array($updated)) {
                                save_content($updated);
                                $changed = true;
                            }
                        }
                        $message = 'File renamed successfully.' . ($changed ? ' References in site content were updated.' : '');
                    } else {
                        $error = 'Failed to rename file.';
                    }
                }
            }
        }
    }
}

$files = list_upload_files();
$baseUrl = site_base_url();

if (isset($_GET['action']) && $_GET['action'] === 'list') {
    header('Content-Type: application/json; charset=UTF-8');
    $out = array();
    foreach ($files as $f) {
        $rel = $f['rel'];
        $publicPath = 'uploads/' . $rel;
        $out[] = array(
            'rel' => $rel,
            'name' => $f['name'],
            'ext' => $f['ext'],
            'size' => format_bytes($f['size']),
            'url' => $baseUrl . '/' . $publicPath,
            'path' => $publicPath,
            'isImage' => in_array($f['ext'], array('jpg','jpeg','png','gif','webp','svg'), true),
            'isVideo' => in_array($f['ext'], array('mp4','webm','mov','m4v'), true),
        );
    }
    echo json_encode(array('files' => $out));
    exit;
}
?>

$content = load_content();
$site = isset($content['site']) ? $content['site'] : array();
$activeTab = 'media';
$pageTitle = 'Media Library';
require __DIR__ . '/partials/top.php';
?>
    <div class="page-head">
      <h1>Media Library</h1>
      <p class="muted">Upload images and videos, manage files, and copy or download a direct link for each file.</p>
    </div>

    <?php if ($message): ?><div class="alert alert-success"><?= e($message) ?></div><?php endif; ?>
    <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>

    <section class="card">
      <div class="upload-box">
        <h3>Upload new files</h3>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="upload">
          <div class="grid-2">
            <label>Files (images/videos)
              <input type="file" name="files[]" multiple accept="image/*,video/mp4,video/webm,video/quicktime,.m4v,.pdf,.svg">
            </label>
            <label>Subfolder inside uploads
              <input type="text" name="subdir" value="library" placeholder="library">
            </label>
          </div>
          <button type="submit" class="btn btn-primary">Upload</button>
        </form>
      </div>

      <div class="section-head">
        <h2>Files</h2>
        <span class="muted small"><?= count($files) ?> files</span>
      </div>

      <?php if (empty($files)): ?>
        <p class="muted">No files found in <code>uploads/</code> yet.</p>
      <?php else: ?>
        <div class="library-grid">
          <?php foreach ($files as $f): ?>
            <?php
              $rel = $f['rel'];
              $publicPath = 'uploads/' . $rel;
              $fullUrl = $baseUrl . '/' . $publicPath;
              $downloadUrl = 'download.php?file=' . rawurlencode($rel);
              $isImage = in_array($f['ext'], array('jpg','jpeg','png','gif','webp','svg'), true);
              $isVideo = in_array($f['ext'], array('mp4','webm','mov','m4v'), true);
            ?>
            <div class="media-card">
              <div class="media-thumb">
                <?php if ($isImage): ?>
                  <img src="../<?= e($publicPath) ?>" alt="<?= e($f['name']) ?>" loading="lazy">
                <?php elseif ($isVideo): ?>
                  <video src="../<?= e($publicPath) ?>" muted preload="metadata"></video>
                <?php else: ?>
                  <div class="file-icon"><?= e(strtoupper($f['ext'])) ?><br><small><?= e($f['name']) ?></small></div>
                <?php endif; ?>
              </div>
              <div class="media-body">
                <div class="media-name"><?= e($f['name']) ?></div>
                <div class="media-meta"><?= e(format_bytes($f['size'])) ?> · <?= e($rel) ?></div>
                <div class="media-actions">
                  <button type="button" class="btn copy-link" data-url="<?= e($fullUrl) ?>">Copy link</button>
                  <a class="btn" href="<?= e($downloadUrl) ?>">Download</a>
                  <button type="button" class="btn rename-file" data-file="<?= e($rel) ?>" data-name="<?= e(pathinfo($f['name'], PATHINFO_FILENAME)) ?>">Rename</button>
                  <form method="post" style="display:inline" onsubmit="return confirm('Delete this file?');">
                    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="file" value="<?= e($rel) ?>">
                    <button type="submit" class="btn btn-danger">Delete</button>
                  </form>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>

  <form id="rename-form" method="post" style="display:none">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="action" value="rename">
    <input type="hidden" name="file" id="rename-file">
    <input type="hidden" name="new_name" id="rename-new-name">
  </form>

  <script>
    document.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('.copy-link');
      if (copyBtn) {
        var url = copyBtn.getAttribute('data-url') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            var old = copyBtn.textContent;
            copyBtn.textContent = 'Copied';
            setTimeout(function () { copyBtn.textContent = old; }, 1500);
          });
        } else {
          var tmp = document.createElement('input');
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
          var old2 = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = old2; }, 1500);
        }
        return;
      }
      var renameBtn = e.target.closest('.rename-file');
      if (renameBtn) {
        var current = renameBtn.getAttribute('data-name') || '';
        var file = renameBtn.getAttribute('data-file') || '';
        var next = window.prompt('New file name (without extension):', current);
        if (next === null) return;
        next = String(next).trim();
        if (!next || next === current) return;
        document.getElementById('rename-file').value = file;
        document.getElementById('rename-new-name').value = next;
        document.getElementById('rename-form').submit();
      }
    });
  </script>
<?php require __DIR__ . '/partials/bottom.php'; ?>
