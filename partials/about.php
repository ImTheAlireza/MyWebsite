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
          <ul class="timeline timeline-experience">
<?php foreach ($about['experience'] as $item): ?>
<?php
  $role = isset($item['role']) ? $item['role'] : (isset($item['what']) ? $item['what'] : '');
  $company = isset($item['company']) ? $item['company'] : '';
  $detail = isset($item['detail']) ? $item['detail'] : '';
?>
            <li>
              <span class="when"><?= e(isset($item['when']) ? $item['when'] : '') ?></span>
              <div class="timeline-content">
                <span class="role-title"><?= e($role) ?></span>
                <?php if ($company !== ''): ?><span class="company"><?= e($company) ?></span><?php endif; ?>
                <?php if ($detail !== ''): ?><span class="detail"><?= e($detail) ?></span><?php endif; ?>
              </div>
            </li>
<?php endforeach; ?>
          </ul>

          <h3>Education</h3>
          <ul class="timeline timeline-education">
<?php foreach ($about['education'] as $item): ?>
<?php
  $degree = isset($item['degree']) ? $item['degree'] : (isset($item['what']) ? $item['what'] : '');
  $institution = isset($item['institution']) ? $item['institution'] : '';
  $gpa = isset($item['gpa']) ? $item['gpa'] : '';
  $detail = isset($item['detail']) ? $item['detail'] : '';
?>
            <li>
              <span class="when"><?= e(isset($item['when']) ? $item['when'] : '') ?></span>
              <div class="timeline-content">
                <span class="role-title"><?= e($degree) ?></span>
                <?php if ($institution !== ''): ?><span class="company"><?= e($institution) ?></span><?php endif; ?>
                <?php if ($gpa !== ''): ?><span class="gpa">GPA: <?= e($gpa) ?></span><?php endif; ?>
                <?php if ($detail !== ''): ?><span class="detail"><?= e($detail) ?></span><?php endif; ?>
              </div>
            </li>
<?php endforeach; ?>
          </ul>
        </div>
      </div>
    </section>
