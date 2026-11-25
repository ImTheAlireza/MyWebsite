<?php
if (!isset($activeTab)) $activeTab = '';
if (!isset($pageTitle)) $pageTitle = 'Admin';
$tabs = array(
    array('id' => 'site', 'label' => 'Site', 'href' => 'index.php?tab=site'),
    array('id' => 'nav', 'label' => 'Navigation', 'href' => 'index.php?tab=nav'),
    array('id' => 'works', 'label' => 'Projects', 'href' => 'index.php?tab=works'),
    array('id' => 'services', 'label' => 'Services', 'href' => 'index.php?tab=services'),
    array('id' => 'about', 'label' => 'About', 'href' => 'index.php?tab=about'),
    array('id' => 'experience', 'label' => 'Experience', 'href' => 'index.php?tab=experience'),
    array('id' => 'education', 'label' => 'Education', 'href' => 'index.php?tab=education'),
    array('id' => 'contact', 'label' => 'Contact', 'href' => 'index.php?tab=contact'),
    array('id' => 'media', 'label' => 'Media Library', 'href' => 'media.php'),
    array('id' => 'password', 'label' => 'Password', 'href' => 'index.php?tab=password'),
);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($pageTitle) ?> - Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
  <div class="admin-topbar">
    <div class="admin-topbar-inner">
      <div class="admin-brand">
        <a href="index.php?tab=site" class="admin-brand-title">Admin Panel</a>
        <span class="admin-brand-sub muted small"><?= e(isset($site['name']) ? $site['name'] : '') ?></span>
      </div>
      <div class="admin-topbar-actions">
        <a href="../index.php" target="_blank" class="btn btn-small">View Site</a>
        <form method="post" action="logout.php"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><button class="btn btn-small btn-danger" type="submit">Log out</button></form>
      </div>
    </div>
    <nav class="admin-tabs" aria-label="Admin sections">
      <?php foreach ($tabs as $tab): ?>
        <a href="<?= e($tab['href']) ?>" class="admin-tab<?= $activeTab === $tab['id'] ? ' active' : '' ?>"><?= e($tab['label']) ?></a>
      <?php endforeach; ?>
    </nav>
  </div>
  <main class="admin-content">
