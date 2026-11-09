/**
 * js/site.js — shared page behaviour
 *
 * Header, theme, drawer, reveal-on-scroll, hero reel, contact form, copy email,
 * showreel dialog, edit mode for the admin live preview. Content rendering lives
 * in js/work.js so this file stays about interaction.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var PAGE_LANG = (html.getAttribute('lang') || 'en').toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';
  var isEditFrame = false;
  try {
    var params = new URLSearchParams(window.location.search);
    isEditFrame = window.self !== window.top && params.has('edit');
  } catch (error) { isEditFrame = false; }

  function T(key) {
    return window.SiteI18n ? window.SiteI18n.t(key) : key;
  }

  var settingsCache = {};
  function hasValue(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return String(value).trim() !== '';
  }
  // Persian mirror wins on the Persian page; an empty mirror falls back to the
  // English value so a half-translated CMS never blanks the page.
  function pick(key) {
    var value = settingsCache[key];
    if (PAGE_LANG === 'fa') {
      var mirror = settingsCache[key + 'Fa'];
      if (hasValue(mirror)) return mirror;
    }
    return value;
  }

  function safeHref(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.charAt(0) === '#' || raw.charAt(0) === '/' || /^[\w.-]+\//.test(raw)) return raw;
    try {
      var url = new URL(raw, window.location.origin);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) { return ''; }
  }

  var VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:[?#].*)?$/i;
  function isVideoFile(value) { return VIDEO_RE.test(String(value || '')); }

  function externalEmbed(value) {
    var url = safeHref(value);
    if (!url) return '';
    try {
      var parsed = new URL(url, window.location.origin);
      var host = parsed.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        var short = parsed.pathname.split('/').filter(Boolean)[0];
        return short ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(short) : '';
      }
      if (host === 'youtube.com' || host.indexOf('.youtube.com') > -1) {
        var parts = parsed.pathname.split('/').filter(Boolean);
        var id = parsed.searchParams.get('v') || (parts[0] === 'embed' || parts[0] === 'shorts' ? parts[1] : '');
        return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
      }
      if (host === 'vimeo.com' || host.indexOf('.vimeo.com') > -1) {
        var vimeo = parsed.pathname.split('/').filter(Boolean).filter(function (part) { return /^\d+$/.test(part); })[0];
        return vimeo ? 'https://player.vimeo.com/video/' + vimeo : '';
      }
    } catch (error) {}
    return '';
  }

  function mediaAllowed() {
    var manager = window.portfolioConsent;
    return !manager || typeof manager.allowed !== 'function' || manager.allowed('media');
  }

  /**
   * Build a media element inside a consent-aware frame.
   * External players show a one-click gate until media is allowed.
   */
  function buildMedia(url, options) {
    var opts = options || {};
    var src = safeHref(url);
    if (!src) {
      var missing = document.createElement('div');
      missing.className = 'embed-gate';
      missing.textContent = opts.emptyText || T('caseNoMedia');
      return missing;
    }
    if (isVideoFile(src)) {
      var video = document.createElement('video');
      video.src = src;
      if (opts.poster) video.poster = safeHref(opts.poster);
      video.playsInline = true;
      video.preload = 'metadata';
      video.controls = opts.controls !== false;
      video.muted = opts.muted === true;
      if (opts.loop) video.loop = true;
      if (opts.autoplay) {
        video.autoplay = true;
        var started = video.play();
        if (started && started.catch) started.catch(function () {});
      }
      video.setAttribute('aria-label', opts.label || T('lightboxTitle'));
      return video;
    }
    var embed = externalEmbed(src);
    if (embed) {
      if (mediaAllowed() || opts.force) return iframe(embed, opts.label);
      var gate = document.createElement('div');
      gate.className = 'embed-gate';
      var note = document.createElement('p');
      note.textContent = T('embedGate');
      var load = document.createElement('button');
      load.type = 'button';
      load.className = 'btn btn-primary btn-sm';
      load.textContent = T('loadVideo');
      load.addEventListener('click', function () {
        if (window.portfolioConsent && typeof window.portfolioConsent.allowMediaForSession === 'function') {
          window.portfolioConsent.allowMediaForSession();
        }
        gate.replaceWith(iframe(embed, opts.label));
      });
      gate.append(note, load);
      return gate;
    }
    var image = document.createElement('img');
    image.src = src;
    image.alt = opts.alt || opts.label || '';
    image.loading = opts.eager ? 'eager' : 'lazy';
    image.decoding = 'async';
    return image;
  }

  function iframe(src, label) {
    var frame = document.createElement('iframe');
    frame.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'rel=0';
    frame.title = label || T('lightboxTitle');
    frame.loading = 'lazy';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    return frame;
  }

  // ---------------------------------------------------------------- theme
  function preferredTheme() {
    var stored = null;
    try { stored = localStorage.getItem('portfolio-theme'); } catch (error) {}
    if (stored === 'light' || stored === 'dark') return stored;
    if (html.hasAttribute('data-theme-forced')) return html.getAttribute('data-theme') || 'dark';
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch (error) { return 'dark'; }
  }

  function applyTheme(theme) {
    var next = theme === 'light' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f8f8f6' : '#09090b');
  }

  function wireTheme() {
    applyTheme(preferredTheme());
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('portfolio-theme', next); } catch (error) {}
    });
  }

  // ---------------------------------------------------------------- header
  function wireHeader() {
    var header = document.getElementById('header');
    var drawer = document.getElementById('mobileDrawer');
    var menuBtn = document.getElementById('mobileMenuBtn');
    var progress = document.getElementById('scrollProgress');
    var backToTop = document.getElementById('backToTop');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-scrolled', y > 24);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
      }
      if (backToTop) backToTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (menuBtn && drawer) {
      var setOpen = function (open) {
        drawer.hidden = !open;
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', open ? T('menuClose') : T('menuOpen'));
      };
      menuBtn.addEventListener('click', function () {
        setOpen(drawer.hidden);
      });
      drawer.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { setOpen(false); });
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !drawer.hidden) {
          setOpen(false);
          menuBtn.focus();
        }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 980 && !drawer.hidden) setOpen(false);
      });
    }

    // Anchor scrolling that respects the floating header.
    document.addEventListener('click', function (event) {
      var anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', href);
      if (drawer && !drawer.hidden) {
        drawer.hidden = true;
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --------------------------------------------------------------- reveals
  var revealObserver = null;
  function revealItems(container, selector) {
    if (!container) return;
    var items = Array.prototype.slice.call(container.querySelectorAll(selector));
    if (!items.length) return;
    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (error) {}
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    items.forEach(function (el) { el.classList.add('reveal-pending'); });
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('reveal-pending');
          entry.target.classList.add('reveal-ready');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    items.forEach(function (el) { revealObserver.observe(el); });

    // Safety net: nothing may stay invisible because an observer never fired.
    window.setTimeout(function () {
      items.forEach(function (el) {
        if (el.classList.contains('reveal-pending')) {
          el.classList.remove('reveal-pending');
          el.classList.add('reveal-ready');
        }
      });
    }, 4000);
  }

  // ------------------------------------------------------------------- hero
  function wireHero() {
    var video = document.getElementById('heroReelVideo');
    var toggle = document.getElementById('heroReelToggle');
    var icon = document.getElementById('heroReelToggleIcon');
    var text = document.getElementById('heroReelToggleText');
    var poster = document.getElementById('stagePoster');
    var posterImage = document.getElementById('stagePosterImage');
    var showreelBtn = document.getElementById('heroShowreelBtn');
    var fileName = document.getElementById('stageFileName');

    var reelUrl = safeHref(settingsCache.heroShowreelUrl);
    var reelIsFile = !!reelUrl && isVideoFile(reelUrl);

    if (posterImage) {
      var posterUrl = safeHref(settingsCache.heroPoster || settingsCache.heroPortraitDark || '');
      if (posterUrl) {
        posterImage.src = posterUrl;
        posterImage.alt = '';
        poster.classList.add('has-image');
      }
    }

    if (fileName && reelUrl) {
      try {
        var path = new URL(reelUrl, window.location.origin).pathname;
        fileName.textContent = decodeURIComponent(path.split('/').pop() || 'showreel.aep');
      } catch (error) {}
    }

    if (video && reelIsFile) {
      video.hidden = false;
      if (poster) poster.style.display = 'none';
      if (video.getAttribute('src') !== reelUrl) {
        video.setAttribute('src', reelUrl);
        video.load();
      }
      if (toggle) toggle.hidden = false;

      var syncReel = function () {
        if (!toggle) return;
        var paused = video.paused;
        toggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
        if (icon) icon.textContent = paused ? '▶' : '❚❚';
        if (text) text.textContent = paused ? T('playReel') : T('pauseReel');
      };

      if (toggle && !toggle.dataset.wired) {
        toggle.dataset.wired = '1';
        toggle.addEventListener('click', function () {
          if (video.paused) {
            var started = video.play();
            if (started && started.catch) started.catch(function () {});
          } else {
            video.pause();
          }
          syncReel();
        });
        video.addEventListener('play', syncReel);
        video.addEventListener('pause', syncReel);
      }

      var reduced = false;
      try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (error) {}
      if (!reduced) {
        var playing = video.play();
        if (playing && playing.then) {
          playing.then(function () {
            if (window.portfolioTracking && !video.dataset.counted) {
              video.dataset.counted = '1';
              window.portfolioTracking.track('reel_play');
            }
          }).catch(function () {});
        }
      }
      syncReel();
    } else if (video) {
      video.hidden = true;
      if (poster) poster.style.display = '';
    }

    // Showreel button: with a real URL it opens the reel. Without one it stays
    // in place but says what to do instead, so the hero never shows a dead
    // button and never fakes a video that does not exist.
    if (showreelBtn) {
      if (!reelUrl) {
        var label = showreelBtn.querySelector('[data-i18n]') || showreelBtn;
        var fallback = T('showreelAskLabel');
        if (fallback && fallback !== 'showreelAskLabel') label.textContent = fallback;
        showreelBtn.addEventListener('click', function () {
          var contact = document.getElementById('contact');
          if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
          var message = document.getElementById('contactMessage');
          if (message && !message.value.trim()) {
            message.focus({ preventScroll: true });
          }
        });
      } else {
        showreelBtn.hidden = false;
        showreelBtn.addEventListener('click', function () { openShowreel(reelUrl); });
      }
    }
  }

  // -------------------------------------------------------------- showreel
  function openShowreel(url) {
    var dialog = document.getElementById('showreelDialog');
    var stage = document.getElementById('showreelStage');
    if (!dialog || !stage) return;
    stage.innerHTML = '';
    var element = buildMedia(url, { label: T('showreelModalTitle'), controls: true, force: true });
    if (element.tagName === 'VIDEO') element.autoplay = true;
    stage.appendChild(element);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function wireShowreelCleanup() {
    var dialog = document.getElementById('showreelDialog');
    if (!dialog) return;
    dialog.addEventListener('close', function () {
      dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
      var stage = document.getElementById('showreelStage');
      if (stage) stage.innerHTML = '';
    });
  }

  // Dialog helpers shared with js/work.js
  function closeOnOutsideClick(dialog) {
    if (!dialog) return;
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) return;
    var pressedOutside = false;
    var outside = function (event) {
      var rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    dialog.addEventListener('pointerdown', function (event) { pressedOutside = outside(event); });
    dialog.addEventListener('pointerup', function (event) {
      if (pressedOutside && outside(event)) dialog.close();
    });
  }

  // ------------------------------------------------------ contact + copy
  function wireContact() {
    var form = document.getElementById('contactForm');
    var status = document.getElementById('contactStatus');

    function setStatus(message, state) {
      if (!status) return;
      status.textContent = message || '';
      status.dataset.state = state || 'info';
      status.hidden = !message;
    }

    // "Open this brief as an email" — works even when the API is unreachable.
    var mailtoLink = document.getElementById('briefMailto');
    if (mailtoLink) {
      var addressLink = document.querySelector('a[data-setting="email"]');
      var address = addressLink ? addressLink.textContent.trim() : '';
      if (address) {
        var body = [
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

    if (!form) return;
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('[data-submit-label]') : null;
    var idleLabel = submitLabel ? submitLabel.textContent : '';

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      var payload = {
        name: (document.getElementById('contactName') || {}).value || '',
        email: (document.getElementById('contactEmail') || {}).value || '',
        message: (document.getElementById('contactMessage') || {}).value || '',
        projectType: (document.getElementById('contactProjectType') || {}).value || '',
        deadline: (document.getElementById('contactDeadline') || {}).value || '',
        outputFormat: (document.getElementById('contactFormat') || {}).value || '',
        replyPreference: (document.getElementById('contactReplyPreference') || {}).value || ''
      };
      payload.name = payload.name.trim();
      payload.email = payload.email.trim();
      payload.message = payload.message.trim();
      payload.deadline = payload.deadline.trim();

      if (!payload.name || !payload.email || !payload.message) {
        setStatus(T('formFillRequired'), 'error');
        var firstEmpty = [!payload.name && 'contactName', !payload.email && 'contactEmail', !payload.message && 'contactMessage']
          .filter(Boolean)[0];
        var field = firstEmpty ? document.getElementById(firstEmpty) : null;
        if (field) field.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = T('formSending');
      setStatus(T('formSendingStatus'), 'info');

      fetch('/api.php?_query=messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error('send failed');
        form.reset();
        if (submitLabel) submitLabel.textContent = T('formSent');
        setStatus(T('formSentStatus'), 'success');
        if (status) status.focus({ preventScroll: true });
        if (window.portfolioTracking) {
          window.portfolioTracking.track('contact_submit', { projectType: payload.projectType || 'none' });
        }
      }).catch(function () {
        setStatus(T('formFailedStatus'), 'error');
        if (status) status.focus({ preventScroll: true });
      }).then(function () {
        window.setTimeout(function () {
          if (submitBtn) submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = idleLabel;
        }, 4000);
      });
    });

    var copyBtn = document.getElementById('copyEmailBtn');
    var feedback = document.getElementById('copyEmailFeedback');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var link = document.querySelector('a[data-setting="email"]');
        var address = (link ? link.textContent : '').trim();
        if (!address) return;
        var done = function (copied) {
          if (feedback) {
            feedback.textContent = copied ? T('copiedOk') + address : T('copiedFail') + address;
            feedback.classList.toggle('is-error', !copied);
          }
          copyBtn.dataset.state = copied ? 'copied' : 'failed';
          window.setTimeout(function () {
            if (feedback) { feedback.textContent = ''; feedback.classList.remove('is-error'); }
            copyBtn.dataset.state = '';
          }, 4000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(address).then(function () { done(true); }).catch(function () { done(false); });
        } else {
          done(false);
        }
      });
    }
  }

  // ------------------------------------------------------------- edit mode
  function wireEditMode() {
    if (!isEditFrame) return;
    document.body.classList.add('is-editing');
    var bar = document.getElementById('siteEditBar');
    if (bar) bar.setAttribute('aria-hidden', 'false');

    document.addEventListener('click', function (event) {
      var target = event.target.closest('[data-setting]');
      if (!target || target === document.body) return;
      if (target.closest('a, button') && !target.hasAttribute('data-setting')) return;
      event.preventDefault();
      var key = target.getAttribute('data-setting');
      var current = target.textContent.trim();
      var next = window.prompt('Edit "' + key + '"', current);
      if (next == null) return;
      var payload = {};
      payload[key] = next;
      window.parent.postMessage({ type: 'admin:setting-edit', key: key, value: next }, window.location.origin);
      target.textContent = next;
      var status = document.getElementById('siteEditStatus');
      if (status) status.textContent = 'Saved ' + key;
      void payload;
    }, true);
  }

  // ------------------------------------------------------------- settings
  function applySettings(settings) {
    settingsCache = settings || {};
    window.SiteSettings = settingsCache;

    document.querySelectorAll('[data-setting]').forEach(function (el) {
      var key = el.getAttribute('data-setting');
      var value = pick(key);
      if (!hasValue(value)) return;

      if (key === 'email') {
        el.textContent = value;
        el.setAttribute('href', 'mailto:' + value);
      } else if (key === 'phone') {
        el.textContent = value;
        el.setAttribute('href', 'tel:' + String(value).replace(/\s/g, ''));
      } else if (key === 'linkedin' || key === 'behance' || key === 'instagram' || key === 'telegram' || key === 'whatsapp') {
        var href = safeHref(value);
        if (!href) {
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
          el.removeAttribute('href');
        } else {
          el.setAttribute('href', href);
          el.hidden = false;
          el.removeAttribute('aria-hidden');
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (key === 'aboutResumeUrl') {
        var resume = safeHref(value);
        if (!resume) {
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
        } else {
          el.setAttribute('href', resume);
          el.hidden = false;
          el.removeAttribute('aria-hidden');
          el.setAttribute('download', 'Alireza-Shabanzadeh-Motion-Designer-Resume.pdf');
          el.setAttribute('rel', 'noopener');
        }
      } else if (key === 'aboutImage') {
        var image = document.getElementById('aboutImage');
        var placeholder = document.getElementById('aboutImagePlaceholder');
        if (image) {
          image.src = value;
          image.hidden = false;
          if (placeholder) placeholder.style.display = 'none';
        }
      } else if (key === 'aboutText') {
        el.innerHTML = renderSimpleMarkdown(value);
      } else if (key === 'experience' || key === 'education') {
        // Rendered by js/work.js (needs the paired FA lists).
      } else if (key === 'heroCtaLink') {
        var cta = document.querySelector('[data-hero-cta]');
        var target = safeHref(value);
        if (cta && target) cta.setAttribute('href', target);
      } else if (/^heroStat\dValue$/.test(key)) {
        el.textContent = value;
      } else {
        el.textContent = value;
      }
    });

    honestyPass();
  }

  function renderSimpleMarkdown(text) {
    var escaped = String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var inline = function (line) {
      return line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" rel="noopener">$1</a>');
    };
    return escaped.split(/\n\s*\n/).map(function (block) {
      block = block.trim();
      if (!block) return '';
      if (/^### /.test(block)) return '<h3>' + inline(block.slice(4)) + '</h3>';
      if (/^## /.test(block)) return '<h2>' + inline(block.slice(3)) + '</h2>';
      if (/^# /.test(block)) return '<h2>' + inline(block.slice(2)) + '</h2>';
      if (/^-\s/.test(block)) {
        var items = block.split(/\n/).map(function (line) {
          return '<li>' + inline(line.replace(/^-\s*/, '')) + '</li>';
        }).join('');
        return '<ul>' + items + '</ul>';
      }
      return '<p>' + inline(block).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  // ------------------------------------------------------- honesty pass
  // Nothing empty or unverifiable is allowed to look like content.
  function honestyPass() {
    // Hero stats: hide a card unless both halves are real.
    ['heroStat1', 'heroStat2', 'heroStat3'].forEach(function (base) {
      var valueEl = document.querySelector('[data-setting="' + base + 'Value"]');
      var labelEl = document.querySelector('[data-setting="' + base + 'Label"]');
      var card = valueEl ? valueEl.closest('.hero-stat') : null;
      var valueEmpty = !hasValue(pick(base + 'Value'));
      var labelEmpty = !hasValue(pick(base + 'Label'));
      if (valueEl && valueEmpty) valueEl.textContent = '';
      if (labelEl && labelEmpty) labelEl.textContent = '';
      if (card) card.hidden = valueEmpty || labelEmpty;
    });

    // Availability pill only when it is actually true.
    var availability = document.querySelector('.status-pill');
    if (availability) availability.hidden = !hasValue(pick('heroAvailability'));

    // Contact rows: never show a label with an empty value.
    document.querySelectorAll('.contact-info-item').forEach(function (item) {
      var value = item.querySelector('.value, .contact-info-value, .meta-val');
      var empty = !value || value.textContent.trim() === '' ||
        (value.tagName === 'A' && (!value.getAttribute('href') || value.getAttribute('href') === '#'));
      item.hidden = empty;
    });

    // Promise line, social row.
    var promise = document.querySelector('.hero-promise-note');
    if (promise) promise.hidden = !hasValue(pick('heroPromise'));
    var social = document.querySelector('.social-row');
    if (social) {
      var visible = Array.prototype.slice.call(social.querySelectorAll('[data-setting]'))
        .some(function (link) { return !link.hidden; });
      social.hidden = !visible;
    }

    // "What you get": a row with no value is not shown; an empty block vanishes.
    var offer = document.getElementById('what-you-get');
    if (offer) {
      var filled = 0;
      offer.querySelectorAll('.offer-row').forEach(function (row) {
        var value = row.querySelector('dd');
        var empty = !value || value.textContent.trim() === '';
        row.hidden = empty;
        if (!empty) filled += 1;
      });
      offer.hidden = filled === 0;
      var intro = offer.querySelector('[data-setting="offerIntro"]');
      if (intro) intro.hidden = intro.textContent.trim() === '';
    }

    // The hero reel stage falls back to the portrait when there is no video.
    var stage = document.getElementById('stagePoster');
    var stageVideo = document.getElementById('heroReelVideo');
    if (stage) {
      var poster = safeHref(pick('heroPoster')) || safeHref(pick('heroPortraitDark')) || '';
      var hasReel = !!safeHref(pick('heroShowreelUrl'));
      if (poster) {
        var posterImage = document.getElementById('stagePosterImage');
        if (posterImage) posterImage.src = poster;
        stage.classList.add('has-image');
      }
      stage.hidden = hasReel && stageVideo && !!stageVideo.getAttribute('src');
      var fileName = document.getElementById('stageFileName');
      if (fileName && poster) fileName.textContent = String(poster).split('/').pop();
    }

    // Section headings with nothing to say leave a gap: hide them.
    ['servicesTitle', 'processTitle', 'ratesTitle', 'contactTitle', 'offerTitle'].forEach(function (key) {
      var node = document.querySelector('[data-setting="' + key + '"]');
      if (!node) return;
      var group = node.closest('.section-head-split > div') || node;
      group.hidden = !hasValue(pick(key));
    });

    // Scope list.
    var scopeBlock = document.getElementById('scopeBlock');
    var scopeList = document.getElementById('scopeList');
    if (scopeBlock && scopeList) {
      var items = String(pick('scopeItems') || '').split('\n')
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
      scopeList.innerHTML = '';
      items.forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        scopeList.appendChild(li);
      });
      scopeBlock.hidden = items.length === 0;
    }
  }

  // ---------------------------------------------------------------- boot
  function loadSettings() {
    return fetch('/api.php?_query=settings', { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : {}; })
      .catch(function () { return {}; })
      .then(function (settings) {
        // Draft preview from the admin panel (only ever applies in the frame).
        try {
          if (window.self !== window.top) {
            var draft = JSON.parse(localStorage.getItem('portfolio-preview-draft') || 'null');
            if (draft) settings = Object.assign({}, settings, draft);
          }
        } catch (error) {}
        return settings || {};
      });
  }

  function boot() {
    wireTheme();
    wireHeader();
    wireContact();
    wireShowreelCleanup();
    wireEditMode();
    closeOnOutsideClick(document.getElementById('portfolioDialog'));
    closeOnOutsideClick(document.getElementById('showreelDialog'));
    closeOnOutsideClick(document.getElementById('mediaLightbox'));

    loadSettings().then(function (settings) {
      applySettings(settings);
      wireHero();
      if (window.SiteWork) window.SiteWork.init(settings);
      if (window.SiteI18n) window.SiteI18n.applyLabels();
      document.dispatchEvent(new CustomEvent('site:ready', { detail: settings }));
    }).catch(function () {
      // API unreachable: static markup stays, hero still gets its reel wiring.
      wireHero();
      if (window.SiteWork) window.SiteWork.init({});
    });
  }

  /** Re-run label translation after dynamic rendering. */
  document.addEventListener('site:labels', function () {
    if (window.SiteI18n) window.SiteI18n.applyLabels();
  });

  Object.assign(window, {
    SiteUI: {
      buildMedia: buildMedia,
      safeHref: safeHref,
      isVideoFile: isVideoFile,
      externalEmbed: externalEmbed,
      revealItems: revealItems,
      renderSimpleMarkdown: renderSimpleMarkdown,
      closeOnOutsideClick: closeOnOutsideClick,
      settings: function () { return settingsCache; },
      pick: pick,
      openShowreel: openShowreel
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
