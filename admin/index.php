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
        $current = post_str('current_password');
        $new = post_str('new_password');
        $confirm = post_str('confirm_password');
        $admin = admin_load();
        $salt = isset($admin['salt']) ? $admin['salt'] : '';
        $hash = isset($admin['password_hash']) ? $admin['password_hash'] : '';
        if (!hash_equals($hash, admin_hash_password($current, $salt))) {
            $error = 'رمز عبور فعلی درست نیست.';
        } elseif (strlen($new) < 8) {
            $error = 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.';
        } elseif ($new !== $confirm) {
            $error = 'تکرار رمز عبور جدید یکسان نیست.';
        } else {
            $newSalt = function_exists('random_bytes') ? bin2hex(random_bytes(16)) : md5(uniqid(mt_rand(), true));
            $admin['salt'] = $newSalt;
            $admin['password_hash'] = admin_hash_password($new, $newSalt);
            if (admin_save($admin)) {
                $message = 'رمز عبور با موفقیت تغییر کرد.';
            } else {
                $error = 'ذخیره رمز عبور ناموفق بود.';
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
                $media = array(
                    'type' => ($existingType === 'video') ? 'video' : 'image',
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
        $eWhats = post_array('exp_what');
        $eDetails = post_array('exp_detail');
        foreach ($eWhens as $i => $when) {
            $when = clean_text($when);
            $what = isset($eWhats[$i]) ? clean_text($eWhats[$i]) : '';
            $detail = isset($eDetails[$i]) ? clean_text($eDetails[$i]) : '';
            if ($when === '' && $what === '' && $detail === '') continue;
            $experience[] = array('when' => $when, 'what' => $what, 'detail' => $detail);
        }
        $about['experience'] = $experience;

        $education = array();
        $edWhens = post_array('edu_when');
        $edWhats = post_array('edu_what');
        $edDetails = post_array('edu_detail');
        foreach ($edWhens as $i => $when) {
            $when = clean_text($when);
            $what = isset($edWhats[$i]) ? clean_text($edWhats[$i]) : '';
            $detail = isset($edDetails[$i]) ? clean_text($edDetails[$i]) : '';
            if ($when === '' && $what === '' && $detail === '') continue;
            $education[] = array('when' => $when, 'what' => $what, 'detail' => $detail);
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
            $message = 'تغییرات با موفقیت ذخیره شد.';
            $content = load_content();
        } else {
            $error = 'ذخیره فایل محتوا ناموفق بود. دسترسی نوشتن پوشه data را بررسی کنید.';
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
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>پنل مدیریت سایت</title>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
  <div class="admin-shell">
    <aside class="sidebar">
      <h2>پنل مدیریت</h2>
      <p class="muted small"><?= e(isset($site['name']) ? $site['name'] : 'Site') ?></p>
      <nav>
        <a href="#site">تنظیمات سایت</a>
        <a href="#nav">منو</a>
        <a href="#works">پروژه‌ها</a>
        <a href="#services">سرویس‌ها</a>
        <a href="#about">درباره</a>
        <a href="#contact">تماس</a>
        <a href="#password">رمز عبور</a>
        <a href="../index.php" target="_blank">مشاهده سایت</a>
        <a href="logout.php" class="danger-link">خروج</a>
      </nav>
    </aside>

    <main class="content">
      <div class="page-head">
        <h1>مدیریت محتوا</h1>
        <p class="muted">اطلاعات سایت، پروژه‌ها و بخش‌های مختلف را از اینجا ویرایش کنید.</p>
      </div>

      <?php if ($message): ?><div class="alert alert-success"><?= e($message) ?></div><?php endif; ?>
      <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>

      <form method="post" enctype="multipart/form-data" class="main-form">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="save_content">

        <section id="site" class="card">
          <h2>تنظیمات سایت</h2>
          <div class="grid-2">
            <label>نام سایت<input type="text" name="site[name]" value="<?= e(isset($site['name']) ? $site['name'] : '') ?>"></label>
            <label>عنوان صفحه (Title)<input type="text" name="site[title]" value="<?= e(isset($site['title']) ? $site['title'] : '') ?>"></label>
            <label>نام<input type="text" name="site[first_name]" value="<?= e(isset($site['first_name']) ? $site['first_name'] : '') ?>"></label>
            <label>نام خانوادگی<input type="text" name="site[last_name]" value="<?= e(isset($site['last_name']) ? $site['last_name'] : '') ?>"></label>
            <label>ایمیل<input type="email" name="site[email]" value="<?= e(isset($site['email']) ? $site['email'] : '') ?>"></label>
            <label>لینک LinkedIn<input type="text" name="site[linkedin_url]" value="<?= e(isset($site['linkedin_url']) ? $site['linkedin_url'] : '') ?>"></label>
            <label>زبان (lang)<input type="text" name="site[lang]" value="<?= e(isset($site['lang']) ? $site['lang'] : 'en') ?>"></label>
            <label>سال کپی‌رایت<input type="text" name="site[copyright_year]" value="<?= e(isset($site['copyright_year']) ? $site['copyright_year'] : '') ?>"></label>
          </div>
          <label>توضیحات متا (Description)<textarea name="site[description]" rows="2"><?= e(isset($site['description']) ? $site['description'] : '') ?></textarea></label>
          <label>نقش/عنوان کوتاه (Hero role)<input type="text" name="site[role]" value="<?= e(isset($site['role']) ? $site['role'] : '') ?>"></label>
          <label>معرفی کوتاه (Hero intro)<textarea name="site[intro]" rows="3"><?= e(isset($site['intro']) ? $site['intro'] : '') ?></textarea></label>
          <label>متن فوتر<input type="text" name="site[footer_tagline]" value="<?= e(isset($site['footer_tagline']) ? $site['footer_tagline'] : '') ?>"></label>
        </section>

        <section id="nav" class="card">
          <div class="section-head">
            <h2>منو</h2>
            <button type="button" class="btn btn-small" data-add="nav">+ افزودن آیتم</button>
          </div>
          <div id="nav-list" class="repeat-list">
            <?php foreach ($nav as $item): ?>
            <div class="repeat-item grid-2">
              <label>عنوان<input type="text" name="nav_label[]" value="<?= e(isset($item['label']) ? $item['label'] : '') ?>"></label>
              <label>لینک<input type="text" name="nav_href[]" value="<?= e(isset($item['href']) ? $item['href'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="works" class="card">
          <div class="section-head">
            <h2>پروژه‌ها (Selected Work)</h2>
            <button type="button" class="btn btn-small" data-add="work">+ افزودن پروژه</button>
          </div>
          <div id="works-list" class="repeat-list">
            <?php foreach ($works as $i => $work): ?>
            <?php $media = isset($work['media']) && is_array($work['media']) ? $work['media'] : null; ?>
            <div class="repeat-item work-item">
              <div class="grid-2">
                <label>عنوان پروژه<input type="text" name="work_title[]" value="<?= e(isset($work['title']) ? $work['title'] : '') ?>"></label>
                <label>متا (مثلاً Motion · Client)<input type="text" name="work_meta[]" value="<?= e(isset($work['meta']) ? $work['meta'] : '') ?>"></label>
              </div>
              <label>متن جایگزین (وقتی رسانه ندارد)<input type="text" name="work_placeholder[]" value="<?= e(isset($work['placeholder']) ? $work['placeholder'] : '') ?>"></label>
              <div class="grid-2">
                <label>فایل رسانه (تصویر/ویدیو)<input type="file" name="work_media_file_<?= $i ?>" accept="image/*,video/mp4,video/webm"></label>
                <label>Alt متن تصویر<input type="text" name="work_media_alt[]" value="<?= e($media && isset($media['alt']) ? $media['alt'] : '') ?>"></label>
              </div>
              <input type="hidden" name="work_media_src[]" value="<?= e($media && isset($media['src']) ? $media['src'] : '') ?>">
              <input type="hidden" name="work_media_type[]" value="<?= e($media && isset($media['type']) ? $media['type'] : '') ?>">
              <?php if ($media && !empty($media['src'])): ?>
              <div class="media-preview">
                <span class="muted small">فایل فعلی: <?= e($media['src']) ?></span>
                <label class="inline-check"><input type="checkbox" name="work_remove_media[<?= $i ?>]" value="1"> حذف رسانه</label>
              </div>
              <?php else: ?>
              <input type="hidden" name="work_remove_media[<?= $i ?>]" value="0">
              <?php endif; ?>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف پروژه</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="services" class="card">
          <div class="section-head">
            <h2>سرویس‌ها</h2>
            <button type="button" class="btn btn-small" data-add="service">+ افزودن سرویس</button>
          </div>
          <div id="services-list" class="repeat-list">
            <?php foreach ($services as $svc): ?>
            <div class="repeat-item grid-2">
              <label>عنوان<input type="text" name="service_title[]" value="<?= e(isset($svc['title']) ? $svc['title'] : '') ?>"></label>
              <label>توضیح<input type="text" name="service_desc[]" value="<?= e(isset($svc['description']) ? $svc['description'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="about" class="card">
          <h2>درباره</h2>
          <div class="section-head"><h3>پاراگراف‌ها</h3><button type="button" class="btn btn-small" data-add="paragraph">+ افزودن پاراگراف</button></div>
          <div id="paragraphs-list" class="repeat-list">
            <?php $paragraphs = isset($about['paragraphs']) && is_array($about['paragraphs']) ? $about['paragraphs'] : array(); ?>
            <?php foreach ($paragraphs as $p): ?>
            <div class="repeat-item">
              <label>پاراگراف<textarea name="about_paragraphs[]" rows="3"><?= e($p) ?></textarea></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>

          <h3>تصویر پرتره/فضای کار</h3>
          <label>متن جایگزین پرتره<input type="text" name="about_portrait_placeholder" value="<?= e(isset($about['portrait_placeholder']) ? $about['portrait_placeholder'] : '') ?>"></label>
          <label>آپلود تصویر پرتره<input type="file" name="about_portrait_file" accept="image/*"></label>
          <input type="hidden" name="about_portrait_image" value="<?= e(isset($about['portrait_image']) ? $about['portrait_image'] : '') ?>">
          <?php if (!empty($about['portrait_image'])): ?>
            <div class="media-preview"><span class="muted small">فایل فعلی: <?= e($about['portrait_image']) ?></span>
            <label class="inline-check"><input type="checkbox" name="about_remove_portrait" value="1"> حذف تصویر</label></div>
          <?php endif; ?>

          <div class="section-head"><h3>جزئیات (Focus/Tools/...)</h3><button type="button" class="btn btn-small" data-add="detail">+ افزودن</button></div>
          <div id="details-list" class="repeat-list">
            <?php $details = isset($about['details']) && is_array($about['details']) ? $about['details'] : array(); ?>
            <?php foreach ($details as $d): ?>
            <div class="repeat-item grid-2">
              <label>عنوان<input type="text" name="detail_label[]" value="<?= e(isset($d['label']) ? $d['label'] : '') ?>"></label>
              <label>مقدار<input type="text" name="detail_value[]" value="<?= e(isset($d['value']) ? $d['value'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>

          <div class="section-head"><h3>تجربه (Experience)</h3><button type="button" class="btn btn-small" data-add="exp">+ افزودن</button></div>
          <div id="exp-list" class="repeat-list">
            <?php $experience = isset($about['experience']) && is_array($about['experience']) ? $about['experience'] : array(); ?>
            <?php foreach ($experience as $ex): ?>
            <div class="repeat-item grid-3">
              <label>بازه زمانی<input type="text" name="exp_when[]" value="<?= e(isset($ex['when']) ? $ex['when'] : '') ?>"></label>
              <label>عنوان/شرکت<input type="text" name="exp_what[]" value="<?= e(isset($ex['what']) ? $ex['what'] : '') ?>"></label>
              <label>توضیح<input type="text" name="exp_detail[]" value="<?= e(isset($ex['detail']) ? $ex['detail'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>

          <div class="section-head"><h3>تحصیلات (Education)</h3><button type="button" class="btn btn-small" data-add="edu">+ افزودن</button></div>
          <div id="edu-list" class="repeat-list">
            <?php $education = isset($about['education']) && is_array($about['education']) ? $about['education'] : array(); ?>
            <?php foreach ($education as $ed): ?>
            <div class="repeat-item grid-3">
              <label>بازه زمانی<input type="text" name="edu_when[]" value="<?= e(isset($ed['when']) ? $ed['when'] : '') ?>"></label>
              <label>مدرک/موسسه<input type="text" name="edu_what[]" value="<?= e(isset($ed['what']) ? $ed['what'] : '') ?>"></label>
              <label>توضیح<input type="text" name="edu_detail[]" value="<?= e(isset($ed['detail']) ? $ed['detail'] : '') ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <section id="contact" class="card">
          <h2>تماس</h2>
          <label>متن معرفی تماس<textarea name="contact_intro" rows="2"><?= e(isset($contact['intro']) ? $contact['intro'] : '') ?></textarea></label>
          <div class="section-head"><h3>گزینه‌های فرم تماس</h3><button type="button" class="btn btn-small" data-add="ctype">+ افزودن گزینه</button></div>
          <div id="ctype-list" class="repeat-list">
            <?php $formTypes = isset($contact['form_types']) && is_array($contact['form_types']) ? $contact['form_types'] : array(); ?>
            <?php foreach ($formTypes as $t): ?>
            <div class="repeat-item grid-2">
              <label>گزینه<input type="text" name="contact_form_types[]" value="<?= e($t) ?>"></label>
              <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
            </div>
            <?php endforeach; ?>
          </div>
        </section>

        <div class="save-bar">
          <button type="submit" class="btn btn-primary">ذخیره همه تغییرات</button>
        </div>
      </form>

      <section id="password" class="card">
        <h2>تغییر رمز عبور</h2>
        <form method="post" class="password-form">
          <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="change_password">
          <div class="grid-3">
            <label>رمز فعلی<input type="password" name="current_password" required></label>
            <label>رمز جدید<input type="password" name="new_password" required minlength="8"></label>
            <label>تکرار رمز جدید<input type="password" name="confirm_password" required minlength="8"></label>
          </div>
          <button type="submit" class="btn btn-primary">تغییر رمز</button>
        </form>
      </section>
    </main>
  </div>

  <template id="tpl-nav">
    <div class="repeat-item grid-2">
      <label>عنوان<input type="text" name="nav_label[]" value=""></label>
      <label>لینک<input type="text" name="nav_href[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-work">
    <div class="repeat-item work-item">
      <div class="grid-2">
        <label>عنوان پروژه<input type="text" name="work_title[]" value=""></label>
        <label>متا (مثلاً Motion · Client)<input type="text" name="work_meta[]" value=""></label>
      </div>
      <label>متن جایگزین (وقتی رسانه ندارد)<input type="text" name="work_placeholder[]" value="Add image or video"></label>
      <div class="grid-2">
        <label>فایل رسانه (تصویر/ویدیو)<input type="file" name="__WORK_MEDIA_FILE__" accept="image/*,video/mp4,video/webm"></label>
        <label>Alt متن تصویر<input type="text" name="work_media_alt[]" value=""></label>
      </div>
      <input type="hidden" name="work_media_src[]" value="">
      <input type="hidden" name="work_media_type[]" value="">
      <input type="hidden" name="work_remove_media[__WORK_INDEX__]" value="0">
      <button type="button" class="btn btn-danger btn-small remove-row">حذف پروژه</button>
    </div>
  </template>
  <template id="tpl-service">
    <div class="repeat-item grid-2">
      <label>عنوان<input type="text" name="service_title[]" value=""></label>
      <label>توضیح<input type="text" name="service_desc[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-paragraph">
    <div class="repeat-item">
      <label>پاراگراف<textarea name="about_paragraphs[]" rows="3"></textarea></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-detail">
    <div class="repeat-item grid-2">
      <label>عنوان<input type="text" name="detail_label[]" value=""></label>
      <label>مقدار<input type="text" name="detail_value[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-exp">
    <div class="repeat-item grid-3">
      <label>بازه زمانی<input type="text" name="exp_when[]" value=""></label>
      <label>عنوان/شرکت<input type="text" name="exp_what[]" value=""></label>
      <label>توضیح<input type="text" name="exp_detail[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-edu">
    <div class="repeat-item grid-3">
      <label>بازه زمانی<input type="text" name="edu_when[]" value=""></label>
      <label>مدرک/موسسه<input type="text" name="edu_what[]" value=""></label>
      <label>توضیح<input type="text" name="edu_detail[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
    </div>
  </template>
  <template id="tpl-ctype">
    <div class="repeat-item grid-2">
      <label>گزینه<input type="text" name="contact_form_types[]" value=""></label>
      <button type="button" class="btn btn-danger btn-small remove-row">حذف</button>
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
