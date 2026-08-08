/**
 * Main application logic
 * Theme toggle, custom cursor, portfolio filter, modal
 */

(function () {
  'use strict';

  // ============================================
  // PAGE LOADER
  // ============================================
  const pageLoader = document.getElementById('pageLoader');
  const loaderSeen = sessionStorage.getItem('portfolio-loader-seen');

  if (pageLoader && !loaderSeen && typeof gsap !== 'undefined') {
    // Animate loader immediately
    const loaderTl = gsap.timeline({
      onComplete: () => {
        pageLoader.classList.add('is-done');
        setTimeout(() => pageLoader.remove(), 700);
      }
    });

    loaderTl
      .fromTo('.loader-char',
        { y: 40, opacity: 0, rotateX: 90 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)' }
      )
      .to('.loader-line', { width: '120px', duration: 0.6, ease: 'power2.out' }, '-=0.2')
      .to('.loader-sub', { opacity: 1, duration: 0.4 }, '-=0.3')
      .to({}, { duration: 0.8 }); // pause before exit

    sessionStorage.setItem('portfolio-loader-seen', '1');
  } else if (pageLoader) {
    // Already seen — remove immediately
    pageLoader.remove();
  }

  // ============================================
  // THEME TOGGLE
  // ============================================
  const THEME_KEY = 'portfolio-theme';
  const THEME_TRANSITION_DURATION = 900;

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function getThemeBgColor(theme) {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    document.documentElement.setAttribute('data-theme', current);
    return color;
  }

  function toggleTheme(e) {
    if (document.querySelector('.theme-transition-overlay')) return;

    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next);
      return;
    }

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const cxPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const cyPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

    // Get current theme bg color for the mask overlay
    const oldBg = getThemeBgColor(current);

    // Swap theme immediately — new theme is now underneath
    setTheme(next);

    // Create mask overlay with old theme background color
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.backgroundColor = oldBg;
    document.body.appendChild(overlay);

    // Add icon rotation animation
    btn.classList.add('is-switching');
    setTimeout(() => btn.classList.remove('is-switching'), THEME_TRANSITION_DURATION);

    // Animate mask: transparent hole grows from button, revealing new theme
    const startTime = performance.now();

    function animate(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / THEME_TRANSITION_DURATION, 1);
      // ease-out quint for a smooth, decelerating expansion
      const eased = 1 - Math.pow(1 - progress, 5);
      const size = eased * 150;

      const mask = `radial-gradient(circle at ${cxPct}% ${cyPct}%, transparent ${size}%, black ${size + 0.1}%)`;
      overlay.style.webkitMaskImage = mask;
      overlay.style.maskImage = mask;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        overlay.remove();
      }
    }

    requestAnimationFrame(animate);
  }

  // Apply saved theme immediately
  setTheme(getPreferredTheme());

  const themeToggle = document.getElementById('themeToggle');
  const themeToggleMobile = document.getElementById('themeToggleMobile');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

  // ============================================
  // SETTINGS — populate all content from API
  // ============================================
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


  // ============================================
  // TESTIMONIALS SLIDER — auto scroll, fade, draggable
  // ============================================
  let testimonialsSlider = {
    offset: 0,
    half: 0,
    speed: 0.6,
    paused: false,
    dragging: false,
    startX: 0,
    startOffset: 0,
    raf: null,
    velocity: 0,
    lastX: 0,
    lastTime: 0
  };

  function initTestimonialsSlider() {
    const viewport = document.getElementById('testimonialsViewport');
    const track = document.getElementById('testimonialsGrid');
    if (!viewport || !track) return;
    if (!track.children.length) return;

    // Cleanup previous
    if (testimonialsSlider.raf) cancelAnimationFrame(testimonialsSlider.raf);
    // Remove old clones
    track.querySelectorAll('[data-clone]').forEach(el => el.remove());

    const originals = Array.from(track.children);
    if (!originals.length) return;

    // Duplicate to ensure enough width for infinite loop (at least 2.5x viewport)
    const viewportW = viewport.clientWidth || 800;
    // Ensure we have at least 4 cards minimum for smooth loop
    let needed = originals.length;
    if (originals.length < 4) {
      // duplicate originals until we have at least 6
      const times = Math.ceil(6 / originals.length);
      for (let t = 1; t < times; t++) {
        originals.forEach(card => {
          const c = card.cloneNode(true);
          c.setAttribute('data-clone', 'true');
          c.setAttribute('aria-hidden', 'true');
          track.appendChild(c);
        });
      }
    }

    // Now duplicate whole set once for seamless loop
    const allOriginalsNow = Array.from(track.children);
    allOriginalsNow.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    // Reset state
    testimonialsSlider.offset = 0;
    testimonialsSlider.paused = false;
    testimonialsSlider.dragging = false;
    track.style.transform = 'translate3d(0,0,0)';

    // Calculate half width after layout
    requestAnimationFrame(() => {
      testimonialsSlider.half = track.scrollWidth / 2;
      // Start tick
      function tick() {
        if (!testimonialsSlider.paused && !testimonialsSlider.dragging) {
          testimonialsSlider.offset -= testimonialsSlider.speed;
          if (testimonialsSlider.offset <= -testimonialsSlider.half) {
            testimonialsSlider.offset += testimonialsSlider.half;
          }
          track.style.transform = `translate3d(${testimonialsSlider.offset}px,0,0)`;
        }
        testimonialsSlider.raf = requestAnimationFrame(tick);
      }
      tick();
    });

    // Only bind events once
    if (!viewport.dataset.sliderBound) {
      viewport.dataset.sliderBound = '1';

      viewport.addEventListener('mouseenter', () => {
        testimonialsSlider.paused = true;
      });
      viewport.addEventListener('mouseleave', () => {
        if (!testimonialsSlider.dragging) testimonialsSlider.paused = false;
      });

      const onDown = (e) => {
        testimonialsSlider.dragging = true;
        testimonialsSlider.paused = true;
        viewport.classList.add('is-dragging');
        testimonialsSlider.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        testimonialsSlider.startOffset = testimonialsSlider.offset;
        testimonialsSlider.lastX = testimonialsSlider.startX;
        testimonialsSlider.lastTime = Date.now();
        testimonialsSlider.velocity = 0;
      };

      const onMove = (e) => {
        if (!testimonialsSlider.dragging) return;
        const x = e.type.includes('touch') ? (e.touches[0] ? e.touches[0].clientX : testimonialsSlider.lastX) : e.clientX;
        const dx = x - testimonialsSlider.startX;
        let newOffset = testimonialsSlider.startOffset + dx;

        // Infinite wrap while dragging
        if (newOffset > 0) {
          newOffset -= testimonialsSlider.half;
          testimonialsSlider.startOffset -= testimonialsSlider.half;
        } else if (newOffset <= -testimonialsSlider.half) {
          newOffset += testimonialsSlider.half;
          testimonialsSlider.startOffset += testimonialsSlider.half;
        }

        testimonialsSlider.offset = newOffset;
        track.style.transform = `translate3d(${newOffset}px,0,0)`;

        const now = Date.now();
        const dt = now - testimonialsSlider.lastTime;
        if (dt > 0) {
          testimonialsSlider.velocity = (x - testimonialsSlider.lastX) / dt;
          testimonialsSlider.lastX = x;
          testimonialsSlider.lastTime = now;
        }
        if (e.type === 'touchmove') e.preventDefault();
      };

      const onUp = () => {
        if (!testimonialsSlider.dragging) return;
        testimonialsSlider.dragging = false;
        viewport.classList.remove('is-dragging');
        const momentum = testimonialsSlider.velocity * 180;
        if (Math.abs(momentum) > 8) {
          testimonialsSlider.offset += momentum;
          if (testimonialsSlider.offset > 0) testimonialsSlider.offset -= testimonialsSlider.half;
          if (testimonialsSlider.offset <= -testimonialsSlider.half) testimonialsSlider.offset += testimonialsSlider.half;
          track.style.transform = `translate3d(${testimonialsSlider.offset}px,0,0)`;
        }
        setTimeout(() => { testimonialsSlider.paused = false; }, 500);
      };

      viewport.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      viewport.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);

      window.addEventListener('resize', () => {
        testimonialsSlider.half = track.scrollWidth / 2;
      });
    }
  }

  window.initTestimonialsSlider = initTestimonialsSlider;

  function appendTextElement(parent, tagName, className, text) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    el.textContent = text || '';
    parent.appendChild(el);
    return el;
  }

  function applySettings(settings) {
    // Populate all data-setting elements
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.getAttribute('data-setting');
      const val = settings[key];
      if (val == null || val === '') return;

      if (key === 'heroCtaLink') {
        el.href = safeHref(val, ['http:', 'https:']) || '#work';
      } else if (key === 'linkedin' || key === 'behance' || key === 'instagram') {
        el.href = safeHref(val, ['http:', 'https:']) || '#';
      } else if (key === 'phone') {
        el.href = 'tel:' + val.replace(/\s/g, '');
        el.textContent = val;
      } else if (key === 'email') {
        el.href = safeHref('mailto:' + val) || '#';
        el.textContent = val;
      } else if (key === 'aboutResumeUrl') {
        el.href = safeHref(val, ['http:', 'https:']) || '#';
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
            appendTextElement(meta, 'span', 'timeline-entry-kind', key === 'experience' ? 'Professional' : 'Academic');
            appendTextElement(meta, 'span', 'timeline-entry-number', String(index + 1).padStart(2, '0'));
            content.appendChild(meta);
            appendTextElement(content, 'h3', 'timeline-title', item.title || 'Untitled entry');
            if (item.subtitle) appendTextElement(content, 'span', 'timeline-subtitle', item.subtitle);
            if (item.desc) appendTextElement(content, 'p', 'timeline-desc', item.desc);
            row.append(dateWrap, marker, content);
            timeline.appendChild(row);
          });
          el.appendChild(timeline);
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
            title.textContent = item.title || 'Untitled service';
            const desc = document.createElement('p');
            desc.className = 'service-desc';
            desc.textContent = item.desc || '';
            const meta = document.createElement('div');
            meta.className = 'service-meta';
            meta.innerHTML = '<span></span>' + String(index + 1).padStart(2, '0') + ' • Service';
            card.append(icon, title, desc, meta);
            el.appendChild(card);
          });
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
            title.textContent = item.title || 'Step';
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
      } else if (key === 'testimonials') {
        if (Array.isArray(val)) {
          el.innerHTML = '';
          val.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            const mark = document.createElement('div');
            mark.className = 'testimonial-quote-mark';
            mark.textContent = '“';
            const quote = document.createElement('p');
            quote.className = 'testimonial-quote';
            quote.textContent = item.quote || '';
            const author = document.createElement('div');
            author.className = 'testimonial-author';
            const avatar = document.createElement('div');
            avatar.className = 'testimonial-avatar';
            const initials = (item.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
            avatar.textContent = initials;
            const info = document.createElement('div');
            info.className = 'testimonial-author-info';
            const name = document.createElement('div');
            name.className = 'testimonial-author-name';
            name.textContent = item.name || 'Anonymous';
            const role = document.createElement('div');
            role.className = 'testimonial-author-role';
            role.textContent = item.role || '';
            info.append(name, role);
            author.append(avatar, info);
            card.append(mark, quote, author);
            el.appendChild(card);
          });
          // Init slider after rendering testimonials
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (typeof window.initTestimonialsSlider === 'function') window.initTestimonialsSlider();
            }, 100);
          });
        }
      } else {
        el.textContent = val;
      }
    });

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

    // After settings applied, refresh hero stats animation to use latest values
    if (typeof window.refreshHeroStats === 'function') {
      // Small delay to ensure DOM updated and ScrollTrigger ready
      setTimeout(() => window.refreshHeroStats(), 100);
    }
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
        if (typeof window.initHeroAnimation === 'function') {
          window.initHeroAnimation();
        }
      });
  });

  // ============================================
  // CUSTOM CURSOR
  // ============================================
  const cursor = document.getElementById('cursor');
  let cursorX = 0, cursorY = 0;
  let currentX = 0, currentY = 0;

  function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  if (cursor && !isTouchDevice()) {
    document.documentElement.classList.add('has-custom-cursor');
    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    });

    function animateCursor() {
      const dx = cursorX - currentX;
      const dy = cursorY - currentY;
      currentX += dx * 0.15;
      currentY += dy * 0.15;
      cursor.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Cursor states
    document.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const type = el.getAttribute('data-cursor');
        cursor.className = 'cursor is-' + type;
      });
      el.addEventListener('mouseleave', () => {
        cursor.className = 'cursor';
      });
    });
  }

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
  // HERO — mesh gradient mouse interaction
  // ============================================
  const hero = document.getElementById('hero');
  const heroMesh = document.querySelector('.hero-mesh');

  if (hero && heroMesh && !isTouchDevice()) {
    let mouseX = 0.5, mouseY = 0.5;
    let currentMX = 0.5, currentMY = 0.5;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    });

    hero.addEventListener('mouseleave', () => {
      mouseX = 0.5;
      mouseY = 0.5;
    });

    function animateHeroMesh() {
      currentMX += (mouseX - currentMX) * 0.04;
      currentMY += (mouseY - currentMY) * 0.04;

      const posX = currentMX * 100;
      const posY = currentMY * 100;

      heroMesh.style.background = `
        radial-gradient(ellipse 50% 70% at ${posX}% ${posY}%, rgba(255, 92, 53, 0.07), transparent),
        radial-gradient(ellipse 40% 60% at ${100 - posX}% ${100 - posY}%, rgba(255, 92, 53, 0.04), transparent),
        radial-gradient(ellipse 80% 40% at 50% 90%, rgba(255, 92, 53, 0.03), transparent)
      `;

      requestAnimationFrame(animateHeroMesh);
    }
    animateHeroMesh();
  }

  // ============================================
  // MOBILE MENU
  // ============================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('is-active');
      mobileMenu.classList.toggle('is-open');
      document.body.style.overflow = mobileMenu.classList.contains('is-open') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('is-active');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
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
  // TIMELINE TABS
  // ============================================
  window.updateTimelineCount = function updateTimelineCount() {
    const countEl = document.getElementById('timelineCount');
    const activePanel = document.querySelector('.timeline-panel.active');
    if (!countEl || !activePanel) return;
    const count = activePanel.querySelectorAll('.timeline-item').length;
    const value = countEl.querySelector('span:last-child');
    const label = String(count).padStart(2, '0') + ' ' + (count === 1 ? 'entry' : 'entries');
    if (value) value.textContent = label;
    else countEl.textContent = label;
  };
  window.updateTimelineCount();

  const tabOrder = ['experience', 'education'];
  let isTransitioning = false;

  document.querySelectorAll('.timeline-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (isTransitioning) return;
      const target = tab.dataset.tab;
      const activeTab = document.querySelector('.timeline-tab.active');
      if (activeTab === tab) return;

      const currentPanel = document.querySelector('.timeline-panel.active');
      const nextPanel = document.querySelector(`.timeline-panel[data-panel="${target}"]`);
      if (!currentPanel || !nextPanel) return;

      isTransitioning = true;

      // Determine direction
      const fromIndex = tabOrder.indexOf(activeTab.dataset.tab);
      const toIndex = tabOrder.indexOf(target);
      const goingRight = toIndex > fromIndex;

      // Update visual and accessible tab states.
      activeTab.classList.remove('active');
      activeTab.setAttribute('aria-selected', 'false');
      activeTab.tabIndex = -1;
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;

      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            isTransitioning = false;
            if (typeof window.updateTimelineCount === 'function') {
              window.updateTimelineCount();
            }
          }
        });

        // 1. Fade out current items
        const currentItems = currentPanel.querySelectorAll('.timeline-item');
        if (currentItems.length) {
          tl.to(currentItems, {
            opacity: 0,
            x: goingRight ? -22 : 22,
            duration: 0.22,
            stagger: 0.025,
            ease: 'power2.in'
          });
        }

        // 2. Fade out the track
        tl.to('.timeline-track', {
          scaleY: 0,
          duration: 0.25,
          ease: 'power2.in'
        }, '-=0.1');

        // 3. Switch panels
        tl.call(() => {
          currentPanel.classList.remove('active');
          currentPanel.hidden = true;
          currentPanel.style.cssText = '';
          // Reset current items
          currentItems.forEach(item => {
            item.style.opacity = '';
            item.style.transform = '';
          });
          nextPanel.hidden = false;
          nextPanel.classList.add('active');
        });

        // 4. Draw the track
        tl.fromTo('.timeline-track',
          { scaleY: 0 },
          { scaleY: 1, duration: 0.5, ease: 'power2.out' }
        );

        // 5. Stagger in new items
        const nextItems = nextPanel.querySelectorAll('.timeline-item');
        if (nextItems.length) {
          tl.fromTo(nextItems,
            { opacity: 0, x: goingRight ? 24 : -24 },
            {
              opacity: 1,
              x: 0,
              duration: 0.42,
              stagger: 0.08,
              ease: 'power3.out'
            },
            '-=0.2'
          );
        }
      } else {
        currentPanel.classList.remove('active');
        currentPanel.hidden = true;
        nextPanel.hidden = false;
        nextPanel.classList.add('active');
        if (typeof window.updateTimelineCount === 'function') {
          window.updateTimelineCount();
        }
      }
    });
  });

  const timelineTabs = Array.from(document.querySelectorAll('.timeline-tab'));
  timelineTabs.forEach((tab, index) => {
    tab.addEventListener('keydown', event => {
      let targetIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % timelineTabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = (index - 1 + timelineTabs.length) % timelineTabs.length;
      else if (event.key === 'Home') targetIndex = 0;
      else if (event.key === 'End') targetIndex = timelineTabs.length - 1;
      else return;
      event.preventDefault();
      timelineTabs[targetIndex].focus();
      timelineTabs[targetIndex].click();
    });
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
  // SCROLL PROGRESS
  // ============================================
  const scrollProgressFill = document.querySelector('.scroll-progress-fill');
  const scrollDots = document.querySelectorAll('.scroll-dot');
  const sections = ['hero', 'about', 'services', 'timeline', 'work', 'process', 'testimonials', 'contact'];

  if (scrollProgressFill && scrollDots.length) {
    window.addEventListener('scroll', () => {
      // Update fill bar
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      scrollProgressFill.style.setProperty('--progress', progress * 100 + '%');
      const fillAfter = scrollProgressFill.querySelector(':after') || scrollProgressFill;

      // Update active dot
      let currentSection = 'hero';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) {
          currentSection = id;
        }
      });

      scrollDots.forEach(dot => {
        dot.classList.toggle('active', dot.dataset.section === currentSection);
      });
    }, { passive: true });

    // Click dots to scroll
    scrollDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(dot.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================
  // NOISE TOGGLE
  // ============================================
  const noiseToggle = document.getElementById('noiseToggle');
  const noiseSvg = document.getElementById('noiseSvg');
  const NOISE_KEY = 'portfolio-noise';

  if (noiseToggle && noiseSvg) {
    // Restore state
    if (localStorage.getItem(NOISE_KEY) === 'on') {
      noiseToggle.classList.add('is-active');
      noiseSvg.classList.add('is-active');
    }

    noiseToggle.addEventListener('click', () => {
      const isActive = noiseToggle.classList.toggle('is-active');
      noiseSvg.classList.toggle('is-active', isActive);
      localStorage.setItem(NOISE_KEY, isActive ? 'on' : 'off');
    });
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
      '.timeline-tab',
      '.header-link',
      '.theme-toggle',
      '.back-to-top',
      '.modal-like-button',
      '.app-card',
      '.skill-node',
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
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<span>Sending...</span>';
      btn.disabled = true;

      const payload = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        message: document.getElementById('contactMessage').value.trim()
      };

      try {
        const res = await fetch('/api.php?_query=messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to send');
        btn.innerHTML = '<span>Message Sent!</span>';
        btn.style.background = '#22c55e';
        contactForm.reset();
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      } catch {
        btn.innerHTML = '<span>Failed to send</span>';
        btn.style.background = '#ef4444';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }
    });
  }

})();
