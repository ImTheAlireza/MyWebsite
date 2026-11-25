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
          Keep 4 to 6 pieces. Lead with the strongest motion piece.
        -->
        <div class="work-grid">
<?php foreach ($works as $i => $work): ?>
<?php
  $media = !empty($work['media']) && is_array($work['media']) ? $work['media'] : null;
  $type = $media && isset($media['type']) ? $media['type'] : '';
  $src = $media && isset($media['src']) ? $media['src'] : '';
  $alt = $media && isset($media['alt']) ? $media['alt'] : (isset($work['title']) ? $work['title'] : '');
  $poster = $media && isset($media['poster']) ? $media['poster'] : '';
  $title = isset($work['title']) ? $work['title'] : '';
  $meta = isset($work['meta']) ? $work['meta'] : '';
  $isLcp = ($i === 0);
  $imgLoading = $isLcp ? 'eager' : 'lazy';
  $imgFetchPriority = $isLcp ? ' fetchpriority="high"' : '';
  $imgDecoding = $isLcp ? 'async' : 'async';
?>
          <div class="work-card" data-work-index="<?= $i ?>" data-type="<?= e($type) ?>" data-src="<?= e($src) ?>" data-poster="<?= e($poster) ?>" data-title="<?= e($title) ?>" data-meta="<?= e($meta) ?>" data-alt="<?= e($alt) ?>" tabindex="0" role="button" aria-label="Open <?= e($title) ?>">
            <div class="work-thumb">
              <?php if ($media && $type === 'video'): ?>
                <?php if ($poster !== ''): ?>
                  <img <?= responsive_img_attrs($poster, '(max-width: 860px) 100vw, 33vw') ?> alt="<?= e($alt) ?>" loading="<?= e($imgLoading) ?>" decoding="<?= e($imgDecoding) ?>"<?= $imgFetchPriority ?>>
                <?php else: ?>
                  <video src="<?= e($src) ?>" muted loop playsinline preload="none" aria-label="<?= e($alt !== '' ? $alt : $title) ?>">
                    <track kind="captions" src="assets/empty.vtt" srclang="en" label="Captions">
                  </video>
                <?php endif; ?>
                <span class="work-play-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7,5 19,12 7,19"></polygon></svg></span>
              <?php elseif ($media && $src !== ''): ?>
                <img <?= responsive_img_attrs($src, '(max-width: 860px) 100vw, 33vw') ?> alt="<?= e($alt) ?>" loading="<?= e($imgLoading) ?>" decoding="<?= e($imgDecoding) ?>"<?= $imgFetchPriority ?>>
              <?php else: ?>
                <div class="work-placeholder"><?= e(isset($work['placeholder']) ? $work['placeholder'] : 'Add image or video') ?></div>
              <?php endif; ?>
              <div class="work-overlay">
                <div class="work-overlay-content">
                  <h3 class="work-overlay-title"><?= e($title) ?></h3>
                  <?php if ($meta !== ''): ?><p class="work-overlay-meta"><?= e($meta) ?></p><?php endif; ?>
                </div>
              </div>
            </div>
          </div>
<?php endforeach; ?>
        </div>
      </div>

    </section>

      <div class="work-modal" id="work-modal" aria-hidden="true">
        <div class="work-modal-backdrop" data-close-work></div>
        <div class="work-modal-dialog" role="dialog" aria-modal="true" aria-label="Project preview">
          <button type="button" class="work-modal-close" data-close-work aria-label="Close">&times;</button>
          <div class="work-modal-navigation" aria-label="Project navigation">
            <button type="button" class="work-modal-prev" data-work-step="-1" aria-label="Previous project">&#8592;</button>
            <span id="work-modal-count" role="status" aria-live="polite"></span>
            <button type="button" class="work-modal-next" data-work-step="1" aria-label="Next project">&#8594;</button>
          </div>
          <div class="work-modal-media" id="work-modal-media"></div>
          <div class="work-modal-info">
            <h3 id="work-modal-title"></h3>
            <p id="work-modal-meta"></p>
          </div>
        </div>
      </div>
