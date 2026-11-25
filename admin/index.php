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
    return is_string($value) ? trim($value) : '';
}
function handle_upload($fileKey, $subdir)
{
    if (!isset($_FILES[$fileKey]) || !is_array($_FILES[$fileKey])) return '';
    $f = $_FILES[$fileKey];
    if (!isset($f['error']) || $f['error'] === UPLOAD_ERR_NO_FILE) return '';
    if ($f['error'] !== UPLOAD_ERR_OK) return '';
    $tmp = $f['tmp_name'];
    $name = isset($f['name']) ? $f['name'] : 'upload';
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm');
    if (!in_array($ext, $allowed, true) || !is_uploaded_file($tmp) || !valid_media_upload($tmp, $ext)) return '';
    $baseDir = dirname(__DIR__) . '/uploads/' . $subdir;
    if (!is_dir($baseDir)) mkdir($baseDir, 0755, true);
    $filename = uniqid('file_', true) . '.' . $ext;
    $dest = $baseDir . '/' . $filename;
    if (!move_uploaded_file($tmp, $dest)) return '';
    if (function_exists('generate_image_variants')) {
        generate_image_variants($dest);
    }
    return 'uploads/' . $subdir . '/' . $filename;
}

$allowedTabs = array('site', 'nav', 'works', 'services', 'about', 'experience', 'education', 'contact', 'password');
$activeTab = isset($_GET['tab']) ? $_GET['tab'] : (isset($_POST['tab']) ? $_POST['tab'] : 'site');
if (!in_array($activeTab, $allowedTabs, true)) $activeTab = 'site';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = post_str('action', 'save_tab');
    $tab = post_str('tab', $activeTab);
    if (!in_array($tab, $allowedTabs, true)) $tab = 'site';
    $activeTab = $tab;

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
            if (!admin_verify($admin['username'], $current)) {
                $error = 'Current password is incorrect.';
            } elseif (strlen($new) < 12 || strlen($new) > 72) {
                $error = 'New password must be between 12 and 72 characters.';
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
        $newContent = $content;

        if ($tab === 'site') {
            $sitePost = post_array('site');
            $site = isset($newContent['site']) && is_array($newContent['site']) ? $newContent['site'] : array();
            $siteFields = array('lang','title','description','name','first_name','last_name','role','intro','email','linkedin_url','footer_tagline','copyright_year');
            foreach ($siteFields as $f) {
                if (isset($sitePost[$f])) $site[$f] = clean_text($sitePost[$f]);
            }
            $newContent['site'] = $site;
        } elseif ($tab === 'nav') {
            $nav = array();
            $navLabels = post_array('nav_label');
            $navHrefs = post_array('nav_href');
            foreach ($navLabels as $i => $label) {
                $label = clean_text($label);
                $href = isset($navHrefs[$i]) ? clean_text($navHrefs[$i]) : '';
                if ($label !== '' && $href !== '') $nav[] = array('label' => $label, 'href' => $href);
            }
            $newContent['nav'] = $nav;
        } elseif ($tab === 'works') {
            $works = array();
            $wTitles = post_array('work_title');
            $wMetas = post_array('work_meta');
            $wPlaceholders = post_array('work_placeholder');
            $wMediaSrcs = post_array('work_media_src');
            $wMediaAlts = post_array('work_media_alt');
            $wMediaTypes = post_array('work_media_type');
            $wMediaPosters = post_array('work_media_poster');
            $wRemoveMedia = post_array('work_remove_media');
            foreach ($wTitles as $i => $title) {
                $title = clean_text($title);
                $meta = isset($wMetas[$i]) ? clean_text($wMetas[$i]) : '';
                $placeholder = isset($wPlaceholders[$i]) ? clean_text($wPlaceholders[$i]) : 'Add image or video';
                if ($title === '' && $meta === '') continue;
                $media = null;
                $removeMedia = isset($wRemoveMedia[$i]) && $wRemoveMedia[$i] === '1';
                $existingSrc = isset($wMediaSrcs[$i]) ? clean_text($wMediaSrcs[$i]) : '';
                $existingAlt = isset($wMediaAlts[$i]) ? clean_text($wMediaAlts[$i]) : '';
                $existingType = isset($wMediaTypes[$i]) ? clean_text($wMediaTypes[$i]) : '';
                $existingPoster = isset($wMediaPosters[$i]) ? clean_text($wMediaPosters[$i]) : '';
                $uploaded = handle_upload('work_media_file_' . $i, 'works');
                if ($uploaded !== '') {
                    $ext = strtolower(pathinfo($uploaded, PATHINFO_EXTENSION));
                    $mediaType = ($ext === 'mp4' || $ext === 'webm') ? 'video' : 'image';
                    $media = array('type' => $mediaType, 'src' => $uploaded, 'alt' => $existingAlt);
                    if ($mediaType === 'video' && $existingPoster !== '') $media['poster'] = $existingPoster;
                } elseif (!$removeMedia && $existingSrc !== '') {
                    $ext = strtolower(pathinfo(parse_url($existingSrc, PHP_URL_PATH), PATHINFO_EXTENSION));
                    $type = in_array($ext, array('mp4','webm','mov','m4v'), true) ? 'video' : 'image';
                    if (($existingType === 'video' || $existingType === 'image') && $ext === '') $type = $existingType;
                    $media = array('type' => $type, 'src' => $existingSrc, 'alt' => $existingAlt);
                    if ($type === 'video' && $existingPoster !== '') $media['poster'] = $existingPoster;
                }
                $works[] = array('title' => $title, 'meta' => $meta, 'media' => $media, 'placeholder' => $placeholder !== '' ? $placeholder : 'Add image or video');
            }
            $newContent['works'] = $works;
        } elseif ($tab === 'services') {
            $services = array();
            $sTitles = post_array('service_title');
            $sDescs = post_array('service_desc');
            foreach ($sTitles as $i => $title) {
                $title = clean_text($title);
                $desc = isset($sDescs[$i]) ? clean_text($sDescs[$i]) : '';
                if ($title === '' && $desc === '') continue;
                $services[] = array('title' => $title, 'description' => $desc);
            }
            $newContent['services'] = $services;
        } elseif ($tab === 'about') {
            $about = isset($newContent['about']) && is_array($newContent['about']) ? $newContent['about'] : array();
            $paragraphs = array();
            foreach (post_array('about_paragraphs') as $p) { $p = clean_text($p); if ($p !== '') $paragraphs[] = $p; }
            $about['paragraphs'] = $paragraphs;
            $about['portrait_placeholder'] = clean_text(post_str('about_portrait_placeholder', isset($about['portrait_placeholder']) ? $about['portrait_placeholder'] : ''));
            $portraitUploaded = handle_upload('about_portrait_file', 'about');
            $removePortrait = post_str('about_remove_portrait') === '1';
            if ($portraitUploaded !== '') $about['portrait_image'] = $portraitUploaded;
            elseif ($removePortrait) $about['portrait_image'] = '';
            elseif (isset($_POST['about_portrait_image'])) $about['portrait_image'] = clean_text($_POST['about_portrait_image']);

            $details = array();
            $dLabels = post_array('detail_label'); $dValues = post_array('detail_value');
            foreach ($dLabels as $i => $label) {
                $label = clean_text($label); $value = isset($dValues[$i]) ? clean_text($dValues[$i]) : '';
                if ($label === '' && $value === '') continue;
                $details[] = array('label' => $label, 'value' => $value);
            }
            $about['details'] = $details;
            $newContent['about'] = $about;
        } elseif ($tab === 'experience') {
            $about = isset($newContent['about']) && is_array($newContent['about']) ? $newContent['about'] : array();
            $experience = array();
            $eWhens = post_array('exp_when'); $eRoles = post_array('exp_role'); $eCompanies = post_array('exp_company'); $eDetails = post_array('exp_detail');
            foreach ($eWhens as $i => $when) {
                $when = clean_text($when); $role = isset($eRoles[$i]) ? clean_text($eRoles[$i]) : ''; $company = isset($eCompanies[$i]) ? clean_text($eCompanies[$i]) : ''; $detail = isset($eDetails[$i]) ? clean_text($eDetails[$i]) : '';
                if ($when === '' && $role === '' && $company === '' && $detail === '') continue;
                $experience[] = array('when' => $when, 'role' => $role, 'company' => $company, 'detail' => $detail);
            }
            $about['experience'] = $experience;
            $newContent['about'] = $about;
        } elseif ($tab === 'education') {
            $about = isset($newContent['about']) && is_array($newContent['about']) ? $newContent['about'] : array();
            $education = array();
            $edWhens = post_array('edu_when'); $edDegrees = post_array('edu_degree'); $edInstitutions = post_array('edu_institution'); $edGpas = post_array('edu_gpa'); $edDetails = post_array('edu_detail');
            foreach ($edWhens as $i => $when) {
                $when = clean_text($when); $degree = isset($edDegrees[$i]) ? clean_text($edDegrees[$i]) : ''; $institution = isset($edInstitutions[$i]) ? clean_text($edInstitutions[$i]) : ''; $gpa = isset($edGpas[$i]) ? clean_text($edGpas[$i]) : ''; $detail = isset($edDetails[$i]) ? clean_text($edDetails[$i]) : '';
                if ($when === '' && $degree === '' && $institution === '' && $gpa === '' && $detail === '') continue;
                $education[] = array('when' => $when, 'degree' => $degree, 'institution' => $institution, 'gpa' => $gpa, 'detail' => $detail);
            }
            $about['education'] = $education;
            $newContent['about'] = $about;
        } elseif ($tab === 'contact') {
            $contact = isset($newContent['contact']) && is_array($newContent['contact']) ? $newContent['contact'] : array();
            $contact['intro'] = clean_text(post_str('contact_intro', isset($contact['intro']) ? $contact['intro'] : ''));
            $formTypes = array();
            foreach (post_array('contact_form_types') as $t) { $t = clean_text($t); if ($t !== '') $formTypes[] = $t; }
            $contact['form_types'] = $formTypes;
            $newContent['contact'] = $contact;
        }

        if ($tab !== 'password') {
            if (save_content($newContent)) {
                $message = 'Changes saved successfully.';
                $content = load_content();
            } else {
                $error = 'Failed to save content file. Check write permissions for the data directory.';
            }
        }
    }
}

