/**
 * Project data loader
 * Projects and categories from live API (not static build snapshot)
 */

const PROJECTS_URL = '/api.php?_query=projects';

let siteCategories = ['Explainer', 'Social Media', 'UI Motion'];
let renderedProjectsById = new Map();
let projectGridEventsBound = false;
let lastProjectTrigger = null;

function normalizeSlug(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function safeUrl(value, allowedProtocols = ['http:', 'https:', '/', '#']) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/') || raw.startsWith('#') || /^[\w.-]+\//.test(raw)) return raw;
  try {
    const url = new URL(raw, window.location.origin);
    return allowedProtocols.includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function safeDirectVideoUrl(value) {
  const safe = safeUrl(value);
  if (!safe) return '';
  try {
    const url = new URL(safe, window.location.origin);
    return /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv)$/i.test(url.pathname) ? safe : '';
  } catch {
    return '';
  }
}

function safeEmbedUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.origin);
    const host = url.hostname.replace(/^www\./, '');
    const allowedHosts = new Set(['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com', window.location.hostname]);
    if (!allowedHosts.has(host)) return '';
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
    if (host === 'youtube.com' && url.pathname === '/watch' && url.searchParams.get('v')) {
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.searchParams.get('v'))}`;
    }
    if (host === 'vimeo.com') {
      const videoId = url.pathname.split('/').filter(Boolean).pop();
      if (/^\d+$/.test(videoId || '')) return `https://player.vimeo.com/video/${videoId}`;
      return '';
    }
    return url.href;
  } catch {
    return '';
  }
}

async function loadProjects() {
  try {
    const [projRes, settingsRes] = await Promise.all([
      fetch(PROJECTS_URL, { credentials: 'same-origin', cache: 'no-store' }),
      fetch('/api.php?_query=settings', { credentials: 'same-origin', cache: 'no-store' })
    ]);
    if (!projRes.ok) throw new Error(`Failed to load projects: ${projRes.status}`);
    const projData = await projRes.json();
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (Array.isArray(settings.categories) && settings.categories.length) {
        siteCategories = settings.categories;
      }
    }
    const all = projData.projects || [];
    // Public API already filters drafts; still require a valid category for display
    const filtered = all.filter(p =>
      p.published !== false &&
      p.category &&
      String(p.category).trim() !== '' &&
      siteCategories.some(c => normalizeSlug(c) === normalizeSlug(p.category))
    );
    // Featured first (API also sorts), then order
    return filtered.slice().sort((a, b) => {
      const fo = (b.featured === true) - (a.featured === true);
      if (fo !== 0) return fo;
      return (Number(a.order) || 0) - (Number(b.order) || 0);
    });
  } catch (err) {
    console.error('Error loading projects:', err);
    return [];
  }
}

function getCategoryLabel(slug) {
  const cat = siteCategories.find(c => normalizeSlug(c) === normalizeSlug(slug));
  return cat || slug;
}

function createProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card' + (project.featured ? ' is-featured' : '') + (project.video ? ' has-video' : '');
  card.dataset.category = project.category;
  card.dataset.id = project.id;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-haspopup', 'dialog');
  card.setAttribute('aria-label', 'View project: ' + (project.title || 'Untitled project'));

  const thumb = document.createElement('div');
  thumb.className = 'project-card-thumbnail';
  const thumbnailUrl = safeUrl(project.thumbnail);
  const directVideoUrl = safeDirectVideoUrl(project.video);

  if (thumbnailUrl) {
    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = project.title || '';
    img.loading = 'lazy';
    thumb.appendChild(img);
  } else if (directVideoUrl) {
    const video = document.createElement('video');
    video.src = directVideoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', (project.title || 'Project') + ' video preview');
    thumb.appendChild(video);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'project-card-thumbnail-placeholder';
    placeholder.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m9 9 6 3-6 3V9z"></path></svg>';
    thumb.appendChild(placeholder);
  }

  if (project.video) {
    const videoBadge = document.createElement('span');
    videoBadge.className = 'project-card-video-badge';
    videoBadge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 3 21 12 7 21 7 3"></polygon></svg><span>Play</span>';
    thumb.appendChild(videoBadge);
  }

  if (project.featured) {
    const badge = document.createElement('span');
    badge.className = 'project-card-featured-badge';
    badge.textContent = 'Featured';
    thumb.appendChild(badge);
  }

  const info = document.createElement('div');
  info.className = 'project-card-info';
  const category = document.createElement('span');
  category.className = 'project-card-category';
  category.textContent = getCategoryLabel(project.category);
  const title = document.createElement('h3');
  title.className = 'project-card-title';
  title.textContent = project.title || '';
  const year = document.createElement('span');
  year.className = 'project-card-year';
  year.textContent = project.year || '';
  const likes = document.createElement('span');
  likes.className = 'project-card-like-count';
  likes.dataset.projectId = String(project.id || '');
  likes.setAttribute('aria-label', '0 likes');
  likes.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg><span class="like-count">0</span>';
  const footer = document.createElement('div');
  footer.className = 'project-card-footer';
  footer.append(year, likes);
  info.append(category, title, footer);
  card.append(thumb, info);

  return card;
}

