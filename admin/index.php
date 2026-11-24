<?php
require_once __DIR__ . '/init.php';
admin_require_login();

$content = load_content();
$message = '';
$error = '';

function post_str($key, $default = '')
{
    return isset($_POST[$key]) ? trim((string) $_POST[$key]) : $default;
}

function post_array($key)
{
    return (isset($_POST[$key]) && is_array($_POST[$key])) ? $_POST[$key] : array();
}

function clean_text($value)
{
    $value = is_string($value) ? trim($value) : '';
    return $value;
}

function handle_upload($fileKey, $subdir)
{
    if (!isset($_FILES[$fileKey]) || !is_array($_FILES[$fileKey])) {
        return '';
    }
    $f = $_FILES[$fileKey];
    if (!isset($f['error']) || $f['error'] === UPLOAD_ERR_NO_FILE) {
        return '';
    }
    if ($f['error'] !== UPLOAD_ERR_OK) {
        return '';
    }
    $tmp = $f['tmp_name'];
    $name = isset($f['name']) ? $f['name'] : 'upload';
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm');
    if (!in_array($ext, $allowed, true)) {
        return '';
    }
    $baseDir = dirname(__DIR__) . '/uploads/' . $subdir;
    if (!is_dir($baseDir)) {
        mkdir($baseDir, 0755, true);
    }
    $filename = uniqid('file_', true) . '.' . $ext;
    $dest = $baseDir . '/' . $filename;
    if (!move_uploaded_file($tmp, $dest)) {
        return '';
    }
    return 'uploads/' . $subdir . '/' . $filename;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = post_str('action', 'save_content');

    if ($action === 'change_password') {
        if (admin_using_env()) {
            $error = 'Password is managed via the .env file. Update ADMIN_PASSWORD in .env.';
        } else {
            $current = post_str('current_password');
            $new = post_str('new_password');
            $confirm = post_str('confirm_password');
            $admin = admin_load();
            $salt = isset($admin['salt']) ? $admin['salt'] : '';
            $hash = isset($admin['password_hash']) ? $admin['password_hash'] : '';
            if (!hash_equals($hash, admin_hash_password($current, $salt))) {
                $error = 'Current password is incorrect.';
            } elseif (strlen($new) < 8) {
                $error = 'New password must be at least 8 characters.';
            } elseif ($new !== $confirm) {
                $error = 'New password confirmation does not match.';
            } else {
                $newSalt = function_exists('random_bytes') ? bin2hex(random_bytes(16)) : md5(uniqid(mt_rand(), true));
                $admin['salt'] = $newSalt;
                $admin['password_hash'] = admin_hash_password($new, $newSalt);
                if (admin_save($admin)) {
                    $message = 'Password updated successfully.';
                } else {
                    $error = 'Failed to save password.';
                }
            }
        }
    } else {
        // Save content
        $sitePost = post_array('site');
        $site = isset($content['site']) && is_array($content['site']) ? $content['site'] : array();
        $siteFields = array('lang','title','description','name','first_name','last_name','role','intro','email','linkedin_url','footer_tagline','copyright_year');
        foreach ($siteFields as $f) {
            if (isset($sitePost[$f])) {
                $site[$f] = clean_text($sitePost[$f]);
            }
        }

        // Nav
        $nav = array();
        $navLabels = post_array('nav_label');
        $navHrefs = post_array('nav_href');
        foreach ($navLabels as $i => $label) {
            $label = clean_text($label);
            $href = isset($navHrefs[$i]) ? clean_text($navHrefs[$i]) : '';
            if ($label !== '' && $href !== '') {
                $nav[] = array('label' => $label, 'href' => $href);
            }
        }

        // Works
        $works = array();
        $wTitles = post_array('work_title');
        $wMetas = post_array('work_meta');
        $wPlaceholders = post_array('work_placeholder');
        $wMediaSrcs = post_array('work_media_src');
        $wMediaAlts = post_array('work_media_alt');
        $wMediaTypes = post_array('work_media_type');
        $wRemoveMedia = post_array('work_remove_media');
        foreach ($wTitles as $i => $title) {
            $title = clean_text($title);
            $meta = isset($wMetas[$i]) ? clean_text($wMetas[$i]) : '';
            $placeholder = isset($wPlaceholders[$i]) ? clean_text($wPlaceholders[$i]) : 'Add image or video';
            if ($title === '' && $meta === '') {
                continue;
            }
            $media = null;
            $removeMedia = isset($wRemoveMedia[$i]) && $wRemoveMedia[$i] === '1';
            $existingSrc = isset($wMediaSrcs[$i]) ? clean_text($wMediaSrcs[$i]) : '';
            $existingAlt = isset($wMediaAlts[$i]) ? clean_text($wMediaAlts[$i]) : '';
            $existingType = isset($wMediaTypes[$i]) ? clean_text($wMediaTypes[$i]) : '';

            // handle upload
            $uploadKey = 'work_media_file_' . $i;
            $uploaded = handle_upload($uploadKey, 'works');
            if ($uploaded !== '') {
                $ext = strtolower(pathinfo($uploaded, PATHINFO_EXTENSION));
                $media = array(
                    'type' => ($ext === 'mp4' || $ext === 'webm') ? 'video' : 'image',
                    'src' => $uploaded,
                    'alt' => $existingAlt,
                );
            } elseif (!$removeMedia && $existingSrc !== '') {
                $ext = strtolower(pathinfo(parse_url($existingSrc, PHP_URL_PATH), PATHINFO_EXTENSION));
                $type = in_array($ext, array('mp4', 'webm', 'mov', 'm4v'), true) ? 'video' : 'image';
                if ($existingType === 'video' || $existingType === 'image') {
                    // keep explicit type if extension is ambiguous
                    if ($ext === '' ) $type = $existingType;
                }
                $media = array(
                    'type' => $type,
                    'src' => $existingSrc,
                    'alt' => $existingAlt,
                );
            }

            $works[] = array(
                'title' => $title,
                'meta' => $meta,
                'media' => $media,
                'placeholder' => $placeholder !== '' ? $placeholder : 'Add image or video',
            );
        }

        // Services
        $services = array();
        $sTitles = post_array('service_title');
        $sDescs = post_array('service_desc');
        foreach ($sTitles as $i => $title) {
            $title = clean_text($title);
            $desc = isset($sDescs[$i]) ? clean_text($sDescs[$i]) : '';
            if ($title === '' && $desc === '') continue;
            $services[] = array('title' => $title, 'description' => $desc);
        }

        // About
        $about = isset($content['about']) && is_array($content['about']) ? $content['about'] : array();
        $paragraphs = array();
        foreach (post_array('about_paragraphs') as $p) {
            $p = clean_text($p);
            if ($p !== '') $paragraphs[] = $p;
        }
        $about['paragraphs'] = $paragraphs;
        $about['portrait_placeholder'] = clean_text(post_str('about_portrait_placeholder', isset($about['portrait_placeholder']) ? $about['portrait_placeholder'] : ''));
        $portraitUploaded = handle_upload('about_portrait_file', 'about');
        $removePortrait = post_str('about_remove_portrait') === '1';
        if ($portraitUploaded !== '') {
            $about['portrait_image'] = $portraitUploaded;
        } elseif ($removePortrait) {
            $about['portrait_image'] = '';
        } elseif (isset($_POST['about_portrait_image'])) {
            $about['portrait_image'] = clean_text($_POST['about_portrait_image']);
        }

        $details = array();
        $dLabels = post_array('detail_label');
        $dValues = post_array('detail_value');
        foreach ($dLabels as $i => $label) {
            $label = clean_text($label);
            $value = isset($dValues[$i]) ? clean_text($dValues[$i]) : '';
            if ($label === '' && $value === '') continue;
            $details[] = array('label' => $label, 'value' => $value);
        }
        $about['details'] = $details;

        $experience = array();
        $eWhens = post_array('exp_when');
        $eRoles = post_array('exp_role');
        $eCompanies = post_array('exp_company');
        $eDetails = post_array('exp_detail');
        foreach ($eWhens as $i => $when) {
            $when = clean_text($when);
            $role = isset($eRoles[$i]) ? clean_text($eRoles[$i]) : '';
            $company = isset($eCompanies[$i]) ? clean_text($eCompanies[$i]) : '';
            $detail = isset($eDetails[$i]) ? clean_text($eDetails[$i]) : '';
            if ($when === '' && $role === '' && $company === '' && $detail === '') continue;
            $experience[] = array('when' => $when, 'role' => $role, 'company' => $company, 'detail' => $detail);
        }
        $about['experience'] = $experience;

        $education = array();
        $edWhens = post_array('edu_when');
        $edDegrees = post_array('edu_degree');
        $edInstitutions = post_array('edu_institution');
        $edGpas = post_array('edu_gpa');
        $edDetails = post_array('edu_detail');
        foreach ($edWhens as $i => $when) {
            $when = clean_text($when);
            $degree = isset($edDegrees[$i]) ? clean_text($edDegrees[$i]) : '';
            $institution = isset($edInstitutions[$i]) ? clean_text($edInstitutions[$i]) : '';
            $gpa = isset($edGpas[$i]) ? clean_text($edGpas[$i]) : '';
            $detail = isset($edDetails[$i]) ? clean_text($edDetails[$i]) : '';
            if ($when === '' && $degree === '' && $institution === '' && $gpa === '' && $detail === '') continue;
            $education[] = array('when' => $when, 'degree' => $degree, 'institution' => $institution, 'gpa' => $gpa, 'detail' => $detail);
        }
        $about['education'] = $education;

        // Contact
        $contact = isset($content['contact']) && is_array($content['contact']) ? $content['contact'] : array();
        $contact['intro'] = clean_text(post_str('contact_intro', isset($contact['intro']) ? $contact['intro'] : ''));
        $formTypes = array();
        foreach (post_array('contact_form_types') as $t) {
            $t = clean_text($t);
            if ($t !== '') $formTypes[] = $t;
        }
        $contact['form_types'] = $formTypes;

        $newContent = array(
            'site' => $site,
            'nav' => $nav,
            'works' => $works,
            'services' => $services,
            'about' => $about,
            'contact' => $contact,
        );

        if (save_content($newContent)) {
            $message = 'Changes saved successfully.';
            $content = load_content();
        } else {
            $error = 'Failed to save content file. Check write permissions for the data directory.';
        }
    }
}

