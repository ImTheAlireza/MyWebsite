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
            'desc' => 'Feature walkthroughs, onboarding flows, interface transitions, and product videos that show how a feature works and how to use it.',
            'descFa' => 'نمایش قابلیت‌های محصول، مسیرهای آنبوردینگ، گذارهای رابط کاربری و تعاملات ریز؛ طوری که مخاطب ببیند هر بخش چه می‌کند و چطور استفاده می‌شود.',
            'bullets' => array(
                'Product walkthroughs & launch videos',
                'UI component transitions & interactions',
                'Exports prepared for the agreed placement',
            ),
            'bulletsFa' => array(
                'ویدیوهای معرفی محصول و نمایش قابلیت‌ها',
                'انیمیشنِ حالت‌های کامپوننت و تعامل‌های رابط کاربری',
                'خروجی ویدئویی متناسب با محل انتشار؛ فرمت و ابعاد را پیش از شروع مشخص می‌کنیم.',
            ),
        ),
        array(
            'icon' => 'film',
            'title' => '2D Explainer & Learning Content',
            'titleFa' => 'اکسپلینر دوبعدی و محتوای آموزشی',
            'kicker' => 'E-LEARNING & EXPLAINERS',
            'kickerFa' => 'آموزش و اکسپلینر',
            'desc' => 'I turn technical or learning concepts into visual explanations, using clear sequencing, diagrams, and motion for courses, training, and product education.',
            'descFa' => 'مفاهیم فنی یا آموزشی را با تصویر، حرکت و روایت مرحله‌به‌مرحله توضیح می‌دهم؛ برای ویدئوهای آموزشی، محتوای دوره و معرفی ایده‌های پیچیده.',
            'bullets' => array(
                '2D explainers with storyboards',
                'University & corporate learning videos',
                'Narration, captions & agreed aspect ratios',
            ),
            'bulletsFa' => array(
                'ایده‌پردازی تصویری و استوری‌بورد برای اکسپلینر دوبعدی',
                'ویدئوها و محتوای بصری برای دوره‌های دانشگاهی و آموزش سازمانی',
                'هماهنگی تصویر با نریشن و زیرنویس، و آماده‌سازی خروجی در ابعاد توافق‌شده',
            ),
        ),
    );
}

function default_process() {
    return array(
        array(
            'title' => 'Brief',
            'titleFa' => 'بریف',
            'badge' => 'Start here',
            'badgeFa' => 'شروع',
            'desc' => 'Share the goal, audience, deadline, and any materials you already have — such as a script, slides, or UI references.',
            'descFa' => 'هدف پروژه، مخاطب، زمان تحویل و هرچه آماده دارید—مثل متن، اسلاید یا طرح رابط—را بفرستید. اگر تماس لازم نباشد، همه‌چیز را مکتوب پیش می‌بریم.',
        ),
        array(
            'title' => 'Agree on the scope',
            'titleFa' => 'توافق روی کار',
            'badge' => 'Scope & schedule',
            'badgeFa' => 'محدوده و زمان',
            'desc' => 'After reviewing the brief, I’ll confirm the deliverables, estimate, schedule, and review rounds in writing.',
            'descFa' => 'بعد از بررسی بریف، خروجی‌ها، هزینه، زمان‌بندی و تعداد مرحله‌های بازبینی را روشن و کتبی می‌فرستم.',
        ),
        array(
            'title' => 'Design and animation',
            'titleFa' => 'طراحی و اجرا',
            'badge' => 'Production',
            'badgeFa' => 'اجرا',
            'desc' => 'Once the visual direction is approved, I’ll develop the animation in agreed stages and collect feedback at the planned review points.',
            'descFa' => 'پس از تأیید مسیر بصری، انیمیشن را مرحله‌به‌مرحله جلو می‌بریم و در نقاط توافق‌شده بازخورد می‌گیرم.',
        ),
    );
}

