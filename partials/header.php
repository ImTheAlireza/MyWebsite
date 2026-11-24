<?php
/** @var array $site */
/** @var array $nav */
?>
  <header>
    <div class="wrap">
      <a class="mark" href="#top"><?= e($site['name']) ?></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">
        <span></span><span></span>
      </button>
      <nav id="main-nav" aria-label="Main">
<?php foreach ($nav as $item): ?>
        <a href="<?= e($item['href']) ?>"><?= e($item['label']) ?></a>
<?php endforeach; ?>
      </nav>
    </div>
  </header>
