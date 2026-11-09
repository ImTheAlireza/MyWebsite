<?php
// php/handlers/settings.php — Settings handlers (PHP 5.6+ compatible)
//
// Every string the public site prints comes from here. The defaults below are
// the reference design's copy, already filled with this site's real content;
// the admin panel can edit every one of them (English + Persian mirror).

function default_rates() {
    return array(
        array(
            'type' => '2D EXPLAINER / LEARNING VIDEO',
            'typeFa' => 'ویدیوی اکسپلینر دوبعدی / آموزشی',
            'price' => '$150–250',
            'priceFa' => '$150–250',
            'unit' => 'per finished minute',
            'unitFa' => 'به ازای هر دقیقهٔ نهایی',
            'note' => 'Includes visual concepting, styleframes, 2D motion, and two structured revision rounds based on your script.',
            'noteFa' => 'شامل ایده‌پردازی بصری، طراحی استایل‌فریم، انیمیت دوبعدی و دو نوبت اصلاحیهٔ ساختارمند بر اساس سناریوی شما.',
            'featured' => false,
            'visible' => true,
        ),
        array(
            'type' => 'UI & PRODUCT MOTION',
            'typeFa' => 'موشن رابط کاربری و محصول',
            'price' => '$25–35',
            'priceFa' => '$25–35',
            'unit' => 'per hour (or fixed per clip)',
            'unitFa' => 'ساعتی (یا مقطوع به ازای هر کلیپ)',
            'note' => 'Ideal for SaaS feature launches, abstract UI walkthroughs, onboarding loops, and design system motion guidelines.',
            'noteFa' => 'مناسب برای معرفی فیچرهای SaaS، نمایش انتزاعی رابط کاربری، لوپ‌های آنبوردینگ و مستندسازی موشن دیزاین سیستم.',
            'featured' => true,
            'visible' => true,
        ),
        array(
            'type' => 'MONTHLY STUDIO CAPACITY',
            'typeFa' => 'ظرفیت کاری ماهانه',
            'price' => '20–30 hrs',
            'priceFa' => '۲۰ تا ۳۰ ساعت',
            'unit' => 'available per month',
            'unitFa' => 'ظرفیت آزاد در ماه',
            'note' => 'Reliable recurring bandwidth for product or e-learning teams needing ongoing motion releases without hiring full-time.',
            'noteFa' => 'همکاری مستمر و قابل اتکا برای تیم‌های محصول یا آموزشی که به تولید ماهانهٔ موشن نیاز دارند.',
            'featured' => false,
            'visible' => true,
        ),
    );
}

function default_services() {
    return array(
        array(
            'icon' => 'screen',
            'title' => 'Product & UI Motion',
            'titleFa' => 'موشن محصول و رابط کاربری',
            'kicker' => 'CORE FOCUS',
            'kickerFa' => 'تمرکز اصلی',
            'desc' => 'High-clarity interface animations, feature launch videos, onboarding walkthroughs, and micro-interaction prototypes that show users how your product works without overwhelming them.',
            'descFa' => 'انیمیشن‌های رابط کاربری با وضوح بالا، ویدیوهای معرفی فیچرها، راهنمای آنبوردینگ و پروتوتایپ‌های تعاملات ریز که کارکرد محصول را بدون پیچیدگی نشان می‌دهند.',
            'bullets' => array(
                'SaaS Product Walkthroughs & Launch Reels',
                'UI Component Transitions & State Motion',
                '4K MP4 / WebM Loops Ready for Landing Pages',
            ),
            'bulletsFa' => array(
                'ویدیوهای معرفی محصول SaaS و دموی فیچرها',
                'انیمیشن وضعیت کامپوننت‌ها و تعاملات رابط کاربری',
                'خروجی‌های 4K MP4 / WebM آماده برای لندینگ‌پیج',
            ),
        ),
        array(
            'icon' => 'film',
            'title' => '2D Explainer & Learning Content',
            'titleFa' => 'اکسپلینر دوبعدی و محتوای آموزشی',
            'kicker' => 'E-LEARNING & EXPLAINERS',
            'kickerFa' => 'آموزش و اکسپلینر',
            'desc' => 'Structured 2D explainers, visual metaphors, and course graphics built on 5+ years of university e-learning production experience. Designed for retention and pedagogical clarity.',
            'descFa' => 'اکسپلینرهای دوبعدی، استعاره‌های تصویری و گرافیک‌های آموزشی بر پایهٔ ۵ سال تجربهٔ تولید محتوای دانشگاهی؛ طراحی‌شده برای یادگیری عمیق و ماندگار.',
            'bullets' => array(
                '2D Narrative Explainers & Storyboarded Visuals',
                'University & Corporate E-Learning Modules',
                'Synced Voiceover, Captions & Multi-Ratio Exports',
            ),
            'bulletsFa' => array(
                'اکسپلینرهای داستانی دوبعدی و استوری‌بوردینگ',
                'ماژول‌های آموزش الکترونیکی دانشگاهی و سازمانی',
                'هماهنگ‌سازی نریشن، زیرنویس و خروجی در ابعاد مختلف',
            ),
        ),
    );
}

