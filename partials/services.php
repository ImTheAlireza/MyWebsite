<?php
/** @var array $services */
?>
    <section id="services">
      <div class="wrap section-grid">
        <h2>Services</h2>
        <div class="section-body">
          <!-- TODO: edit these to match exactly what you want to sell. -->
          <ul class="services">
<?php foreach ($services as $service): ?>
            <li><h3><?= e($service['title']) ?></h3><p><?= e($service['description']) ?></p></li>
<?php endforeach; ?>
          </ul>
        </div>
      </div>
    </section>
