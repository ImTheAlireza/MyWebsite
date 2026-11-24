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
    }
}

$files = list_upload_files();
$baseUrl = site_base_url();
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Media Library</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
  <div class="admin-shell">
    <aside class="sidebar">
      <h2>Admin Panel</h2>
      <p class="muted small">Media Library</p>
      <nav>
        <a href="index.php#site">Site Settings</a>
        <a href="index.php#works">Projects</a>
        <a href="index.php#services">Services</a>
        <a href="index.php#about">About</a>
        <a href="index.php#contact">Contact</a>
        <a href="media.php" class="active">Media Library</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="danger-link">Log out</a>
      </nav>
    </aside>

    <main class="content">
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
                    <form method="post" style="display:inline" onsubmit="return confirm('Delete this file?');">
                      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                      <input type="hidden" name="action" value="delete">
                      <input type="hidden" name="file" value="<?= e($rel) ?>">
                      <button type="submit" class="btn btn-danger">Remove</button>
                    </form>
                  </div>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    </main>
  </div>

  <script>
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy-link');
      if (!btn) return;
      var url = btn.getAttribute('data-url') || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          var old = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = old; }, 1500);
        });
      } else {
        var tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        var old2 = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old2; }, 1500);
      }
    });
  </script>
</body>
</html>