function default_process() {
    return array(
        array(
            'title' => 'Send a written brief',
            'titleFa' => 'ارسال بریف مکتوب',
            'badge' => 'Async Brief',
            'badgeFa' => 'بریف مکتوب',
            'desc' => 'Share your goal, target audience, existing assets (slides, script, or UI screens) and deadline via email or the form. A live call is never required by default.',
            'descFa' => 'هدف، مخاطب، فایل‌های موجود (اسلاید، متن یا طرح UI) و ددلاین را از طریق فرم یا ایمیل بفرستید. نیازی به تماس آنلاین نیست.',
        ),
        array(
            'title' => 'Agree scope, price & timeline',
            'titleFa' => 'توافق بر سر شرح کار، قیمت و زمان',
            'badge' => 'Fixed Scope',
            'badgeFa' => 'شرح کار ثابت',
            'desc' => 'Within 24 hours I reply with a concrete deliverable list, a fixed price or hourly estimate, and a milestone schedule so everyone knows what to expect.',
            'descFa' => 'حداکثر تا ۲۴ ساعت فهرست دقیق خروجی‌ها، قیمت مقطوع یا برآورد ساعتی و زمان‌بندی مراحل را ارسال می‌کنم.',
        ),
        array(
            'title' => 'Motion & written review',
            'titleFa' => 'تولید موشن و بازبینی مکتوب',
            'badge' => 'Iterative Delivery',
            'badgeFa' => 'تحویل مرحله‌ای',
            'desc' => 'Styleframes, animatics, and motion passes are reviewed asynchronously with timestamped written feedback, delivering clean master files on schedule.',
            'descFa' => 'استایل‌فریم‌ها، انیماتیک و نسخه‌های موشن با بازخورد مکتوب و زمان‌دار پیش می‌روند تا فایل نهایی سر موعد تحویل شود.',
        ),
    );
}