$DEFAULT_SETTINGS = array(
    // ---------------------------------------------------------------- identity
    'siteName' => 'Alireza Shabanzadeh',
    'siteNameFa' => 'علیرضا شعبان‌زاده',
    'siteTitle' => 'Product & UI Motion Designer',
    'siteTitleFa' => 'طراح موشن محصول و رابط کاربری',
    'tagline' => '',
    'email' => 'alirezashabanzadeh01@gmail.com',
    'phone' => '+98 911 694 7375',
    'location' => 'Rasht, Iran',
    'locationFa' => 'رشت، ایران · همکاری دورکاری',
    'linkedin' => 'https://www.linkedin.com/in/alirezashabanzadeh',
    'behance' => '',
    'instagram' => 'https://instagram.com/imthealireza',
    'telegram' => 'https://t.me/i_over',
    'whatsapp' => 'https://wa.me/989116947375',

    // -------------------------------------------------------------------- hero
    'heroEyebrow' => 'PRODUCT & UI · 2D EXPLAINERS',
    'heroEyebrowFa' => 'محصول و رابط کاربری · اکسپلینر دوبعدی',
    'heroFirstName' => 'Alireza',
    'heroFirstNameFa' => 'علیرضا',
    'heroLastName' => 'Shabanzadeh',
    'heroLastNameFa' => 'شعبان‌زاده',
    'heroSubtitle' => 'I create clear, purposeful motion for software products and learning content — from UI walkthroughs and feature explainers to structured 2D educational videos.',
    'heroSubtitleFa' => 'برای محصول‌های نرم‌افزاری و محتوای آموزشی، موشن‌هایی می‌سازم که کارکرد و مفهوم را روشن‌تر نشان می‌دهند؛ از نمایش رابط کاربری و معرفی قابلیت‌ها تا ویدئوهای آموزشی دوبعدی.',
    'heroAvailability' => 'Open for freelance projects',
    'heroAvailabilityFa' => 'برای همکاری پروژه‌ای در دسترس هستم',
    'heroStat1Value' => 'Motion design',
    'heroStat1ValueFa' => 'موشن و محتوای آموزشی',
    'heroStat1Label' => 'Product and learning content',
    'heroStat1LabelFa' => 'محصول و آموزش',
    'heroStat2Value' => 'English · Persian',
    'heroStat2ValueFa' => 'فارسی و انگلیسی',
    'heroStat2Label' => 'Working languages',
    'heroStat2LabelFa' => 'زبان کار',
    'heroStat3Value' => 'Rasht, Iran',
    'heroStat3ValueFa' => 'رشت، ایران',
    'heroStat3Label' => 'Working remotely',
    'heroStat3LabelFa' => 'همکاری دورکاری',
    'heroHudTag' => 'UI WALKTHROUGH',
    'heroHudTagFa' => 'نمای رابط کاربری',
    'heroPromise' => 'Tell me what needs explaining, who it is for, and when you need it. After reviewing the brief, I’ll send a written scope, estimate, and schedule.',
    'heroPromiseFa' => 'هدف، مخاطب و زمان تحویل را بفرستید. بعد از بررسی، محدودهٔ کار، برآورد هزینه و زمان‌بندی را کتبی می‌فرستم.',
    'heroCtaText' => 'View selected work',
    'heroCtaTextFa' => 'دیدن نمونه‌کارها',
    'heroCtaLink' => '#work',
    'heroShowreelUrl' => '/assets/showreel-titlecard.mp4',
    'heroShowreelVisible' => true,
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
    'aboutIntro' => 'I work across product motion, UI animation, and visual learning content. My focus is making a feature or concept easier to follow through clear visual storytelling.',
    'aboutIntroFa' => 'موشن برای وقت‌هایی است که دیدنِ یک مسیر یا مفهوم، از توضیح طولانی روشن‌ترش می‌کند. تمرکزم روی محصول، رابط کاربری و محتوای آموزشی است.',
    'aboutText' => "I make motion for things that need to be understood: a product feature, an onboarding step, or a learning concept. I start by clarifying what the audience needs to understand, then build the visuals and pacing around that goal.\n\nMy work focuses on product motion, UI animation, and learning content. I use the brief, audience, and purpose to guide visual decisions, and agree on the scope before production begins.",
    'aboutTextFa' => "بخشی از کار من این است که یک قابلیت، مسیر استفاده یا مفهوم آموزشی را به تصویر و حرکت تبدیل کنم. پیش از انیمیت، اول روشن می‌کنم مخاطب باید چه چیزی را بفهمد؛ بعد ریتم، تصویر و حرکت را حول همان هدف می‌چینم.\n\nدر پروژه‌هایم روی موشن محصول، رابط کاربری و محتوای آموزشی تمرکز دارم. بریف، هدف و مخاطب را مبنای تصمیم‌های بصری می‌گذارم و پیش از شروع، خروجی و محدودهٔ کار را روشن می‌کنم.",
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
    'workIntro' => 'A selection of product motion, 2D explainers, and learning content. Each case study explains the project goal, my role, and the final deliverables.',
    'workIntroFa' => 'اینجا نمونه‌هایی از موشن محصول، اکسپلینر دوبعدی و محتوای آموزشی را می‌بینید. هر پروژه را با هدف کار، سهم من و خروجی نهایی معرفی می‌کنم.',

    // -------------------------------------------------------------- services
    'servicesTitle' => 'Services & Deliverables',
    'servicesTitleFa' => 'خدمات و خروجی‌ها',
    'servicesIntro' => 'I focus on product and UI motion, alongside 2D explainers and visual content for learning. We can shape the format around what the audience needs to understand or do.',
    'servicesIntroFa' => 'بیشتر روی موشن محصول و رابط کاربری کار می‌کنم؛ اکسپلینر دوبعدی و محتوای آموزشی هم می‌سازم. نوع خروجی را بر اساس چیزی انتخاب می‌کنیم که مخاطب باید بفهمد یا انجام دهد.',
    'services' => default_services(),
    'servicesFa' => default_services(),

    // --------------------------------------------------------------- process
    'processTitle' => 'How I Work',
    'processTitleFa' => 'شیوهٔ همکاری',
    'processIntro' => 'We start with a clear brief and agree on the scope, review points, and schedule before production. Most coordination can happen in writing, with calls when they are useful.',
    'processIntroFa' => 'کار را با یک بریف روشن شروع می‌کنیم و مراحل، بازخوردها و زمان تحویل را از قبل مشخص می‌کنیم. بیشتر هماهنگی‌ها می‌تواند مکتوب و غیرهم‌زمان باشد.',
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
    'footerCopyFa' => '© ۱۴۰۵ علیرضا شعبان‌زاده',
    'footerNote' => 'Motion Designer · Rasht, Iran',
    'footerNoteFa' => 'طراح موشن · رشت، ایران',

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
