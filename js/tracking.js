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
      const res = await fetch(`${LIKES_URL}/${encodeURIComponent(projectId)}/likes`, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
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
        credentials: 'same-origin',
        cache: 'no-store',
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

  const modalLikeButton = document.getElementById('modalLikeButton');
  const modalLikeLabel = document.getElementById('modalLikeLabel');
  const modalLikeCount = document.getElementById('modalLikeCount');

  function updateCardLikeCounts(projectId, count) {
    document.querySelectorAll('.project-card-like-count[data-project-id]').forEach(indicator => {
      if (String(indicator.dataset.projectId) !== String(projectId)) return;
      const value = indicator.querySelector('.like-count');
      if (value) value.textContent = String(count);
      indicator.setAttribute('aria-label', count + (count === 1 ? ' like' : ' likes'));
      indicator.classList.toggle('has-likes', count > 0);
    });
  }

  function updateModalLike(projectId, count) {
    if (!modalLikeButton || String(modalLikeButton.dataset.projectId || '') !== String(projectId)) return;
    const isLiked = likedProjects.has(String(projectId));
    modalLikeButton.disabled = false;
    modalLikeButton.classList.toggle('is-liked', isLiked);
    modalLikeButton.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
    modalLikeButton.setAttribute('aria-label', (isLiked ? 'Unlike' : 'Like') + ' this project. ' + count + (count === 1 ? ' like' : ' likes'));
    const icon = modalLikeButton.querySelector('svg');
    if (icon) icon.setAttribute('fill', isLiked ? 'currentColor' : 'none');
    if (modalLikeLabel) modalLikeLabel.textContent = isLiked ? 'Liked' : 'Like project';
    if (modalLikeCount) modalLikeCount.textContent = String(count);
  }

  async function refreshLikeCount(projectId) {
    const count = await fetchLikeCount(projectId);
    updateCardLikeCounts(projectId, count);
    updateModalLike(projectId, count);
    return count;
  }

  function hydrateCardLikeCounts() {
    document.querySelectorAll('.project-card-like-count[data-project-id]').forEach(indicator => {
      if (indicator.dataset.likesLoading === 'true' || indicator.dataset.likesLoaded === 'true') return;
      indicator.dataset.likesLoading = 'true';
      refreshLikeCount(indicator.dataset.projectId).then(() => {
        indicator.dataset.likesLoaded = 'true';
      }).finally(() => {
        indicator.dataset.likesLoading = 'false';
      });
    });
  }

  document.addEventListener('projects:rendered', hydrateCardLikeCounts);
  document.addEventListener('project:opened', event => {
    if (!modalLikeButton) return;
    const projectId = String(event.detail && event.detail.projectId || '');
    if (!projectId) return;
    modalLikeButton.dataset.projectId = projectId;
    modalLikeButton.disabled = true;
    modalLikeButton.classList.toggle('is-liked', likedProjects.has(projectId));
    if (modalLikeLabel) modalLikeLabel.textContent = 'Loading likes…';
    if (modalLikeCount) modalLikeCount.textContent = '—';
    refreshLikeCount(projectId);
  });

  if (modalLikeButton) {
    modalLikeButton.addEventListener('click', async event => {
      event.stopPropagation();
      const projectId = String(modalLikeButton.dataset.projectId || '');
      if (!projectId || modalLikeButton.disabled) return;
      modalLikeButton.disabled = true;
      const result = await toggleLike(projectId);
      if (result) {
        updateCardLikeCounts(projectId, Number(result.count) || 0);
        updateModalLike(projectId, Number(result.count) || 0);
      } else {
        modalLikeButton.disabled = false;
        if (modalLikeLabel) modalLikeLabel.textContent = 'Try again';
      }
    });
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (card && card.dataset.id) trackProjectClick(card.dataset.id);

    const resumeLink = e.target.closest('a[download], a[data-setting="aboutResumeUrl"]');
    if (resumeLink) trackResumeDownload();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      trackPageView();
      startTimeTracking();
      hydrateCardLikeCounts();
    });
  } else {
    trackPageView();
    startTimeTracking();
    hydrateCardLikeCounts();
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
    refreshLikeCount,
    hydrateCardLikeCounts
  };
})();
