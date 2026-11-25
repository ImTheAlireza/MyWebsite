<?php
require_once __DIR__ . '/init.php';

if (admin_logged_in()) {
    admin_redirect('index.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    if (!rate_limit_check('admin_login:' . $ip, 10, 900)) {
        $error = 'Too many login attempts. Please try again later.';
    } else {
    $username = isset($_POST['username']) && is_string($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) && is_string($_POST['password']) ? (string) $_POST['password'] : '';
    if (admin_verify($username, $password)) {
        session_regenerate_id(true);
        $_SESSION = array();
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        admin_redirect('index.php');
    } else {
        $error = 'Incorrect username or password.';
    }
    }
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Login</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="login-page">
  <div class="login-card">
    <h1>Admin Panel</h1>
    <p class="muted">Sign in to edit your website content.</p>
    <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>
    <form method="post">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <label>Username
        <input type="text" name="username" required autocomplete="username">
      </label>
      <label>Password
        <input type="password" name="password" required autocomplete="current-password">
      </label>
      <button type="submit" class="btn btn-primary">Sign in</button>
    </form>
  </div>
</body>
</html>
