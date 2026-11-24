<?php
/** @var array $site */
?>
    <div class="hero">
      <canvas class="dots" aria-hidden="true"></canvas>
      <div class="wrap">
        <h1 class="name" aria-label="<?= e($site['name']) ?>">
          <span aria-hidden="true"><em><?= e($site['first_name']) ?></em></span>
          <span aria-hidden="true"><em><?= e($site['last_name']) ?></em></span>
        </h1>
        <div class="hero-row">
          <p class="role"><?= e($site['role']) ?></p>
          <p class="intro"><?= e($site['intro']) ?></p>
        </div>
      </div>
      <div class="wrap"><div class="playhead" aria-hidden="true"></div></div>
    </div>