function renderProjects(projects) {
  const grid = document.getElementById('workGrid');
  if (!grid) return;

  renderedProjectsById = new Map(
    (Array.isArray(projects) ? projects : []).map(project => [String(project.id), project])
  );
  grid.innerHTML = '';
  renderedProjectsById.forEach(project => {
    grid.appendChild(createProjectCard(project));
  });

  // Delegate activation to the stable grid. This keeps cards clickable after
  // filters, like-count updates, animations, and any future DOM enhancements.
  if (!projectGridEventsBound) {
    grid.addEventListener('click', event => {
      const card = event.target.closest('.project-card');
      if (!card || !grid.contains(card)) return;
      const project = renderedProjectsById.get(String(card.dataset.id));
      if (project) openProjectModal(project, card);
    });
    grid.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.project-card');
      if (!card || !grid.contains(card)) return;
      const project = renderedProjectsById.get(String(card.dataset.id));
      if (!project) return;
      event.preventDefault();
      openProjectModal(project, card);
    });
    projectGridEventsBound = true;
  }

  document.dispatchEvent(new CustomEvent('projects:rendered'));
}

function renderFilters() {
  const filters = document.getElementById('workFilters');
  if (!filters) return;
  filters.innerHTML = '<button class="filter-btn active" data-filter="all" data-cursor="link">All</button>' +
    siteCategories.map(c => {
      const slug = normalizeSlug(c);
      return '<button class="filter-btn" data-filter="' + slug + '" data-cursor="link">' + c.replace(/[&<>"']/g, '') + '</button>';
    }).join('');
}

function filterProjects(category, projects) {
  if (category === 'all') return projects;
  return projects.filter(p => p.category && normalizeSlug(p.category) === category);
}

function openProjectModal(project, trigger) {
  const modal = document.getElementById('projectModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalYear = document.getElementById('modalYear');
  const modalDescription = document.getElementById('modalDescription');
  const modalTools = document.getElementById('modalTools');
  const modalRole = document.getElementById('modalRole');

  if (!modal || !modalVideo || !modalTitle || !modalCategory || !modalYear ||
      !modalDescription || !modalTools || !modalRole) {
    console.error('Project modal markup is incomplete.');
    return;
  }

  // Open first so a broken media URL can never make the card appear unresponsive.
  lastProjectTrigger = trigger || document.activeElement;
  modal.dataset.projectId = String(project.id || '');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('project-modal-open');
  document.body.style.overflow = 'hidden';

  modalVideo.innerHTML = '';
  const directVideo = safeDirectVideoUrl(project.video);
  const embed = directVideo ? '' : safeEmbedUrl(project.video);
  if (directVideo) {
    const video = document.createElement('video');
    video.src = directVideo;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    const poster = safeUrl(project.thumbnail);
    if (poster) video.poster = poster;
    video.setAttribute('aria-label', (project.title || 'Project') + ' video');
    video.appendChild(document.createTextNode('Your browser does not support this video.'));
    modalVideo.appendChild(video);
  } else if (embed) {
    const iframe = document.createElement('iframe');
    iframe.src = embed + (embed.includes('?') ? '&' : '?') + 'autoplay=0&rel=0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    modalVideo.appendChild(iframe);
  } else if (project.thumbnail) {
    const img = document.createElement('img');
    img.src = safeUrl(project.thumbnail);
    img.alt = project.title || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit';
    modalVideo.appendChild(img);
  }

  // Optional gallery strip
  let galleryEl = document.getElementById('modalGallery');
  if (!galleryEl) {
    galleryEl = document.createElement('div');
    galleryEl.id = 'modalGallery';
    galleryEl.className = 'modal-gallery';
    if (modalDescription && modalDescription.parentNode) {
      modalDescription.parentNode.insertBefore(galleryEl, modalDescription);
    }
  }
  galleryEl.innerHTML = '';
  const gallery = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
  if (gallery.length) {
    gallery.forEach(url => {
      const safe = safeUrl(url);
      if (!safe) return;
      const gimg = document.createElement('img');
      gimg.src = safe;
      gimg.alt = '';
      gimg.loading = 'lazy';
      galleryEl.appendChild(gimg);
    });
    galleryEl.hidden = false;
  } else {
    galleryEl.hidden = true;
  }

  modalTitle.textContent = project.title;
  modalCategory.textContent = getCategoryLabel(project.category);
  modalYear.textContent = project.year;
  modalDescription.textContent = project.description;
  modalRole.textContent = project.role;
  modalTools.innerHTML = '';
  (Array.isArray(project.tools) ? project.tools : []).forEach(t => {
    const tag = document.createElement('span');
    tag.className = 'modal-tool-tag';
    tag.textContent = t;
    modalTools.appendChild(tag);
  });

  document.dispatchEvent(new CustomEvent('project:opened', {
    detail: { projectId: String(project.id || '') }
  }));
  const closeButton = document.getElementById('modalClose');
  if (closeButton) closeButton.focus({ preventScroll: true });
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  const modalVideo = document.getElementById('modalVideo');
  if (!modal || !modalVideo) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.removeAttribute('data-project-id');
  document.body.classList.remove('project-modal-open');
  document.body.style.overflow = '';
  modalVideo.innerHTML = '';
  const galleryEl = document.getElementById('modalGallery');
  if (galleryEl) galleryEl.innerHTML = '';
  if (lastProjectTrigger && typeof lastProjectTrigger.focus === 'function') {
    lastProjectTrigger.focus({ preventScroll: true });
  }
  lastProjectTrigger = null;
}

Object.assign(window, {
  loadProjects,
  renderProjects,
  renderFilters,
  filterProjects,
  openProjectModal,
  closeProjectModal
});
