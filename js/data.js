/**
 * Brand-first portfolio data, gallery experiences, and layered media viewer.
 */
const PROJECTS_URL = '/api.php?_query=projects';

let siteBrands = [];
let allPortfolioProjects = [];
let lastProjectTrigger = null;
let currentBrand = null;
let activeCaseStudy = null;
let activeLightbox = null;
let modalScrollPosition = 0;
let previousBodyOverflow = '';

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv)(?:[?#].*)?$/i;
const ICONS = {
  arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',
  arrowRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>',
  back: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="m15 18-6-6 6-6"></path><path d="M9 12h10"></path></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>',
  expand: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path></svg>',
  play: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"></path></svg>',
  gallery: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>'
};

function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const parsed = new URL(raw, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function isDirectVideo(value) {
  return VIDEO_EXTENSION.test(String(value || ''));
}

function isExternalVideo(value) {
  const url = safeUrl(value);
  if (!url) return false;
  try {
    const host = new URL(url, window.location.origin).hostname.toLowerCase().replace(/^www\./, '');
    return host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'vimeo.com' || host.endsWith('.vimeo.com');
  } catch {
    return false;
  }
}

function isVideo(value) {
  return isDirectVideo(value) || isExternalVideo(value);
}

function uniqueMedia(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).reduce((result, value) => {
    const url = safeUrl(value);
    if (!url || seen.has(url)) return result;
    seen.add(url);
    result.push(url);
    return result;
  }, []);
}

function externalVideoEmbed(value) {
  const url = safeUrl(value);
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
    }
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parsed.searchParams.get('v') || (parts[0] === 'embed' || parts[0] === 'shorts' ? parts[1] : '');
      return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
    }
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
      return id ? 'https://player.vimeo.com/video/' + id : '';
    }
  } catch {}
  return '';
}

function mediaElement(value, options = {}) {
  const url = safeUrl(value);
  const title = options.title || '';
  const viewer = options.viewer === true;

  if (!url) {
    const missing = document.createElement('div');
    missing.className = 'portfolio-media-missing';
    missing.textContent = 'Media unavailable';
    return missing;
  }

  if (isExternalVideo(url)) {
    if (!viewer) {
      const placeholder = document.createElement('span');
      placeholder.className = 'portfolio-video-placeholder';
      placeholder.innerHTML = ICONS.play;
      return placeholder;
    }
    const embed = externalVideoEmbed(url);
    if (embed) {
      const frame = document.createElement('iframe');
      frame.src = embed;
      frame.title = title || 'Embedded video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      return frame;
    }
  }

  if (isDirectVideo(url)) {
    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    video.preload = viewer ? 'metadata' : 'metadata';
    video.controls = viewer;
    video.muted = !viewer;
    video.setAttribute('aria-label', title || 'Video');
    if (!viewer) video.tabIndex = -1;
    return video;
  }

  const image = document.createElement('img');
  image.src = url;
  image.alt = title;
  image.loading = viewer ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.draggable = false;
  return image;
}

function button(className, label, icon) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.setAttribute('aria-label', label);
  if (icon) element.innerHTML = icon;
  return element;
}

function brandMode(brand) {
  return brand && brand.mode === 'gallery' ? 'gallery' : 'projects';
}

function brandProjects(brand) {
  return allPortfolioProjects.filter(project => String(project.brand) === String(brand.id));
}

function brandGallery(brand) {
  return uniqueMedia(brand && brand.gallery);
}

function projectMedia(project) {
  const gallery = uniqueMedia(project && project.gallery);
  const video = safeUrl(project && project.video);
  if (video && !gallery.includes(video)) gallery.unshift(video);
  if (!gallery.length) {
    const thumbnail = safeUrl(project && project.thumbnail);
    if (thumbnail) gallery.push(thumbnail);
  }
  return gallery;
}

function projectPreview(project, media) {
  return safeUrl(project && project.thumbnail) || media[0] || '';
}

