<?php
/** @var array $about */
$experience = isset($about['experience']) && is_array($about['experience']) ? $about['experience'] : array();
?>
    <section id="experience">
      <div class="wrap section-grid">
        <h2>Experience</h2>
        <div class="section-body">
          <!-- TODO: copy these rows from LinkedIn, newest first. Duplicate the <li> as needed. -->
          <ul class="timeline timeline-experience">
<?php foreach ($experience as $item): ?>
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
        </div>
      </div>
    </section>
