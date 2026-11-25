<?php
/** @var array $site */
/** @var array $works */
/** @var array $about */
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'alirezashabanzadeh.ir';
$requestUri = isset($_SERVER['REQUEST_URI']) ? strtok($_SERVER['REQUEST_URI'], '?') : '/';
$canonicalUrl = $scheme . '://' . $host . $requestUri;
$ogImage = '';
if (!empty($about['portrait_image'])) {
    $ogImage = $about['portrait_image'];
} elseif (!empty($works) && is_array($works)) {
    foreach ($works as $w) {
        $m = isset($w['media']) && is_array($w['media']) ? $w['media'] : null;
        if ($m && !empty($m['src']) && (!isset($m['type']) || $m['type'] !== 'video')) {
            $ogImage = $m['src'];
            break;
        }
        if ($m && !empty($m['poster'])) {
            $ogImage = $m['poster'];
            break;
        }
    }
}
if ($ogImage !== '' && !preg_match('#^https?://#i', $ogImage)) {
    $ogImage = $scheme . '://' . $host . '/' . ltrim($ogImage, '/');
}
?>
<!DOCTYPE html>
<html lang="<?= e($site['lang']) ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($site['title']) ?></title>
  <meta name="description" content="<?= e($site['description']) ?>">
  <meta name="theme-color" content="#e9e8e4">
  <meta name="color-scheme" content="light dark">
  <link rel="canonical" href="<?= e($canonicalUrl) ?>">
  <link rel="icon" href="<?= e(asset('favicon.svg')) ?>" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="<?= e($site['name']) ?>">
  <meta property="og:title" content="<?= e($site['title']) ?>">
  <meta property="og:description" content="<?= e($site['description']) ?>">
  <meta property="og:url" content="<?= e($canonicalUrl) ?>">
  <?php if ($ogImage !== ''): ?>
  <meta property="og:image" content="<?= e($ogImage) ?>">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="<?= e($ogImage) ?>">
  <?php else: ?>
  <meta name="twitter:card" content="summary">
  <?php endif; ?>
  <meta name="twitter:title" content="<?= e($site['title']) ?>">
  <meta name="twitter:description" content="<?= e($site['description']) ?>">
  <!-- Tip: if Google Fonts is unreliable from Iran, self-host Bricolage Grotesque and replace this link. -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet"></noscript>
  <link rel="preload" as="style" href="<?= e(asset('css/style.css')) ?>">
  <link rel="stylesheet" href="<?= e(asset('css/style.css')) ?>">
</head>
<body>
  <a class="skip" href="#work">Skip to work</a>
  <div class="cursor" aria-hidden="true"></div>
