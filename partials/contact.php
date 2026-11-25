<?php
/** @var array $site */
/** @var array $contact */
?>
    <section id="contact" class="contact">
      <div class="wrap section-grid">
        <h2>Contact</h2>
        <div class="section-body">
          <a class="contact-mail" href="mailto:<?= e($site['email']) ?>"><?= e($site['email']) ?></a>
          <p><?= e($contact['intro']) ?></p>
          <?php if (!empty($site['linkedin_url'])): ?>
          <a class="contact-linkedin" href="<?= e($site['linkedin_url']) ?>" target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">&nbsp;↗</span></a>
          <?php endif; ?>

          <form class="form" id="contact-form">
            <div class="field hp-field" aria-hidden="true">
              <label for="f-company">Company</label>
              <input id="f-company" name="company" type="text" tabindex="-1" autocomplete="off">
            </div>
            <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
            <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
            <div class="field full">
              <label for="f-type">What do you need?</label>
              <select id="f-type" name="type">
<?php foreach ($contact['form_types'] as $type): ?>
                <option><?= e($type) ?></option>
<?php endforeach; ?>
              </select>
            </div>
            <div class="field full"><label for="f-msg">Project details</label><textarea id="f-msg" name="message" required placeholder="What it is, the format and the deadline."></textarea></div>
            <button class="send" type="submit">Send message</button>
            <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>