$DEFAULT_SETTINGS = array(
    // ---------------------------------------------------------------- identity
    'siteName' => 'Alireza Shabanzadeh',
    'siteNameFa' => 'علیرضا شابان‌زاده',
    'siteTitle' => 'Product & UI Motion Designer',
    'siteTitleFa' => 'طراح موشن محصول و رابط کاربری',
    'tagline' => '',
    'email' => 'alirezashabanzadeh01@gmail.com',
    'phone' => '+98 911 694 7375',
    'location' => 'Rasht, Guilan, Iran',
    'locationFa' => 'رشت، گیلان، ایران',
    'linkedin' => '',
    'behance' => '',
    'instagram' => '',
    'telegram' => '',
    'whatsapp' => '',

    // -------------------------------------------------------------------- hero
    'heroEyebrow' => 'Motion Designer · Product & UI Motion',
    'heroEyebrowFa' => 'طراح موشن · موشن محصول و رابط کاربری',
    'heroFirstName' => 'Alireza',
    'heroFirstNameFa' => 'علیرضا',
    'heroLastName' => 'Shabanzadeh',
    'heroLastNameFa' => 'شابان‌زاده',
    'heroSubtitle' => 'I make product and learning ideas move: explainers, UI motion and social cuts that stay legible on a phone — English or Persian.',
    'heroSubtitleFa' => 'ایده‌های محصول و آموزش را به حرکت تبدیل می‌کنم: اکسپلینر، موشن رابط کاربری و کات‌های شبکه‌های اجتماعی که روی موبایل هم خوانا باشند.',
    'heroAvailability' => 'Open for freelance projects',
    'heroAvailabilityFa' => 'پروژهٔ جدید می‌پذیرم',
    'heroStat1Value' => 'Since 2018',
    'heroStat1ValueFa' => 'از ۱۳۹۷',
    'heroStat1Label' => 'Motion & learning content',
    'heroStat1LabelFa' => 'موشن و محتوای آموزشی',
    'heroStat2Value' => 'EN · FA',
    'heroStat2ValueFa' => 'فارسی و انگلیسی',
    'heroStat2Label' => 'Working languages',
    'heroStat2LabelFa' => 'زبان کار',
    'heroStat3Value' => 'Remote · UTC+3:30',
    'heroStat3ValueFa' => 'دورکاری · UTC+3:30',
    'heroStat3Label' => 'How I work',
    'heroStat3LabelFa' => 'شیوهٔ همکاری',
    'heroHudTag' => 'UI WALKTHROUGH',
    'heroHudTagFa' => 'نمای رابط کاربری',
    'heroPromise' => 'Send the goal and the deadline: you get a scope, a price and a timeline in reply.',
    'heroPromiseFa' => 'هدف و ددلاین را بفرستید؛ در جواب شرح کار، قیمت و زمان‌بندی می‌گیرید.',
    'heroCtaText' => 'See selected work',
    'heroCtaTextFa' => 'دیدن نمونه‌کارها',
    'heroCtaLink' => '#work',
    'heroShowreelUrl' => '',
    'heroPoster' => '',
    'heroPortraitDark' => '/assets/hero-portrait-dark.jpg',
    'heroPortraitDarkOpacity' => 0.89,
    'heroPortraitDarkScale' => 0.91,
    'heroPortraitLight' => '/assets/hero-portrait-light.jpg',
    'heroPortraitLightOpacity' => 0.87,
    'heroPortraitLightScale' => 0.91,

    // ------------------------------------------------------------------- about
    'aboutTitle' => 'About & Toolkit',
    'aboutTitleFa' => 'دربارهٔ من و ابزارها',
    'aboutIntro' => 'Combining a Software Engineering background with motion craft and university e-learning production.',
    'aboutIntroFa' => 'ترکیب پیشینهٔ مهندسی نرم‌افزار با تجربهٔ موشن و تولید محتوای آموزش الکترونیکی دانشگاهی.',
    'aboutText' => "I animate things that have to *explain* something: a feature nobody understands yet, a course module, an onboarding step.\n\nSince 2018 I have worked on both sides of that job — producing e-learning content at Mehr-e-Alborz University, and since 2023 motion graphics in production at Rahavard Samanehaye Amn. I studied software engineering and I am finishing a master's in English language education, which is why briefs, storyboards and review calls do not need a translator in the middle.\n\nI work in After Effects, Photoshop and Premiere Pro. Send the goal and the deadline; you get an honest answer about what is realistic, a scope and a price before anything starts.",
    'aboutTextFa' => "موشن گرافیک آن‌جایی به کارم می‌آید که چیزی باید *توضیح* داده شود: یک قابلیت جدید، یک ماژول آموزشی، یا یک مرحله از آنبوردینگ.\n\nاز سال ۱۳۹۷ همین کار را می‌کنم — تولید محتوای آموزش الکترونیکی در دانشگاه مهرالبرز، و از ۱۴۰۲ موشن گرافیک در واحد تولید رهاورد سامانه‌های امن. مهندسی نرم‌افزار خوانده‌ام و کارشناسی ارشدم آموزش زبان انگلیسی است؛ برای همین بریف، استوری‌بورد و بازخوردها مترجم لازم ندارند.\n\nبا افترافکت، فتوشاپ و پریمیر کار می‌کنم. هدف و ددلاین را بگویید؛ پیش از شروع، شرح کار و قیمت را کتبی می‌گیرید.",
    'aboutImage' => '/assets/about-portrait.jpg',
    'aboutSkills' => 'After Effects, Photoshop, Premiere Pro, Illustrator, Blender',
    'aboutSkillsFa' => 'افترافکت، فتوشاپ، پریمیر، ایلاستریتور، بلندر',
    'aboutResumeUrl' => '/assets/alireza-shabanzadeh-client-onepager.pdf',
    'experience' => array(
        array('date' => 'June 2023 — Present', 'title' => 'Motion Designer', 'subtitle' => 'IDmelon / Rahavard Samanehaye Amn', 'desc' => 'Leading product and UI motion, hardware security key explainers, and enterprise passwordless authentication walkthroughs.'),
        array('date' => 'September 2018 — June 2023', 'title' => 'E-learning Content Creator', 'subtitle' => 'Mehr-e-Alborz University', 'desc' => 'Produced hundreds of minutes of structured academic e-learning modules, instructional graphics, and visual explainers for graduate courses.'),
        array('date' => 'January — August 2022', 'title' => 'Motion Graphics Designer & Animator', 'subtitle' => 'Micfava', 'desc' => 'Created 2D promotional explainers, character-driven educational clips, and social media motion assets.'),
    ),
    'experienceFa' => array(
        array('date' => 'خرداد ۱۴۰۲ — اکنون', 'title' => 'طراح موشن', 'subtitle' => 'IDmelon / رهاورد سامانه‌های امن', 'desc' => 'طراحی و اجرای موشن محصول و رابط کاربری، ویدیوهای معرفی کلیدهای امنیتی و راهنماهای احراز هویت بدون رمز عبور.'),
        array('date' => 'شهریور ۱۳۹۷ — خرداد ۱۴۰۲', 'title' => 'تولیدکنندهٔ محتوای آموزش الکترونیکی', 'subtitle' => 'دانشگاه مهرالبرز', 'desc' => 'تولید صدها دقیقه محتوای آموزشی ساختارمند، اینفوگرافیک‌های متحرک و ویدیوهای درسی برای دوره‌های تحصیلات تکمیلی.'),
        array('date' => 'دی ۱۴۰۰ — مرداد ۱۴۰۱', 'title' => 'طراح و انیماتور موشن گرافیک', 'subtitle' => 'میکفاوا (Micfava)', 'desc' => 'ساخت اکسپلینرهای تبلیغاتی دوبعدی، کلیپ‌های آموزشی کاراکتری و موشن‌های شبکه‌های اجتماعی.'),
    ),
    'education' => array(
        array('date' => '2024 — Present', 'title' => 'M.A. in English Language Education', 'subtitle' => 'Azad University of Rasht', 'desc' => 'Instructional design, bilingual communication, and multimedia learning principles.'),
        array('date' => '2022 — 2024', 'title' => 'B.Sc. in Software Engineering', 'subtitle' => 'GPA 17.8 / 20', 'desc' => 'Software architecture, human–computer interaction, and web technologies.'),
        array('date' => '2020 — 2022', 'title' => 'Associate Degree in Software Engineering', 'subtitle' => 'GPA 18 / 20', 'desc' => 'Foundations of programming, algorithms, and digital systems.'),
    ),
    'educationFa' => array(
        array('date' => '۱۴۰۳ — اکنون', 'title' => 'کارشناسی ارشد آموزش زبان انگلیسی', 'subtitle' => 'دانشگاه آزاد اسلامی واحد رشت', 'desc' => 'طراحی آموزشی، ارتباطات دوزبانه و اصول یادگیری چندرسانه‌ای.'),
        array('date' => '۱۴۰۱ — ۱۴۰۳', 'title' => 'کارشناسی مهندسی نرم‌افزار', 'subtitle' => 'معدل ۱۷.۸ از ۲۰', 'desc' => 'معماری نرم‌افزار، تعامل انسان و کامپیوتر و فناوری‌های وب.'),
        array('date' => '۱۳۹۹ — ۱۴۰۱', 'title' => 'کاردانی مهندسی نرم‌افزار', 'subtitle' => 'معدل ۱۸ از ۲۰', 'desc' => 'مبانی برنامه‌نویسی، الگوریتم‌ها و سیستم‌های دیجیتال.'),
    ),

    // ---------------------------------------------------------- work section
    'workTitle' => 'Selected Work',
    'workTitleFa' => 'گزیدهٔ نمونه‌کارها',
    'workIntro' => 'Selected product motion, 2D explainers and e-learning visual systems. Explore by client brand or open a case study for the real outcomes.',
    'workIntroFa' => 'گزیده‌ای از موشن محصول، اکسپلینر دوبعدی و سیستم‌های بصری آموزشی. با برند کارفرما شروع کنید و جزئیات هر پروژه را ببینید.',

    // -------------------------------------------------------------- services
    'servicesTitle' => 'Services & Deliverables',
    'servicesTitleFa' => 'خدمات و خروجی‌ها',
    'servicesIntro' => 'Product and UI motion first, followed by 2D explainers and structured educational content for university and SaaS teams.',
    'servicesIntroFa' => 'اولویت اول موشن محصول و رابط کاربری است؛ در کنار آن اکسپلینر دوبعدی و محتوای آموزشی ساختارمند برای تیم‌های محصول و دانشگاهی.',
    'services' => default_services(),
    'servicesFa' => default_services(),

    // --------------------------------------------------------------- process
    'processTitle' => 'How I Work',
    'processTitleFa' => 'شیوهٔ همکاری',
    'processIntro' => 'Calm, asynchronous, and written-first. No unnecessary meetings — just clear milestones from brief to final render.',
    'processIntroFa' => 'آرام، غیرهم‌زمان و مبتنی بر مکاتبهٔ شفاف. بدون جلسات غیرضروری؛ با مراحل مشخص از بریف تا فایل نهایی.',
    'process' => default_process(),

    // ------------------------------------------------------- what you get
    'offerTitle' => 'What you get',
    'offerTitleFa' => 'چه چیزی تحویل می‌گیرید',
    'offerIntro' => 'The questions you would ask before writing an email — answered here, so the first reply is about your project.',
    'offerIntroFa' => 'همان سؤال‌هایی که پیش از نوشتن ایمیل در ذهن دارید — پاسخشان اینجاست تا اولین جواب دربارهٔ خود پروژه باشد.',
    'offerReply' => 'Within one business day.',
    'offerReplyFa' => 'حداکثر یک روز کاری.',
    'offerTimeline' => '60–90s explainer: 2–3 weeks from the approved storyboard.',
    'offerTimelineFa' => 'اکسپلینر ۶۰ تا ۹۰ ثانیه‌ای: از استوری‌بورد تأییدشده، دو تا سه هفته.',
    'offerFormat' => 'MP4 in 16:9, 1:1 and 9:16, plus three still frames. Project files on request.',
    'offerFormatFa' => 'MP4 در ۱۶:۹، ۱:۱ و ۹:۱۶ + سه فریم ثابت. فایل پروژه در صورت درخواست.',
    'offerRevisions' => 'Two rounds: after the storyboard and after the first cut.',
    'offerRevisionsFa' => 'دو بار اصلاح: یکی بعد از استوری‌بورد، یکی بعد از نسخهٔ اول.',
    'offerTerms' => '50% to start, 50% on delivery. Nothing is paid before the scope is agreed.',
    'offerTermsFa' => '۵۰٪ برای شروع، ۵۰٪ هنگام تحویل. پیش از قطعی‌شدن شرح کار، پرداختی انجام نمی‌شود.',
    'offerFrom' => '',
    'offerFromFa' => '',
    'offerAvailability' => '',
    'offerAvailabilityFa' => '',
    'scopeTitle' => "What's not included",
    'scopeTitleFa' => 'این‌ها جزو کار نیست',
    'scopeItems' => "Voice-over and sound design\nLicensed music and stock footage\nMore than two revision rounds",
    'scopeItemsFa' => "گویندگی و صداگذاری\nموسیقی و فیلم آرشیوی دارای مجوز\nبیشتر از دو بار اصلاح",

    // ----------------------------------------------------------------- rates
    'ratesTitle' => 'Rates & Availability',
    'ratesTitleFa' => 'تعرفه‌ها و ظرفیت کاری',
    'ratesIntro' => 'Clear ballpark numbers so you can gauge fit immediately. Every project receives a fixed quote after reviewing your written brief.',
    'ratesIntroFa' => 'حدود قیمت‌ها شفاف درج شده تا تناسب بودجه را بسنجید. قیمت قطعی پس از بررسی بریف اعلام می‌شود.',
    'rates' => default_rates(),

    // --------------------------------------------------------------- contact
    'contactTitle' => 'Start a Project',
    'contactTitleFa' => 'ارسال بریف پروژه',
    'contactIntro' => 'Share the goal and deadline in a short written brief. I reply within 24 hours with a scope, price and timeline.',
    'contactIntroFa' => 'هدف و زمان‌بندی را در یک پیام کوتاه بنویسید. ظرف ۲۴ ساعت با شرح کار، قیمت و زمان‌بندی پاسخ می‌دهم.',
    'contactAsyncNote' => 'I do my best work with clear written briefs and asynchronous feedback. Send a quick note with your goal and timeline — no discovery call is needed to get a quote.',
    'contactAsyncNoteFa' => 'بهترین خروجی من با بریف و بازخورد مکتوب شکل می‌گیرد. بدون نیاز به جلسهٔ آنلاین، هدف پروژه را بفرستید تا برآورد دقیق بگیرید.',

    // ---------------------------------------------------------------- footer
    'footerCopy' => '© 2026 Alireza Shabanzadeh',
    'footerCopyFa' => '© ۱۴۰۵ علیرضا شابان‌زاده',
    'footerNote' => 'Motion Designer · Rasht, Iran · UTC+3:30',
    'footerNoteFa' => 'طراح موشن · رشت، ایران · UTC+3:30',

    // -------------------------------------------------------------- internal
    'categories' => array(),
    'projectLayout' => '2col',
    'testimonialsTitle' => 'Client thoughts',
    'testimonialsIntro' => 'Words from clients — shown only when a real client agrees to be quoted.',
    'testimonials' => array(),
);

