#!/usr/bin/env python3
"""Build fa.html as an exact Persian mirror of index.html.

Why a generator instead of a hand-written page: fa.html and index.html must stay
structurally identical — same sections, same ids, same scripts, same animations.
Only language changes. When index.html changes, run this script again:

    python3 tools/build-fa-page.py

The script:
  1. copies the whole DOM of index.html
  2. swaps <html lang/dir>, the head meta, canonical and hreflang alternates
  3. replaces every visible string, label, placeholder and aria-label with Persian
  4. points the language switch back to index.html
  5. verifies that no English prose is left behind (build fails loudly if it is)
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'index.html'
TARGET = ROOT / 'fa.html'

# ---------------------------------------------------------------- head
HEAD_SWAPS = [
    ('<html lang="en" data-theme="dark">', '<html lang="fa" dir="rtl" data-theme="dark">'),
    ('<title>Alireza Shabanzadeh — Motion Graphics Designer (Rasht, Iran)</title>',
     '<title>علیرضا شابان‌زاده — موشن گرافیست، اکسپلینر و موشن UI</title>'),
    ('  <link rel="canonical" href="https://alirezashabanzadeh.com/">',
     '  <link rel="canonical" href="https://alirezashabanzadeh.com/fa.html">'),
    ('<meta name="description" content="Freelance motion graphics designer. Explainer videos, social media animation and UI motion for product and marketing teams. See the work, download the résumé, get a reply in one business day.">',
     '<meta name="description" content="اکسپلینر، موشن UI و کات شبکه‌های اجتماعی برای تیم‌های محصول. نمونه‌کارها، شرح کار و قیمت از قبل مشخص. رشت، ایران؛ دورکاری.">'),
    ('<meta property="og:title" content="Alireza Shabanzadeh — Motion Graphics Designer">',
     '<meta property="og:title" content="علیرضا شابان‌زاده — موشن گرافیست">'),
    ('<meta property="og:description" content="Explainer videos, social media animation and UI motion. See selected work and get in touch.">',
     '<meta property="og:description" content="اکسپلینر، موشن UI و کات شبکه‌های اجتماعی — با شرح کار و قیمت مشخص قبل از شروع.">'),
    ('<meta property="og:site_name" content="Alireza Shabanzadeh">', '<meta property="og:locale" content="fa_IR">'),
    ('<meta property="og:url" content="https://alirezashabanzadeh.com/">',
     '<meta property="og:url" content="https://alirezashabanzadeh.com/fa.html">'),
    ('<meta name="twitter:title" content="Alireza Shabanzadeh — Motion Graphics Designer">',
     '<meta name="twitter:title" content="علیرضا شابان‌زاده — موشن گرافیست">'),
    ('<meta name="twitter:description" content="Explainer videos, social media animation and UI motion. See selected work and get in touch.">',
     '<meta name="twitter:description" content="اکسپلینر، موشن UI و کات شبکه‌های اجتماعی — با شرح کار و قیمت مشخص قبل از شروع.">'),
]

# ---------------------------------------------------------------- body text
# Ordered, exact replacements. Anything with more than one meaning in the page
# carries enough context to hit the right one.
BODY_SWAPS = [
    # language switch: fa.html links back to the English page
    ('<a href="fa.html" hreflang="fa" lang="fa" dir="rtl" class="header-link header-lang">فارسی</a>',
     '<a href="index.html" hreflang="en" lang="en" class="header-link header-lang">English</a>'),
    ('<a href="fa.html" class="mobile-menu-link" hreflang="fa" lang="fa" dir="rtl">فارسی</a>',
     '<a href="index.html" class="mobile-menu-link" hreflang="en" lang="en">English</a>'),
    ('<a href="fa.html" hreflang="fa" lang="fa" dir="rtl">فارسی</a>',
     '<a href="index.html" hreflang="en" lang="en">English</a>'),

    # chrome and navigation — simple text swaps, applied globally
    ('<a class="skip-link" href="#main">Skip to content</a>', '<a class="skip-link" href="#main">پرش به محتوا</a>'),
    ('aria-label="Main navigation"', 'aria-label="ناوبری اصلی"'),
    ('aria-label="Mobile navigation"', 'aria-label="ناوبری موبایل"'),
    ('aria-label="LinkedIn profile"', 'aria-label="صفحهٔ لینکدین"'),
    ('aria-label="Behance portfolio"', 'aria-label="نمونه‌کارهای بیهنس"'),
    ('aria-label="Instagram profile"', 'aria-label="صفحهٔ اینستاگرام"'),
    ('aria-label="Showreel"', 'aria-label="ریل"'),
    ('aria-label="Open menu"', 'aria-label="باز کردن منو"'),
    ('aria-label="Back to top"', 'aria-label="بازگشت به بالا"'),
    ('aria-label="Close brand"', 'aria-label="بستن"'),
    ('aria-label="Close showreel"', 'aria-label="بستن ریل"'),
    ('aria-label="Like this project"', 'aria-label="پسندیدن این پروژه"'),
    ('aria-label="Alireza Shabanzadeh — back to top"', 'aria-label="علیرضا شابان‌زاده — بازگشت به بالا"'),
    ('>Like project<', '>پسندیدن پروژه<'),
    ('<strong>Showreel</strong>', '<strong>ریل</strong>'),
    ('>About</a>', '>درباره من</a>'),
    ('>Work</a>', '>نمونه‌کارها</a>'),
    ('>Services</a>', '>خدمات</a>'),
    ('>Contact</a>', '>تماس</a>'),
    ('>Hire me</a>', '>شروع پروژه</a>'),
    ('<span>Résumé</span>', '<span>رزومه</span>'),
    ('>Client one-pager (PDF)</a>', '>معرفی یک‌صفحه‌ای (PDF)</a>'),
    ('>Client one-pager (PDF)</span>', '>معرفی یک‌صفحه‌ای (PDF)</span>'),
    ('>Alireza Shabanzadeh</a>', '>علیرضا شابان‌زاده</a>'),

    # hero
    ('alt="Portrait of Alireza Shabanzadeh, motion graphics designer"',
     'alt="پرترهٔ علیرضا شابان‌زاده، طراح موشن گرافیک"'),
    ('<span data-setting="heroAvailability">Available for work</span>',
     '<span data-setting="heroAvailability">پروژهٔ جدید می‌پذیرم</span>'),
    ('class="hero-eyebrow" data-setting="heroEyebrow">Motion Graphics Designer</p>',
     'class="hero-eyebrow" data-setting="heroEyebrow">موشن گرافیست</p>'),
    ('data-split="Alireza">Alireza</span>', 'data-split="Alireza">علیرضا</span>'),
    ('data-split="Shabanzadeh">Shabanzadeh</span>', 'data-split="Shabanzadeh">شابان‌زاده</span>'),
    ('class="hero-subtitle" data-setting="heroSubtitle">Crafting motion that communicates, engages, and inspires.</p>',
     'class="hero-subtitle" data-setting="heroSubtitle">اکسپلینر، موشن UI و کات شبکه‌های اجتماعی می‌سازم — از استوری‌بورد تا فایلی که آمادهٔ انتشار باشه. چیزی که روی موبایل هم خواناست.</p>'),
    ('<span data-setting="heroCtaText">See selected work</span>', '<span data-setting="heroCtaText">نمونه‌کارها رو ببین</span>'),
    ('<span>Watch showreel</span>', '<span>دیدن ریل</span>'),
    ('aria-label="Motion reel — a short loop of recent animation work"',
     'aria-label="ریل موشن — چند ثانیه از کارهای اخیر"'),
    ('<span class="hero-reel-toggle-label">Pause reel</span>', '<span class="hero-reel-toggle-label">توقف ریل</span>'),
    ('data-setting="heroStat1Label">Tools I use</span>', 'data-setting="heroStat1Label">موشن و محتوای آموزشی</span>'),
    ('data-setting="heroStat2Value">Rasht, Iran</span>', 'data-setting="heroStat2Value">فارسی و انگلیسی</span>'),
    ('data-setting="heroStat2Label">Based in</span>', 'data-setting="heroStat2Label">زبان کار</span>'),
    ('class="hero-promise" data-setting="heroPromise">Tell me the goal and the deadline — you get a scope, a price and a timeline in reply.</p>',
     'class="hero-promise" data-setting="heroPromise">هدف و ددلاین رو بگو؛ در جواب، شرح کار و قیمت و زمان‌بندی می‌گیری.</p>'),
    ('<div class="hero-scroll">\n      <span>Scroll</span>', '<div class="hero-scroll">\n      <span>اسکرول</span>'),

    # work
    ('<h2 class="section-title">Selected work</h2>', '<h2 class="section-title">نمونه‌کارها</h2>'),
    ('Real projects, not a gallery dump: what the team needed, what I made, and what shipped. Open a card to see the case study — video plays inside the page.',
     'کار واقعی، نه گالری: هر پروژه چه می‌خواست، چه ساختم و چه تحویل شد. روی هر کارت بزن تا جزئیات پروژه داخل همین صفحه باز بشه.'),

    # what you get
    ('<h2 class="section-title" data-setting="offerTitle">What you get</h2>',
     '<h2 class="section-title" data-setting="offerTitle">چه چیزی تحویل می‌گیری</h2>'),
    ('<dt>Reply time</dt>', '<dt>زمان پاسخ</dt>'),
    ('<dt>Typical timeline</dt>', '<dt>معمولاً چقدر طول می‌کشه</dt>'),
    ('<dt>You receive</dt>', '<dt>چی تحویل می‌گیری</dt>'),
    ('<dt>Revisions</dt>', '<dt>اصلاحات</dt>'),
    ('<dt>Payment</dt>', '<dt>پرداخت</dt>'),
    ('<dt>Starting point</dt>', '<dt>شروع قیمت</dt>'),
    ('<dt>Next opening</dt>', '<dt>پروژهٔ بعدی از کی</dt>'),
    ('data-setting="scopeTitle">What\'s not included</h3>', 'data-setting="scopeTitle">این‌ها جزو کار نیست</h3>'),

    # about
    ('<h2 class="section-title">About</h2>', '<h2 class="section-title">درباره من</h2>'),
    ('alt="Alireza Shabanzadeh at work on a motion graphics project"',
     'alt="علیرضا شابان‌زاده هنگام کار روی یک پروژهٔ موشن گرافیک"'),
    ('<span class="about-apps-label">Tools I Use</span>', '<span class="about-apps-label">ابزارهای کار</span>'),

    # services
    ('<h2 class="section-title" data-setting="servicesTitle">What I do</h2>', '<h2 class="section-title" data-setting="servicesTitle">چه کاری برات انجام می‌دم</h2>'),

    # timeline
    ('<h2 class="section-title">Experience & Education</h2>', '<h2 class="section-title">سابقه و تحصیلات</h2>'),
    ('The work, collaborations, and learning that shaped how I think and create.',
     'جاهایی که کار کردم و چیزهایی که خوندم — به ترتیب.'),
    ('>Experience</h3>', '>سابقهٔ کاری</h3>'),
    ('>Education</h3>', '>تحصیلات</h3>'),

    # contact section (rebuilt in the 2026-10 pass: two panels, direct lines,
    # three "what happens next" steps)
    ('<h2 class="section-title">Start a project</h2>', '<h2 class="section-title">شروع کنیم</h2>'),
    ('Six lines is enough. Say what the video has to achieve and when you\n          need it — you get a scope, a price and a timeline back.',
     'شش خط کافیه: بگو این ویدیو باید چه کاری انجام بده و کِی لازمش داری — شرح کار، قیمت و زمان‌بندی رو پس می‌گیری.'),
    ('>Your name <span', '>اسمت <span'),
    ('>Email address <span', '>ایمیل <span'),
    ('>Project type <span', '>نوع پروژه <span'),
    ('placeholder="Your full name"', 'placeholder="اسم و فامیل"'),
    ('placeholder="you@company.com"', 'placeholder="you@company.com"'),
    ('<option value="">Not sure yet</option>', '<option value="">مطمئن نیستم</option>'),
    ('<option value="explainer">Explainer / product video</option>', '<option value="explainer">اکسپلینر محصول</option>'),
    ('<option value="social">Social media animation</option>', '<option value="social">محتوای شبکه‌های اجتماعی</option>'),
    ('<option value="ui">UI / app motion</option>', '<option value="ui">موشن UI</option>'),
    ('<option value="logo">Logo or brand animation</option>', '<option value="logo">انیمیشن لوگو و برند</option>'),
    ('<option value="other">Something else</option>', '<option value="other">چیز دیگر</option>'),
    ('>Deadline <span', '>ددلاین <span'),
    ('placeholder="e.g. mid-November, or \'no rush\'"', 'placeholder="مثلاً اواسط آبان، یا «عجله‌ای نیست»"'),
    ('>Output format <span', '>فرمت خروجی <span'),
    ('<option value="16:9">16:9 — website / YouTube</option>', '<option value="16:9">۱۶:۹ — وب‌سایت و یوتیوب</option>'),
    ('<option value="1:1">1:1 — feed</option>', '<option value="1:1">۱:۱ — فید</option>'),
    ('<option value="9:16">9:16 — reels / shorts</option>', '<option value="9:16">۹:۱۶ — ریلز و شورتس</option>'),
    ('<option value="multiple">Several of them</option>', '<option value="multiple">چند تا</option>'),
    ('<option value="unsure">Advise me</option>', '<option value="unsure">خودت پیشنهاد بده</option>'),
    ('>Reply by <span', '>جواب رو کجا بدم <span'),
    ('<option value="">Email is fine</option>', '<option value="">ایمیل خوب است</option>'),
    ('<option value="email">Email</option>', '<option value="email">ایمیل</option>'),
    ('<option value="telegram">Telegram</option>', '<option value="telegram">تلگرام</option>'),
    ('<option value="whatsapp">WhatsApp</option>', '<option value="whatsapp">واتساپ</option>'),
    ('<option value="call">A short call</option>', '<option value="call">یک تماس کوتاه</option>'),
    ('>The brief <span', '>بریف <span'),
    ('placeholder="What should this video make people do? Who is watching it, and what do you already have (script, brand files, footage)?"',
     'placeholder="این ویدیو باید مخاطب رو به چی برسونه؟ کی می‌بینه و از قبل چی داری (متن، فایل برند، فیلم خام)؟"'),
    ('(optional)</span>', '(اختیاری)</span>'),
    ('<span aria-hidden="true">*</span> Required fields. Your message and email address are stored on my\n              server and used only to reply — details in the',
     '<span aria-hidden="true">*</span> فیلدهای ستاره‌دار ضروریه. پیام و ایمیل شما روی سرور من ذخیره می‌شه و فقط برای جواب دادن استفاده می‌شه — جزئیات در'),
    ('<a href="privacy.html">privacy policy</a>', '<a href="privacy.html">سیاست حفظ حریم خصوصی</a>'),
    ('<span data-submit-label>Send the brief</span>', '<span data-submit-label>ارسال بریف</span>'),
    ('<h3 class="contact-panel-title">Direct lines</h3>', '<h3 class="contact-panel-title">راه‌های مستقیم</h3>'),
    ('<span class="contact-info-label">Email</span>', '<span class="contact-info-label">ایمیل</span>'),
    ('<button type="button" class="copy-email-btn" id="copyEmailBtn">Copy</button>', '<button type="button" class="copy-email-btn" id="copyEmailBtn">کپی</button>'),
    ('>Phone / WhatsApp</span>', '>تلفن / واتساپ</span>'),
    ('<span class="contact-info-label">Telegram</span>', '<span class="contact-info-label">تلگرام</span>'),
    ('<span class="contact-info-label">WhatsApp</span>', '<span class="contact-info-label">واتساپ</span>'),
    ('<span class="contact-info-label">Based in</span>', '<span class="contact-info-label">محل کار</span>'),
    ('data-setting="telegram" rel="noopener" hidden>Telegram</a>', 'data-setting="telegram" rel="noopener" hidden>تلگرام</a>'),
    ('data-setting="whatsapp" rel="noopener" hidden>WhatsApp</a>', 'data-setting="whatsapp" rel="noopener" hidden>واتساپ</a>'),
    ('<h3 class="contact-panel-title">What happens next</h3>', '<h3 class="contact-panel-title">بعدش چی می‌شه؟</h3>'),
    ('<li><strong>You send the brief</strong> — a rough one is fine.</li>',
     '<li><strong>بریف رو می‌فرستی</strong> — حتی یه نسخهٔ خام و سرانگشتی.</li>'),
    ('<li><strong>I reply within one business day</strong> with questions, a scope and a price.</li>',
     '<li><strong>من حداکثر یه روز کاری جواب می‌دم</strong> — با چند سؤال، شرح کار و قیمت.</li>'),
    ('<li><strong>We fix the price</strong>, then the storyboard starts.</li>',
     '<li><strong>قیمت رو قطعی می‌کنیم</strong> و بعد استوری‌بورد شروع می‌شه.</li>'),
    ('<p class="contact-steps-note">Prefer email? <a id="briefMailto" href="#">Open this brief as an email instead</a>.</p>',
     '<p class="contact-steps-note">ترجیح می‌دی ایمیل بزنی؟ <a id="briefMailto" href="#">همین بریف رو به‌شکل ایمیل باز کن</a>.</p>'),
    ('data-setting="location">Rasht, Guilan, Iran</span>', 'data-setting="location">رشت، گیلان، ایران</span>'),

    # the work pack link sits on its own line, so swap the bare text
    ('Work pack — all work on one page (print / PDF)', 'همهٔ کارها در یک صفحه (برای پرینت/PDF)'),

    # footer
    ('data-setting="footerCopy">&copy; 2026 Alireza Shabanzadeh</span>',
     'data-setting="footerCopy">&copy; ۱۴۰۵ علیرضا شابان‌زاده</span>'),
    ('data-setting="footerNote">Motion graphics designer · Rasht, Iran · available for remote work</span>',
     'data-setting="footerNote">موشن گرافیک · رشت، ایران · آمادهٔ دورکاری</span>'),
    ('aria-label="Legal and site information"', 'aria-label="اطلاعات سایت"'),
    ('<a href="privacy.html">Privacy policy</a>', '<a href="privacy.html">سیاست حفظ حریم خصوصی</a>'),
    ('<a href="cookies.html">Cookie policy</a>', '<a href="cookies.html">سیاست کوکی</a>'),
    ('data-consent-settings>Cookie settings</button>', 'data-consent-settings>تنظیمات کوکی</button>'),
]


# ---------------------------------------------------------------- static blocks
# The Persian page must read correctly before any script runs, so the static
# markup that index.html ships with (hero stats, about text, service cards and
# the timeline) is regenerated here from the Persian values in data/settings.json.
# One source of truth: edit the CMS, re-run this script.

def _fa_digits(value):
    table = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
    return str(value).translate(table)


def _esc(value):
    return (str(value or '')
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;'))


def _replace_inner(html, opener, new_inner):
    """Swap the inner HTML of the first div whose opening tag starts with opener."""
    i = html.index(opener)
    start = html.index('>', i) + 1
    depth = 1
    for match in re.finditer(r'<(/?)(?:div|article|section|aside|nav|ul|ol|dl|figure|form|fieldset|details|summary)\b', html[start:]):
        depth += -1 if match.group(1) else 1
        if depth == 0:
            end = start + match.start()
            return html[:start] + new_inner + html[end:]
    raise ValueError('unbalanced block: ' + opener)


def _timeline_markup(items, kind_label):
    rows = []
    for index, item in enumerate(items):
        desc = ''
        if item.get('desc'):
            desc = '\n              <p class="timeline-desc">%s</p>' % _esc(item['desc'])
        rows.append(
            '\n          <article class="timeline-item">' \
            '\n            <div class="timeline-date-wrap"><span class="timeline-date">%s</span></div>' \
            '\n            <div class="timeline-marker"><span></span></div>' \
            '\n            <div class="timeline-content">' \
            '\n              <div class="timeline-entry-meta"><span class="timeline-entry-kind">%s</span>'
            '<span class="timeline-entry-number">%02d</span></div>' \
            '\n              <h3 class="timeline-title">%s</h3>' \
            '\n              <span class="timeline-subtitle">%s</span>%s' \
            '\n            </div>' \
            '\n          </article>'
            % (_esc(item.get('date')), kind_label, index + 1, _esc(item.get('title')), _esc(item.get('subtitle')), desc)
        )
    return '\n        <div class="timeline">%s\n        </div>\n      ' % ''.join(rows)


def localise_static(html, settings):
    if not settings:
        return html

    # Plain text blocks: whatever the CMS holds in the Fa mirror wins over the
    # English markup that index.html ships with.
    simple_keys = [
        'siteName', 'siteTitle', 'heroEyebrow', 'heroSubtitle', 'heroPromise',
        'heroAvailability', 'heroCtaText', 'servicesTitle', 'servicesIntro',
        'offerTitle', 'offerIntro', 'scopeTitle', 'location',
        'footerCopy', 'footerNote', 'aboutSkills'
    ]
    for key in simple_keys:
        fa = settings.get(key + 'Fa')
        if not fa:
            continue
        pattern = r'(data-setting="%s"[^>]*>)[^<]*<' % key
        if re.search(pattern, html):
            html = re.sub(pattern, lambda m: '%s%s<' % (m.group(1), _esc(fa)), html, count=1)

    # hero stats: value and label of each visible stat
    for key in ('heroStat1Value', 'heroStat1Label', 'heroStat2Value', 'heroStat2Label',
                'heroStat3Value', 'heroStat3Label'):
        fa = settings.get(key + 'Fa')
        if not fa:
            continue
        pattern = r'(data-setting="%s")>[^<]*</span>' % key
        if re.search(pattern, html):
            html = re.sub(pattern, lambda m: '%s>%s</span>' % (m.group(1), _esc(fa)), html, count=1)

    # about text: markdown-lite -> paragraphs, *italic* preserved as <em>
    about = settings.get('aboutTextFa')
    if about:
        paragraphs = []
        for block in str(about).split('\n\n'):
            block = block.strip()
            if not block:
                continue
            block = _esc(block)
            block = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', block)
            paragraphs.append('\n            <p>%s</p>' % block.replace('\n', '<br>'))
        if paragraphs:
            html = _replace_inner(html, '<div class="about-text" data-setting="aboutText">',
                                  ''.join(paragraphs) + '\n          ')

    # service cards: keep the icon markup that index.html ships, swap the copy
    services = settings.get('servicesFa') or []
    if services:
        titles = iter([item.get('title', '') for item in services])
        descs = iter([item.get('desc', '') for item in services])

        def _swap_title(match):
            try:
                return '%s>%s</h3>' % (match.group(1), _esc(next(titles)))
            except StopIteration:
                return match.group(0)

        def _swap_desc(match):
            try:
                return '%s>%s</p>' % (match.group(1), _esc(next(descs)))
            except StopIteration:
                return match.group(0)

        html = re.sub(r'(<h3 class="service-title")>[^<]*</h3>', _swap_title, html)
        html = re.sub(r'(<p class="service-desc")>[^<]*</p>', _swap_desc, html)

    # the "01 • Service" meta line on each static service card
    def _service_meta(match):
        return match.group(1) + _fa_digits(match.group(2)) + ' • خدمت'
    html = re.sub(r'(class="service-meta"><span></span>\s*)(\d+)\s*•\s*Service', _service_meta, html)

    # timeline: experience and education, rebuilt from the Persian mirror lists
    for key, kind in (('experience', 'کاری'), ('education', 'تحصیلی')):
        items = settings.get(key + 'Fa') or []
        if not items:
            continue
        opener = 'data-setting="%s">' % key
        if opener in html:
            html = _replace_inner(html, opener, _timeline_markup(items, kind))

    return html


# Latin runs that are allowed to stay: brand names, file types, numbers, emails,
# URLs and the language switch itself.
ALLOWED = [
    r'After Effects', r'Photoshop', r'Premiere Pro', r'\bAe\b', r'\bPs\b', r'\bPr\b',
    # Terms the Iranian market uses in English on purpose. Translating them is
    # what makes a Persian page read like a machine translation.
    r'\bexplainer\b', r'\bUI\b', r'\bsafe area\b', r'\bMP4\b', r'\bFR\b',
    r'\bPDF\b', r'\bEN\b', r'\bFA\b', r'16:9', r'1:1', r'9:16', r'&[a-zA-Z]+;',
    r'[\w.+-]+@[\w-]+\.[\w.]+', r'https?://\S+', r'\bEnglish\b', r'\bRel\b',
    r'\bIcons8\b', r'gsap\b', r'ScrollTrigger',
]


def build() -> int:
    html = SOURCE.read_text(encoding='utf-8')
    failures = []
    settings = None
    settings_path = ROOT / 'data' / 'settings.json'
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text(encoding='utf-8'))
        except ValueError as error:  # malformed JSON must not be a silent skip
            print('data/settings.json could not be parsed:', error)
            return 1

    for old, new in HEAD_SWAPS + BODY_SWAPS:
        if old not in html:
            failures.append(old[:90])
            continue
        html = html.replace(old, new)

    if not failures:
        html = localise_static(html, settings)

    if failures:
        print('FAILED — these source strings were not found in index.html:')
        for item in failures:
            print('   ', item)
        print('\nUpdate the swap list in tools/build-fa-page.py, then run again.')
        return 1

    TARGET.write_text(html, encoding='utf-8')

    # ---- verification: no English prose may survive in the visible text
    body = html[html.find('<body'):]
    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<style.*?</style>', '', body, flags=re.S)
    visible = [t.strip() for t in re.findall(r'>([^<>]+)<', body) if t.strip()]
    leftovers = []
    for text in visible:
        probe = text
        for pattern in ALLOWED:
            probe = re.sub(pattern, ' ', probe)
        for word in re.findall(r'[A-Za-z]{3,}', probe):
            leftovers.append((word, text[:70]))

    latin_attr = [m for m in re.findall(r'(placeholder|aria-label|title|alt)="([^"]*[A-Za-z]{3,}[^"]*)"', html)
                  if not any(re.search(p, m[1]) for p in ALLOWED)]

    print('fa.html written from index.html')
    print('  swaps applied :', len(HEAD_SWAPS) + len(BODY_SWAPS))
    print('  visible strings:', len(visible))
    print('  English words left in text   :', len(leftovers))
    for word, text in leftovers[:12]:
        print('      ', word, '->', text)
    print('  Latin-only attributes left   :', len(latin_attr))
    for name, value in latin_attr[:8]:
        print('      ', name, '=', value[:70])
    return 0 if not leftovers and not latin_attr else 2


if __name__ == '__main__':
    sys.exit(build())
