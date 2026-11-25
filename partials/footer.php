<?php
/** @var array $site */
?>
  <footer>
    <div class="wrap">
      <span>© <?= e($site['copyright_year']) ?> <?= e($site['name']) ?></span>
      <span><?= e($site['footer_tagline']) ?></span>
      <?php if (!empty($site['linkedin_url'])): ?>
      <a href="<?= e($site['linkedin_url']) ?>" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <?php endif; ?>
    </div>
  </footer>

  <script>
    window.SITE_CONFIG = {
      email: <?= json_encode($site['email'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>
    };
  </script>
  <script src="<?= e(asset('js/main.js')) ?>"></script>
</body>
</html>