function normalize_categories($values) {
    return normalize_category_list($values);
}

function deep_clean_text($value) {
    if (is_array($value)) {
        $cleaned = array();
        foreach ($value as $k => $v) {
            $cleaned[$k] = deep_clean_text($v);
        }
        return $cleaned;
    }
    if (is_string($value)) {
        return clean_content_text($value);
    }
    return $value;
}

function normalize_text_list($value, $limit = 6) {
    if (!is_array($value)) return array();
    $list = array();
    foreach ($value as $item) {
        $text = clean_content_text((string)$item);
        if ($text === '') continue;
        $list[] = $text;
        if (count($list) >= $limit) break;
    }
    return $list;
}

function normalize_rates($value) {
    if (!is_array($value)) return array();
    $out = array();
    foreach ($value as $rate) {
        if (!is_array($rate)) continue;
        $out[] = array(
            'type' => clean_content_text((string)arr_get($rate, 'type', '')),
            'typeFa' => clean_content_text((string)arr_get($rate, 'typeFa', '')),
            'price' => clean_content_text((string)arr_get($rate, 'price', '')),
            'priceFa' => clean_content_text((string)arr_get($rate, 'priceFa', '')),
            'unit' => clean_content_text((string)arr_get($rate, 'unit', '')),
            'unitFa' => clean_content_text((string)arr_get($rate, 'unitFa', '')),
            'note' => clean_content_text((string)arr_get($rate, 'note', '')),
            'noteFa' => clean_content_text((string)arr_get($rate, 'noteFa', '')),
            'featured' => !empty($rate['featured']),
            'visible' => !isset($rate['visible']) || $rate['visible'] === true || $rate['visible'] === 'true',
        );
        if (count($out) >= 6) break;
    }
    return $out;
}