$site = isset($content['site']) ? $content['site'] : array();
$nav = isset($content['nav']) ? $content['nav'] : array();
$works = isset($content['works']) ? $content['works'] : array();
$services = isset($content['services']) ? $content['services'] : array();
$about = isset($content['about']) ? $content['about'] : array();
$contact = isset($content['contact']) ? $content['contact'] : array();

$pageTitle = ucfirst($activeTab);
if ($activeTab === 'works') $pageTitle = 'Projects';
if ($activeTab === 'nav') $pageTitle = 'Navigation';
require __DIR__ . '/partials/top.php';
?>
    <div class="page-head">
      <h1><?= e($pageTitle) ?></h1>
      <p class="muted">Manage your <?= e(strtolower($pageTitle)) ?> settings in a clean, focused view.</p>
    </div>

    <?php if ($message): ?><div class="alert alert-success"><?= e($message) ?></div><?php endif; ?>
    <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>

<?php if ($activeTab === 'site'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="site">
      <section class="card">
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
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>

<?php elseif ($activeTab === 'nav'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="nav">
      <section class="card">
        <div class="section-head"><h2>Navigation items</h2><button type="button" class="btn btn-small" data-add="nav">+ Add item</button></div>
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
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-nav">
      <div class="repeat-item grid-2">
        <label>Title<input type="text" name="nav_label[]" value=""></label>
        <label>URL<input type="text" name="nav_href[]" value=""></label>
        <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
      </div>
    </template>

<?php elseif ($activeTab === 'works'): ?>
    <form method="post" enctype="multipart/form-data" class="panel-form main-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="works">
      <section class="card">
        <div class="section-head"><h2>Projects</h2><button type="button" class="btn btn-small" data-add="work">+ Add project</button></div>
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
            <div class="media-pick-row">
              <label>Or media URL/path (copy from library)<input type="text" name="work_media_src[]" class="work-media-src-input" value="<?= e($media && isset($media['src']) ? $media['src'] : '') ?>" placeholder="uploads/library/... or https://..."></label>
              <button type="button" class="btn btn-small pick-media" data-target-input="work_media_src[]">Choose from library</button>
            </div>
            <input type="hidden" name="work_media_type[]" value="<?= e($media && isset($media['type']) ? $media['type'] : '') ?>">
            <?php $mediaSrc = ($media && !empty($media['src'])) ? $media['src'] : ''; $mediaType = ($media && !empty($media['type'])) ? $media['type'] : ''; $mediaPoster = ($media && !empty($media['poster'])) ? $media['poster'] : ''; ?>
            <div class="media-pick-row">
              <label>Video thumbnail (optional)<input type="text" name="work_media_poster[]" class="work-poster-src-input" value="<?= e($mediaPoster) ?>" placeholder="uploads/library/... or https://..."></label>
              <button type="button" class="btn btn-small pick-media" data-target-input="work_media_poster[]">Choose from library</button>
              <button type="button" class="btn btn-small pick-video-frame">Pick frame from video</button>
            </div>
            <div class="work-media-preview" data-poster-preview>
              <?php if ($mediaPoster !== ''): ?>
                <?php $posterPreviewSrc = (strpos($mediaPoster, 'http://') === 0 || strpos($mediaPoster, 'https://') === 0 || strpos($mediaPoster, '/') === 0) ? $mediaPoster : '../' . ltrim($mediaPoster, '/'); ?>
                <img src="<?= e($posterPreviewSrc) ?>" alt="Thumbnail preview" loading="lazy">
              <?php endif; ?>
            </div>
            <div class="work-media-preview" data-preview>
              <?php if ($mediaSrc !== ''): ?>
                <?php $previewSrc = (strpos($mediaSrc, 'http://') === 0 || strpos($mediaSrc, 'https://') === 0 || strpos($mediaSrc, '/') === 0) ? $mediaSrc : '../' . ltrim($mediaSrc, '/'); ?>
                <?php if ($mediaType === 'video'): ?>
                  <video src="<?= e($previewSrc) ?>" muted preload="metadata" controls></video>
                <?php else: ?>
                  <img src="<?= e($previewSrc) ?>" alt="Preview" loading="lazy">
                <?php endif; ?>
              <?php endif; ?>
            </div>
            <?php if ($mediaSrc !== ''): ?>
            <div class="media-preview"><span class="muted small">Current file: <?= e($mediaSrc) ?></span><label class="inline-check"><input type="checkbox" name="work_remove_media[<?= $i ?>]" value="1"> Remove media</label></div>
            <?php else: ?>
            <input type="hidden" name="work_remove_media[<?= $i ?>]" value="0">
            <?php endif; ?>
            <button type="button" class="btn btn-danger btn-small remove-row">Remove project</button>
          </div>
          <?php endforeach; ?>
        </div>
      </section>
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
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
        <div class="media-pick-row">
          <label>Or media URL/path (copy from library)<input type="text" name="work_media_src[]" class="work-media-src-input" value="" placeholder="uploads/library/... or https://..."></label>
          <button type="button" class="btn btn-small pick-media" data-target-input="work_media_src[]">Choose from library</button>
        </div>
        <input type="hidden" name="work_media_type[]" value="">
        <div class="media-pick-row">
          <label>Video thumbnail (optional)<input type="text" name="work_media_poster[]" class="work-poster-src-input" value="" placeholder="uploads/library/... or https://..."></label>
          <button type="button" class="btn btn-small pick-media" data-target-input="work_media_poster[]">Choose from library</button>
          <button type="button" class="btn btn-small pick-video-frame">Pick frame from video</button>
        </div>
        <div class="work-media-preview" data-poster-preview></div>
        <div class="work-media-preview" data-preview></div>
        <input type="hidden" name="work_remove_media[__WORK_INDEX__]" value="0">
        <button type="button" class="btn btn-danger btn-small remove-row">Remove project</button>
      </div>
    </template>

<?php elseif ($activeTab === 'services'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="services">
      <section class="card">
        <div class="section-head"><h2>Services</h2><button type="button" class="btn btn-small" data-add="service">+ Add service</button></div>
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
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-service">
      <div class="repeat-item grid-2">
        <label>Title<input type="text" name="service_title[]" value=""></label>
        <label>Description<input type="text" name="service_desc[]" value=""></label>
        <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
      </div>
    </template>

<?php elseif ($activeTab === 'about'): ?>
    <form method="post" enctype="multipart/form-data" class="panel-form main-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="about">
      <section class="card">
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
        <div class="media-pick-row">
          <label>Or portrait image URL/path (copy from library)<input type="text" name="about_portrait_image" value="<?= e(isset($about['portrait_image']) ? $about['portrait_image'] : '') ?>" placeholder="uploads/library/... or https://..."></label>
          <button type="button" class="btn btn-small pick-media" data-target-input="about_portrait_image">Choose from library</button>
        </div>
        <?php if (!empty($about['portrait_image'])): ?>
          <div class="media-preview"><span class="muted small">Current file: <?= e($about['portrait_image']) ?></span><label class="inline-check"><input type="checkbox" name="about_remove_portrait" value="1"> Remove image</label></div>
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
      </section>
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-paragraph"><div class="repeat-item"><label>Paragraph<textarea name="about_paragraphs[]" rows="3"></textarea></label><button type="button" class="btn btn-danger btn-small remove-row">Remove</button></div></template>
    <template id="tpl-detail"><div class="repeat-item grid-2"><label>Title<input type="text" name="detail_label[]" value=""></label><label>Value<input type="text" name="detail_value[]" value=""></label><button type="button" class="btn btn-danger btn-small remove-row">Remove</button></div></template>

<?php elseif ($activeTab === 'experience'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="experience">
      <section class="card">
        <div class="section-head"><h2>Experience</h2><button type="button" class="btn btn-small" data-add="exp">+ Add</button></div>
        <div id="exp-list" class="repeat-list">
          <?php $experience = isset($about['experience']) && is_array($about['experience']) ? $about['experience'] : array(); ?>
          <?php foreach ($experience as $ex): ?>
          <?php $exRole = isset($ex['role']) ? $ex['role'] : (isset($ex['what']) ? $ex['what'] : ''); $exCompany = isset($ex['company']) ? $ex['company'] : ''; ?>
          <div class="repeat-item">
            <div class="grid-3">
              <label>Period<input type="text" name="exp_when[]" value="<?= e(isset($ex['when']) ? $ex['when'] : '') ?>"></label>
              <label>Role / Title<input type="text" name="exp_role[]" value="<?= e($exRole) ?>"></label>
              <label>Company / Organization<input type="text" name="exp_company[]" value="<?= e($exCompany) ?>"></label>
            </div>
            <label>Description<textarea name="exp_detail[]" rows="2"><?= e(isset($ex['detail']) ? $ex['detail'] : '') ?></textarea></label>
            <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
          </div>
          <?php endforeach; ?>
        </div>
      </section>
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-exp"><div class="repeat-item"><div class="grid-3"><label>Period<input type="text" name="exp_when[]" value=""></label><label>Role / Title<input type="text" name="exp_role[]" value=""></label><label>Company / Organization<input type="text" name="exp_company[]" value=""></label></div><label>Description<textarea name="exp_detail[]" rows="2"></textarea></label><button type="button" class="btn btn-danger btn-small remove-row">Remove</button></div></template>

<?php elseif ($activeTab === 'education'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="education">
      <section class="card">
        <div class="section-head"><h2>Education</h2><button type="button" class="btn btn-small" data-add="edu">+ Add</button></div>
        <div id="edu-list" class="repeat-list">
          <?php $education = isset($about['education']) && is_array($about['education']) ? $about['education'] : array(); ?>
          <?php foreach ($education as $ed): ?>
          <?php $edDegree = isset($ed['degree']) ? $ed['degree'] : (isset($ed['what']) ? $ed['what'] : ''); $edInst = isset($ed['institution']) ? $ed['institution'] : ''; $edGpa = isset($ed['gpa']) ? $ed['gpa'] : ''; ?>
          <div class="repeat-item">
            <div class="grid-2">
              <label>Period<input type="text" name="edu_when[]" value="<?= e(isset($ed['when']) ? $ed['when'] : '') ?>"></label>
              <label>Degree / Program<input type="text" name="edu_degree[]" value="<?= e($edDegree) ?>"></label>
              <label>Institution<input type="text" name="edu_institution[]" value="<?= e($edInst) ?>"></label>
              <label>GPA<input type="text" name="edu_gpa[]" value="<?= e($edGpa) ?>"></label>
            </div>
            <label>Description (optional)<textarea name="edu_detail[]" rows="2"><?= e(isset($ed['detail']) ? $ed['detail'] : '') ?></textarea></label>
            <button type="button" class="btn btn-danger btn-small remove-row">Remove</button>
          </div>
          <?php endforeach; ?>
        </div>
      </section>
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-edu"><div class="repeat-item"><div class="grid-2"><label>Period<input type="text" name="edu_when[]" value=""></label><label>Degree / Program<input type="text" name="edu_degree[]" value=""></label><label>Institution<input type="text" name="edu_institution[]" value=""></label><label>GPA<input type="text" name="edu_gpa[]" value=""></label></div><label>Description (optional)<textarea name="edu_detail[]" rows="2"></textarea></label><button type="button" class="btn btn-danger btn-small remove-row">Remove</button></div></template>

<?php elseif ($activeTab === 'contact'): ?>
    <form method="post" class="panel-form">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="save_tab">
      <input type="hidden" name="tab" value="contact">
      <section class="card">
        <h2>Contact</h2>
        <label>Contact intro text<textarea name="contact_intro" rows="3"><?= e(isset($contact['intro']) ? $contact['intro'] : '') ?></textarea></label>
        <div class="section-head"><h3>Contact form options</h3><button type="button" class="btn btn-small" data-add="ctype">+ Add option</button></div>
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
      <div class="save-bar"><button type="submit" class="btn btn-primary">Save changes</button></div>
    </form>
    <template id="tpl-ctype"><div class="repeat-item grid-2"><label>Option<input type="text" name="contact_form_types[]" value=""></label><button type="button" class="btn btn-danger btn-small remove-row">Remove</button></div></template>

<?php elseif ($activeTab === 'password'): ?>
    <section class="card">
      <h2>Change password</h2>
      <?php if (admin_using_env()): ?>
        <p class="muted">Admin authentication is managed through the <code>.env</code> file. To change credentials, update <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> in <code>.env</code>.</p>
      <?php else: ?>
        <form method="post" class="panel-form">
          <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="change_password">
          <input type="hidden" name="tab" value="password">
          <div class="grid-3">
            <label>Current password<input type="password" name="current_password" required></label>
            <label>New password<input type="password" name="new_password" required minlength="12" maxlength="72"></label>
            <label>Confirm new password<input type="password" name="confirm_password" required minlength="12" maxlength="72"></label>
          </div>
          <button type="submit" class="btn btn-primary">Update password</button>
        </form>
      <?php endif; ?>
    </section>
<?php endif; ?>

  <div class="media-modal" id="media-modal" aria-hidden="true">
    <div class="media-modal-backdrop" data-close-media></div>
    <div class="media-modal-dialog" role="dialog" aria-modal="true" aria-label="Media library">
      <div class="media-modal-head">
        <h3>Select media</h3>
        <button type="button" class="btn btn-small" data-close-media>Close</button>
      </div>
      <div class="media-modal-body">
        <p class="muted small" id="media-modal-status">Loading...</p>
        <div class="library-grid" id="media-modal-grid"></div>
      </div>
    </div>
  </div>

  <div class="media-modal" id="frame-modal" aria-hidden="true">
    <div class="media-modal-backdrop" data-close-frame></div>
    <div class="media-modal-dialog" role="dialog" aria-modal="true" aria-label="Pick video frame">
      <div class="media-modal-head">
        <h3>Pick a frame from video</h3>
        <button type="button" class="btn btn-small" data-close-frame>Close</button>
      </div>
      <div class="media-modal-body">
        <p class="muted small" id="frame-modal-status">Load a video, scrub to the desired frame, then capture it as thumbnail.</p>
        <div class="frame-picker">
          <video id="frame-picker-video" controls playsinline preload="metadata"></video>
          <div class="frame-picker-controls">
            <label class="frame-picker-seek">Time
              <input type="range" id="frame-picker-seek" min="0" max="0" step="0.01" value="0">
            </label>
            <span class="muted small" id="frame-picker-time">0:00</span>
            <button type="button" class="btn btn-primary btn-small" id="frame-picker-capture">Use this frame</button>
          </div>
          <div class="frame-picker-preview-wrap">
            <span class="muted small">Captured preview</span>
            <div class="work-media-preview" id="frame-picker-preview"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

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
        target.appendChild(wrap.firstChild);
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
        if (rem) { var item = rem.closest('.repeat-item'); if (item) item.remove(); }
      });

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

      var mediaModal = document.getElementById('media-modal');
      var mediaGrid = document.getElementById('media-modal-grid');
      var mediaStatus = document.getElementById('media-modal-status');
      var currentMediaInput = null;
      function openMediaModal(input) {
        currentMediaInput = input;
        if (!mediaModal) return;
        mediaModal.classList.add('is-open');
        mediaModal.setAttribute('aria-hidden', 'false');
        loadMediaLibrary();
      }
      function closeMediaModal() {
        if (!mediaModal) return;
        mediaModal.classList.remove('is-open');
        mediaModal.setAttribute('aria-hidden', 'true');
        currentMediaInput = null;
      }
      function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }
      function loadMediaLibrary() {
        if (!mediaGrid || !mediaStatus) return;
        mediaStatus.textContent = 'Loading...';
        mediaGrid.innerHTML = '';
        fetch('media.php?action=list', { credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var files = (data && data.files) ? data.files : [];
            if (!files.length) { mediaStatus.textContent = 'No media files found. Upload files in Media Library first.'; return; }
            mediaStatus.textContent = files.length + ' file(s)';
            files.forEach(function (f) {
              var card = document.createElement('div');
              card.className = 'media-card media-card-select';
              var thumb = f.isImage ? '<img src="../' + escapeHtml(f.path) + '" alt="' + escapeHtml(f.name) + '" loading="lazy">' : (f.isVideo ? '<video src="../' + escapeHtml(f.path) + '" muted preload="metadata"></video>' : '<div class="file-icon">' + escapeHtml((f.ext||'').toUpperCase()) + '</div>');
              card.innerHTML = '<div class="media-thumb">' + thumb + '</div><div class="media-body"><div class="media-name">' + escapeHtml(f.name) + '</div><div class="media-meta">' + escapeHtml(f.size) + '</div><div class="media-actions"><button type="button" class="btn select-media-file">Select</button></div></div>';
              card.querySelector('.select-media-file').addEventListener('click', function () {
                if (currentMediaInput) { currentMediaInput.value = f.path; currentMediaInput.dispatchEvent(new Event('input', { bubbles: true })); }
                closeMediaModal();
              });
              mediaGrid.appendChild(card);
            });
          })
          .catch(function () { mediaStatus.textContent = 'Failed to load media library.'; });
      }
      document.addEventListener('click', function (e) {
        var pick = e.target.closest('.pick-media');
        if (pick) {
          var targetName = pick.getAttribute('data-target-input');
          var scope = pick.closest('.repeat-item') || pick.closest('.media-pick-row') || pick.parentElement;
          var input = null;
          if (targetName) { input = scope ? scope.querySelector('input[name="' + targetName + '"]') : null; if (!input) input = document.querySelector('input[name="' + targetName + '"]'); }
          if (input) openMediaModal(input);
        }
        if (e.target.closest('[data-close-media]')) closeMediaModal();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mediaModal && mediaModal.classList.contains('is-open')) closeMediaModal(); });
    })();

    (function () {
      function isVideoSrc(src) { return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src || ''); }
      function previewSrc(src) {
        if (!src) return '';
        if (/^(https?:\/\/|\/|blob:|data:)/i.test(src)) return src;
        return '../' + src.replace(/^\/+/, '');
      }
      function setPreview(el, src, isVideo) {
        if (!el) return;
        el.innerHTML = '';
        if (!src) return;
        var ps = previewSrc(src);
        if (isVideo) {
          var v = document.createElement('video'); v.src = ps; v.muted = true; v.preload = 'metadata'; v.controls = true; el.appendChild(v);
        } else {
          var img = document.createElement('img'); img.src = ps; img.alt = 'Preview'; img.loading = 'lazy';
          img.onerror = function () { el.innerHTML = '<span class="muted small">Preview unavailable</span>'; };
          el.appendChild(img);
        }
      }
      function updateWorkPreview(input) {
        var item = input.closest('.work-item');
        if (!item) return;
        setPreview(item.querySelector('[data-preview]'), (input.value || '').trim(), isVideoSrc(input.value || ''));
      }
      function updatePosterPreview(input) {
        var item = input.closest('.work-item');
        if (!item) return;
        setPreview(item.querySelector('[data-poster-preview]'), (input.value || '').trim(), false);
      }
      document.addEventListener('input', function (e) {
        if (!e.target || !e.target.classList) return;
        if (e.target.classList.contains('work-media-src-input')) updateWorkPreview(e.target);
        if (e.target.classList.contains('work-poster-src-input')) updatePosterPreview(e.target);
      });
      document.addEventListener('change', function (e) {
        if (!e.target) return;
        if (e.target.classList && e.target.classList.contains('work-media-src-input')) updateWorkPreview(e.target);
        if (e.target.classList && e.target.classList.contains('work-poster-src-input')) updatePosterPreview(e.target);
        if (e.target.matches && e.target.matches('input[type="file"][name^="work_media_file_"]')) {
          var item = e.target.closest('.work-item');
          var preview = item ? item.querySelector('[data-preview]') : null;
          var file = e.target.files && e.target.files[0];
          if (!preview || !file) return;
          var url = URL.createObjectURL(file);
          setPreview(preview, url, /^video\//i.test(file.type));
        }
      });
    })();

    (function () {
      var modal = document.getElementById('frame-modal');
      var video = document.getElementById('frame-picker-video');
      var seek = document.getElementById('frame-picker-seek');
      var timeLabel = document.getElementById('frame-picker-time');
      var captureBtn = document.getElementById('frame-picker-capture');
      var preview = document.getElementById('frame-picker-preview');
      var status = document.getElementById('frame-modal-status');
      if (!modal || !video || !seek || !captureBtn) return;

      var currentPosterInput = null;
      var currentItem = null;
      var objectUrl = null;

      function fmtTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }
      function getCsrf() {
        var el = document.querySelector('input[name="csrf_token"]');
        return el ? el.value : '';
      }
      function resolveSrc(src) {
        if (!src) return '';
        if (/^(https?:\/\/|\/|blob:|data:)/i.test(src)) return src;
        return '../' + src.replace(/^\/+/, '');
      }
      function setStatus(msg, isErr) {
        if (!status) return;
        status.textContent = msg;
        status.style.color = isErr ? '#b3261e' : '';
      }
      function cleanupObjectUrl() {
        if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      }
      function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        video.pause();
        video.removeAttribute('src');
        video.load();
        seek.value = 0; seek.max = 0;
        timeLabel.textContent = '0:00';
        preview.innerHTML = '';
        setStatus('Load a video, scrub to the desired frame, then capture it as thumbnail.', false);
        cleanupObjectUrl();
        currentPosterInput = null;
        currentItem = null;
      }
      function openModal(item) {
        currentItem = item;
        currentPosterInput = item ? item.querySelector('.work-poster-src-input') : null;
        var srcInput = item ? item.querySelector('.work-media-src-input') : null;
        var fileInput = item ? item.querySelector('input[type="file"][name^="work_media_file_"]') : null;
        var src = srcInput ? (srcInput.value || '').trim() : '';
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;

        cleanupObjectUrl();
        preview.innerHTML = '';
        seek.value = 0; seek.max = 0; timeLabel.textContent = '0:00';

        var videoSrc = '';
        if (file && /^video\//i.test(file.type)) {
          objectUrl = URL.createObjectURL(file);
          videoSrc = objectUrl;
        } else if (src && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src)) {
          videoSrc = resolveSrc(src);
        }

        if (!videoSrc) {
          setStatus('No video source found for this project. Add a video file or URL first.', true);
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
          return;
        }

        setStatus('Loading video...', false);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        video.crossOrigin = 'anonymous';
        video.src = videoSrc;
        video.load();
      }

      video.addEventListener('loadedmetadata', function () {
        seek.max = String(video.duration || 0);
        seek.value = 0;
        timeLabel.textContent = fmtTime(0);
        setStatus('Scrub to the frame you want, then click "Use this frame".', false);
      });
      video.addEventListener('error', function () {
        setStatus('Could not load this video. If it is on another domain, download and upload it to the media library first.', true);
      });
      video.addEventListener('timeupdate', function () {
        if (!seek.matches(':active')) seek.value = String(video.currentTime || 0);
        timeLabel.textContent = fmtTime(video.currentTime || 0);
      });
      seek.addEventListener('input', function () {
        var t = parseFloat(seek.value || '0');
        if (isFinite(t)) video.currentTime = t;
        timeLabel.textContent = fmtTime(t);
      });

      captureBtn.addEventListener('click', function () {
        if (!currentPosterInput) return;
        if (!video.videoWidth || !video.videoHeight) {
          setStatus('Video is not ready yet.', true);
          return;
        }
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          setStatus('Could not capture this frame (cross-origin video). Use a video hosted on this site.', true);
          return;
        }
        var dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        } catch (e) {
          setStatus('Could not export frame image.', true);
          return;
        }
        preview.innerHTML = '<img src="' + dataUrl + '" alt="Captured frame preview">';
        captureBtn.disabled = true;
        setStatus('Saving thumbnail...', false);

        var form = new FormData();
        form.append('csrf_token', getCsrf());
        form.append('action', 'upload_poster_frame');
        form.append('poster_data', dataUrl);
        form.append('poster_name', 'video-poster');

        fetch('media.php', { method: 'POST', body: form, credentials: 'same-origin' })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (!res.ok || !res.data || !res.data.ok) {
              throw new Error((res.data && res.data.error) ? res.data.error : 'Upload failed');
            }
            currentPosterInput.value = res.data.path;
            currentPosterInput.dispatchEvent(new Event('input', { bubbles: true }));
            currentPosterInput.dispatchEvent(new Event('change', { bubbles: true }));
            setStatus('Thumbnail saved and set for this project. It will be used as the video poster.', false);
          })
          .catch(function (err) {
            setStatus(err && err.message ? err.message : 'Failed to save thumbnail.', true);
          })
          .then(function () { captureBtn.disabled = false; });
      });

      document.addEventListener('click', function (e) {
        var pickBtn = e.target.closest('.pick-video-frame');
        if (pickBtn) {
          var item = pickBtn.closest('.work-item');
          if (item) openModal(item);
          return;
        }
        if (e.target.closest('[data-close-frame]')) closeModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
      });
    })();
  </script>
<?php require __DIR__ . '/partials/bottom.php'; ?>
