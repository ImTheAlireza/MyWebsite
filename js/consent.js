/**
 * Consent manager — privacy-first default.
 *
 * Categories
 *   analytics : first-party visitor statistics (pageviews, dwell time, clicks)
 *   media     : third-party embeds (YouTube / Vimeo players)
 *
 * Rules
 *   - Nothing in the two optional categories runs before an explicit choice.
 *   - The choice is remembered in localStorage (strictly necessary storage).
 *   - Global Privacy Control (GPC) and Do-Not-Track are honoured automatically.
 *   - Inside the admin preview iframe the banner is hidden and everything stays off.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'portfolio-consent-v1';
  var CONSENT_VERSION = 1;
  var SESSION_MEDIA_KEY = 'portfolio-consent-media-session';

  var isPreviewFrame = false;
  try {
    isPreviewFrame = window.self !== window.top;
  } catch (error) {
    isPreviewFrame = true;
  }

  var gpcSignal = navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1';

  function readStored() {
    if (isPreviewFrame) return null;
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!raw || raw.version !== CONSENT_VERSION) return null;
      if (typeof raw.analytics !== 'boolean' || typeof raw.media !== 'boolean') return null;
      return raw;
    } catch (error) {
      return null;
    }
  }

  function writeStored(state) {
    if (isPreviewFrame) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* storage blocked — the choice simply will not persist */
    }
  }

  var stored = readStored();
  var state = {
    version: CONSENT_VERSION,
    analytics: stored ? stored.analytics : false,
    media: stored ? stored.media : false,
    method: stored ? stored.method || 'stored' : (gpcSignal ? 'gpc' : 'none'),
    decidedAt: stored ? stored.decidedAt || null : null
  };

  // GPC / DNT: keep everything optional off and do not nag with a banner.
  var hasDecision = !!stored || gpcSignal;
  var mediaSessionAllowed = false;
  try {
    mediaSessionAllowed = sessionStorage.getItem(SESSION_MEDIA_KEY) === '1';
  } catch (error) {}

  var listeners = [];

  function allowed(category) {
    if (isPreviewFrame) return false;
    if (category === 'media') return state.media || mediaSessionAllowed;
    return state.analytics === true;
  }

  function emit() {
    listeners.forEach(function (listener) {
      try {
        listener(state);
      } catch (error) {
        /* a broken listener must never break the page */
      }
    });
    try {
      document.dispatchEvent(new CustomEvent('portfolio:consent', { detail: state }));
    } catch (error) {}
  }

  function save(nextState) {
    state = nextState;
    hasDecision = true;
    writeStored(state);
    hideBanner();
    emit();
  }

  function grantAll() {
    save({
      version: CONSENT_VERSION,
      analytics: true,
      media: true,
      method: 'accept-all',
      decidedAt: new Date().toISOString()
    });
  }

  function clearAnalyticsIdentifiers() {
    // Promise kept in cookies.html: "Essential only" removes the visitor id again.
    try {
      localStorage.removeItem('portfolio-visitor-id');
    } catch (error) {}
    try {
      sessionStorage.removeItem('portfolio-session-id');
    } catch (error) {}
  }

  function grantEssentialOnly() {
    clearAnalyticsIdentifiers();
    save({
      version: CONSENT_VERSION,
      analytics: false,
      media: false,
      method: 'essential-only',
      decidedAt: new Date().toISOString()
    });
  }

  function allowMediaForSession() {
    mediaSessionAllowed = true;
    try {
      sessionStorage.setItem(SESSION_MEDIA_KEY, '1');
    } catch (error) {}
    emit();
  }

  var banner = null;

  function buildBanner() {
    if (banner) return banner;

    banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.id = 'consentBanner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie and privacy settings');
    banner.innerHTML = '' +
      '<div class="consent-banner-inner">' +
        '<div class="consent-copy">' +
          '<p class="consent-title">Cookies &amp; privacy</p>' +
          '<p class="consent-text">This site sets no advertising or third-party cookies. ' +
          'I would like to use first-party statistics (pages, time on site, clicks) to see which work gets attention, ' +
          'and to load video from YouTube/Vimeo only when you open a project. ' +
          'Read the <a href="cookies.html">cookie&nbsp;policy</a> and <a href="privacy.html">privacy&nbsp;policy</a>.</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn btn-ghost consent-btn" data-consent="essential">Essential only</button>' +
          '<button type="button" class="btn btn-primary consent-btn" data-consent="all">Accept statistics</button>' +
        '</div>' +
      '</div>';

    banner.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-consent]');
      if (!trigger) return;
      if (trigger.getAttribute('data-consent') === 'all') grantAll();
      else grantEssentialOnly();
    });

    document.body.appendChild(banner);
    return banner;
  }

  function showBanner() {
    if (isPreviewFrame) return;
    buildBanner();
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    window.setTimeout(function () {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = null;
    }, 320);
  }

  function openSettings() {
    buildBanner();
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      var firstButton = banner.querySelector('[data-consent="essential"]');
      if (firstButton) firstButton.focus();
    });
  }

  function onChange(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    if (hasDecision) listener(state);
    return function () {
      listeners = listeners.filter(function (item) {
        return item !== listener;
      });
    };
  }

  window.portfolioConsent = {
    version: CONSENT_VERSION,
    allowed: allowed,
    onChange: onChange,
    open: openSettings,
    grantAll: grantAll,
    grantEssentialOnly: grantEssentialOnly,
    allowMediaForSession: allowMediaForSession,
    isPreviewFrame: isPreviewFrame,
    gpcSignal: gpcSignal,
    state: function () {
      return {
        analytics: allowed('analytics'),
        media: allowed('media'),
        method: state.method,
        decidedAt: state.decidedAt
      };
    }
  };

  // Footer "Cookie settings" trigger (delegated, so it works on every page).
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-consent-settings]');
    if (!trigger) return;
    event.preventDefault();
    openSettings();
  });

  if (!hasDecision) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
