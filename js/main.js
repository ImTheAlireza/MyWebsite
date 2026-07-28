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
          val.forEach(item => {
            const row = document.createElement('div');
            row.className = 'timeline-item';
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            const content = document.createElement('div');
            content.className = 'timeline-content';
            appendTextElement(content, 'span', 'timeline-date', item.date);
            appendTextElement(content, 'h3', 'timeline-title', item.title);
            appendTextElement(content, 'span', 'timeline-subtitle', item.subtitle);
            appendTextElement(content, 'p', 'timeline-desc', item.desc);
            row.append(marker, content);
            timeline.appendChild(row);
          });
          el.appendChild(timeline);
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
  let currentFilter = 'all';

  function animateCards() {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length || typeof gsap === 'undefined') return;
    gsap.fromTo(cards,
      { rotateX: 12, y: 50, opacity: 0 },
      { rotateX: 0, y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', clearProps: 'all' }
    );
  }

  async function initPortfolio() {
    allProjects = await window.loadProjects();
    window.renderFilters();
    window.renderProjects(allProjects);
    animateCards();

    function bindFilters() {
      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter;
          if (filter === currentFilter) return;
          currentFilter = filter;

          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filtered = window.filterProjects(filter, allProjects);
          window.renderProjects(filtered);
          animateCards();

          if (!isTouchDevice()) {
            document.querySelectorAll('.project-card').forEach(card => {
              card.addEventListener('mouseenter', () => {
                cursor.className = 'cursor is-play';
              });
              card.addEventListener('mouseleave', () => {
              cursor.className = 'cursor';
            });
          });
        }
      });
    });

    }

    bindFilters();
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

      // Update tab states
      activeTab.classList.remove('active');
      tab.classList.add('active');

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
            y: -15,
            duration: 0.2,
            stagger: 0.03,
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
          currentPanel.style.cssText = '';
          // Reset current items
          currentItems.forEach(item => {
            item.style.opacity = '';
            item.style.transform = '';
          });
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
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.08,
              ease: 'power3.out'
            },
            '-=0.2'
          );
        }
      } else {
        currentPanel.classList.remove('active');
        nextPanel.classList.add('active');
        if (typeof window.updateTimelineCount === 'function') {
          window.updateTimelineCount();
        }
      }
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
  const sections = ['hero', 'about', 'timeline', 'work', 'contact'];

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
      '.project-card-like',
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
  // 3D CARD TILT
  // ============================================
  if (!isTouchDevice() && typeof gsap !== 'undefined') {
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.project-card:not(.layout-list .project-card)').forEach(card => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const percentX = (e.clientX - centerX) / (rect.width / 2);
        const percentY = (e.clientY - centerY) / (rect.height / 2);

        const isHovering = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (isHovering) {
          const rotateY = percentX * 6;
          const rotateX = -percentY * 6;
          gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            transformPerspective: 800,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });
    });

    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
          overwrite: 'auto'
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
