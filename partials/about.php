<?php
/** @var array $about */
?>
    <section id="about" class="about">
      <div class="wrap section-grid">
        <h2>About</h2>
        <div class="section-body">
          <div class="about-split">
            <div>
<?php foreach ($about['paragraphs'] as $i => $paragraph): ?>
              <p><?= e($paragraph) ?></p>
<?php endforeach; ?>
            </div>
            <!-- TODO: replace with a workspace photo, your hands at work, or an illustrated portrait. -->
            <figure class="portrait"><div class="frame"><?php if (!empty($about['portrait_image'])): ?><img src="<?= e($about['portrait_image']) ?>" alt="<?= e(isset($site['name']) ? $site['name'] : 'Portrait') ?>" loading="lazy"><?php else: ?><?= e(isset($about['portrait_placeholder']) ? $about['portrait_placeholder'] : 'Add a portrait or workspace photo') ?><?php endif; ?></div></figure>
          </div>

          <dl>
<?php foreach ($about['details'] as $detail): ?>
            <div><dt><?= e($detail['label']) ?></dt><dd><?php if (!empty($detail['raw'])): ?><?= $detail['value'] ?><?php else: ?><?= e($detail['value']) ?><?php endif; ?></dd></div>
<?php endforeach; ?>
          </dl>
        </div>
      </div>
    </section>