function normalize_services($value) {
    if (!is_array($value)) return array();
    $out = array();
    foreach ($value as $service) {
        if (!is_array($service)) continue;
        $item = array(
            'icon' => clean_content_text((string)arr_get($service, 'icon', 'screen')),
            'title' => clean_content_text((string)arr_get($service, 'title', '')),
            'titleFa' => clean_content_text((string)arr_get($service, 'titleFa', '')),
            'desc' => clean_content_text((string)arr_get($service, 'desc', '')),
            'descFa' => clean_content_text((string)arr_get($service, 'descFa', '')),
        );
        if (isset($service['bullets'])) $item['bullets'] = normalize_text_list($service['bullets'], 5);
        if (isset($service['bulletsFa'])) $item['bulletsFa'] = normalize_text_list($service['bulletsFa'], 5);
        if (isset($service['titleFa']) && $item['title'] === '') $item['title'] = $item['titleFa'];
        if (isset($service['descFa']) && $item['desc'] === '') $item['desc'] = $item['descFa'];
        $out[] = $item;
        if (count($out) >= 6) break;
    }
    return $out;
}

function normalize_process_steps($value) {
    if (!is_array($value)) return array();
    $out = array();
    foreach ($value as $step) {
        if (!is_array($step)) continue;
        $out[] = array(
            'title' => clean_content_text((string)arr_get($step, 'title', '')),
            'titleFa' => clean_content_text((string)arr_get($step, 'titleFa', '')),
            'badge' => clean_content_text((string)arr_get($step, 'badge', '')),
            'badgeFa' => clean_content_text((string)arr_get($step, 'badgeFa', '')),
            'desc' => clean_content_text((string)arr_get($step, 'desc', '')),
            'descFa' => clean_content_text((string)arr_get($step, 'descFa', '')),
        );
        if (count($out) >= 8) break;
    }
    return $out;
}

