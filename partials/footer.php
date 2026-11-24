<?php
/** @var array $site */
?>
  <footer>
    <div class="wrap">
      <span>© <?= e($site['copyright_year']) ?> <?= e($site['name']) ?></span>
      <span><?= e($site['footer_tagline']) ?></span>
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