async function loadProjects() {
  try {
    const response = await fetch(PROJECTS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Portfolio request failed');
    const data = await response.json();
    allPortfolioProjects = (Array.isArray(data.projects) ? data.projects : []).filter(project => project.published !== false);
    siteBrands = (Array.isArray(data.brands) ? data.brands : []).slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return allPortfolioProjects;
  } catch (error) {
    console.error('Could not load portfolio:', error);
    allPortfolioProjects = [];
    siteBrands = [];
    return [];
  }
}

function renderProjects() {
  const grid = document.getElementById('workGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const visibleBrands = siteBrands.filter(brand => {
    if (brandMode(brand) === 'gallery') return brandGallery(brand).length > 0;
    return brandProjects(brand).length > 0;
  });

  if (!visibleBrands.length) {
    const empty = document.createElement('div');
    empty.className = 'projects-public-empty';
    const heading = document.createElement('h3');
    heading.textContent = 'No brands published yet';
    const copy = document.createElement('p');
    copy.textContent = 'New work will appear here soon.';
    empty.append(heading, copy);
    grid.appendChild(empty);
    return;
  }

  visibleBrands.forEach((brand, index) => {
    const mode = brandMode(brand);
    const count = mode === 'gallery' ? brandGallery(brand).length : brandProjects(brand).length;
    const countLabel = mode === 'gallery'
      ? count + ' media item' + (count === 1 ? '' : 's')
      : count + ' project' + (count === 1 ? '' : 's');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'brand-card is-' + mode;
    card.style.setProperty('--brand-index', index);
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', 'Open ' + brand.name + ', ' + countLabel);

    const cover = mediaElement(brand.thumbnail, { title: '' });
    cover.className = 'brand-card-image';
    card.appendChild(cover);

    const overlay = document.createElement('span');
    overlay.className = 'brand-card-overlay';
    const kind = document.createElement('span');
    kind.className = 'brand-card-kind';
    kind.innerHTML = mode === 'gallery' ? ICONS.gallery + '<span>Gallery</span>' : '<span>Case studies</span>';
    const name = document.createElement('strong');
    name.textContent = brand.name || 'Untitled brand';
    const meta = document.createElement('small');
    meta.textContent = countLabel;
    overlay.append(kind, name, meta);
    card.appendChild(overlay);

    card.addEventListener('click', () => openBrandModal(brand, card));
    grid.appendChild(card);
  });
  document.dispatchEvent(new CustomEvent('projects:rendered'));
}

function modalElements() {
  const modal = document.getElementById('projectModal');
  if (!modal) return {};
  return {
    modal,
    dialog: modal.querySelector('.portfolio-dialog'),
    mount: document.getElementById('portfolioModalContent'),
    close: document.getElementById('modalClose')
  };
}

function setElementInert(element, inert) {
  if (!element) return;
  element.inert = inert;
  if (inert) element.setAttribute('inert', '');
  else element.removeAttribute('inert');
}

function syncModalLayers() {
  const { mount, close } = modalElements();
  const like = document.getElementById('modalLikeButton');
  const lightboxOpen = !!activeLightbox;
  const caseOpen = !!activeCaseStudy;
  setElementInert(close, lightboxOpen);
  setElementInert(like, lightboxOpen || !caseOpen);
  setElementInert(mount, lightboxOpen || caseOpen);
  if (activeCaseStudy) setElementInert(activeCaseStudy.panel, lightboxOpen);
}

function brandHero(brand, count) {
  const mode = brandMode(brand);
  const hero = document.createElement('header');
  hero.className = 'portfolio-brand-hero is-' + mode;

  const cover = mediaElement(brand.thumbnail, { title: '' });
  cover.className = 'portfolio-brand-cover';
  hero.appendChild(cover);

  const shade = document.createElement('div');
  shade.className = 'portfolio-brand-shade';
  hero.appendChild(shade);

  const copy = document.createElement('div');
  copy.className = 'portfolio-brand-copy';
  const type = document.createElement('span');
  type.className = 'portfolio-brand-type';
  type.innerHTML = mode === 'gallery' ? ICONS.gallery + '<span>Media gallery</span>' : '<span>Selected work</span>';
  const title = document.createElement('h2');
  title.id = 'portfolioModalTitle';
  title.textContent = brand.name || 'Untitled brand';
  const meta = document.createElement('p');
  meta.textContent = mode === 'gallery'
    ? count + ' media item' + (count === 1 ? '' : 's')
    : count + ' case stud' + (count === 1 ? 'y' : 'ies');
  copy.append(type, title, meta);
  hero.appendChild(copy);
  return hero;
}

