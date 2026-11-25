<?php
/** @var array $site */
?>
<!DOCTYPE html>
<html lang="<?= e($site['lang']) ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($site['title']) ?></title>
  <meta name="description" content="<?= e($site['description']) ?>">
  <meta name="color-scheme" content="light dark">
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
