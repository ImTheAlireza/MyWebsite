<?php
/** @var array $about */
$education = isset($about['education']) && is_array($about['education']) ? $about['education'] : array();
?>
    <section id="education">
      <div class="wrap section-grid">
        <h2>Education</h2>
        <div class="section-body">
          <ul class="timeline timeline-education">
<?php foreach ($education as $item): ?>
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
