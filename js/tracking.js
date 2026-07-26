/**
 * Client-side analytics tracking + project likes
 * Privacy-friendly: no third-party geo, debounced heartbeats
 */
(function () {
  'use strict';

  const TRACK_URL = '/api.php?_query=track';
  const LIKES_URL = '/api.php?_query=projects';

  function randomId(prefix) {
    const core = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
    return prefix + core;
  }

  function getVisitorId() {
    let id = localStorage.getItem('portfolio-visitor-id');
    if (!id) {
      id = randomId('v-');
      localStorage.setItem('portfolio-visitor-id', id);
    }
    return id;
  }

  function getSessionId() {
    let id = sessionStorage.getItem('portfolio-session-id');
    if (!id) {
      id = randomId('s-');
      sessionStorage.setItem('portfolio-session-id', id);
    }
    return id;
  }

  // Coarse region only from timezone — no third-party IP lookup
  function detectLocation() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return tz.replace(/_/g, ' ').slice(0, 80);
    } catch {
      return '';
    }
  }

  const lastSent = new Map();

  async function track(type, extra = {}) {
    const key = type + ':' + (extra.page || '') + ':' + (extra.projectId || '');
    const now = Date.now();
    const minGap = type === 'heartbeat' ? 25000 : 8000;
    if (lastSent.has(key) && now - lastSent.get(key) < minGap) return;
    lastSent.set(key, now);

    try {
      await fetch(TRACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type,
          sessionId: getSessionId(),
          visitorId: getVisitorId(),
          location: detectLocation(),
          ...extra
        }),
        keepalive: type !== 'heartbeat'
      });
    } catch {}
  }

  function trackPageView() {
    const page = window.location.pathname + window.location.hash;
    track('pageview', { page });
  }

  let heartbeatInterval = null;
  function startTimeTracking() {
    track('heartbeat');
    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') track('heartbeat');
    }, 30000);
  }

  function trackResumeDownload() {
    track('resume_download');
  }

  function trackProjectClick(projectId) {
    track('project_click', { projectId: String(projectId) });
  }

  // ============================================
  // LIKE SYSTEM
  // ============================================
  const visitorId = getVisitorId();
  let likedProjects;
  try {
    likedProjects = new Set(JSON.parse(localStorage.getItem('portfolio-likes') || '[]'));
  } catch {
    likedProjects = new Set();
  }

  async function fetchLikeCount(projectId) {
    try {
      const res = await fetch(`${LIKES_URL}/${encodeURIComponent(projectId)}/likes`);
      if (res.ok) {
        const d = await res.json();
        return d.count || 0;
      }
    } catch {}
    return 0;
  }

  async function toggleLike(projectId) {
    try {
      const res = await fetch(`${LIKES_URL}/${encodeURIComponent(projectId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.liked) likedProjects.add(String(projectId));
        else likedProjects.delete(String(projectId));
        localStorage.setItem('portfolio-likes', JSON.stringify([...likedProjects]));
        return d;
      }
    } catch {}
    return null;
  }

  function createLikeButton(projectId) {
    const btn = document.createElement('button');
    btn.className = 'project-card-like';
    btn.type = 'button';
    btn.setAttribute('data-cursor', 'link');
    btn.setAttribute('aria-label', 'Like project');
    const isLiked = likedProjects.has(String(projectId));
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
      <span class="like-count">0</span>
    `;
    if (isLiked) btn.classList.add('is-liked');

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.style.pointerEvents = 'none';
      const result = await toggleLike(projectId);
      if (result) {
        btn.classList.toggle('is-liked', result.liked);
        const svg = btn.querySelector('svg');
        svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
        btn.querySelector('.like-count').textContent = result.count;
      }
      btn.style.pointerEvents = '';
    });

    fetchLikeCount(projectId).then(count => {
      const el = btn.querySelector('.like-count');
      if (el) el.textContent = count;
    });

    return btn;
  }

  function addLikeButtons() {
    document.querySelectorAll('.project-card').forEach(card => {
      if (card.querySelector('.project-card-like')) return;
      const projectId = card.dataset.id;
      if (!projectId) return;
      const info = card.querySelector('.project-card-info');
      if (info) info.appendChild(createLikeButton(projectId));
    });
  }

  const observer = new MutationObserver(() => addLikeButtons());
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.project-card-like')) return;
    const card = e.target.closest('.project-card');
    if (card && card.dataset.id) trackProjectClick(card.dataset.id);

    const resumeLink = e.target.closest('a[download], a[data-setting="aboutResumeUrl"]');
    if (resumeLink) trackResumeDownload();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      trackPageView();
      startTimeTracking();
      addLikeButtons();
    });
  } else {
    trackPageView();
    startTimeTracking();
    addLikeButtons();
  }

  window.addEventListener('hashchange', trackPageView);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && heartbeatInterval) {
      // flush a final heartbeat when leaving
      track('heartbeat');
    }
  });

  window.portfolioTracking = {
    track,
    trackPageView,
    trackResumeDownload,
    trackProjectClick,
    getVisitorId,
    createLikeButton,
    addLikeButtons
  };
})();
