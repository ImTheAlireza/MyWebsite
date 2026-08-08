/**
 * GSAP Animations
 * Editorial hero entrance, stagger effects, scroll reveals
 */

(function () {
  'use strict';

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Register GSAP plugins
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    // Fallback: make everything visible if GSAP fails
    document.querySelectorAll('.hero-name-first, .hero-name-last, .hero-top-bar, .hero-side-content').forEach(el => {
      el.style.opacity = '1';
    });
    document.querySelectorAll('.hero-accent-line').forEach(el => {
      el.style.transform = 'scaleY(1)';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ============================================
  // HERO — IMMEDIATE SETUP (runs on DOMContentLoaded)
  // Split text into chars and hide them instantly
  // so they're never visible before animation
  // ============================================
  function setupHeroChars() {
    document.querySelectorAll('.hero-name-line').forEach(line => {
      if (line.querySelector('.hero-name-char')) return;
      const text = line.textContent;
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

    heroTl
      // Animate first name chars
      .to('.hero-name-first .hero-name-char', {
        opacity: 1,
        y: '0%',
        duration: 0.8,
        stagger: 0.04,
        delay: 0.15
      })
      // Animate last name chars (overlapping)
      .to('.hero-name-last .hero-name-char', {
        opacity: 1,
        y: '0%',
        duration: 0.7,
        stagger: 0.03
      }, '-=0.5')
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
  // 3D SECTION REVEALS
  // ============================================
  function create3DSectionReveal(selector, options = {}) {
    const {
      rotateX = 8,
      rotateY = 0,
      translateY = 60,
      duration = 1.2,
      ease = 'power3.out',
      start = 'top 85%'
    } = options;

    const el = document.querySelector(selector);
    if (!el) return;

    el.style.perspective = '1200px';
    el.style.transformStyle = 'preserve-3d';

    gsap.fromTo(el,
      {
        rotateX: rotateX,
        rotateY: rotateY,
        y: translateY,
        opacity: 0
      },
      {
        scrollTrigger: {
          trigger: el,
          start: start,
          toggleActions: 'play none none none'
        },
        rotateX: 0,
        rotateY: 0,
        y: 0,
        opacity: 1,
        duration: duration,
        ease: ease,
        clearProps: 'transform,opacity'
      }
    );
  }

  // About section — 3D tilt from below
  create3DSectionReveal('.about', {
    rotateX: 10,
    rotateY: -3,
    translateY: 80,
    duration: 1.4,
    start: 'top 82%'
  });

  // ============================================
  // TIMELINE SECTION — coordinated reveal
  // ============================================
  const timelineSection = document.querySelector('.timeline-section');
  if (timelineSection) {
    // Section enters with standard 3D reveal
    create3DSectionReveal('.timeline-section', {
      rotateX: 8,
      rotateY: 0,
      translateY: 60,
      duration: 1.2,
      start: 'top 82%'
    });

    // Timeline track draw + items stagger on scroll
    ScrollTrigger.create({
      trigger: '.timeline-panels',
      start: 'top 80%',
      onEnter: () => {
        const panels = document.querySelector('.timeline-panels');
        panels.classList.add('is-drawn');

        // Draw the track line
        const track = document.querySelector('.timeline-track');
        if (track) {
          gsap.fromTo(track,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.8, ease: 'power2.out' }
          );
        }

        // Stagger timeline items in
        const activeItems = document.querySelectorAll('.timeline-panel.active .timeline-item');
        if (activeItems.length) {
          gsap.fromTo(activeItems,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.1,
              ease: 'power3.out',
              delay: 0.22
            }
          );
        }
      },
      once: true
    });

    // Update count display
    function updateTimelineCount() {
      const countEl = document.getElementById('timelineCount');
      const activePanel = document.querySelector('.timeline-panel.active');
      if (!countEl || !activePanel) return;
      const items = activePanel.querySelectorAll('.timeline-item');
      const count = items.length;
      const value = countEl.querySelector('span:last-child');
      const label = String(count).padStart(2, '0') + ' ' + (count === 1 ? 'entry' : 'entries');
      if (value) value.textContent = label;
      else countEl.textContent = label;
    }
    updateTimelineCount();

    // Expose for tab switch to call
    window.updateTimelineCount = updateTimelineCount;
  }

  // Services section
  create3DSectionReveal('.services', {
    rotateX: 10,
    rotateY: -2,
    translateY: 70,
    duration: 1.2,
    start: 'top 82%'
  });

  // Work section — 3D tilt from above
  create3DSectionReveal('.work', {
    rotateX: 8,
    rotateY: 2,
    translateY: 60,
    duration: 1.2,
    start: 'top 80%'
  });

  // Process section
  create3DSectionReveal('.process-section', {
    rotateX: 8,
    rotateY: 1,
    translateY: 60,
    duration: 1.2,
    start: 'top 80%'
  });

  // Testimonials section
  create3DSectionReveal('.testimonials-section', {
    rotateX: 10,
    rotateY: -1,
    translateY: 70,
    duration: 1.3,
    start: 'top 82%'
  });

  // Contact section — 3D tilt from below
  create3DSectionReveal('.contact', {
    rotateX: 10,
    rotateY: -2,
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
          { opacity: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', clearProps: 'transform' }
        );
      },
      once: true
    });
  });

  // Process steps stagger
  gsap.utils.toArray('.process-timeline').forEach(tl => {
    ScrollTrigger.create({
      trigger: tl,
      start: 'top 78%',
      onEnter: () => {
        gsap.fromTo(tl.querySelectorAll('.process-step'),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
        );
      },
      once: true
    });
  });

  // Testimonials stagger
  gsap.utils.toArray('.testimonials-grid').forEach(grid => {
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 78%',
      onEnter: () => {
        gsap.fromTo(grid.querySelectorAll('.testimonial-card'),
          { opacity: 0, y: 28, rotateY: -4 },
          { opacity: 1, y: 0, rotateY: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out', clearProps: 'transform' }
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
  // SECTION HEADERS — 3D rotation per header
  // ============================================
  gsap.utils.toArray('.section-header').forEach((header, i) => {
    gsap.fromTo(header.children,
      {
        rotateX: 15,
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
        rotateX: 0,
        rotateY: 0,
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
  gsap.fromTo('.about-image-frame',
    { rotateY: -12, x: -40, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.about-grid',
        start: 'top 78%'
      },
      rotateY: 0,
      x: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  gsap.fromTo('.about-content > *',
    { rotateX: 8, y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.about-content',
        start: 'top 78%'
      },
      rotateX: 0,
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  // ============================================
  // SKILLS CONSTELLATION — staggered entrance
  // ============================================
  const constellation = document.querySelector('.skills-constellation');
  if (constellation) {
    ScrollTrigger.create({
      trigger: constellation,
      start: 'top 80%',
      onEnter: () => {
        constellation.classList.add('is-visible');
        gsap.fromTo(constellation.querySelectorAll('.skill-node'),
          { opacity: 0, scale: 0.6 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: 'back.out(1.4)',
            clearProps: 'transform'
          }
        );
        gsap.fromTo(constellation.querySelectorAll('.constellation-line'),
          { opacity: 0 },
          {
            opacity: 0.5,
            duration: 0.8,
            stagger: 0.08,
            delay: 0.3,
            ease: 'power2.out'
          }
        );
      },
      once: true
    });
  }

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
    { rotateX: 10, y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.contact-form',
        start: 'top 80%'
      },
      rotateX: 0,
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  gsap.fromTo('.contact-info-item',
    { rotateX: 10, y: 30, opacity: 0 },
    {
      scrollTrigger: {
        trigger: '.contact-info',
        start: 'top 80%'
      },
      rotateX: 0,
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform'
    }
  );

  // ============================================
  // HERO MESH PARALLAX ON SCROLL
  // ============================================
  gsap.to('.hero-mesh', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: 100,
    opacity: 0.3
  });

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
  // ANIMATED STATS COUNTER — reads latest value at scroll time
  // ============================================
  function animateHeroStat(stat) {
    if (!stat) return;
    const raw = (stat.textContent || '').trim();
    if (!raw) return;
    const match = raw.match(/^(\d+)/);
    if (!match) {
      // Non-numeric like "Rasht" — just ensure visible, no counter
      return;
    }
    const targetNum = parseInt(match[1], 10);
    const suffix = raw.slice(match[1].length);
    // Reset to 0 for animation
    gsap.fromTo(stat,
      { textContent: 0 },
      {
        textContent: targetNum,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate: function() {
          const current = Math.round(gsap.getProperty(stat, 'textContent'));
          stat.textContent = current + suffix;
        },
        onComplete: function() {
          stat.textContent = targetNum + suffix;
        }
      }
    );
  }

  const heroStats = document.querySelectorAll('.hero-stat-value');
  if (heroStats.length) {
    heroStats.forEach(stat => {
      ScrollTrigger.create({
        trigger: stat,
        start: 'top 95%',
        onEnter: () => animateHeroStat(stat),
        once: true
      });
    });
    // Expose refresh so settings update can re-animate or update after API load
    window.refreshHeroStats = function() {
      document.querySelectorAll('.hero-stat-value').forEach(s => {
        // If already animated, just set final value from current DOM (which was just updated by applySettings)
        // Kill any existing tween on this element
        gsap.killTweensOf(s);
        const raw = (s.textContent || '').trim();
        const m = raw.match(/^(\d+)/);
        if (!m) return; // keep "Rasht" as is
        // Re-trigger animation with new value if in viewport, otherwise set directly
        const rect = s.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
          animateHeroStat(s);
        } else {
          // Will animate when scrolled into view, keep raw for now
        }
      });
    };
  }


})();
