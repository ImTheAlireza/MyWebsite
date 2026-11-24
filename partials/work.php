<?php
/** @var array $works */
?>
    <section id="work">
      <div class="wrap">
        <div class="section-grid" style="margin-bottom: 2.5rem;">
          <h2>Selected work</h2>
        </div>
        <!--
          TODO: replace each .frame content with your own <img> or <video muted loop playsinline>.
          Example: <div class="frame"><img src="work/project-name.jpg" alt="Describe what the piece shows" loading="lazy"></div>
          Keep 4 to 6 pieces. Lead with the strongest motion piece.
        -->
        <div class="work-grid">
<?php foreach ($works as $work): ?>
          <figure class="work">
            <div class="frame"><?php if (!empty($work['media'])): ?><?php if ($work['media']['type'] === 'video'): ?><video src="<?= e($work['media']['src']) ?>" muted loop playsinline></video><?php else: ?><img src="<?= e($work['media']['src']) ?>" alt="<?= e(isset($work['media']['alt']) ? $work['media']['alt'] : '') ?>" loading="lazy"><?php endif; ?><?php else: ?><?= e(isset($work['placeholder']) ? $work['placeholder'] : 'Add image or video') ?><?php endif; ?></div>
            <figcaption><span class="title"><?= e($work['title']) ?></span><span class="meta"><?= e($work['meta']) ?></span></figcaption>
          </figure>
<?php endforeach; ?>
        </div>
      </div>
    </section>
