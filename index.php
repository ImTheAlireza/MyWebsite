<?php

// Temporary debug settings to diagnose production issues.
// TODO: disable/remove after the site is loading correctly.
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php-error.log');
error_log('[' . date('c') . '] index.php reached; PHP ' . PHP_VERSION . '; SAPI ' . PHP_SAPI);

try {
    require __DIR__ . '/includes/functions.php';
    require __DIR__ . '/includes/config.php';

    require __DIR__ . '/partials/head.php';
    require __DIR__ . '/partials/header.php';
    ?>
  <main id="top">
<?php
    require __DIR__ . '/partials/hero.php';
    require __DIR__ . '/partials/work.php';
    require __DIR__ . '/partials/services.php';
    require __DIR__ . '/partials/about.php';
    require __DIR__ . '/partials/contact.php';
    ?>
  </main>

<?php
    require __DIR__ . '/partials/footer.php';
} catch (Exception $e) {
    $msg = '[' . date('c') . '] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    error_log($msg);
    http_response_code(500);
    echo '<pre style="white-space:pre-wrap;font:14px/1.5 monospace;padding:24px">';
    echo htmlspecialchars($msg, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo "\n\n" . htmlspecialchars($e->getTraceAsString(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '</pre>';
}
