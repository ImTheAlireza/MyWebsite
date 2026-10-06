/**
 * Main application logic
 * Content, mobile menu, modal, filters, forms
 */

(function () {
  'use strict';

  // ============================================
  // SETTINGS — populate all content from API
  // ============================================
  // ============================================
  // LANGUAGE
  // One rule for both pages: index.html is English, fa.html is Persian
  // (<html lang="fa" dir="rtl">). Everything else in the app stays identical.
  // ============================================
  const PAGE_LANG = (document.documentElement.getAttribute('lang') || 'en')
    .toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';

  function hasValue(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  }

  // Filled by applySettings(); pick() reads from here so the settings loop, the
  // honesty pass and any later lookup all resolve the same value.
  let settingsCache = {};

  function pick(key) {
    const value = settingsCache[key];
    if (PAGE_LANG === 'fa') {
      const mirror = settingsCache[key + 'Fa'];
      if (hasValue(mirror)) return mirror;
    }
    return value;
  }

  // UI strings the app builds in JavaScript (the CMS covers the rest).
  const STR = PAGE_LANG === 'fa' ? {
    professional: 'سابقهٔ کاری',
    academic: 'تحصیلات',
    untitledEntry: 'بدون عنوان',
    untitledService: 'خدمت بدون عنوان',
    step: 'مرحله',
    service: 'خدمت',
    fillRequired: 'نام، ایمیل و متن بریف را پر کن.',
    sending: 'در حال ارسال…',
    sendingStatus: 'بریف در حال ارسال است…',
    sent: 'ارسال شد',
    sentStatus: 'ممنون — بریف به دستم رسید. حداکثر یک روز کاری جواب می‌دهم.',
    sendFailed: 'ارسال نشد',
    sendFailedStatus: 'ارسال نشد. لطفاً دوباره تلاش کن یا مستقیم ایمیل بزن.',
    copyBtn: 'کپی ایمیل',
    copiedOk: 'ایمیل کپی شد: ',
    copiedFail: 'کپی نشد — ایمیل: ',
    resumeFile: 'Alireza-Shabanzadeh-Motion-Designer-Resume.pdf',
    resumeLabel: 'معرفی یک‌صفحه‌ای (PDF)',
    showreelFallback: 'این لینک ریل قابل نمایش داخل صفحه نیست؛ در تب تازه باز می‌شود…'
  } : {
    professional: 'Professional',
    academic: 'Academic',
    untitledEntry: 'Untitled entry',
    untitledService: 'Untitled service',
    step: 'Step',
    service: 'Service',
    fillRequired: 'Please fill in your name, email and a short message.',
    sending: 'Sending…',
    sendingStatus: 'Sending your message…',
    sent: 'Message sent',
    sentStatus: 'Thanks — your message is with me. I reply within one business day.',
    sendFailed: 'Send failed',
    sendFailedStatus: 'Could not send. Please try again, or email me directly.',
    copyBtn: 'Copy email address',
    copiedOk: 'Email copied: ',
    copiedFail: 'Copy failed — the address is ',
    resumeFile: 'Alireza-Shabanzadeh-Motion-Designer-Resume.pdf',
    resumeLabel: 'Client one-pager (PDF)',
    showreelFallback: 'This showreel link cannot be embedded. Opening it in a new tab instead…'
  };

  // ============================================
  // DYNAMIC REVEALS
  // Content rendered from the CMS is animated, never hidden: an item is only
  // given .reveal-pending when the script is certain it will animate it, and a
  // safety timer releases anything still invisible after a few seconds.
  // ============================================
  function revealDynamic(container, selector) {
    if (!container) return;
    const items = Array.from(container.querySelectorAll(selector));
    if (!items.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof gsap === 'undefined') return; // stay visible, no animation

    const inView = el => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    };

    const play = els => {
      gsap.fromTo(els,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          clearProps: 'transform,opacity',
          onComplete: () => els.forEach(el => { el.classList.remove('reveal-pending'); el.style.opacity = ''; })
        }
      );
    };

    const belowFold = items.filter(el => !inView(el));
    belowFold.forEach(el => el.classList.add('reveal-pending'));

    if (belowFold.length && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const hit = entries.filter(entry => entry.isIntersecting).map(entry => entry.target);
        if (!hit.length) return;
        hit.forEach(el => { el.classList.remove('reveal-pending'); observer.unobserve(el); });
        play(hit);
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      belowFold.forEach(el => observer.observe(el));
    }

    // If anything is still invisible a few seconds later, show it.
    setTimeout(() => {
      items.forEach(el => {
        if (getComputedStyle(el).opacity === '0') {
          el.classList.remove('reveal-pending');
          el.style.opacity = '';
          el.style.transform = '';
        }
      });
    }, 4000);
  }
  window.revealDynamic = revealDynamic;

  function parseMd(text) {
    if (!text) return '';
    let h = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^- (.+)$/gm, '<li>$1</li>');
    h = h.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    h = h.split(/\n\n+/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<[hul]/.test(block)) return block;
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    return h;
  }

  function safeHref(value, allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('#') || raw.startsWith('/') || /^[\w.-]+\//.test(raw)) return raw;
    try {
      const url = new URL(raw, window.location.origin);
      return allowedProtocols.includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }


  function appendTextElement(parent, tagName, className, text) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    el.textContent = text || '';
    parent.appendChild(el);
    return el;
  }

  function applySettings(settings) {
    settingsCache = settings || {};
    // Populate all data-setting elements
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.getAttribute('data-setting');
      // fa.html renders the same markup as index.html. Any CMS value that has a
      // Persian twin (heroSubtitleFa, servicesFa, aboutTextFa, ...) wins on the
      // Persian page; an empty twin falls back to the English value, so the page
      // is never half-empty.
      let val = pick(key);
      if (val == null || val === '') return;

      if (key === 'heroCtaLink') {
        el.href = safeHref(val, ['http:', 'https:']) || '#work';
      } else if (/^heroStat\dValue$/.test(key)) {
        // The CMS value is stored on the element (data-stat-value) and the
        // counter in js/animations.js animates towards it. It never reads a
        // half-animated DOM value back, which is what broke this before.
        if (typeof window.setHeroStatValue === 'function') window.setHeroStatValue(el, val);
        else el.textContent = val;
      } else if (key === 'linkedin' || key === 'behance' || key === 'instagram'
                 || key === 'telegram' || key === 'whatsapp') {
        const socialHref = safeHref(val, ['http:', 'https:']);
        // No dead "#" links: an icon that goes nowhere costs more trust than it adds.
        if (!socialHref) {
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
          el.removeAttribute('href');
        } else {
          el.href = socialHref;
          el.hidden = false;
          el.removeAttribute('aria-hidden');
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (key === 'phone') {
        el.href = 'tel:' + val.replace(/\s/g, '');
        el.textContent = val;
      } else if (key === 'email') {
        el.href = safeHref('mailto:' + val) || '#';
        el.textContent = val;
      } else if (key === 'aboutResumeUrl') {
        const resumeHref = safeHref(val, ['http:', 'https:']);
        if (!resumeHref) {
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
        } else {
          el.href = resumeHref;
          el.hidden = false;
          el.removeAttribute('aria-hidden');
          // A readable filename in the recruiter's Downloads folder instead of a UUID.
          el.setAttribute('download', 'Alireza-Shabanzadeh-Motion-Designer-Resume.pdf');
          el.setAttribute('rel', 'noopener');
          const label = el.querySelector('[data-resume-label]');
          // A client-facing one-pager, not a job-application CV.
          if (label) label.textContent = STR.resumeLabel;
        }
      } else if (key === 'aboutSkills') {
        const skillPositions = [
          { left: '2%', top: '8%' },
          { left: '42%', top: '0%' },
          { left: '72%', top: '22%' },
          { left: '58%', top: '62%' },
          { left: '5%', top: '55%' },
        ];
        el.innerHTML = '';
        val.split(',').forEach((s, i) => {
          const pos = skillPositions[i] || { left: '50%', top: '50%' };
          const node = appendTextElement(el, 'div', 'skill-node', s.trim());
          node.style.left = pos.left;
          node.style.top = pos.top;
        });
      } else if (key === 'aboutImage') {
        const img = document.getElementById('aboutImage');
        const placeholder = document.getElementById('aboutImagePlaceholder');
        if (img && val) {
          img.src = val;
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        }
      } else if (key === 'aboutText') {
        el.innerHTML = parseMd(val);
      } else if (key === 'experience' || key === 'education') {
        if (Array.isArray(val)) {
          el.innerHTML = '';
          const timeline = document.createElement('div');
          timeline.className = 'timeline';
          val.forEach((item, index) => {
            const row = document.createElement('article');
            row.className = 'timeline-item';
            row.style.setProperty('--entry-index', index);

            const dateWrap = document.createElement('div');
            dateWrap.className = 'timeline-date-wrap';
            appendTextElement(dateWrap, 'span', 'timeline-date', item.date || '—');

            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.innerHTML = '<span></span>';

            const content = document.createElement('div');
            content.className = 'timeline-content';
            const meta = document.createElement('div');
            meta.className = 'timeline-entry-meta';
            appendTextElement(meta, 'span', 'timeline-entry-kind', key === 'experience' ? STR.professional : STR.academic);
            appendTextElement(meta, 'span', 'timeline-entry-number', String(index + 1).padStart(2, '0'));
            content.appendChild(meta);
            appendTextElement(content, 'h3', 'timeline-title', item.title || STR.untitledEntry);
            if (item.subtitle) appendTextElement(content, 'span', 'timeline-subtitle', item.subtitle);
            if (item.desc) appendTextElement(content, 'p', 'timeline-desc', item.desc);
            row.append(dateWrap, marker, content);
            timeline.appendChild(row);
          });
          el.appendChild(timeline);
          revealDynamic(el, '.timeline-item');
          requestAnimationFrame(() => {
            if (typeof window.updateTimelineCount === 'function') window.updateTimelineCount();
          });
        }
      } else if (key === 'services') {
        if (Array.isArray(val)) {
          el.innerHTML = '';
          const iconMap = {
            play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
            share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 6.5M15.7 17.5 8.5 10.5"/></svg>',
            monitor: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
            film: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 7h20M7 2v20M17 2v20"/></svg>',
            spark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 13.5 8.5H20l-5.5 4 2 6.5L12 15l-4.5 4 2-6.5L4 8.5h6.5L12 2z"/></svg>',
            zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
          };
          val.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.setProperty('--service-index', index);
            const icon = document.createElement('div');
            icon.className = 'service-icon';
            icon.innerHTML = iconMap[item.icon] || iconMap.play;
            const title = document.createElement('h3');
            title.className = 'service-title';
            title.textContent = item.title || STR.untitledService;
            const desc = document.createElement('p');
            desc.className = 'service-desc';
            desc.textContent = item.desc || '';
            const meta = document.createElement('div');
            meta.className = 'service-meta';
            meta.innerHTML = '<span></span>' + String(index + 1).padStart(2, '0') + ' • ' + STR.service;
            card.append(icon, title, desc, meta);
            el.appendChild(card);
          });
          revealDynamic(el, '.service-card');
        }
      } else if (key === 'process') {
        if (Array.isArray(val)) {
          el.innerHTML = '';
          val.forEach((item, index) => {
            const step = document.createElement('div');
            step.className = 'process-step';
            step.style.setProperty('--step-index', index);
            const num = document.createElement('div');
            num.className = 'process-step-number';
            num.textContent = String(index + 1).padStart(2, '0');
            const title = document.createElement('h3');
            title.className = 'process-step-title';
            title.textContent = item.title || STR.step;
            const desc = document.createElement('p');
            desc.className = 'process-step-desc';
            desc.textContent = item.desc || '';
            const arrow = document.createElement('div');
            arrow.className = 'process-step-arrow';
            arrow.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';
            step.append(num, title, desc, arrow);
            el.appendChild(step);
          });
        }
      } else {
        el.textContent = val;
      }
    });

    // ============================================
    // HONESTY / EMPTY-STATE PASS
    // Nothing unverifiable or empty is allowed to look like content: stats with
    // no value, placeholder testimonials, empty social icons and empty info
    // rows are hidden instead of rendered.
    // ============================================
    const isBlank = value => value == null || String(value).trim() === '' || (Array.isArray(value) && value.length === 0);

    ['heroStat1', 'heroStat2', 'heroStat3'].forEach(key => {
      const valueEl = document.querySelector('[data-setting="' + key + 'Value"]');
      const labelEl = document.querySelector('[data-setting="' + key + 'Label"]');
      const block = valueEl ? valueEl.closest('.hero-stat') : null;
      const valueEmpty = isBlank(pick(key + 'Value')) || !valueEl || !valueEl.dataset.statValue;
      const labelEmpty = isBlank(pick(key + 'Label'));
      if (valueEl && valueEmpty) valueEl.textContent = '';
      if (labelEl && labelEmpty) labelEl.textContent = '';
      if (block && (valueEmpty || labelEmpty)) block.hidden = true;
    });

    // Whole sections stay off the page while they hold nothing real.
    const timelineSection = document.getElementById('timeline');
    if (timelineSection) {
      // The markup ships with the real entries baked in, so this section is
      // only ever hidden when the CMS explicitly answers "this list is empty".
      // A failed, partial or silent response leaves the static entries alone.
      const answered = key => Object.prototype.hasOwnProperty.call(settingsCache, key)
        || Object.prototype.hasOwnProperty.call(settingsCache, key + 'Fa');
      const cameBackEmpty = key => {
        const raw = settingsCache[key + 'Fa'];
        const effective = PAGE_LANG === 'fa' && hasValue(raw) ? raw : settingsCache[key];
        return answered(key) && Array.isArray(effective) && effective.length === 0;
      };
      const experienceEmpty = cameBackEmpty('experience');
      const educationEmpty = cameBackEmpty('education');
      timelineSection.hidden = experienceEmpty && educationEmpty;
      // The education group carries its own heading, so an empty one must go.
      const educationGroup = document.getElementById('educationGroup');
      if (educationGroup) educationGroup.hidden = educationEmpty;
    }

    const workSection = document.getElementById('work');
    if (workSection) workSection.hidden = false; // the CTA card keeps it useful

    // Availability badge: only when it is actually true.
    const availability = document.querySelector('.availability-badge');
    if (availability) availability.hidden = isBlank(pick('heroAvailability'));

    // Contact info rows: never show a label with an empty value.
    document.querySelectorAll('.contact-info-item').forEach(item => {
      const value = item.querySelector('.contact-info-value');
      const emptyText = !value || value.textContent.trim() === '';
      const emptyHref = value && value.tagName === 'A' && (!value.getAttribute('href') || value.getAttribute('href') === '#');
      if (emptyText || emptyHref) item.hidden = true;
    });

    // Showreel button (only when a real video URL exists).
    const showreelButton = document.getElementById('heroShowreelBtn');
    const showreelUrl = safeHref(settings.heroShowreelUrl, ['http:', 'https:']);
    if (showreelButton) {
      if (!showreelUrl) {
        showreelButton.hidden = true;
      } else {
        showreelButton.hidden = false;
        showreelButton.dataset.videoUrl = showreelUrl;
      }
    }

    // Hero reel: only a self-hosted file (mp4/webm) plays inline. An external
    // embed keeps the click-to-open dialog, so no third-party iframe loads on
    // first paint.
    const heroReel = document.getElementById('heroReel');
    const heroReelVideo = document.getElementById('heroReelVideo');
    const heroReelToggle = document.getElementById('heroReelToggle');
    if (heroReel && heroReelVideo) {
      const reelUrl = safeHref(settings.heroShowreelUrl, ['http:', 'https:']);
      const isFile = !!reelUrl && /\.(mp4|webm|ogv|ogg|m4v|mov)(?:[?#].*)?$/i.test(reelUrl);
      if (isFile) {
        heroReel.hidden = false;
        if (heroReelVideo.getAttribute('src') !== reelUrl) {
          heroReelVideo.setAttribute('src', reelUrl);
          heroReelVideo.load();
        }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const syncReel = () => {
          if (!heroReelToggle) return;
          const paused = heroReelVideo.paused;
          heroReelToggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
          const label = heroReelToggle.querySelector('.hero-reel-toggle-label');
          if (label) label.textContent = paused ? 'Play reel' : 'Pause reel';
        };
        if (heroReelToggle && !heroReelToggle.dataset.wired) {
          heroReelToggle.dataset.wired = '1';
          heroReelToggle.addEventListener('click', () => {
            if (heroReelVideo.paused) {
              const started = heroReelVideo.play();
              if (started && started.catch) started.catch(() => {});
            } else {
              heroReelVideo.pause();
            }
            syncReel();
          });
          heroReelVideo.addEventListener('play', syncReel);
          heroReelVideo.addEventListener('pause', syncReel);
        }
        if (!reduced) {
          const started = heroReelVideo.play();
          if (started && started.then) {
            started.then(() => {
              if (window.portfolioTracking && !heroReel.dataset.counted) {
                heroReel.dataset.counted = '1';
                window.portfolioTracking.track('reel_play');
              }
            }).catch(() => {});
          }
        }
        syncReel();
      } else {
        heroReel.hidden = true;
      }
    }

    // "What you get": every row needs a real value, otherwise the block stays
    // off the page instead of showing empty promises.
    const offerSection = document.getElementById('what-you-get');
    if (offerSection) {
      let filledRows = 0;
      offerSection.querySelectorAll('.offer-row').forEach(row => {
        const value = row.querySelector('dd');
        const isEmpty = !value || value.textContent.trim() === '';
        row.hidden = isEmpty;
        if (!isEmpty) filledRows += 1;
      });
      offerSection.hidden = filledRows === 0;
      const offerIntro = offerSection.querySelector('[data-setting="offerIntro"]');
      if (offerIntro) offerIntro.hidden = offerIntro.textContent.trim() === '';
    }

    // Scope guard: what a quote does not include, one item per line. Saying
    // "no" up front is what keeps a fixed-price project profitable.
    const scopeBlock = document.getElementById('scopeBlock');
    const scopeList = document.getElementById('scopeList');
    if (scopeBlock && scopeList) {
      const raw = pick('scopeItems');
      const items = String(raw || '').split('\n').map(line => line.trim()).filter(Boolean);
      scopeList.innerHTML = '';
      items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        scopeList.appendChild(li);
      });
      scopeBlock.hidden = items.length === 0;
    }

    // Promise line: hidden when empty rather than leaving an orphan sentence.
    const promiseLine = document.querySelector('.hero-promise');
    if (promiseLine) promiseLine.hidden = isBlank(pick('heroPromise'));

    // Social block: hide the whole row when nothing is configured.
    const socialBlock = document.querySelector('.contact-social');
    if (socialBlock) {
      const visible = Array.from(socialBlock.querySelectorAll('.social-link')).some(link => !link.hidden);
      socialBlock.hidden = !visible;
    }

    // Dual hero portraits
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const portraitDark = document.getElementById('heroPortraitDark');
    const portraitLight = document.getElementById('heroPortraitLight');

    if (portraitDark) {
      if (settings.heroPortraitDark) {
        portraitDark.onload = () => portraitDark.classList.add('is-loaded');
        portraitDark.src = settings.heroPortraitDark;
        if (portraitDark.complete) portraitDark.classList.add('is-loaded');
        portraitDark.style.setProperty('--portrait-opacity', settings.heroPortraitDarkOpacity ?? 0.18);
        portraitDark.style.setProperty('--portrait-scale', settings.heroPortraitDarkScale ?? 1);
      }
    }

    if (portraitLight) {
      if (settings.heroPortraitLight) {
        portraitLight.onload = () => portraitLight.classList.add('is-loaded');
        portraitLight.src = settings.heroPortraitLight;
        if (portraitLight.complete) portraitLight.classList.add('is-loaded');
        portraitLight.style.setProperty('--portrait-opacity', settings.heroPortraitLightOpacity ?? 0.12);
        portraitLight.style.setProperty('--portrait-scale', settings.heroPortraitLightScale ?? 1);
      }
    }

    // Hero stats were already handed to the counter while the settings loop ran
    // (setHeroStatValue). No second pass here — that is what used to restart the
    // animation on a half-finished number.
  }

  window.addEventListener('load', () => {
    fetch('/api.php?_query=settings')
      .then(r => r.json())
      .then(settings => {
        // Merge draft preview data from admin panel (if in iframe)
        try {
          const draft = JSON.parse(localStorage.getItem('portfolio-preview-draft') || 'null');
          if (draft && window.self !== window.top) {
            settings = { ...settings, ...draft };
          }
        } catch {}
        applySettings(settings);
        if (typeof window.initHeroAnimation === 'function') {
          window.initHeroAnimation();
        }
      })
      .catch(() => {
        // API unreachable: keep the static markup honest — no empty stat blocks.
        document.querySelectorAll('.hero-stat').forEach(block => {
          const value = block.querySelector('.hero-stat-value');
          if (!value || value.textContent.trim() === '') block.hidden = true;
        });
        if (typeof window.initHeroAnimation === 'function') {
          window.initHeroAnimation();
        }
      });
  });

  // ============================================
  // HEADER SCROLL
  // ============================================
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // ============================================
  // MOBILE MENU
  // ============================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuBtn && mobileMenu) {
    const setMenuState = (open) => {
      mobileMenuBtn.classList.toggle('is-active', open);
      mobileMenu.classList.toggle('is-open', open);
      mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    mobileMenuBtn.setAttribute('type', 'button');
    mobileMenuBtn.setAttribute('aria-controls', 'mobileMenu');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-label', 'Open menu');

    mobileMenuBtn.addEventListener('click', () => {
      setMenuState(!mobileMenu.classList.contains('is-open'));
    });

    mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        setMenuState(false);
        mobileMenuBtn.focus();
      }
    });
  }

  // ============================================
  // PORTFOLIO FILTER
  // ============================================
  let allProjects = [];
  async function initPortfolio() {
    allProjects = await window.loadProjects();
    window.renderProjects();
  }
  initPortfolio();

  // ============================================
  // PROJECT MODAL
  // ============================================
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');

  if (modalClose) modalClose.addEventListener('click', window.closeProjectModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', window.closeProjectModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeProjectModal();
    }
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  const HEADER_HEIGHT = 72;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ============================================
  // BACK TO TOP
  // ============================================
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      const hero = document.getElementById('hero');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 400;
      if (heroBottom < 0) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // POINTER TYPE
  // ============================================
  function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  // ============================================
  // MAGNETIC BUTTONS
  // ============================================
  if (!isTouchDevice() && typeof gsap !== 'undefined') {
    const magneticSelector = [
      '[data-magnetic]',
      '.btn-primary',
      '.btn-ghost',
      '.btn-outline',
      '.social-link',
      '.filter-btn',
      '.header-link',
      '.back-to-top',
      '.modal-like-button',
      '.app-card',
      '.availability-badge'
    ].join(', ');

    document.querySelectorAll(magneticSelector).forEach(el => {
      const strength = 0.35;
      const bounds = 80;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;

        if (Math.abs(distX) > bounds || Math.abs(distY) > bounds) return;

        gsap.to(el, {
          x: distX * strength,
          y: distY * strength,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)'
        });
      });
    });
  }

  // ============================================
  // CONTACT FORM
  // ============================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusEl = document.getElementById('contactStatus');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.querySelector('[data-submit-label]') : null;
    const originalLabel = submitLabel ? submitLabel.textContent : '';

    function setStatus(message, state) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.dataset.state = state || 'info';
      statusEl.hidden = !message;
    }

    // "Or open this as an email" — for people who live in their inbox, and for
    // anyone whose network blocks the form.
    const mailtoLink = document.getElementById('briefMailto');
    if (mailtoLink) {
      const addressLink = document.querySelector('a[data-setting="email"]');
      const address = addressLink ? addressLink.textContent.trim() : '';
      if (address) {
        const body = [
          'Goal (what should this make people do):',
          'Audience:',
          'Deadline:',
          'Formats needed:',
          'What I already have (script / logo / footage):'
        ].join('\n');
        mailtoLink.setAttribute('href', 'mailto:' + address +
          '?subject=' + encodeURIComponent('Project brief') +
          '&body=' + encodeURIComponent(body));
      } else {
        mailtoLink.hidden = true;
      }
    }

    function emailFallback() {
      const mailLink = document.querySelector('a[data-setting="email"]');
      const address = mailLink ? mailLink.textContent.trim() : '';
      return address ? ' You can email me directly at ' + address + '.' : '';
    }

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      const nameField = document.getElementById('contactName');
      const emailField = document.getElementById('contactEmail');
      const messageField = document.getElementById('contactMessage');
      const typeField = document.getElementById('contactProjectType');
      const deadlineField = document.getElementById('contactDeadline');
      const formatField = document.getElementById('contactFormat');
      const replyField = document.getElementById('contactReplyPreference');
      const payload = {
        name: nameField ? nameField.value.trim() : '',
        email: emailField ? emailField.value.trim() : '',
        message: messageField ? messageField.value.trim() : '',
        projectType: typeField ? typeField.value : '',
        // The brief: what a quote actually needs. All three are optional so the
        // form never becomes a wall, but they turn a vague email into a job.
        deadline: deadlineField ? deadlineField.value.trim() : '',
        outputFormat: formatField ? formatField.value : '',
        replyPreference: replyField ? replyField.value : ''
      };

      if (!payload.name || !payload.email || !payload.message) {
        setStatus(STR.fillRequired, 'error');
        const firstEmpty = [!payload.name && nameField, !payload.email && emailField, !payload.message && messageField]
          .find(Boolean);
        if (firstEmpty) firstEmpty.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = STR.sending;
      setStatus(STR.sendingStatus, 'info');

      try {
        const response = await fetch('/api.php?_query=messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Send failed');

        contactForm.reset();
        if (submitLabel) submitLabel.textContent = STR.sent;
        setStatus(STR.sentStatus + emailFallback(), 'success');
        if (statusEl) statusEl.focus({ preventScroll: true });
        if (window.portfolioTracking) {
          window.portfolioTracking.track('contact_submit', { projectType: payload.projectType || 'none' });
        }
      } catch (error) {
        setStatus('That did not go through — please try again.' + emailFallback(), 'error');
        if (statusEl) statusEl.focus({ preventScroll: true });
      } finally {
        window.setTimeout(() => {
          if (submitBtn) submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = originalLabel || 'Send message';
        }, 4000);
      }
    });
  }

  // ============================================
  // COPY EMAIL — one click instead of retyping an address
  // ============================================
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const emailLink = document.querySelector('a[data-setting="email"]');
      const address = (emailLink ? emailLink.textContent : '').trim();
      if (!address) return;
      let copied = false;
      try {
        await navigator.clipboard.writeText(address);
        copied = true;
      } catch (error) {
        // Clipboard API blocked (http, iframe, permissions) — fall back to selection.
        try {
          const helper = document.createElement('textarea');
          helper.value = address;
          helper.setAttribute('readonly', '');
          helper.style.position = 'fixed';
          helper.style.opacity = '0';
          document.body.appendChild(helper);
          helper.select();
          copied = document.execCommand('copy');
          helper.remove();
        } catch (innerError) {
          copied = false;
        }
      }
      const feedback = document.getElementById('copyEmailFeedback');
      if (feedback) feedback.textContent = copied ? STR.copiedOk + address : STR.copiedFail + address;
      copyEmailBtn.dataset.state = copied ? 'copied' : 'failed';
      window.setTimeout(() => {
        if (feedback) feedback.textContent = '';
        copyEmailBtn.dataset.state = '';
      }, 4000);
    });
  }

  // ============================================
  // SHOWREEL — loaded only on an explicit click
  // ============================================
  const showreelBtn = document.getElementById('heroShowreelBtn');
  const showreelDialog = document.getElementById('showreelDialog');
  if (showreelBtn && showreelDialog) {
    const stage = showreelDialog.querySelector('.showreel-stage');
    const closeBtn = showreelDialog.querySelector('.showreel-close');
    let lastFocus = null;

    function embedUrl(raw) {
      try {
        const url = new URL(raw, window.location.origin);
        const host = url.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(url.pathname.split('/').filter(Boolean)[0] || '');
        if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
          const parts = url.pathname.split('/').filter(Boolean);
          const id = url.searchParams.get('v') || (parts[0] === 'embed' || parts[0] === 'shorts' ? parts[1] : '');
          return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
        }
        if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
          const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
          return id ? 'https://player.vimeo.com/video/' + id : '';
        }
        if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url.pathname)) return url.href;
      } catch (error) {}
      return '';
    }

    function mountShowreel() {
      const source = showreelBtn.dataset.videoUrl || '';
      const embed = embedUrl(source);
      if (!stage) return;
      stage.innerHTML = '';
      if (!embed) {
        const fallback = document.createElement('p');
        fallback.className = 'showreel-fallback';
        fallback.textContent = STR.showreelFallback;
        stage.appendChild(fallback);
        window.open(source, '_blank', 'noopener');
        return;
      }
      if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(embed)) {
        const video = document.createElement('video');
        video.src = embed;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-label', 'Showreel');
        stage.appendChild(video);
        return;
      }
      const consents = window.portfolioConsent;
      const allowed = !consents || consents.allowed('media');
      if (!allowed) {
        const gate = document.createElement('div');
        gate.className = 'showreel-gate';
        gate.innerHTML = '<p>This video is hosted on YouTube. Loading it sends your IP address to Google.</p>';
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'btn btn-primary';
        load.textContent = 'Load video from YouTube';
        load.addEventListener('click', () => {
          if (window.portfolioConsent && typeof window.portfolioConsent.allowMediaForSession === 'function') {
            window.portfolioConsent.allowMediaForSession();
          }
          mountShowreel();
        });
        gate.appendChild(load);
        stage.appendChild(gate);
        return;
      }
      const frame = document.createElement('iframe');
      frame.src = embed + (embed.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1&rel=0';
      frame.title = 'Showreel';
      frame.loading = 'lazy';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      stage.appendChild(frame);
    }

    function openShowreel() {
      lastFocus = document.activeElement;
      showreelDialog.hidden = false;
      document.body.style.overflow = 'hidden';
      mountShowreel();
      requestAnimationFrame(() => showreelDialog.classList.add('is-visible'));
      if (closeBtn) closeBtn.focus();
    }

    function closeShowreel() {
      showreelDialog.classList.remove('is-visible');
      if (stage) {
        const frame = stage.querySelector('iframe');
        if (frame) frame.remove();
        const video = stage.querySelector('video');
        if (video) video.pause();
      }
      showreelDialog.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    showreelBtn.addEventListener('click', openShowreel);
    if (closeBtn) closeBtn.addEventListener('click', closeShowreel);
    showreelDialog.addEventListener('click', (event) => {
      if (event.target === showreelDialog) closeShowreel();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !showreelDialog.hidden) closeShowreel();
    });
  }

})();