function get_settings() {
    global $DEFAULT_SETTINGS;
    $data = json_read('settings.json');
    $settings = array_merge($DEFAULT_SETTINGS, is_array($data) ? $data : array());
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    $settings['rates'] = normalize_rates(arr_get($settings, 'rates', array()));
    $settings['services'] = normalize_services(arr_get($settings, 'services', array()));
    $settings['servicesFa'] = normalize_services(arr_get($settings, 'servicesFa', array()));
    $settings['process'] = normalize_process_steps(arr_get($settings, 'process', array()));
    // Decode previously html-encoded entities (e.g. I&#039;ve) so the panel and
    // the page print the real characters.
    $settings = deep_clean_text($settings);
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    send_json($settings);
}

function update_settings() {
    global $DEFAULT_SETTINGS;
    require_auth();
    $input = get_json_input();

    $SETTINGS_KEYS = array();
    foreach (array_keys($DEFAULT_SETTINGS) as $k) {
        $SETTINGS_KEYS[$k] = true;
    }
    $patch = array();

    foreach ($input as $key => $value) {
        if (!isset($SETTINGS_KEYS[$key])) continue;

        if ($key === 'experience' || $key === 'education' || $key === 'experienceFa' || $key === 'educationFa') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'date' => clean_content_text((string)arr_get($item, 'date', '')),
                    'title' => clean_content_text((string)arr_get($item, 'title', '')),
                    'subtitle' => clean_content_text((string)arr_get($item, 'subtitle', '')),
                    'desc' => clean_content_text((string)arr_get($item, 'desc', '')),
                );
            }, $value);
        } elseif ($key === 'services' || $key === 'servicesFa') {
            $patch[$key] = normalize_services($value);
        } elseif ($key === 'process') {
            $patch[$key] = normalize_process_steps($value);
        } elseif ($key === 'rates') {
            $patch[$key] = normalize_rates($value);
        } elseif ($key === 'testimonials') {
            if (!is_array($value)) continue;
            $patch[$key] = array_map(function($item) {
                return array(
                    'quote' => clean_content_text((string)arr_get($item, 'quote', '')),
                    'name' => clean_content_text((string)arr_get($item, 'name', '')),
                    'role' => clean_content_text((string)arr_get($item, 'role', '')),
                );
            }, $value);
        } elseif ($key === 'categories') {
            if (!is_array($value)) continue;
            $patch[$key] = normalize_categories($value);
        } elseif (substr($key, -7) === 'Opacity' || substr($key, -5) === 'Scale') {
            $n = floatval($value);
            if (is_finite($n)) $patch[$key] = $n;
        } else {
            // clean_content_text keeps apostrophes and quotes intact.
            $patch[$key] = is_string($value) ? clean_content_text($value) : $value;
        }
    }

    $current = json_read('settings.json');
    if (!is_array($current)) $current = array();
    $settings = array_merge($DEFAULT_SETTINGS, $current, $patch);
    $settings['categories'] = normalize_categories(arr_get($settings, 'categories', array()));
    json_write('settings.json', $settings);
    send_json($settings);
}
