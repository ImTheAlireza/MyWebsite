/**
 * Project data loader
 * Projects and categories from live API (not static build snapshot)
 */

const PROJECTS_URL = '/api.php?_query=projects';

let siteCategories = ['Explainer', 'Social Media', 'UI Motion'];

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

function safeEmbedUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.origin);
    const host = url.hostname.replace(/^www\./, '');
    const allowedHosts = new Set(['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'player.vimeo.com', window.location.hostname]);
    if (!allowedHosts.has(host)) return '';
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
    if (host === 'youtube.com' && url.pathname === '/watch' && url.searchParams.get('v')) {
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.searchParams.get('v'))}`;
    }
    return url.href;
  } catch {
    return '';
  }
}

async function loadProjects() {
  try {
    const [projRes, settingsRes] = await Promise.all([
      fetch(PROJECTS_URL, { credentials: 'same-origin' }),
      fetch('/api.php?_query=settings', { credentials: 'same-origin' })
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
  const card = document.createElement('div');
  card.className = 'project-card' + (project.featured ? ' is-featured' : '');
  card.dataset.category = project.category;
  card.dataset.id = project.id;

  const thumb = document.createElement('div');
  thumb.className = 'project-card-thumbnail';
  const img = document.createElement('img');
  img.src = safeUrl(project.thumbnail) || '';
  img.alt = project.title || '';
  img.loading = 'lazy';
  thumb.appendChild(img);

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
  info.append(category, title, year);
  card.append(thumb, info);

  card.addEventListener('click', () => openProjectModal(project));

  return card;
}

function renderProjects(projects) {
  const grid = document.getElementById('workGrid');
  if (!grid) return;
  grid.innerHTML = '';
  projects.forEach(project => {
    grid.appendChild(createProjectCard(project));
  });
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

function openProjectModal(project) {
  const modal = document.getElementById('projectModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalYear = document.getElementById('modalYear');
  const modalDescription = document.getElementById('modalDescription');
  const modalTools = document.getElementById('modalTools');
  const modalRole = document.getElementById('modalRole');

  modalVideo.innerHTML = '';
  const embed = safeEmbedUrl(project.video);
  if (embed) {
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

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  const modalVideo = document.getElementById('modalVideo');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  modalVideo.innerHTML = '';
  const galleryEl = document.getElementById('modalGallery');
  if (galleryEl) galleryEl.innerHTML = '';
}

Object.assign(window, {
  loadProjects,
  renderProjects,
  renderFilters,
  filterProjects,
  openProjectModal,
  closeProjectModal
});
