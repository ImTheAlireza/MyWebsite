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
     '<title>علیرضا شابان‌زاده — موشن گرافیک و ویدیوی توضیحی</title>'),
    ('  <link rel="canonical" href="https://alirezashabanzadeh.com/">',
     '  <link rel="canonical" href="https://alirezashabanzadeh.com/fa.html">'),
    ('<meta name="description" content="Freelance motion graphics designer. Explainer videos, social media animation and UI motion for product and marketing teams. See the work, download the résumé, get a reply in one business day.">',
     '<meta name="description" content="ویدیوی توضیحی محصول، موشن رابط کاربری و کات شبکه‌های اجتماعی. کارها، تحویل‌ها و روند پروژه — با تعریف کار، قیمت و زمان‌بندی مشخص. رشت، ایران؛ دورکاری.">'),
    ('<meta property="og:title" content="Alireza Shabanzadeh — Motion Graphics Designer">',
     '<meta property="og:title" content="علیرضا شابان‌زاده — موشن گرافیک و ویدیوی توضیحی">'),
    ('<meta property="og:description" content="Explainer videos, social media animation and UI motion. See selected work and get in touch.">',
     '<meta property="og:description" content="ویدیوی توضیحی، موشن رابط کاربری و کات شبکه‌های اجتماعی — با تعریف کار، مهلت و قیمت مشخص پیش از شروع.">'),
    ('<meta property="og:site_name" content="Alireza Shabanzadeh">', '<meta property="og:locale" content="fa_IR">'),
    ('<meta property="og:url" content="https://alirezashabanzadeh.com/">',
     '<meta property="og:url" content="https://alirezashabanzadeh.com/fa.html">'),
    ('<meta name="twitter:title" content="Alireza Shabanzadeh — Motion Graphics Designer">',
     '<meta name="twitter:title" content="علیرضا شابان‌زاده — موشن گرافیک و ویدیوی توضیحی">'),
    ('<meta name="twitter:description" content="Explainer videos, social media animation and UI motion. See selected work and get in touch.">',
     '<meta name="twitter:description" content="ویدیوی توضیحی، موشن رابط کاربری و کات شبکه‌های اجتماعی — با تعریف کار، مهلت و قیمت مشخص پیش از شروع.">'),
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
     '<span data-setting="heroAvailability">آمادهٔ همکاری</span>'),
    ('class="hero-eyebrow" data-setting="heroEyebrow">Motion Graphics Designer</p>',
     'class="hero-eyebrow" data-setting="heroEyebrow">موشن گرافیک و ویدیوی توضیحی</p>'),
    ('data-split="Alireza">Alireza</span>', 'data-split="Alireza">علیرضا</span>'),
    ('data-split="Shabanzadeh">Shabanzadeh</span>', 'data-split="Shabanzadeh">شابان‌زاده</span>'),
    ('class="hero-subtitle" data-setting="heroSubtitle">Crafting motion that communicates, engages, and inspires.</p>',
     'class="hero-subtitle" data-setting="heroSubtitle">ایدهٔ محصول و آموزش را به حرکت تبدیل می‌کنم: ویدیوی توضیحی، موشن رابط کاربری و کات شبکه‌های اجتماعی.</p>'),
    ('<span data-setting="heroCtaText">See selected work</span>', '<span data-setting="heroCtaText">دیدن نمونه‌کارها</span>'),
    ('<span>Watch showreel</span>', '<span>دیدن ریل</span>'),
    ('aria-label="Motion reel — a short loop of recent animation work"',
     'aria-label="ریل موشن — چند ثانیه از کارهای اخیر"'),
    ('<span class="hero-reel-toggle-label">Pause reel</span>', '<span class="hero-reel-toggle-label">توقف ریل</span>'),
    ('data-setting="heroStat1Label">Tools I use</span>', 'data-setting="heroStat1Label">ابزارهای کار</span>'),
    ('data-setting="heroStat2Value">Rasht, Iran</span>', 'data-setting="heroStat2Value">رشت، ایران</span>'),
    ('data-setting="heroStat2Label">Based in</span>', 'data-setting="heroStat2Label">محل کار</span>'),
    ('class="hero-promise" data-setting="heroPromise">Tell me the goal and the deadline — you get a scope, a price and a timeline in reply.</p>',
     'class="hero-promise" data-setting="heroPromise">هدف و مهلت را بگو — در جواب، تعریف کار، قیمت و زمان‌بندی می‌گیری.</p>'),
    ('<div class="hero-scroll">\n      <span>Scroll</span>', '<div class="hero-scroll">\n      <span>اسکرول</span>'),

    # work
    ('<h2 class="section-title">Selected work</h2>', '<h2 class="section-title">نمونه‌کارها</h2>'),
    ('Real projects, not a gallery dump: what the team needed, what I made, and what shipped. Open a card to see the case study — video plays inside the page.',
     'کار واقعی، نه گالری: هر پروژه چه می‌خواست، چه ساختم و چه تحویل شد. روی هر کارت بزن تا مطالعهٔ موردی داخل همین صفحه باز شود.'),

    # what you get
    ('<h2 class="section-title" data-setting="offerTitle">What you get</h2>',
     '<h2 class="section-title" data-setting="offerTitle">چه می‌گیری</h2>'),
    ('<dt>Reply time</dt>', '<dt>زمان پاسخ</dt>'),
    ('<dt>Typical timeline</dt>', '<dt>زمان‌بندی معمول</dt>'),
    ('<dt>You receive</dt>', '<dt>تحویل</dt>'),
    ('<dt>Revisions</dt>', '<dt>اصلاحات</dt>'),
    ('<dt>Payment</dt>', '<dt>پرداخت</dt>'),
    ('<dt>Starting point</dt>', '<dt>حداقل شروع</dt>'),
    ('<dt>Next opening</dt>', '<dt>ظرفیت بعدی</dt>'),
    ('data-setting="scopeTitle">What\'s not included</h3>', 'data-setting="scopeTitle">چه چیزی شامل نمی‌شود</h3>'),

    # about
    ('<h2 class="section-title">About</h2>', '<h2 class="section-title">درباره من</h2>'),
    ('alt="Alireza Shabanzadeh at work on a motion graphics project"',
     'alt="علیرضا شابان‌زاده هنگام کار روی یک پروژهٔ موشن گرافیک"'),
    ('<span class="about-apps-label">Tools I Use</span>', '<span class="about-apps-label">ابزارهای کار</span>'),

    # services
    ('<h2 class="section-title" data-setting="servicesTitle">What I do</h2>', '<h2 class="section-title" data-setting="servicesTitle">چه کاری برایت می‌کنم</h2>'),

    # timeline
    ('<h2 class="section-title">Experience & Education</h2>', '<h2 class="section-title">سابقه و تحصیلات</h2>'),
    ('The work, collaborations, and learning that shaped how I think and create.',
     'کارها، همکاری‌ها و آموخته‌هایی که شکل کار کردنم را ساخته‌اند.'),
    ('>Experience</h3>', '>سابقهٔ کاری</h3>'),
    ('>Education</h3>', '>تحصیلات</h3>'),

    # contact form
    ('<h2 class="section-title">Get in Touch</h2>', '<h2 class="section-title">شروع کنیم</h2>'),
    ('>Your name <span', '>نام شما <span'),
    ('>Email address <span', '>ایمیل <span'),
    ('>Project type <span', '>نوع پروژه <span'),
    ('placeholder="e.g. Sara Ahmadi"', 'placeholder="مثلاً سارا احمدی"'),
    ('<option value="">Not sure yet</option>', '<option value="">مطمئن نیستم</option>'),
    ('<option value="explainer">Explainer / product video</option>', '<option value="explainer">ویدیوی توضیحی محصول</option>'),
    ('<option value="social">Social media animation</option>', '<option value="social">محتوای شبکه‌های اجتماعی</option>'),
    ('<option value="ui">UI / app motion</option>', '<option value="ui">موشن رابط کاربری</option>'),
    ('<option value="logo">Logo or brand animation</option>', '<option value="logo">انیمیشن لوگو و برند</option>'),
    ('<option value="other">Something else</option>', '<option value="other">چیز دیگر</option>'),
    ('>Deadline <span', '>مهلت <span'),
    ('>Output format <span', '>فرمت خروجی <span'),
    ('placeholder="e.g. mid-November, or \'no rush\'"', 'placeholder="مثلاً اواسط آبان، یا «عجله‌ای نیست»"'),
    ('<option value="16:9">16:9 — website / YouTube</option>', '<option value="16:9">۱۶:۹ — وب‌سایت و یوتیوب</option>'),
    ('<option value="1:1">1:1 — feed</option>', '<option value="1:1">۱:۱ — فید</option>'),
    ('<option value="9:16">9:16 — reels / shorts</option>', '<option value="9:16">۹:۱۶ — ریلز و شورتس</option>'),
    ('<option value="multiple">Several of them</option>', '<option value="multiple">چند مورد</option>'),
    ('<option value="unsure">Advise me</option>', '<option value="unsure">راهنمایی کن</option>'),
    ('>The brief <span', '>بریف <span'),
    ('placeholder="What should this video make people do? Who is watching it, and what do you already have (script, brand files, footage)?"',
     'placeholder="این ویدیو باید مخاطب را به چه کاری ترغیب کند؟ چه کسی می‌بیند و از قبل چه داری (متن، فایل برند، فیلم خام)؟"'),
    ('>How should I reply? <span', '>چطور جواب بدهم؟ <span'),
    ('<option value="">Email is fine</option>', '<option value="">ایمیل خوب است</option>'),
    ('<option value="email">Email</option>', '<option value="email">ایمیل</option>'),
    ('<option value="telegram">Telegram</option>', '<option value="telegram">تلگرام</option>'),
    ('<option value="whatsapp">WhatsApp</option>', '<option value="whatsapp">واتساپ</option>'),
    ('<option value="call">A short call</option>', '<option value="call">یک تماس کوتاه</option>'),
    ('(optional)</span>', '(اختیاری)</span>'),
    ('<span aria-hidden="true">*</span> Required fields. Your message and email address are stored on my\n            server and used only to reply — details in the',
     '<span aria-hidden="true">*</span> فیلدهای ضروری. پیام و ایمیل شما روی سرور من ذخیره می‌شود و فقط برای پاسخ استفاده می‌شود — جزئیات در'),
    ('<a href="privacy.html">privacy policy</a>', '<a href="privacy.html">سیاست حفظ حریم خصوصی</a>'),
    ('<span data-submit-label>Send the brief</span>', '<span data-submit-label>ارسال بریف</span>'),
    ('<strong>What happens next:</strong> I read it myself and reply within one business day —\n            usually with a couple of questions, a scope and a timeline.\n            Prefer email?',
     '<strong>بعدش چه می‌شود:</strong> خودم می‌خوانم و حداکثر یک روز کاری جواب می‌دهم — معمولاً با چند سؤال، تعریف کار و زمان‌بندی.\n            ترجیح می‌دهی ایمیل کنی؟'),
    ('>Open this brief as an email instead</a>', '>همین بریف را ایمیل کن</a>'),
    ('>Location</span>', '>محل</span>'),
    ('data-setting="location">Rasht, Guilan, Iran</span>', 'data-setting="location">رشت، ایران</span>'),
    ('>Phone / WhatsApp</span>', '>تلفن / واتساپ</span>'),
    ('<span class="contact-info-label">Telegram</span>', '<span class="contact-info-label">تلگرام</span>'),
    ('<span class="contact-info-label">WhatsApp</span>', '<span class="contact-info-label">واتساپ</span>'),
    ('<span class="contact-info-label">Email</span>', '<span class="contact-info-label">ایمیل</span>'),
    ('data-setting="telegram" rel="noopener" hidden>Telegram</a>', 'data-setting="telegram" rel="noopener" hidden>تلگرام</a>'),
    ('data-setting="whatsapp" rel="noopener" hidden>WhatsApp</a>', 'data-setting="whatsapp" rel="noopener" hidden>واتساپ</a>'),
    ('>Copy email address</button>', '>کپی ایمیل</button>'),

    # the work pack link sits on its own line, so swap the bare text
    ('Work pack — all work on one page (print / PDF)', 'بستهٔ کاری — همهٔ کارها در یک صفحه (پرینت/PDF)'),

    # footer
    ('data-setting="footerCopy">&copy; 2026 Alireza Shabanzadeh</span>',
     'data-setting="footerCopy">&copy; ۱۴۰۵ علیرضا شابان‌زاده</span>'),
    ('data-setting="footerNote">Motion graphics designer · Rasht, Iran · available for remote work</span>',
     'data-setting="footerNote">موشن گرافیک · رشت، ایران · آمادهٔ دورکاری</span>'),
    ('aria-label="Legal and site information"', 'aria-label="اطلاعات سایت"'),
    ('<a href="privacy.html">Privacy policy</a>', '<a href="privacy.html">سیاست حفظ حریم خصوصی</a>'),
    ('<a href="cookies.html">Cookie policy</a>', '<a href="cookies.html">سیاست کوکی</a>'),
    ('data-consent-settings>Cookie settings</button>', 'data-consent-settings>تنظیمات کوکی</button>'),
    # about + services placeholder copy (both are overwritten from the CMS, but
    # the static page must read Persian before any script runs)
    ("I'm a motion graphics designer with a passion for transforming complex ideas into\n            clear, compelling visual stories. With expertise in After Effects and a keen eye for\n            timing and composition, I create animations that don't just look good — they communicate.", 'برای چیزهایی موشن می\u200cسازم که باید توضیح بدهند: قابلیتی که هنوز کسی نمی\u200cفهمد، یک ماژول\n            آموزشی، یک مرحله از آنبوردینگ. از ۲۰۱۸ هر دو طرف این کار را دیده\u200cام — چهار سال و نه ماه\n            تولید محتوای آموزش الکترونیکی در دانشگاه مهرالبرز، و از ۱۴۰۲ موشن گرافیک در تولید در رهاورد سامانه\u200cهای امن.'),
    ('Motion that moves people — from idea to final frame. Specialized in work that converts, not just looks pretty.',
     'سه راه که موشن را به سرانجام می‌رسانم — هر کدام با تعریف کار مشخص، نه با وعده.'),
]

# Latin runs that are allowed to stay: brand names, file types, numbers, emails,
# URLs and the language switch itself.
ALLOWED = [
    r'After Effects', r'Photoshop', r'Premiere Pro', r'\bAe\b', r'\bPs\b', r'\bPr\b',
    r'\bPDF\b', r'\bEN\b', r'\bFA\b', r'16:9', r'1:1', r'9:16', r'&[a-zA-Z]+;',
    r'[\w.+-]+@[\w-]+\.[\w.]+', r'https?://\S+', r'\bEnglish\b', r'\bRel\b',
    r'\bIcons8\b', r'gsap\b', r'ScrollTrigger',
]


def build() -> int:
    html = SOURCE.read_text(encoding='utf-8')
    failures = []

    for old, new in HEAD_SWAPS + BODY_SWAPS:
        if old not in html:
            failures.append(old[:90])
            continue
        html = html.replace(old, new)

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
