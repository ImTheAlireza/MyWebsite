    // Submits contact form to backend endpoint (Telegram notification).
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
        formStatus.textContent = '';
        try {
          const d = new FormData(form);
          const payload = {
            name: d.get('name') || '',
            email: d.get('email') || '',
            type: d.get('type') || '',
            message: d.get('message') || '',
            company: d.get('company') || ''
          };
          const res = await fetch('api/contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.ok) {
            form.reset();
            formStatus.textContent = data.message || 'Your message was sent successfully.';
          } else {
            formStatus.textContent = data.message || 'Could not send your message. Please try again.';
          }
        } catch (err) {
          formStatus.textContent = 'Network error. Please try again later.';
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }
      });
    }
  
    // Hero: a spring-physics dot field and a name whose letters react to the pointer.
    (() => {
      const hero = document.querySelector('.hero');
      const canvas = hero.querySelector('.dots');
      const ctx = canvas.getContext('2d');
      const name = hero.querySelector('.name');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Split the name into letters. Mark it ready after the intro so lifted letters are not clipped.
      name.querySelectorAll('em').forEach((em) => {
        const text = em.textContent;
        em.textContent = '';
        for (const ch of text) { const i = document.createElement('i'); i.textContent = ch; em.appendChild(i); }
      });
      const letters = [...name.querySelectorAll('i')];
      const ready = () => name.classList.add('ready');
      if (reduce) ready();
      else { name.querySelector('span:last-child em').addEventListener('animationend', ready, { once: true }); setTimeout(ready, 2500); }

      function lift(x, y) {
        const reach = parseFloat(getComputedStyle(name).fontSize) * 1.5;
        for (const l of letters) {
          const r = l.getBoundingClientRect();
          const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
          const f = Math.max(0, 1 - d / reach);
          l.style.setProperty('--f', (f * f).toFixed(3));
        }
      }
      const drop = () => letters.forEach((l) => l.style.setProperty('--f', 0));

      // Dot field
      const GAP = 36, RADIUS = 150;
      let W = 0, H = 0, dots = [], ink = '#000', accent = '#00f', running = false, raf = 0, shock = null;
      const ptr = { x: 0, y: 0, on: false };

      function colors() {
        const cs = getComputedStyle(document.documentElement);
        ink = cs.getPropertyValue('--ink').trim();
        accent = cs.getPropertyValue('--accent').trim();
      }
      function size() {
        const r = hero.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1;
        const ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
        dots = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) dots.push({ x: ox + x * GAP, y: oy + y * GAP, dx: 0, dy: 0, vx: 0, vy: 0 });
        colors();
        if (!running) frame(0);
      }

      function frame(now) {
        const t = now / 1000;
        ctx.clearRect(0, 0, W, H);
        for (const d of dots) {
          let near = 0;
          if (running) {
            const ax = d.x + d.dx - ptr.x, ay = d.y + d.dy - ptr.y, dist = Math.hypot(ax, ay) || 1;
            if (ptr.on && dist < RADIUS) {
              near = 1 - dist / RADIUS;
              const f = near * near * 2.2;
              d.vx += (ax / dist) * f; d.vy += (ay / dist) * f;
            }
            if (shock) {
              const age = (now - shock.t) / 1000;
              const sx = d.x - shock.x, sy = d.y - shock.y, sd = Math.hypot(sx, sy) || 1;
              const ring = Math.abs(sd - age * 700);
              if (ring < 60) {
                const k = (1 - ring / 60) * Math.max(0, 1 - age / 1.1) * 3;
                d.vx += (sx / sd) * k; d.vy += (sy / sd) * k;
              }
            }
            d.vx -= d.dx * 0.06; d.vy -= d.dy * 0.06;   // spring back
            d.vx *= 0.86; d.vy *= 0.86;                 // damping, leaves a little overshoot
            d.dx += d.vx; d.dy += d.vy;
          }
          const sway = running ? Math.sin(t * 0.9 + d.x * 0.008 + d.y * 0.011) * 1.6 : 0;
          const moved = Math.min(1, Math.hypot(d.dx, d.dy) / 14);
          const e = Math.max(near, moved);
          ctx.globalAlpha = 0.22 + 0.6 * e;
          ctx.fillStyle = e > 0.2 ? accent : ink;
          ctx.beginPath();
          ctx.arc(d.x + d.dx, d.y + d.dy + sway, 1.5 + 1.9 * e, 0, Math.PI * 2);
          ctx.fill();
        }
        if (shock && now - shock.t > 1300) shock = null;
        if (running) raf = requestAnimationFrame(frame);
      }

      function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(frame); } }
      function stop() { running = false; cancelAnimationFrame(raf); }

      size();
      addEventListener('resize', size);
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colors(); if (!running) frame(0); });
      if (reduce) return;

      new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(hero);
      const local = (e) => { const r = hero.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; };
      hero.addEventListener('pointermove', (e) => { local(e); ptr.on = true; lift(e.clientX, e.clientY); });
      hero.addEventListener('pointerdown', (e) => { local(e); shock = { x: ptr.x, y: ptr.y, t: performance.now() }; });
      const leave = () => { ptr.on = false; drop(); };
      hero.addEventListener('pointerleave', leave);
      hero.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') leave(); });
      hero.addEventListener('pointercancel', leave);
    })();
  
    // Pointer play: a springy cursor follower, tilting work frames, a magnetic send button.
    (() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

      const cur = document.querySelector('.cursor');
      document.documentElement.classList.add('has-cursor');
      let tx = -100, ty = -100, x = tx, y = ty, vx = 0, vy = 0;
      (function tick() {
        vx += (tx - x) * 0.2; vy += (ty - y) * 0.2;
        vx *= 0.7; vy *= 0.7;
        x += vx; y += vy;
        cur.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        requestAnimationFrame(tick);
      })();
      addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
      document.addEventListener('pointerleave', () => cur.classList.remove('on'));
      document.addEventListener('pointerover', (e) => {
        const t = e.target.closest('a, button, .work-card, .services li, input, select, textarea');
        cur.classList.toggle('big', !!t && !t.matches('input, select, textarea'));
        cur.classList.toggle('hide', !!t && t.matches('input, select, textarea'));
      });

      // Work cards tilt toward the pointer.
      document.querySelectorAll('.work-card .work-thumb').forEach((f) => {
        f.addEventListener('pointermove', (e) => {
          const r = f.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          f.style.transform = 'perspective(900px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg) scale(1.02)';
        });
        f.addEventListener('pointerleave', () => { f.style.transform = ''; });
      });

      // Send button leans toward the pointer.
      const send = document.querySelector('.send');
      send.addEventListener('pointermove', (e) => {
        const r = send.getBoundingClientRect();
        send.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)';
      });
      send.addEventListener('pointerleave', () => { send.style.transform = ''; });
    })();
  
    // Mobile menu toggle
    (() => {
      const toggle = document.querySelector('.menu-toggle');
      const nav = document.getElementById('main-nav');
      if (!toggle || !nav) return;
      const close = () => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        nav.classList.remove('is-open');
      };
      const open = () => {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        nav.classList.add('is-open');
      };
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        expanded ? close() : open();
      });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      document.addEventListener('click', (e) => {
        if (!nav.classList.contains('is-open')) return;
        if (e.target.closest('header')) return;
        close();
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 860) close();
      });
    })();

    // Work modal
    (() => {
      const modal = document.getElementById('work-modal');
      const dialog = modal ? modal.querySelector('.work-modal-dialog') : null;
      const mediaWrap = document.getElementById('work-modal-media');
      const titleEl = document.getElementById('work-modal-title');
      const metaEl = document.getElementById('work-modal-meta');
      if (!modal || !mediaWrap || !dialog) return;

      let originRect = null;
      let closing = false;

      const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

      const clearDialogStyles = () => {
        dialog.style.transition = '';
        dialog.style.transform = '';
        dialog.style.opacity = '';
        dialog.style.transformOrigin = '';
      };

      const close = () => {
        if (!modal.classList.contains('is-open') || closing) return;
        if (reduceMotion() || !originRect) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
          mediaWrap.innerHTML = '';
          document.body.style.overflow = '';
          clearDialogStyles();
          return;
        }
        closing = true;
        const end = dialog.getBoundingClientRect();
        const dx = originRect.left + originRect.width / 2 - (end.left + end.width / 2);
        const dy = originRect.top + originRect.height / 2 - (end.top + end.height / 2);
        const sx = originRect.width / Math.max(end.width, 1);
        const sy = originRect.height / Math.max(end.height, 1);
        dialog.style.transition = 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease';
        dialog.style.transformOrigin = 'center center';
        requestAnimationFrame(() => {
          dialog.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
          dialog.style.opacity = '0.2';
          modal.style.transition = 'background-color 0.32s ease';
        });
        const done = () => {
          dialog.removeEventListener('transitionend', done);
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
          mediaWrap.innerHTML = '';
          document.body.style.overflow = '';
          clearDialogStyles();
          modal.style.transition = '';
          closing = false;
        };
        dialog.addEventListener('transitionend', done);
        setTimeout(done, 500);
      };

      const open = (card) => {
        if (modal.classList.contains('is-open')) return;
        const type = card.getAttribute('data-type') || '';
        const src = card.getAttribute('data-src') || '';
        const poster = card.getAttribute('data-poster') || '';
        const title = card.getAttribute('data-title') || '';
        const meta = card.getAttribute('data-meta') || '';
        const alt = card.getAttribute('data-alt') || title || '';
        if (!src) return;
        const thumb = card.querySelector('.work-thumb') || card;
        originRect = thumb.getBoundingClientRect();

        mediaWrap.innerHTML = '';
        if (type === 'video') {
          const v = document.createElement('video');
          v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'metadata';
          if (poster) v.poster = poster;
          v.setAttribute('aria-label', title || 'Project video');
          const track = document.createElement('track');
          track.kind = 'captions';
          track.label = 'Captions';
          track.src = 'assets/empty.vtt';
          track.default = true;
          v.appendChild(track);
          mediaWrap.appendChild(v);
        } else {
          const img = document.createElement('img');
          img.src = src; img.alt = alt;
          mediaWrap.appendChild(img);
        }
        titleEl.textContent = title;
        metaEl.textContent = meta;
        metaEl.style.display = meta ? '' : 'none';

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (reduceMotion()) { clearDialogStyles(); return; }

        const end = dialog.getBoundingClientRect();
        const dx = originRect.left + originRect.width / 2 - (end.left + end.width / 2);
        const dy = originRect.top + originRect.height / 2 - (end.top + end.height / 2);
        const sx = originRect.width / Math.max(end.width, 1);
        const sy = originRect.height / Math.max(end.height, 1);

        dialog.style.transition = 'none';
        dialog.style.transformOrigin = 'center center';
        dialog.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
        dialog.style.opacity = '0.72';
        // force reflow
        dialog.offsetHeight; // eslint-disable-line no-unused-expressions
        requestAnimationFrame(() => {
          dialog.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease';
          dialog.style.transform = '';
          dialog.style.opacity = '1';
        });
        const cleanup = (e) => {
          if (e.target !== dialog || e.propertyName !== 'transform') return;
          dialog.removeEventListener('transitionend', cleanup);
          clearDialogStyles();
        };
        dialog.addEventListener('transitionend', cleanup);
      };

      document.querySelectorAll('.work-card').forEach((card) => {
        card.addEventListener('click', () => open(card));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
        });
      });

      modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-work]')) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
      });
    })();