function galleryTile(url, index, brand) {
  const tile = button('brand-gallery-tile', 'Open media ' + (index + 1) + ' of ' + brandGallery(brand).length);
  tile.dataset.index = String(index);
  tile.style.setProperty('--gallery-order', index);

  const preview = mediaElement(url, { title: '' });
  preview.classList.add('brand-gallery-preview');
  tile.appendChild(preview);

  if (isVideo(url)) {
    const videoMark = document.createElement('span');
    videoMark.className = 'brand-gallery-video-mark';
    videoMark.innerHTML = ICONS.play;
    tile.appendChild(videoMark);
  }

  const expand = document.createElement('span');
  expand.className = 'brand-gallery-expand';
  expand.innerHTML = ICONS.expand;
  tile.appendChild(expand);
  tile.addEventListener('click', () => openMediaLightbox(brandGallery(brand), index, brand.name, tile));
  return tile;
}

function renderGalleryBrand(brand, mount) {
  const media = brandGallery(brand);
  const body = document.createElement('section');
  body.className = 'brand-gallery-body';
  body.setAttribute('aria-label', brand.name + ' media gallery');

  const grid = document.createElement('div');
  grid.className = 'brand-gallery-grid';
  media.forEach((url, index) => grid.appendChild(galleryTile(url, index, brand)));
  body.appendChild(grid);
  mount.appendChild(body);
}

function projectCard(project, index) {
  const media = projectMedia(project);
  const card = button('portfolio-project-card', 'Open ' + (project.title || 'project'));
  card.dataset.id = String(project.id || '');
  card.style.setProperty('--project-order', index);

  const visual = document.createElement('span');
  visual.className = 'portfolio-project-visual';
  const previewUrl = projectPreview(project, media);
  if (previewUrl) {
    const preview = mediaElement(previewUrl, { title: '' });
    preview.classList.add('portfolio-project-preview');
    visual.appendChild(preview);
  } else {
    const missing = document.createElement('span');
    missing.className = 'portfolio-project-empty';
    missing.textContent = 'No preview';
    visual.appendChild(missing);
  }

  if (isVideo(media[0])) {
    const play = document.createElement('span');
    play.className = 'portfolio-project-play';
    play.innerHTML = ICONS.play;
    visual.appendChild(play);
  }
  if (media.length > 1) {
    const mediaCount = document.createElement('span');
    mediaCount.className = 'portfolio-project-media-count';
    mediaCount.textContent = media.length + ' media';
    visual.appendChild(mediaCount);
  }

  const details = document.createElement('span');
  details.className = 'portfolio-project-details';
  const text = document.createElement('span');
  const year = document.createElement('small');
  year.textContent = project.year || 'Case study';
  const title = document.createElement('strong');
  title.textContent = project.title || 'Untitled project';
  text.append(year, title);
  const arrow = document.createElement('span');
  arrow.className = 'portfolio-project-arrow';
  arrow.innerHTML = ICONS.arrowRight;
  details.append(text, arrow);

  card.append(visual, details);
  card.addEventListener('click', () => openCaseStudy(card, project, media));
  return card;
}

function renderProjectBrand(brand, mount) {
  const projects = brandProjects(brand);
  const body = document.createElement('section');
  body.className = 'portfolio-projects-body';

  const intro = document.createElement('div');
  intro.className = 'portfolio-projects-intro';
  const heading = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.textContent = 'Case studies';
  const title = document.createElement('h3');
  title.textContent = 'Explore the work';
  heading.append(eyebrow, title);
  const hint = document.createElement('p');
  hint.textContent = 'Select a project to see the full story and media.';
  intro.append(heading, hint);

  const grid = document.createElement('div');
  grid.className = 'portfolio-projects-grid';
  projects.forEach((project, index) => grid.appendChild(projectCard(project, index)));
  body.append(intro, grid);
  mount.appendChild(body);
}

function openBrandModal(brand, trigger) {
  const { modal, dialog, mount, close } = modalElements();
  if (!modal || !dialog || !mount) return;

  closeMediaLightbox(false);
  closeCaseStudy(false);
  currentBrand = brand;
  lastProjectTrigger = trigger || document.activeElement;
  previousBodyOverflow = document.body.style.overflow;
  modalScrollPosition = 0;
  mount.innerHTML = '';

  const mode = brandMode(brand);
  const count = mode === 'gallery' ? brandGallery(brand).length : brandProjects(brand).length;
  mount.appendChild(brandHero(brand, count));
  if (mode === 'gallery') renderGalleryBrand(brand, mount);
  else renderProjectBrand(brand, mount);

  modal.classList.add('is-open', 'is-brand-modal');
  modal.classList.toggle('is-gallery-brand', mode === 'gallery');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  mount.scrollTop = 0;

  requestAnimationFrame(() => {
    modal.classList.add('is-ready');
    if (close) close.focus({ preventScroll: true });
  });
}

