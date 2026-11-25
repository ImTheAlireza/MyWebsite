<?php

if (!function_exists('hash_equals')) {
    function hash_equals($known_string, $user_string)
    {
        if (!is_string($known_string) || !is_string($user_string)) {
            return false;
        }
        if (strlen($known_string) !== strlen($user_string)) {
            return false;
        }
        $res = $known_string ^ $user_string;
        $ret = 0;
        for ($i = strlen($res) - 1; $i >= 0; $i--) {
            $ret |= ord($res[$i]);
        }
        return $ret === 0;
    }
}

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function asset($path)
{
    $path = ltrim($path, '/');
    $scriptName = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
    $base = rtrim(dirname($scriptName), '/\\');
    $url = ($base === '' ? '' : $base) . '/assets/' . $path;

    $file = dirname(__DIR__) . '/assets/' . $path;
    if (is_file($file)) {
        $ver = @filemtime($file);
        if ($ver) {
            $url .= (strpos($url, '?') === false ? '?' : '&') . 'v=' . $ver;
        }
    }
    return $url;
}

function image_variant_widths()
{
    return array(480, 768, 1200, 1600);
}

function image_variant_path($path, $width)
{
    $info = pathinfo($path);
    $dir = isset($info['dirname']) ? $info['dirname'] : '';
    $ext = isset($info['extension']) ? strtolower($info['extension']) : '';
    $name = isset($info['filename']) ? $info['filename'] : 'image';
    if ($dir === '.' || $dir === '') $dir = '';
    $suffix = '-w' . intval($width) . '.' . $ext;
    return ($dir !== '' ? $dir . '/' : '') . $name . $suffix;
}

function generate_image_variants($absolutePath)
{
    if (!is_file($absolutePath) || !is_readable($absolutePath)) return array();
    if (!function_exists('imagecreatetruecolor') || !function_exists('imagecopyresampled')) return array();

    $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
    $supported = array('jpg', 'jpeg', 'png', 'webp');
    if (!in_array($ext, $supported, true)) return array();

    $info = @getimagesize($absolutePath);
    if ($info && ($info[0] * $info[1] > 24000000 || $info[0] > 12000 || $info[1] > 12000)) return array();
    if (!$info || empty($info[0]) || empty($info[1])) return array();
    $origW = (int) $info[0];
    $origH = (int) $info[1];
    if ($origW < 1 || $origH < 1) return array();

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $src = @imagecreatefromjpeg($absolutePath);
            break;
        case 'png':
            $src = @imagecreatefrompng($absolutePath);
            break;
        case 'webp':
            if (function_exists('imagecreatefromwebp')) $src = @imagecreatefromwebp($absolutePath);
            else $src = false;
            break;
        default:
            $src = false;
    }
    if (!$src) return array();

    $generated = array();
    foreach (image_variant_widths() as $w) {
        if ($w >= $origW) continue;
        $h = (int) round($origH * ($w / $origW));
        if ($h < 1) continue;
        $dst = imagecreatetruecolor($w, $h);
        if (!$dst) continue;
        if ($ext === 'png' || $ext === 'webp') {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $w, $h, $transparent);
        }
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $w, $h, $origW, $origH);

        $variantAbs = image_variant_path($absolutePath, $w);
        $ok = false;
        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                $ok = @imagejpeg($dst, $variantAbs, 82);
                break;
            case 'png':
                $ok = @imagepng($dst, $variantAbs, 6);
                break;
            case 'webp':
                if (function_exists('imagewebp')) $ok = @imagewebp($dst, $variantAbs, 80);
                break;
        }
        imagedestroy($dst);
        if ($ok) $generated[] = $variantAbs;
    }
    imagedestroy($src);
    return $generated;
}

function responsive_img_attrs($src, $sizes)
{
    $src = (string) $src;
    $sizes = (string) $sizes;
    $attr = 'src="' . e($src) . '"';
    if ($src === '' || preg_match('#^(https?:)?//#i', $src) || strpos($src, 'data:') === 0) {
        return $attr . ($sizes !== '' ? ' sizes="' . e($sizes) . '"' : '');
    }

    $clean = ltrim($src, '/');
    $abs = dirname(__DIR__) . '/' . $clean;
    if (!is_file($abs)) {
        return $attr . ($sizes !== '' ? ' sizes="' . e($sizes) . '"' : '');
    }

    $info = @getimagesize($abs);
    $origW = ($info && !empty($info[0])) ? (int) $info[0] : 0;
    $origH = ($info && !empty($info[1])) ? (int) $info[1] : 0;
    if ($origW > 0 && $origH > 0) {
        $attr .= ' width="' . $origW . '" height="' . $origH . '"';
    }

    $srcset = array();
    foreach (image_variant_widths() as $w) {
        if ($origW > 0 && $w >= $origW) continue;
        $variantAbs = image_variant_path($abs, $w);
        if (is_file($variantAbs)) {
            $variantSrc = image_variant_path($src, $w);
            $srcset[] = $variantSrc . ' ' . $w . 'w';
        }
    }
    if ($origW > 0) {
        $srcset[] = $src . ' ' . $origW . 'w';
    }
    if (!empty($srcset)) {
        $attr .= ' srcset="' . e(implode(', ', $srcset)) . '"';
        if ($sizes !== '') $attr .= ' sizes="' . e($sizes) . '"';
    }
    return $attr;
}

function rate_limit_check($key, $maxAttempts, $windowSeconds)
{
    // Fixed bucket count bounds disk usage; lock covers the full read/modify/write.
    $bucket = hexdec(substr(hash('sha256', $key), 0, 3));
    $file = dirname(__DIR__) . '/data/ratelimit-' . $bucket . '.json';
    $fp = @fopen($file, 'c+');
    if (!$fp) return false;
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    $now = time();
    $state = json_decode(stream_get_contents($fp), true);
    if (!is_array($state) || !isset($state['start'], $state['count']) || $now - $state['start'] >= $windowSeconds) {
        $state = array('start' => $now, 'count' => 0);
    }
    $allowed = $state['count'] < $maxAttempts;
    $state['count'] = min($maxAttempts, $state['count'] + 1);
    rewind($fp);
    $json = json_encode($state);
    $written = fwrite($fp, $json);
    $ok = $written === strlen($json) && ftruncate($fp, strlen($json)) && fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $allowed && $ok;
}

function valid_media_upload($path, $ext)
{
    $types = array(
        'jpg' => array('image/jpeg'), 'jpeg' => array('image/jpeg'),
        'png' => array('image/png'), 'gif' => array('image/gif'), 'webp' => array('image/webp'),
        'mp4' => array('video/mp4', 'application/mp4'), 'm4v' => array('video/mp4', 'video/x-m4v'),
        'webm' => array('video/webm'), 'mov' => array('video/quicktime'), 'pdf' => array('application/pdf')
    );
    if (!isset($types[$ext]) || !is_file($path) || !class_exists('finfo')) return false;
    $size = filesize($path);
    $isImage = in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp'), true);
    $limit = $isImage || $ext === 'pdf' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if ($size <= 0 || $size > $limit) return false;
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if (!in_array($finfo->file($path), $types[$ext], true)) return false;
    if ($isImage) {
        $info = @getimagesize($path);
        if (!$info || $info[0] < 1 || $info[1] < 1 || $info[0] > 12000 || $info[1] > 12000 || $info[0] * $info[1] > 24000000) return false;
    }
    return true;
}
