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

          <h3>Experience</h3>
          <!-- TODO: copy these rows from LinkedIn, newest first. Duplicate the <li> as needed. -->
          <ul class="timeline">
<?php foreach ($about['experience'] as $item): ?>
            <li><span class="when"><?= e($item['when']) ?></span><span class="what"><?= e($item['what']) ?><?php if (!empty($item['detail'])): ?><span class="detail"><?= e($item['detail']) ?></span><?php endif; ?></span></li>
<?php endforeach; ?>
          </ul>

          <h3>Education</h3>
          <ul class="timeline">
<?php foreach ($about['education'] as $item): ?>
            <li><span class="when"><?= e($item['when']) ?></span><span class="what"><?= e($item['what']) ?><?php if (!empty($item['detail'])): ?><span class="detail"><?= e($item['detail']) ?></span><?php endif; ?></span></li>
<?php endforeach; ?>
          </ul>
        </div>
      </div>
    </section>