function caseStudyInfo(project) {
  const info = document.createElement('div');
  info.className = 'case-study-info';

  if (project.year) {
    const meta = document.createElement('span');
    meta.className = 'case-study-meta';
    meta.textContent = project.year;
    info.appendChild(meta);
  }

  const title = document.createElement('h2');
  title.id = 'caseStudyTitle';
  title.textContent = project.title || 'Untitled project';
  info.appendChild(title);

  if (project.description) {
    const description = document.createElement('p');
    description.className = 'case-study-description';
    description.textContent = project.description;
    info.appendChild(description);
  }

  const hasTools = Array.isArray(project.tools) && project.tools.length > 0;
  if (project.role || hasTools) {
    const details = document.createElement('div');
    details.className = 'case-study-details';
    if (project.role) {
      const role = document.createElement('div');
      role.className = 'case-study-role';
      const label = document.createElement('span');
      label.textContent = 'Role';
      const value = document.createElement('strong');
      value.textContent = project.role;
      role.append(label, value);
      details.appendChild(role);
    }
    if (hasTools) {
      const tools = document.createElement('div');
      tools.className = 'case-study-tools';
      project.tools.forEach(tool => {
        const tag = document.createElement('span');
        tag.textContent = tool;
        tools.appendChild(tag);
      });
      details.appendChild(tools);
    }
    info.appendChild(details);
  }
  return info;
}