$site = isset($content['site']) ? $content['site'] : array();
$nav = isset($content['nav']) ? $content['nav'] : array();
$works = isset($content['works']) ? $content['works'] : array();
$services = isset($content['services']) ? $content['services'] : array();
$about = isset($content['about']) ? $content['about'] : array();
$contact = isset($content['contact']) ? $content['contact'] : array();
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
  <div class="admin-shell">
    <aside class="sidebar">
      <h2>Admin Panel</h2>
      <p class="muted small"><?= e(isset($site['name']) ? $site['name'] : 'Site') ?></p>
      <nav>
        <a href="#site">Site Settings</a>
        <a href="#nav">Navigation</a>
        <a href="#works">Projects</a>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="#password">Password</a>
        <a href="media.php">Media Library</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="danger-link">Log out</a>
      </nav>
    </aside>

    <main class="content">
      <div class="page-head">
        <h1>Content Manager</h1>
        <p class="muted">Edit your site information, projects, and all other sections from here.</p>
      </div>

      <?php if ($message): ?><div class="alert alert-success"><?= e($message) ?></div><?php endif; ?>
      <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>

      <form method="post" enctype="multipart/form-data" class="main-form">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="save_content">

        <section id="site" class="card">
          <h2>Site Settings</h2>
          <div class="grid-2">
            <label>Site name<input type="text" name="site[name]" value="<?= e(isset($site['name']) ? $site['name'] : '') ?>"></label>
            <label>Page title<input type="text" name="site[title]" value="<?= e(isset($site['title']) ? $site['title'] : '') ?>"></label>
            <label>First name<input type="text" name="site[first_name]" value="<?= e(isset($site['first_name']) ? $site['first_name'] : '') ?>"></label>
            <label>Last name<input type="text" name="site[last_name]" value="<?= e(isset($site['last_name']) ? $site['last_name'] : '') ?>"></label>
            <label>Email<input type="email" name="site[email]" value="<?= e(isset($site['email']) ? $site['email'] : '') ?>"></label>
            <label>LinkedIn URL<input type="text" name="site[linkedin_url]" value="<?= e(isset($site['linkedin_url']) ? $site['linkedin_url'] : '') ?>"></label>
            <label>Language (lang)<input type="text" name="site[lang]" value="<?= e(isset($site['lang']) ? $site['lang'] : 'en') ?>"></label>
            <label>Copyright year<input type="text" name="site[copyright_year]" value="<?= e(isset($site['copyright_year']) ? $site['copyright_year'] : '') ?>"></label>
          </div>
          <label>Meta description<textarea name="site[description]" rows="2"><?= e(isset($site['description']) ? $site['description'] : '') ?></textarea></label>
          <label>Hero role<input type="text" name="site[role]" value="<?= e(isset($site['role']) ? $site['role'] : '') ?>"></label>
          <label>Hero intro<textarea name="site[intro]" rows="3"><?= e(isset($site['intro']) ? $site['intro'] : '') ?></textarea></label>
          <label>Footer tagline<input type="text" name="site[footer_tagline]" value="<?= e(isset($site['footer_tagline']) ? $site['footer_tagline'] : '') ?>"></label>
        </section>

        <section id="nav" class="card">
          <div class="section-head">
            <h2>Navigation</h2>
            <button type="button" class="btn btn-small" data-add="nav">+ Add item</button>
          </div>
          <div id="nav-list" class="repeat-list">
            <?php foreach ($nav as $item): ?>
            <div class="repeat-item grid-2">
              <label>Title<input type="text" name="nav_label[]" value="<?= e(isset($item['label']) ? $item['label'] : '') ?>"></label>
              <label>URL<input type="text" name="nav_href[]" value="<?= e(isset($item['href']) ? $item['href'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="works" class="card">
          <div class="section-head">
            <h2>Projects (Selected Work)</h2>
            <button type="button" class="btn btn-small" data-add="work">+ Add project</button>
          </div>
          <div id="works-list" class="repeat-list">
            <?php foreach ($works as $i => $work): ?>
            <?php $media = isset($work['media']) && is_array($work['media']) ? $work['media'] : null; ?>
            <div class="repeat-item work-item">
              <div class="grid-2">
                <label>Project title<input type="text" name="work_title[]" value="<?= e(isset($work['title']) ? $work['title'] : '') ?>"></label>
                <label>Meta (e.g. Motion · Client)<input type="text" name="work_meta[]" value="<?= e(isset($work['meta']) ? $work['meta'] : '') ?>"></label>
              </div>
              <label>Placeholder text (when no media)<input type="text" name="work_placeholder[]" value="<?= e(isset($work['placeholder']) ? $work['placeholder'] : '') ?>"></label>
              <div class="grid-2">
                <label>Media file (image/video)<input type="file" name="work_media_file_<?= $i ?>" accept="image/*,video/mp4,video/webm"></label>
                <label>Image alt text<input type="text" name="work_media_alt[]" value="<?= e($media && isset($media['alt']) ? $media['alt'] : '') ?>"></label>
              </div>
              <input type="hidden" name="work_media_src[]" value="<?= e($media && isset($media['src']) ? $media['src'] : '') ?>">
              <input type="hidden" name="work_media_type[]" value="<?= e($media && isset($media['type']) ? $media['type'] : '') ?>">
              <?php if ($media && !empty($media['src'])): ?>
              <div class="media-preview">
                <span class="muted small">Current file: <?= e($media['src']) ?></span>
                <label class="inline-check"><input type="checkbox" name="work_remove_media[<?= $i ?>]" value="1"> Remove media</label>
              </div>
              <?php else: ?>
              <input type="hidden" name="work_remove_media[<?= $i ?>]" value="0">
              <?php endif; ?>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove project</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="services" class="card">
          <div class="section-head">
            <h2>Services</h2>
            <button type="button" class="btn btn-small" data-add="service">+ Add service</button>
          </div>
          <div id="services-list" class="repeat-list">
            <?php foreach ($services as $svc): ?>
            <div class="repeat-item grid-2">
              <label>Title<input type="text" name="service_title[]" value="<?= e(isset($svc['title']) ? $svc['title'] : '') ?>"></label>
              <label>Description<input type="text" name="service_desc[]" value="<?= e(isset($svc['description']) ? $svc['description'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="about" class="card">
          <h2>About</h2>
          <div class="section-head"><h3>Paragraphs</h3><button type="button" class="btn btn-small" data-add="paragraph">+ Add paragraph</button></div>
          <div id="paragraphs-list" class="repeat-list">
            <?php $paragraphs = isset($about['paragraphs']) && is_array($about['paragraphs']) ? $about['paragraphs'] : array(); ?>
            <?php foreach ($paragraphs as $p): ?>
            <div class="repeat-item">
              <label>Paragraph<textarea name="about_paragraphs[]" rows="3"><?= e($p) ?></textarea></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>

          <h3>Portrait / workspace image</h3>
          <label>Portrait placeholder text<input type="text" name="about_portrait_placeholder" value="<?= e(isset($about['portrait_placeholder']) ? $about['portrait_placeholder'] : '') ?>"></label>
          <label>Upload portrait image<input type="file" name="about_portrait_file" accept="image/*"></label>
          <input type="hidden" name="about_portrait_image" value="<?= e(isset($about['portrait_image']) ? $about['portrait_image'] : '') ?>">
          <?php if (!empty($about['portrait_image'])): ?>
            <div class="media-preview"><span class="muted small">Current file: <?= e($about['portrait_image']) ?></span>
            <label class="inline-check"><input type="checkbox" name="about_remove_portrait" value="1"> Remove image</label></div>
          <?php endif; ?>

          <div class="section-head"><h3>Details (Focus/Tools/...)</h3><button type="button" class="btn btn-small" data-add="detail">+ Add</button></div>
          <div id="details-list" class="repeat-list">
            <?php $details = isset($about['details']) && is_array($about['details']) ? $about['details'] : array(); ?>
            <?php foreach ($details as $d): ?>
            <div class="repeat-item grid-2">
              <label>Title<input type="text" name="detail_label[]" value="<?= e(isset($d['label']) ? $d['label'] : '') ?>"></label>
              <label>Value<input type="text" name="detail_value[]" value="<?= e(isset($d['value']) ? $d['value'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>

          <div class="section-head"><h3>Experience</h3><button type="button" class="btn btn-small" data-add="exp">+ Add</button></div>
          <div id="exp-list" class="repeat-list">
            <?php $experience = isset($about['experience']) && is_array($about['experience']) ? $about['experience'] : array(); ?>
            <?php foreach ($experience as $ex): ?>
            <?php $exRole = isset($ex['role']) ? $ex['role'] : (isset($ex['what']) ? $ex['what'] : ''); $exCompany = isset($ex['company']) ? $ex['company'] : ''; ?>
            <div class="repeat-item">
              <div class="grid-3">
                <label>Period<input type="text" name="exp_when[]" value="<?= e(isset($ex['when']) ? $ex['when'] : '') ?>" placeholder="e.g. Jun 2023 – Present"></label>
                <label>Role / Title<input type="text" name="exp_role[]" value="<?= e($exRole) ?>" placeholder="e.g. Motion Designer"></label>
                <label>Company / Organization<input type="text" name="exp_company[]" value="<?= e($exCompany) ?>" placeholder="e.g. IDmelon"></label>
              </div>
              <label>Description<textarea name="exp_detail[]" rows="2" placeholder="One line on what you did there."><?= e(isset($ex['detail']) ? $ex['detail'] : '') ?></textarea></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>

          <div class="section-head"><h3>Education</h3><button type="button" class="btn btn-small" data-add="edu">+ Add</button></div>
          <div id="edu-list" class="repeat-list">
            <?php $education = isset($about['education']) && is_array($about['education']) ? $about['education'] : array(); ?>
            <?php foreach ($education as $ed): ?>
            <?php $edDegree = isset($ed['degree']) ? $ed['degree'] : (isset($ed['what']) ? $ed['what'] : ''); $edInst = isset($ed['institution']) ? $ed['institution'] : ''; $edGpa = isset($ed['gpa']) ? $ed['gpa'] : ''; ?>
            <div class="repeat-item">
              <div class="grid-2">
                <label>Period<input type="text" name="edu_when[]" value="<?= e(isset($ed['when']) ? $ed['when'] : '') ?>" placeholder="e.g. 2020 – 2024"></label>
                <label>Degree / Program<input type="text" name="edu_degree[]" value="<?= e($edDegree) ?>" placeholder="e.g. B.A. Graphic Design"></label>
                <label>Institution<input type="text" name="edu_institution[]" value="<?= e($edInst) ?>" placeholder="e.g. University name"></label>
                <label>GPA<input type="text" name="edu_gpa[]" value="<?= e($edGpa) ?>" placeholder="e.g. 3.8 / 4.0"></label>
              </div>
              <label>Description (optional)<textarea name="edu_detail[]" rows="2" placeholder="Optional note"><?= e(isset($ed['detail']) ? $ed['detail'] : '') ?></textarea></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="contact" class="card">
          <h2>Contact</h2>
          <label>Contact intro text<textarea name="contact_intro" rows="2"><?= e(isset($contact['intro']) ? $contact['intro'] : '') ?></textarea></label>
          <div class="section-head"><h3>Contact form options</h3><button type="button" class="btn btn-small" data-add="ctype">+ Add Option</button></div>
          <div id="ctype-list" class="repeat-list">
            <?php $formTypes = isset($contact['form_types']) && is_array($contact['form_types']) ? $contact['form_types'] : array(); ?>
            <?php foreach ($formTypes as $t): ?>
            <div class="repeat-item grid-2">
              <label>Option<input type="text" name="contact_form_types[]" value="<?= e($t) ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <div class="save-bar">
          <button type="submit" class="btn btn-primary">Save all changes</button>
        </div>
      </form>

      <section id="password" class="card">
        <h2>Change password</h2>
        <?php if (admin_using_env()): ?>
          <p class="muted">Admin authentication is managed through the <code>.env</code> file. To change credentials, update <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> in <code>.env</code>.</p>
        <?php else: ?>
          <form method="post" class="password-form">
            <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
            <input type="hidden" name="action" value="change_password">
            <div class="grid-3">
              <label>Current password<input type="password" name="current_password" required></label>
              <label>New password<input type="password" name="new_password" required minlength="8"></label>
              <label>Confirm new password<input type="password" name="confirm_password" required minlength="8"></label>
            </div>
            <button type="submit" class="btn btn-primary">Update password</button>
          </form>
        <?php endif; ?>
      </section>
    </main>
  </div>

  <template id="tpl-nav">
    <div class="repeat-item grid-2">
      <label>Title<input type="text" name="nav_label[]" value=""></label>
      <label>URL<input type="text" name="nav_href[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-work">
    <div class="repeat-item work-item">
      <div class="grid-2">
        <label>Project title<input type="text" name="work_title[]" value=""></label>
        <label>Meta (e.g. Motion · Client)<input type="text" name="work_meta[]" value=""></label>
      </div>
      <label>Placeholder text (when no media)<input type="text" name="work_placeholder[]" value="Add image or video"></label>
      <div class="grid-2">
        <label>Media file (image/video)<input type="file" name="__WORK_MEDIA_FILE__" accept="image/*,video/mp4,video/webm"></label>
        <label>Image alt text<input type="text" name="work_media_alt[]" value=""></label>
      </div>
      <label>Or media URL/path (copy from library)<input type="text" name="work_media_src[]" value="" placeholder="uploads/library/... or https://..."></label>
      <input type="hidden" name="work_media_type[]" value="">
      <input type="hidden" name="work_remove_media[__WORK_INDEX__]" value="0">
      <button type="button" class="btn btn-danger btn-small remove-row">Remove project</button>
    </div>
  </template>
  <template id="tpl-service">
    <div class="repeat-item grid-2">
      <label>Title<input type="text" name="service_title[]" value=""></label>
      <label>Description<input type="text" name="service_desc[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-paragraph">
    <div class="repeat-item">
      <label>Paragraph<textarea name="about_paragraphs[]" rows="3"></textarea></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-detail">
    <div class="repeat-item grid-2">
      <label>Title<input type="text" name="detail_label[]" value=""></label>
      <label>Value<input type="text" name="detail_value[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-exp">
    <div class="repeat-item">
      <div class="grid-3">
        <label>Period<input type="text" name="exp_when[]" value="" placeholder="e.g. Jun 2023 – Present"></label>
        <label>Role / Title<input type="text" name="exp_role[]" value="" placeholder="e.g. Motion Designer"></label>
        <label>Company / Organization<input type="text" name="exp_company[]" value="" placeholder="e.g. IDmelon"></label>
      </div>
      <label>Description<textarea name="exp_detail[]" rows="2" placeholder="One line on what you did there."></textarea></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-edu">
    <div class="repeat-item">
      <div class="grid-2">
        <label>Period<input type="text" name="edu_when[]" value="" placeholder="e.g. 2020 – 2024"></label>
        <label>Degree / Program<input type="text" name="edu_degree[]" value="" placeholder="e.g. B.A. Graphic Design"></label>
        <label>Institution<input type="text" name="edu_institution[]" value="" placeholder="e.g. University name"></label>
        <label>GPA<input type="text" name="edu_gpa[]" value="" placeholder="e.g. 3.8 / 4.0"></label>
      </div>
      <label>Description (optional)<textarea name="edu_detail[]" rows="2" placeholder="Optional note"></textarea></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>
  <template id="tpl-ctype">
    <div class="repeat-item grid-2">
      <label>Option<input type="text" name="contact_form_types[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
    </div>
  </template>

  <script>
    (function () {
      var workIndex = document.querySelectorAll('#works-list .work-item').length;
      function addFromTemplate(tplId, targetId, isWork) {
        var tpl = document.getElementById(tplId);
        var target = document.getElementById(targetId);
        if (!tpl || !target) return;
        var html = tpl.innerHTML;
        if (isWork) {
          html = html.replace(/__WORK_INDEX__/g, String(workIndex));
          html = html.replace(/__WORK_MEDIA_FILE__/g, 'work_media_file_' + workIndex);
          workIndex++;
        }
        var wrap = document.createElement('div');
        wrap.innerHTML = html.trim();
        var node = wrap.firstChild;
        target.appendChild(node);
      }
      document.addEventListener('click', function (e) {
        var add = e.target.closest('[data-add]');
        if (add) {
          var type = add.getAttribute('data-add');
          if (type === 'nav') addFromTemplate('tpl-nav', 'nav-list');
          if (type === 'work') addFromTemplate('tpl-work', 'works-list', true);
          if (type === 'service') addFromTemplate('tpl-service', 'services-list');
          if (type === 'paragraph') addFromTemplate('tpl-paragraph', 'paragraphs-list');
          if (type === 'detail') addFromTemplate('tpl-detail', 'details-list');
          if (type === 'exp') addFromTemplate('tpl-exp', 'exp-list');
          if (type === 'edu') addFromTemplate('tpl-edu', 'edu-list');
          if (type === 'ctype') addFromTemplate('tpl-ctype', 'ctype-list');
        }
        var rem = e.target.closest('.remove-row');
        if (rem) {
          var item = rem.closest('.repeat-item');
          if (item) item.remove();
        }
      });

      // Renumber work media file inputs/remove_media before submit so indexes align with posted arrays
      var mainForm = document.querySelector('.main-form');
      if (mainForm) {
        mainForm.addEventListener('submit', function () {
          var items = mainForm.querySelectorAll('#works-list .work-item');
          items.forEach(function (item, idx) {
            var file = item.querySelector('input[type="file"]');
            if (file) file.name = 'work_media_file_' + idx;
            var remove = item.querySelector('input[name^="work_remove_media"]');
            if (remove) remove.name = 'work_remove_media[' + idx + ']';
          });
        });
      }
    })();
  </script>
</body>
</html>
