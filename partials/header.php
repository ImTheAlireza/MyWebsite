<?php
/** @var array $site */
/** @var array $nav */
?>
  <header>
    <div class="wrap">
      <a class="mark" href="#top"><?= e($site['name']) ?></a>
      <nav aria-label="Main">
<?php foreach ($nav as $item): ?>
        <a href="<?= e($item['href']) ?>"><?= e($item['label']) ?></a>
<?php endforeach; ?>
      </nav>
    </div>
  </header>