function updateCaseMedia(index) {
  if (!activeCaseStudy) return;
  const { media, stage, counter, thumbs, project } = activeCaseStudy;
  if (!media.length) return;
  activeCaseStudy.index = (index + media.length) % media.length;
  const url = media[activeCaseStudy.index];
  stage.innerHTML = '';
  stage.appendChild(mediaElement(url, { title: project.title || 'Project media', viewer: true }));
  if (counter) counter.textContent = (activeCaseStudy.index + 1) + ' / ' + media.length;
  if (thumbs) {
    thumbs.querySelectorAll('button').forEach((thumb, thumbIndex) => {
      const selected = thumbIndex === activeCaseStudy.index;
      thumb.classList.toggle('is-active', selected);
      thumb.setAttribute('aria-current', selected ? 'true' : 'false');
      if (selected) thumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
  }
}

function openCaseStudy(trigger, project, media) {
  const { modal, dialog, mount } = modalElements();
  if (!modal || !dialog || !mount) return;
  closeCaseStudy(false);
  modalScrollPosition = mount.scrollTop;

  const panel = document.createElement('section');
  panel.className = 'case-study-panel';
  panel.setAttribute('role', 'document');
  panel.setAttribute('aria-labelledby', 'caseStudyTitle');

  const toolbar = document.createElement('div');
  toolbar.className = 'case-study-toolbar';
  const back = button('case-study-back', 'Back to all projects', ICONS.back);
  const backText = document.createElement('span');
  backText.textContent = currentBrand ? currentBrand.name : 'All projects';
  back.appendChild(backText);
  const mediaLabel = document.createElement('span');
  mediaLabel.className = 'case-study-toolbar-label';
  mediaLabel.textContent = 'Case study';
  toolbar.append(back, mediaLabel);

  const viewer = document.createElement('div');
  viewer.className = 'case-study-viewer';
  const stage = document.createElement('div');
  stage.className = 'case-study-stage';
  viewer.appendChild(stage);

  let counter = null;
  if (media.length) {
    const expand = button('case-study-expand', 'View media fullscreen', ICONS.expand);
    expand.addEventListener('click', () => openMediaLightbox(media, activeCaseStudy ? activeCaseStudy.index : 0, project.title, expand));
    viewer.appendChild(expand);
  }

  if (media.length > 1) {
    const previous = button('case-study-nav is-previous', 'Previous media', ICONS.arrowLeft);
    const next = button('case-study-nav is-next', 'Next media', ICONS.arrowRight);
    previous.addEventListener('click', () => updateCaseMedia(activeCaseStudy.index - 1));
    next.addEventListener('click', () => updateCaseMedia(activeCaseStudy.index + 1));
    counter = document.createElement('span');
    counter.className = 'case-study-counter';
    viewer.append(previous, next, counter);
  }

  let thumbs = null;
  if (media.length > 1) {
    thumbs = document.createElement('div');
    thumbs.className = 'case-study-thumbs';
    thumbs.setAttribute('aria-label', 'Project media');
    media.forEach((url, index) => {
      const thumb = button('case-study-thumb', 'Show media ' + (index + 1));
      thumb.appendChild(mediaElement(url, { title: '' }));
      if (isVideo(url)) {
        const mark = document.createElement('span');
        mark.innerHTML = ICONS.play;
        thumb.appendChild(mark);
      }
      thumb.addEventListener('click', () => updateCaseMedia(index));
      thumbs.appendChild(thumb);
    });
  }

  const content = document.createElement('div');
  content.className = 'case-study-content';
  content.appendChild(caseStudyInfo(project));
  panel.append(toolbar, viewer);
  if (thumbs) panel.appendChild(thumbs);
  panel.appendChild(content);
  dialog.appendChild(panel);

  activeCaseStudy = { panel, trigger, project, media, index: 0, stage, counter, thumbs };
  const likeButton = document.getElementById('modalLikeButton');
  if (likeButton) likeButton.hidden = false;
  syncModalLayers();
  document.dispatchEvent(new CustomEvent('project:opened', { detail: { projectId: project.id } }));
  back.addEventListener('click', () => closeCaseStudy());
  modal.classList.add('has-case-study');
  if (window.portfolioTracking && typeof window.portfolioTracking.trackProjectClick === 'function' && project.id) {
    window.portfolioTracking.trackProjectClick(project.id);
  }

  if (media.length) updateCaseMedia(0);
  else {
    const missing = document.createElement('div');
    missing.className = 'portfolio-media-missing';
    missing.textContent = 'No media added';
    stage.appendChild(missing);
  }

  requestAnimationFrame(() => {
    panel.classList.add('is-visible');
    back.focus({ preventScroll: true });
  });
}

function closeCaseStudy(restoreFocus = true) {
  if (!activeCaseStudy) return;
  const { panel, trigger } = activeCaseStudy;
  panel.querySelectorAll('video').forEach(video => video.pause());
  panel.remove();
  activeCaseStudy = null;
  const likeButton = document.getElementById('modalLikeButton');
  if (likeButton) {
    likeButton.hidden = true;
    likeButton.removeAttribute('data-project-id');
  }
  const { modal, mount } = modalElements();
  syncModalLayers();
  if (modal) modal.classList.remove('has-case-study');
  if (mount) mount.scrollTop = modalScrollPosition;
  if (restoreFocus && trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
}

function lightboxThumb(url, index) {
  const thumb = button('media-lightbox-thumb', 'Show media ' + (index + 1));
  thumb.appendChild(mediaElement(url, { title: '' }));
  if (isVideo(url)) {
    const mark = document.createElement('span');
    mark.innerHTML = ICONS.play;
    thumb.appendChild(mark);
  }
  thumb.addEventListener('click', () => updateMediaLightbox(index));
  return thumb;
}

function updateMediaLightbox(index) {
  if (!activeLightbox) return;
  const { media, stage, counter, thumbs, title } = activeLightbox;
  activeLightbox.index = (index + media.length) % media.length;
  const url = media[activeLightbox.index];
  stage.innerHTML = '';
  stage.appendChild(mediaElement(url, { title: title || 'Media', viewer: true }));
  counter.textContent = (activeLightbox.index + 1) + ' / ' + media.length;
  if (thumbs) {
    thumbs.querySelectorAll('button').forEach((thumb, thumbIndex) => {
      const selected = thumbIndex === activeLightbox.index;
      thumb.classList.toggle('is-active', selected);
      thumb.setAttribute('aria-current', selected ? 'true' : 'false');
      if (selected) thumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }
}

function openMediaLightbox(mediaValues, index, title, trigger) {
  const { modal, dialog } = modalElements();
  if (!modal || !dialog) return;
  closeMediaLightbox(false);

  const media = uniqueMedia(mediaValues);
  if (!media.length) return;
  const lightbox = document.createElement('section');
  lightbox.className = 'media-lightbox';
  lightbox.setAttribute('role', 'document');
  lightbox.setAttribute('aria-label', (title || 'Media') + ' viewer');

  const top = document.createElement('div');
  top.className = 'media-lightbox-top';
  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = title || 'Media';
  const counter = document.createElement('span');
  counter.setAttribute('aria-live', 'polite');
  identity.append(name, counter);
  const close = button('media-lightbox-close', 'Close media viewer', ICONS.close);
  top.append(identity, close);

  const stage = document.createElement('div');
  stage.className = 'media-lightbox-stage';
  lightbox.append(top, stage);

  let previous = null;
  let next = null;
  if (media.length > 1) {
    previous = button('media-lightbox-nav is-previous', 'Previous media', ICONS.arrowLeft);
    next = button('media-lightbox-nav is-next', 'Next media', ICONS.arrowRight);
    previous.addEventListener('click', () => updateMediaLightbox(activeLightbox.index - 1));
    next.addEventListener('click', () => updateMediaLightbox(activeLightbox.index + 1));
    lightbox.append(previous, next);
  }

  let thumbs = null;
  if (media.length > 1) {
    thumbs = document.createElement('div');
    thumbs.className = 'media-lightbox-thumbs';
    media.forEach((url, thumbIndex) => thumbs.appendChild(lightboxThumb(url, thumbIndex)));
    lightbox.appendChild(thumbs);
  }

  dialog.appendChild(lightbox);
  activeLightbox = { element: lightbox, trigger, media, index: 0, title, stage, counter, thumbs };
  syncModalLayers();
  modal.classList.add('has-lightbox');
  close.addEventListener('click', () => closeMediaLightbox());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeMediaLightbox();
  });

  let touchStartX = 0;
  stage.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 48 || media.length < 2) return;
    updateMediaLightbox(activeLightbox.index + (delta < 0 ? 1 : -1));
  }, { passive: true });

  updateMediaLightbox(index || 0);
  requestAnimationFrame(() => {
    lightbox.classList.add('is-visible');
    close.focus({ preventScroll: true });
  });
}

