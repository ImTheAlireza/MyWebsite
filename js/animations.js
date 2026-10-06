/**
 * GSAP Animations
 * Editorial hero entrance, stagger effects, scroll reveals
 */

(function () {
  'use strict';

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Everything below is progressive enhancement only: if the animation library
  // is missing (offline CDN, blocked host, old browser) the page must still be
  // fully readable and clickable.
  function revealWithoutMotion() {
    document.documentElement.classList.add('no-motion');
    document.querySelectorAll('.hero-name-first, .hero-name-last, .hero-top-bar, .hero-side-content, .hero-scroll').forEach(el => {
      el.style.opacity = '1';
    });
    document.querySelectorAll('.hero-accent-line').forEach(el => {
      el.style.transform = 'scaleY(1)';
    });
    document.querySelectorAll('.hero-name-char, .hero-name-whole').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }

  // Register GSAP plugins
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded — showing static layout');
    revealWithoutMotion();
    window.initHeroAnimation = function () {};
    window.setHeroStatValue = function (el, value) {
      if (!el) return;
      el.dataset.statValue = value == null ? '' : String(value);
      el.textContent = el.dataset.statValue;
    };
    window.refreshHeroStats = function () {};
    return;
  }

  // Safety net: whatever happens with tweens, no hero element may stay invisible.
  window.setTimeout(() => {
    document.querySelectorAll('.hero-name-char, .hero-name-whole').forEach(el => {
      if (getComputedStyle(el).opacity === '0') el.style.opacity = '1';
    });
    ['.hero-top-bar', '.hero-side-content', '.hero-scroll'].forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (getComputedStyle(el).opacity === '0') el.style.opacity = '1';
      });
    });
  }, 4000);

  gsap.registerPlugin(ScrollTrigger);

  // ============================================
  // HERO — IMMEDIATE SETUP (runs on DOMContentLoaded)
  // Split text into chars and hide them instantly
  // so they're never visible before animation
  // ============================================
  // Arabic/Persian script must never be split per character: the letters join,
  // and isolated spans would turn the name into unreadable pieces. Those names
  // animate as whole lines instead.
  const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

  function setupHeroChars() {
    document.querySelectorAll('.hero-name-line').forEach(line => {
      if (line.querySelector('.hero-name-char')) return;
      const text = line.textContent;
      if (ARABIC_SCRIPT.test(text) || document.documentElement.getAttribute('dir') === 'rtl') {
        if (line.classList.contains('hero-name-whole')) return;
        line.classList.add('hero-name-whole');
        line.setAttribute('aria-label', text);
        line.style.opacity = '0';
        line.style.transform = 'translateY(40px)';
        return;
      }
      line.textContent = '';
      line.setAttribute('aria-label', text);
      for (const char of text) {
        const span = document.createElement('span');
        span.className = 'hero-name-char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(110%)';
        line.appendChild(span);
      }
    });
  }

  // Run setup immediately — before any async delays
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeroChars);
  } else {
    setupHeroChars();
  }

  // ============================================
  // HERO ENTRANCE — called after settings load
  // ============================================
  window.initHeroAnimation = function () {
    // If reduced motion, just make everything visible
    if (prefersReducedMotion) {
      document.querySelectorAll('.hero-name-char').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      document.querySelector('.hero-top-bar').style.opacity = '1';
      document.querySelector('.hero-side-content').style.opacity = '1';
      document.querySelector('.hero-accent-line').style.transform = 'scaleY(1)';
      document.querySelector('.hero-scroll').style.opacity = '1';
      return;
    }

    // Ensure chars are set up (in case setupHeroChars was delayed)
    setupHeroChars();

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (document.querySelector('.hero-name-whole')) {
      // Persian name: rise as whole lines, same easing and feel as the char run.
      heroTl.fromTo('.hero-name-whole',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.15, clearProps: 'transform' }
      );
    } else {
      heroTl
        .to('.hero-name-first .hero-name-char', {
          opacity: 1,
          y: '0%',
          duration: 0.8,
          stagger: 0.04,
          delay: 0.15
        })
        .to('.hero-name-last .hero-name-char', {
          opacity: 1,
          y: '0%',
          duration: 0.7,
          stagger: 0.03
        }, '-=0.5');
    }

    heroTl
      // Top bar (availability + role)
      .to('.hero-top-bar', {
        opacity: 1,
        duration: 0.5
      }, '-=0.4')
      // Accent line draws in
      .to('.hero-accent-line', {
        scaleY: 1,
        duration: 0.7,
        ease: 'power2.out'
      }, '-=0.3')
      // Side content (subtitle, buttons, stats)
      .to('.hero-side-content', {
        opacity: 1,
        duration: 0.5
      }, '-=0.4')
      // Scroll indicator
      .fromTo('.hero-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        '-=0.2'
      );
  };

  // ============================================
  // SECTION REVEALS — one plain fade + rise, no 3D
  // ============================================
  function createSectionReveal(selector, options = {}) {
    const { translateY = 28, duration = 0.7, ease = 'power2.out', start = 'top 85%' } = options;
    const el = document.querySelector(selector);
    if (!el) return;
    gsap.fromTo(el,
      { y: translateY, opacity: 0 },
      {
        scrollTrigger: { trigger: el, start: start, toggleActions: 'play none none none' },
        y: 0,
        opacity: 1,
        duration: duration,
        ease: ease,
        clearProps: 'transform,opacity'
      }
    );
  }

  // About section
  createSectionReveal('.about', {
    translateY: 80,
    duration: 1.4,
    start: 'top 82%'
  });

  // ============================================
  // TIMELINE SECTION
  // ============================================
  createSectionReveal('.timeline-section', { translateY: 28, start: 'top 84%' });

  gsap.utils.toArray('.timeline-panel').forEach(panel => {
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 85%',
      onEnter: () => {
        gsap.fromTo(panel.querySelectorAll('.timeline-item'),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'transform' }
        );
      },
      once: true
    });
  });

  // Work section
  createSectionReveal('.work', {
    translateY: 60,
    duration: 1.2,
    start: 'top 80%'
  });

  // Process section


  // Testimonials section


  // Contact section
  createSectionReveal('.contact', {
    translateY: 70,
    duration: 1.3,
    start: 'top 82%'
  });

  // Services cards stagger
  gsap.utils.toArray('.services-grid').forEach(grid => {
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 78%',
      onEnter: () => {
        gsap.fromTo(grid.querySelectorAll('.service-card'),
          { opacity: 0, y: 30, rotateX: 6 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', clearProps: 'transform' }
        );
      },
      once: true
    });
  });

  // Brand CTA card reveal
  ScrollTrigger.create({
    trigger: '.work-grid',
    start: 'top 75%',
    onEnter: () => {
      const cta = document.querySelector('.brand-card-cta');
      if (cta) {
        gsap.fromTo(cta,
          { opacity: 0, scale: 0.92, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.2)', clearProps: 'transform' }
        );
      }
    },
    once: true
  });

  // ============================================
  // SECTION HEADERS — plain stagger
  // ============================================
  gsap.utils.toArray('.section-header').forEach((header, i) => {
    gsap.fromTo(header.children,
      {
        rotateY: i % 2 === 0 ? -5 : 5,
        y: 30,
        opacity: 0
      },
      {
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'transform'
      }
    );
  });

  // ============================================
  // ABOUT SECTION — inner elements
  // ============================================
  const RTL = document.documentElement.getAttribute('dir') === 'rtl';
  gsap.fromTo('.about-image-frame',
    { x: RTL ? 40 : -40, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.about-grid',
        start: 'top 78%'
      },
      x: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  gsap.fromTo('.about-content > *',
    { y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.about-content',
        start: 'top 78%'
      },
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  // ============================================
  // WORK FILTERS
  // ============================================
  gsap.fromTo('.work-filters',
    { y: 20, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.work-filters',
        start: 'top 85%'
      },
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out'
    }
  );

  // ============================================
  // CONTACT SECTION — inner elements
  // ============================================
  gsap.fromTo('.contact-form .form-group',
    { y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.contact-form',
        start: 'top 80%'
      },
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  gsap.fromTo('.contact-info-item',
    { y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.contact-info',
        start: 'top 80%'
      },
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  // ============================================
  // HERO FADE TO BLACK ON SCROLL
  // ============================================
  const fadeOverlay = document.getElementById('heroFadeOverlay');
  if (fadeOverlay) {
    gsap.to(fadeOverlay, {
      scrollTrigger: {
        trigger: '.hero',
        start: '60% top',
        end: 'bottom top',
        scrub: 0.5
      },
      opacity: 1,
      ease: 'none'
    });
  }

  // ============================================
  // HERO NAME PARALLAX ON SCROLL
  // ============================================
  gsap.to('.hero-name-block', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: -60,
    ease: 'none'
  });

  // ============================================
  // HERO STATS
  // The value typed in the CMS is the single source of truth. It is stored on
  // the element as data-stat-value and is never read back out of the DOM, so an
  // in-flight animation can no longer overwrite it or be mistaken for a real
  // value (that was the bug: the counter re-read its own half-finished digits
  // and ended on a number the CMS never contained).
  // ============================================
  const PERSIAN_DIGITS = ['\u06F0', '\u06F1', '\u06F2', '\u06F3', '\u06F4', '\u06F5', '\u06F6', '\u06F7', '\u06F8', '\u06F9'];
  const ARABIC_DIGITS = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];

  function normalizeDigits(value) {
    return String(value).replace(/[\u06F0-\u06F9\u0660-\u0669]/g, ch => {
      const persianIndex = PERSIAN_DIGITS.indexOf(ch);
      if (persianIndex > -1) return String(persianIndex);
      return String(ARABIC_DIGITS.indexOf(ch));
    });
  }

  function localizeDigits(value, persian) {
    const text = String(value);
    if (!persian) return text;
    return text.replace(/[0-9]/g, digit => PERSIAN_DIGITS[Number(digit)]);
  }

  function formatStatNumber(number, parsed) {
    const fixed = parsed.decimals > 0
      ? number.toFixed(parsed.decimals)
      : String(Math.round(number));
    if (!parsed.groupSeparator) return fixed;
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, parsed.groupSeparator);
    return parts.join(parsed.decimalSeparator || '.');
  }

  // "1,200+", "۲۵ پروژه", "5 yrs", "Rasht" — any format is accepted.
  function parseStatValue(raw) {
    const original = String(raw == null ? '' : raw).trim();
    if (!original) return null;
    const normalized = normalizeDigits(original);
    const match = normalized.match(/\d+(?:[,\u066B]\d{3})*(?:[.\u066C]\d+)?/);
    if (!match) return { raw: original, number: null, format: () => original };
    const token = match[0];
    const prefix = normalized.slice(0, match.index);
    const suffix = normalized.slice(match.index + token.length);
    const persian = /[\u06F0-\u06F9]/.test(original);
    const groupSeparator = /\u066B/.test(token) ? '\u066B' : (token.indexOf(',') > -1 ? ',' : '');
    const decimals = /[.\u066C]/.test(token) ? (token.split(/[.\u066C]/)[1] || '').replace(/\D/g, '').length : 0;
    const number = parseFloat(token.replace(/[,\u066B]/g, '').replace(/\u066C/g, '.'));
    const parsed = {
      raw: original,
      number: isFinite(number) ? number : null,
      decimals: decimals,
      groupSeparator: groupSeparator,
      decimalSeparator: decimals > 0 ? '.' : '',
      prefix: prefix,
      suffix: suffix
    };
    parsed.format = value => {
      if (parsed.number === null) return original;
      const body = formatStatNumber(value, parsed);
      return localizeDigits(parsed.prefix + body + parsed.suffix, persian);
    };
    return parsed;
  }

  function prefersReducedMotionNow() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function animateHeroStat(stat) {
    if (!stat) return;
    const parsed = parseStatValue(stat.dataset.statValue || '');
    if (!parsed) return;

    if (stat._statTween) {
      stat._statTween.kill();
      stat._statTween = null;
    }

    // Nothing to count (text value, zero, reduced motion): show the exact string.
    if (parsed.number === null || parsed.number <= 0 || prefersReducedMotionNow()) {
      stat.textContent = parsed.raw;
      return;
    }

    const proxy = { value: 0 };
    stat.textContent = parsed.format(0);
    stat._statTween = gsap.to(proxy, {
      value: parsed.number,
      duration: Math.min(2, 0.7 + Math.log10(Math.max(10, parsed.number)) * 0.45),
      ease: 'power2.out',
      onUpdate: () => {
        stat.textContent = parsed.format(proxy.value);
      },
      onComplete: () => {
        stat._statTween = null;
        stat.textContent = parsed.raw; // always exactly what the CMS contains
      }
    });
  }

  const heroStats = document.querySelectorAll('.hero-stat-value');

  // Called by js/main.js every time settings are loaded or re-applied.
  window.setHeroStatValue = function (el, value) {
    if (!el) return;
    el.dataset.statValue = value == null ? '' : String(value);
    const parsed = parseStatValue(el.dataset.statValue);
    if (!parsed) {
      el.textContent = '';
      return;
    }
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView && !prefersReducedMotionNow()) animateHeroStat(el);
    else stat_setStatic(el, parsed);
  };

  function stat_setStatic(el, parsed) {
    if (el._statTween) {
      el._statTween.kill();
      el._statTween = null;
    }
    el.textContent = parsed.raw;
  }

  if (heroStats.length) {
    heroStats.forEach(stat => {
      ScrollTrigger.create({
        trigger: stat,
        start: 'top 95%',
        onEnter: () => {
          // Animate only once the CMS value has arrived — until then the
          // neutral placeholder is left alone.
          if (stat.dataset.statValue) animateHeroStat(stat);
        },
        once: true
      });
    });

    window.refreshHeroStats = function () {
      heroStats.forEach(stat => {
        const value = stat.dataset.statValue;
        if (!value) return;
        const parsed = parseStatValue(value);
        if (!parsed) return;
        const rect = stat.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) animateHeroStat(stat);
        else stat_setStatic(stat, parsed);
      });
    };
  }

  // Exposed for tests / other pages that need the same parsing rules.
  window.portfolioStats = { parse: parseStatValue };

})();