function closeMediaLightbox(restoreFocus = true) {
  if (!activeLightbox) return;
  const { element, trigger } = activeLightbox;
  element.querySelectorAll('video').forEach(video => video.pause());
  element.remove();
  activeLightbox = null;
  syncModalLayers();
  const { modal } = modalElements();
  if (modal) modal.classList.remove('has-lightbox');
  if (restoreFocus && trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
}

function closeProjectModal() {
  const { modal, mount } = modalElements();
  if (!modal) return;
  closeMediaLightbox(false);
  closeCaseStudy(false);
  modal.classList.remove('is-open', 'is-brand-modal', 'is-gallery-brand', 'is-ready', 'has-case-study', 'has-lightbox');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousBodyOverflow;
  currentBrand = null;
  if (mount) mount.innerHTML = '';
  if (lastProjectTrigger && document.contains(lastProjectTrigger)) lastProjectTrigger.focus({ preventScroll: true });
  lastProjectTrigger = null;
}

function focusableElements(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(element => element.offsetParent !== null && element.getAttribute('aria-hidden') !== 'true');
}

document.addEventListener('keydown', event => {
  const { modal, dialog } = modalElements();
  if (!modal || !modal.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (activeLightbox) closeMediaLightbox();
    else if (activeCaseStudy) closeCaseStudy();
    else closeProjectModal();
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (activeLightbox && activeLightbox.media.length > 1) {
      event.preventDefault();
      updateMediaLightbox(activeLightbox.index + (event.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (activeCaseStudy && activeCaseStudy.media.length > 1 && !(event.target.closest && event.target.closest('video'))) {
      event.preventDefault();
      updateCaseMedia(activeCaseStudy.index + (event.key === 'ArrowRight' ? 1 : -1));
      return;
    }
  }

  if (event.key === 'Tab') {
    const root = activeLightbox ? activeLightbox.element : (activeCaseStudy ? activeCaseStudy.panel : dialog);
    let focusable = focusableElements(root);
    if (activeCaseStudy && !activeLightbox) {
      const close = document.getElementById('modalClose');
      const like = document.getElementById('modalLikeButton');
      const shellActions = [close, like].filter(element => element && element.offsetParent !== null && !element.disabled);
      focusable = shellActions.concat(focusable);
    }
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}, true);

Object.assign(window, {
  loadProjects,
  renderProjects,
  closeProjectModal,
  openBrandModal,
  renderFilters: () => {},
  filterProjects: () => allPortfolioProjects
});
