/**
 * Brand-first portfolio data, gallery experiences, and layered media viewer.
 */
const PROJECTS_URL = '/api.php?_query=projects';

// The Persian page (fa.html) runs the same renderer. Only the strings data.js
// owns are translated here; the content itself comes from the CMS.
const LANG = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';
// ---------------------------------------------------------------- strings
// Two complete packs, merged so a missing Persian key can never render as
// "undefined" on fa.html: anything the FA pack forgets falls back to English.
// Counted labels are functions because Persian does not pluralise after a
// number and uses Persian digits.
const STRINGS = {
  en: {
    caseStudy: 'Case study',
    untitled: 'Untitled project',
    noPreview: 'No preview',
    media: 'media',
    open: 'Open',
    projects: 'projects',
    emptyHeading: 'Want the reel and three recent samples?',
    emptyCopy: 'Send one line about the project — the goal and the deadline. You get the most relevant work, a scope and a price, not a gallery dump.',
    emptyCta: 'Send the brief',
    liveLabel: 'Watch it where it was published',
    client: 'Client',
    deliverable: 'Deliverable',
    outcome: 'Outcome',
    browse: 'Browse work',
    projectsLabel: 'projects',
    gallery: 'Gallery',
    caseStudies: 'Case studies',
    exploreWork: 'Explore the work',
    exploreHint: 'Select a project to see the full story and media.',
    openMedia: 'Open media',
    project: 'project',
    externalNote: 'This video is hosted on YouTube/Vimeo. Loading it sends your IP address to that provider.',
    previousMedia: 'Previous media',
    nextMedia: 'Next media',
    loading: 'Loading…',
    loadError: 'Could not load the portfolio.',
    ctaAria: 'Start a project with me',
    ctaTitle: 'Your project next?',
    ctaSub: 'Tell me what the video has to do — you get a scope, a price and a timeline back.',
    ctaAction: 'Send the brief',
    why: 'Why it matters',
    mediaUnavailable: 'Media unavailable',
    loadVideo: 'Load video',
    embeddedVideo: 'Embedded video',
    videoLabel: 'Video',
    previewImage: 'Preview image',
    untitledBrand: 'Untitled brand',
    brandCover: 'Brand cover image',
    coverSuffix: ' — cover image',
    mediaGallery: 'Media gallery',
    selectedWork: 'Selected work',
    preparingGallery: 'Preparing gallery',
    mediaGallerySuffix: ' media gallery',
    role: 'Role',
    allProjects: 'All projects',
    projectMedia: 'Project media',
    noMediaAdded: 'No media added',
    backToAll: 'Back to all projects',
    viewFullscreen: 'View media fullscreen',
    closeViewer: 'Close media viewer',
    mediaViewerSuffix: ' viewer',
    mediaShort: 'Media',
    previewSuffix: ' — preview',
    previewImageSuffix: ' — preview image',
    mediaTitleSuffix: ' — media ',
    thumbSuffix: ' — thumbnail ',
    showMedia: 'Show media ',
    ofWord: ' of ',
    countProjects: n => n + ' project' + (n === 1 ? '' : 's'),
    countCaseStudies: n => n + ' case stud' + (n === 1 ? 'y' : 'ies'),
    countMedia: n => n + ' media item' + (n === 1 ? '' : 's')
  },
  fa: {
    caseStudy: 'پروژه',
    untitled: 'بدون عنوان',
    noPreview: 'پیش‌نمایشی نداره',
    media: 'فایل',
    open: 'نمایش',
    projects: 'پروژه',
    emptyHeading: 'ریل و سه نمونه‌کار تازه می‌خوای؟',
    emptyCopy: 'یه خط از پروژه بنویس — هدف و ددلاین. مرتبط‌ترین کارها + شرح کار و قیمت رو می‌گیری، نه یه گالری بی‌ربط.',
    emptyCta: 'بریف رو بفرست',
    liveLabel: 'کار رو سر جاش ببین',
    client: 'کارفرما',
    deliverable: 'تحویل',
    outcome: 'نتیجه',
    browse: 'دیدن نمونه‌کارها',
    projectsLabel: 'پروژه',
    gallery: 'گالری',
    caseStudies: 'پروژه‌ها',
    exploreWork: 'کارها رو ببین',
    exploreHint: 'یه پروژه رو انتخاب کن تا کل ماجرا و فایل‌هاش رو ببینی.',
    openMedia: 'بازکردن فایل',
    project: 'پروژه',
    externalNote: 'این ویدیو روی یوتیوب/ویمئو میزبانی می‌شه؛ بازکردنش IP شما رو برای اون سرویس می‌فرسته.',
    previousMedia: 'فایل قبلی',
    nextMedia: 'فایل بعدی',
    loading: 'داره بارگذاری می‌شه…',
    loadError: 'نمونه‌کارها بارگذاری نشد.',
    ctaAria: 'شروع پروژه با من',
    ctaTitle: 'پروژهٔ بعدی، مال تو؟',
    ctaSub: 'بگو این ویدیو باید چه کاری انجام بده — شرح کار و قیمت رو برات می‌فرستم.',
    ctaAction: 'بریف رو بفرست',
    why: 'چرا مهمه؟',
    mediaUnavailable: 'فایل در دسترس نیست',
    loadVideo: 'پخش ویدیو',
    embeddedVideo: 'ویدیو',
    videoLabel: 'ویدیو',
    previewImage: 'تصویر پیش‌نمایش',
    untitledBrand: 'برند بدون نام',
    brandCover: 'تصویر برند',
    coverSuffix: ' — تصویر برند',
    mediaGallery: 'گالری فایل',
    selectedWork: 'نمونه‌کارها',
    preparingGallery: 'داره آماده می‌شه…',
    mediaGallerySuffix: ' — گالری فایل',
    role: 'نقش',
    allProjects: 'همهٔ پروژه‌ها',
    projectMedia: 'فایل‌های پروژه',
    noMediaAdded: 'فایلی اضافه نشده',
    backToAll: 'برگشت به همهٔ پروژه‌ها',
    viewFullscreen: 'دیدن فایل در تمام صفحه',
    closeViewer: 'بستن نمایشگر',
    mediaViewerSuffix: ' — نمایشگر',
    mediaShort: 'فایل',
    previewSuffix: ' — پیش‌نمایش',
    previewImageSuffix: ' — تصویر پیش‌نمایش',
    mediaTitleSuffix: ' — فایل ',
    thumbSuffix: ' — تصویر بندانگشتی ',
    showMedia: 'نمایش فایل ',
    ofWord: ' از ',
    countProjects: n => faDigits(n) + ' پروژه',
    countCaseStudies: n => faDigits(n) + ' پروژه',
    countMedia: n => faDigits(n) + ' فایل'
  }
};

const T = Object.assign({}, STRINGS.en, STRINGS[LANG]);

let siteBrands = [];
let allPortfolioProjects = [];
let lastProjectTrigger = null;
let currentBrand = null;
let activeCaseStudy = null;
let activeLightbox = null;
let modalScrollPosition = 0;
let previousBodyOverflow = '';
let galleryResizeObserver = null;
let galleryLayoutFrame = null;
let galleryResizeHandler = null;

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

// "Why it matters" — an optional block per project. It is the one part of a
// case study a visitor cannot get anywhere else, so it is rendered as plain
// text on the card and with its metrics inside the case study.
// Accepted shapes: { text, metrics:[{label,value}] } or a plain string.
function whyMatters(project) {
  const raw = (LANG === 'fa' && project.whyMattersFa && (project.whyMattersFa.text || typeof project.whyMattersFa === 'string'))
    ? project.whyMattersFa
    : project.whyMatters;
  if (!raw) return null;
  const source = typeof raw === 'string' ? { text: raw } : raw;
  const text = typeof source.text === 'string' ? source.text.trim() : '';
  const metrics = Array.isArray(source.metrics)
    ? source.metrics
        .filter(m => m && (m.value || m.label))
        .slice(0, 3)
        .map(m => ({ value: faDigits(String(m.value || '').trim()), label: String(m.label || '').trim() }))
    : [];
  if (!text && !metrics.length) return null;
  return { text, metrics };
}

// Persian pages read better with Persian numerals. Only ASCII digits inside
// owner-entered values are converted, never the site's own markup.
function faDigits(value) {
  if (LANG !== 'fa' || !value) return value;
  return String(value).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

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
    missing.textContent = T.mediaUnavailable;
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
      // Third-party player: only embedded after consent (or after an explicit
      // click in this session). Until then the visitor sees a clear choice.
      const manager = window.portfolioConsent;
      const mediaAllowed = !manager || typeof manager.allowed !== 'function' || manager.allowed('media');
      if (!mediaAllowed) {
        const gate = document.createElement('div');
        gate.className = 'portfolio-embed-gate';
        const note = document.createElement('p');
        note.textContent = T.externalNote;
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'btn btn-primary';
        load.textContent = T.loadVideo;
        load.addEventListener('click', () => {
          if (manager && typeof manager.allowMediaForSession === 'function') manager.allowMediaForSession();
          const frame = document.createElement('iframe');
          frame.src = embed + (embed.indexOf('?') > -1 ? '&' : '?') + 'rel=0';
          frame.title = title || T.embeddedVideo;
          frame.loading = 'lazy';
          frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
          frame.allowFullscreen = true;
          frame.referrerPolicy = 'strict-origin-when-cross-origin';
          gate.replaceWith(frame);
        });
        gate.append(note, load);
        return gate;
      }
      const frame = document.createElement('iframe');
      frame.src = embed;
      frame.title = title || T.embeddedVideo;
      frame.loading = 'lazy';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      return frame;
    }
  }

  if (isDirectVideo(url)) {
    const video = document.createElement('video');
    video.src = url;
    const poster = safeUrl(options.poster);
    if (poster) video.poster = poster;
    video.playsInline = true;
    video.preload = viewer ? 'metadata' : 'metadata';
    video.controls = viewer;
    video.muted = !viewer;
    video.setAttribute('aria-label', title || T.videoLabel);
    if (!viewer) video.tabIndex = -1;
    return video;
  }

  const image = document.createElement('img');
  image.src = url;
  // Always give the image a usable name: alt text comes from the brand/project
  // title, and generic previews fall back to something descriptive rather than "".
  image.alt = title || (options.altFallback || T.previewImage);
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

function brandGalleryPoster(brand, mediaUrl) {
  if (!brand || !brand.galleryPosters || typeof brand.galleryPosters !== 'object') return '';
  if (brand.galleryPosters[mediaUrl]) return safeUrl(brand.galleryPosters[mediaUrl]);
  const matchingKey = Object.keys(brand.galleryPosters).find(key => safeUrl(key) === mediaUrl);
  return matchingKey ? safeUrl(brand.galleryPosters[matchingKey]) : '';
}

function brandGalleryAspect(brand, mediaUrl) {
  if (!brand || !brand.galleryAspects || typeof brand.galleryAspects !== 'object') return 0;
  let value = brand.galleryAspects[mediaUrl];
  if (value == null) {
    const matchingKey = Object.keys(brand.galleryAspects).find(key => safeUrl(key) === mediaUrl);
    if (matchingKey) value = brand.galleryAspects[matchingKey];
  }
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio >= 0.05 && ratio <= 20 ? ratio : 0;
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
    // Never show admin instructions to a visitor. If the grid is empty, the
    // useful thing is a straight path to asking for the work directly.
    const empty = document.createElement('div');
    empty.className = 'projects-public-empty';
    const heading = document.createElement('h3');
    heading.textContent = T.emptyHeading;
    const copy = document.createElement('p');
    copy.textContent = T.emptyCopy;
    const cta = document.createElement('a');
    cta.className = 'btn btn-primary';
    cta.href = '#contact';
    cta.textContent = T.emptyCta;
    cta.addEventListener('click', () => {
      if (window.portfolioTracking) window.portfolioTracking.track('contact_cta', { source: 'empty-work-grid' });
    });
    empty.append(heading, copy, cta);
    grid.appendChild(empty);
  }

  visibleBrands.forEach((brand, index) => {
    const mode = brandMode(brand);
    const count = mode === 'gallery' ? brandGallery(brand).length : brandProjects(brand).length;
    const countLabel = mode === 'gallery' ? T.countMedia(count) : T.countProjects(count);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'brand-card is-' + mode;
    card.style.setProperty('--brand-index', index);
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', T.open + ' ' + brand.name + ', ' + countLabel);

    const cover = mediaElement(brand.thumbnail, {
      title: brand.name ? brand.name + ' — cover image' : 'Brand cover image'
    });
    cover.className = 'brand-card-image';
    card.appendChild(cover);

    const overlay = document.createElement('span');
    overlay.className = 'brand-card-overlay';
    const kind = document.createElement('span');
    kind.className = 'brand-card-kind';
    kind.innerHTML = mode === 'gallery' ? ICONS.gallery + '<span>' + T.gallery + '</span>' : '<span>' + T.caseStudies + '</span>';
    const name = document.createElement('strong');
    name.textContent = brand.name || T.untitledBrand;
    const meta = document.createElement('small');
    meta.textContent = countLabel;
    overlay.append(kind, name, meta);
    card.appendChild(overlay);

    card.addEventListener('click', () => openBrandModal(brand, card));
    grid.appendChild(card);
  });

  // CTA Card — always last, invites next collaboration
  const cta = document.createElement('a');
  cta.href = '#contact';
  cta.className = 'brand-card-cta';
  cta.setAttribute('aria-label', T.ctaAria);
  cta.innerHTML = '' +
    '<span class=\"brand-card-cta-icon\">' +
      '<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" aria-hidden=\"true\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line></svg>' +
    '</span>' +
    '<span class=\"brand-card-cta-title\">' + T.ctaTitle + '</span>' +
    '<span class=\"brand-card-cta-sub\">' + T.ctaSub + '</span>' +
    '<span class=\"brand-card-cta-action\"><span>' + T.ctaAction + '</span><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"m9 18 6-6-6-6\"></path></svg></span>';
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('contact');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
  grid.appendChild(cta);

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

  const cover = mediaElement(brand.thumbnail, {
    title: brand.name ? brand.name + ' — cover image' : 'Brand cover image'
  });
  cover.className = 'portfolio-brand-cover';
  hero.appendChild(cover);

  const shade = document.createElement('div');
  shade.className = 'portfolio-brand-shade';
  hero.appendChild(shade);

  const copy = document.createElement('div');
  copy.className = 'portfolio-brand-copy';
  const type = document.createElement('span');
  type.className = 'portfolio-brand-type';
  type.innerHTML = mode === 'gallery' ? ICONS.gallery + '<span>' + T.mediaGallery + '</span>' : '<span>' + T.selectedWork + '</span>';
  const title = document.createElement('h2');
  title.id = 'portfolioModalTitle';
  title.textContent = brand.name || T.untitledBrand;
  const meta = document.createElement('p');
  meta.textContent = mode === 'gallery' ? T.countMedia(count) : T.countCaseStudies(count);
  copy.append(type, title, meta);
  hero.appendChild(copy);
  return hero;
}

function galleryTargetHeight(width) {
  if (width <= 460) return 155;
  if (width <= 760) return 178;
  return Math.max(195, Math.min(230, width * 0.215));
}

function galleryGap(grid) {
  const styles = getComputedStyle(grid);
  return Number.parseFloat(styles.columnGap || styles.gap) || 10;
}

function rowHeightForWidth(row, width, gap) {
  const ratioTotal = row.reduce((sum, tile) => sum + (Number.parseFloat(tile.dataset.aspect) || 4 / 3), 0);
  return ratioTotal > 0 ? (width - gap * Math.max(0, row.length - 1)) / ratioTotal : 0;
}

function sizeGalleryRow(row, gridWidth, gap, height, fillRow) {
  if (!row.length || !height) return;
  const availableWidth = gridWidth - gap * Math.max(0, row.length - 1);
  let usedWidth = 0;

  row.forEach((tile, index) => {
    const ratio = Number.parseFloat(tile.dataset.aspect) || 4 / 3;
    let width = ratio * height;
    if (fillRow && index === row.length - 1) width = Math.max(1, availableWidth - usedWidth);
    usedWidth += width;
    tile.style.width = width.toFixed(2) + 'px';
    tile.style.height = height.toFixed(2) + 'px';
    tile.style.flexBasis = width.toFixed(2) + 'px';
    tile.style.setProperty('--media-aspect', String(ratio));
  });
}

function layoutGalleryCollage(grid) {
  if (!grid || !grid.isConnected) return;
  const tiles = Array.from(grid.querySelectorAll('.brand-gallery-tile'));
  const gridWidth = grid.clientWidth;
  if (!tiles.length || gridWidth < 1) return;

  const gap = galleryGap(grid);
  const targetHeight = galleryTargetHeight(gridWidth);
  let row = [];

  tiles.forEach(tile => {
    const candidate = row.concat(tile);
    const candidateHeight = rowHeightForWidth(candidate, gridWidth, gap);
    if (candidateHeight > targetHeight) {
      row = candidate;
      return;
    }

    if (row.length) {
      const previousHeight = rowHeightForWidth(row, gridWidth, gap);
      const smallestCandidateRatio = Math.min(...candidate.map(item => Number.parseFloat(item.dataset.aspect) || 4 / 3));
      const minimumRowItemWidth = gridWidth <= 460 ? 100 : 110;
      const candidateWouldBeTooSmall = smallestCandidateRatio * candidateHeight < minimumRowItemWidth;
      const previousIsComfortable = previousHeight <= targetHeight * 1.3;
      const previousIsCloser = Math.abs(previousHeight - targetHeight) < Math.abs(candidateHeight - targetHeight);
      if (previousIsComfortable && (candidateWouldBeTooSmall || previousIsCloser)) {
        sizeGalleryRow(row, gridWidth, gap, previousHeight, true);
        row = [tile];
        return;
      }
    }

    sizeGalleryRow(candidate, gridWidth, gap, candidateHeight, true);
    row = [];
  });

  if (row.length) {
    const fittedHeight = rowHeightForWidth(row, gridWidth, gap);
    const smallestRatio = Math.min(...row.map(tile => Number.parseFloat(tile.dataset.aspect) || 4 / 3));
    const minimumVisualWidth = gridWidth <= 460 ? 105 : 125;
    const comfortableHeight = minimumVisualWidth / smallestRatio;
    const lastRowHeight = Math.min(
      fittedHeight,
      targetHeight * 1.3,
      Math.max(targetHeight, comfortableHeight)
    );
    sizeGalleryRow(row, gridWidth, gap, lastRowHeight, fittedHeight <= lastRowHeight);
  }
}

function scheduleGalleryLayout(grid) {
  if (galleryLayoutFrame) cancelAnimationFrame(galleryLayoutFrame);
  galleryLayoutFrame = requestAnimationFrame(() => {
    galleryLayoutFrame = null;
    layoutGalleryCollage(grid);
  });
}

function disconnectGalleryLayout() {
  if (galleryResizeObserver) galleryResizeObserver.disconnect();
  galleryResizeObserver = null;
  if (galleryResizeHandler) window.removeEventListener('resize', galleryResizeHandler);
  galleryResizeHandler = null;
  if (galleryLayoutFrame) cancelAnimationFrame(galleryLayoutFrame);
  galleryLayoutFrame = null;
}

function observeGalleryLayout(grid) {
  disconnectGalleryLayout();
  if (typeof ResizeObserver === 'function') {
    let observedWidth = 0;
    galleryResizeObserver = new ResizeObserver(entries => {
      const width = entries[0] ? entries[0].contentRect.width : grid.clientWidth;
      if (Math.abs(width - observedWidth) < 0.5) return;
      observedWidth = width;
      scheduleGalleryLayout(grid);
    });
    galleryResizeObserver.observe(grid);
  } else {
    galleryResizeHandler = () => scheduleGalleryLayout(grid);
    window.addEventListener('resize', galleryResizeHandler, { passive: true });
  }
  scheduleGalleryLayout(grid);
}

function setGalleryTileAspect(tile, preview, grid, persistedAspect) {
  const known = Number(persistedAspect);
  if (Number.isFinite(known) && known >= 0.05 && known <= 20) {
    tile.dataset.aspect = String(known);
    return Promise.resolve(known);
  }

  return new Promise(resolve => {
    let settled = false;
    const finish = (width, height) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const measured = Number(width) / Number(height);
      const ratio = Number.isFinite(measured) && measured >= 0.05 && measured <= 20
        ? measured
        : (Number.parseFloat(tile.dataset.aspect) || 4 / 3);
      tile.dataset.aspect = String(ratio);
      scheduleGalleryLayout(grid);
      resolve(ratio);
    };
    const timeout = setTimeout(() => finish(0, 0), 4000);

    if (preview instanceof HTMLImageElement) {
      preview.addEventListener('load', () => finish(preview.naturalWidth, preview.naturalHeight), { once: true });
      preview.addEventListener('error', () => finish(0, 0), { once: true });
      if (preview.complete) finish(preview.naturalWidth, preview.naturalHeight);
    } else if (preview instanceof HTMLVideoElement) {
      preview.addEventListener('loadedmetadata', () => finish(preview.videoWidth, preview.videoHeight), { once: true });
      preview.addEventListener('error', () => finish(0, 0), { once: true });
      if (preview.readyState >= 1) finish(preview.videoWidth, preview.videoHeight);
    } else {
      finish(0, 0);
    }
  });
}

function galleryTile(url, index, brand, grid) {
  const tile = button('brand-gallery-tile', T.openMedia + ' ' + (index + 1) + ' / ' + brandGallery(brand).length);
  tile.dataset.index = String(index);
  const persistedAspect = brandGalleryAspect(brand, url);
  tile.dataset.aspect = String(persistedAspect || (isVideo(url) ? 16 / 9 : 4 / 3));
  tile.style.setProperty('--gallery-order', index);

  const total = brandGallery(brand).length;
  const preview = mediaElement(url, {
    title: (brand.name || T.untitledBrand) + T.mediaTitleSuffix + faDigits(index + 1) + T.ofWord + faDigits(total),
    poster: brandGalleryPoster(brand, url)
  });
  preview.classList.add('brand-gallery-preview');
  if (preview instanceof HTMLImageElement && (index < 16 || !persistedAspect)) preview.loading = 'eager';
  tile.appendChild(preview);
  tile.aspectReady = setGalleryTileAspect(tile, preview, grid, persistedAspect);

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
  body.setAttribute('aria-label', (brand.name || T.untitledBrand) + T.mediaGallerySuffix);

  const loader = document.createElement('div');
  loader.className = 'brand-gallery-loading';
  loader.setAttribute('role', 'status');
  loader.innerHTML = '<span aria-hidden="true"></span><small>' + T.preparingGallery + '</small>';

  const grid = document.createElement('div');
  grid.className = 'brand-gallery-grid';
  const tiles = media.map((url, index) => galleryTile(url, index, brand, grid));
  tiles.forEach(tile => grid.appendChild(tile));
  body.append(loader, grid);
  mount.appendChild(body);

  Promise.all(tiles.map(tile => tile.aspectReady)).then(() => {
    if (!grid.isConnected) return;
    layoutGalleryCollage(grid);
    observeGalleryLayout(grid);
    requestAnimationFrame(() => {
      if (!grid.isConnected) return;
      grid.classList.add('is-collage-ready');
      body.classList.add('is-collage-ready');
      loader.remove();
    });
  });
}

function projectCard(project, index) {
  const media = projectMedia(project);
  const card = button('portfolio-project-card', T.open + ' ' + (project.title || T.project));
  card.dataset.id = String(project.id || '');
  card.style.setProperty('--project-order', index);

  const visual = document.createElement('span');
  visual.className = 'portfolio-project-visual';
  const previewUrl = projectPreview(project, media);
  if (previewUrl) {
    const preview = mediaElement(previewUrl, {
      title: (project.title || T.untitled) + T.previewSuffix,
      altFallback: (project.title || T.untitled) + T.previewImageSuffix
    });
    preview.classList.add('portfolio-project-preview');
    visual.appendChild(preview);
  } else {
    const missing = document.createElement('span');
    missing.className = 'portfolio-project-empty';
    missing.textContent = T.noPreview;
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
    mediaCount.textContent = media.length + ' ' + T.media;
    visual.appendChild(mediaCount);
  }

  // Hover preview: a short muted clip is the difference between "nice picture"
  // and "this person animates". Skipped on touch and for reduced motion.
  const previewClip = safeUrl(project.previewVideo);
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchDevice = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (previewClip && isDirectVideo(previewClip) && !reducedMotion && (canHover || touchDevice)) {
    const clip = document.createElement('video');
    clip.className = 'portfolio-project-clip';
    clip.muted = true;
    clip.loop = true;
    clip.playsInline = true;
    clip.preload = 'none';
    clip.tabIndex = -1;
    clip.setAttribute('aria-hidden', 'true');
    clip.src = previewClip;
    visual.appendChild(clip);
    let counted = false;
    if (touchDevice && 'IntersectionObserver' in window) {
      // Phones have no hover: play the clip only while the card is on screen,
      // and stop as soon as it leaves. Motion is the product; a still frame
      // hides it.
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const started = clip.play();
            if (started && started.catch) started.catch(() => {});
            if (!counted && window.portfolioTracking) {
              counted = true;
              window.portfolioTracking.track('case_preview_play', { projectId: String(project.id || ''), device: 'touch' });
            }
          } else {
            clip.pause();
          }
        });
      }, { threshold: 0.6 });
      observer.observe(card);
    }

    card.addEventListener('pointerenter', () => {
      const playing = clip.play();
      if (playing && playing.then) {
        playing.then(() => {
          if (counted) return;
          counted = true;
          if (window.portfolioTracking) {
            window.portfolioTracking.track('case_preview_play', { projectId: String(project.id || '') });
          }
        }).catch(() => {});
      }
    });
    card.addEventListener('pointerleave', () => {
      clip.pause();
      try { clip.currentTime = 0; } catch (error) {}
    });
  }

  const details = document.createElement('span');
  details.className = 'portfolio-project-details';
  const text = document.createElement('span');
  const year = document.createElement('small');
  year.textContent = project.year || T.caseStudy;
  const title = document.createElement('strong');
  title.textContent = (LANG === 'fa' && project.titleFa) ? project.titleFa
    : (project.title || T.untitled);
  text.append(year, title);
  // Who it was for and what came out of it — the two things a buyer scans for.
  const cardFacts = [];
  if (project.client) cardFacts.push(project.client);
  if (project.deliverable) cardFacts.push(project.deliverable);
  if (cardFacts.length) {
    const facts = document.createElement('span');
    facts.className = 'portfolio-project-facts';
    facts.textContent = cardFacts.join(' · ');
    text.appendChild(facts);
  }
  // Proof line directly on the card. Spans only: the card itself is a button,
  // so no nested interactive or block-level elements are allowed in here.
  const why = whyMatters(project);
  if (why && why.text) {
    const block = document.createElement('span');
    block.className = 'portfolio-project-why';
    const label = document.createElement('span');
    label.className = 'portfolio-project-why-label';
    label.textContent = T.why;
    const body = document.createElement('span');
    body.className = 'portfolio-project-why-text';
    body.textContent = why.text;
    block.append(label, body);
    text.appendChild(block);
  }
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
  eyebrow.textContent = T.caseStudies;
  const title = document.createElement('h3');
  title.textContent = T.exploreWork;
  heading.append(eyebrow, title);
  const hint = document.createElement('p');
  hint.textContent = T.exploreHint;
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
  disconnectGalleryLayout();
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
  title.textContent = (LANG === 'fa' && project.titleFa) ? project.titleFa
    : (project.title || T.untitled);
  info.appendChild(title);

  const summary = (LANG === 'fa' && project.descriptionFa) ? project.descriptionFa : project.description;
  if (summary) {
    const description = document.createElement('p');
    description.className = 'case-study-description';
    description.textContent = summary;
    info.appendChild(description);
  }

  // Client / deliverable / outcome first: the three lines that decide whether
  // someone keeps reading. Only shown when the CMS actually holds them.
  const caseFacts = [
    [T.client, project.client],
    [T.deliverable, project.deliverable],
    [T.outcome, project.outcome]
  ].filter(pair => pair[1] && String(pair[1]).trim() !== '');
  if (caseFacts.length) {
    const facts = document.createElement('dl');
    facts.className = 'case-study-facts';
    caseFacts.forEach(pair => {
      const row = document.createElement('div');
      row.className = 'case-study-fact';
      const label = document.createElement('dt');
      label.textContent = pair[0];
      const value = document.createElement('dd');
      value.textContent = pair[1];
      row.append(label, value);
      facts.appendChild(row);
    });
    info.appendChild(facts);
  }

  // Why it matters: the owner's own words plus, when given, the numbers.
  const whyBlock = whyMatters(project);
  if (whyBlock) {
    const block = document.createElement('div');
    block.className = 'case-study-why';
    const label = document.createElement('span');
    label.className = 'case-study-why-label';
    label.textContent = T.why;
    block.appendChild(label);
    if (whyBlock.text) {
      const body = document.createElement('p');
      body.className = 'case-study-why-text';
      body.textContent = whyBlock.text;
      block.appendChild(body);
    }
    if (whyBlock.metrics.length) {
      const list = document.createElement('dl');
      list.className = 'case-study-why-metrics';
      whyBlock.metrics.forEach(metric => {
        const cell = document.createElement('div');
        const value = document.createElement('dt');
        value.textContent = metric.value;
        const name = document.createElement('dd');
        name.textContent = metric.label;
        cell.append(value, name);
        list.appendChild(cell);
      });
      block.appendChild(list);
    }
    info.appendChild(block);
  }

  // Where the work actually went live: the strongest proof a fixed-price
  // project can carry, because the visitor can go and watch it.
  const publishedUrl = safeUrl(project.publishedUrl);
  if (publishedUrl) {
    const live = document.createElement('a');
    live.className = 'case-study-live';
    live.href = publishedUrl;
    live.target = '_blank';
    live.rel = 'noopener';
    live.textContent = T.liveLabel + ' ↗';
    live.addEventListener('click', () => {
      if (window.portfolioTracking) window.portfolioTracking.track('case_live_click', { projectId: String(project.id || '') });
    });
    info.appendChild(live);
  }

  const hasTools = Array.isArray(project.tools) && project.tools.length > 0;
  if (project.role || hasTools) {
    const details = document.createElement('div');
    details.className = 'case-study-details';
    if (project.role) {
      const role = document.createElement('div');
      role.className = 'case-study-role';
      const label = document.createElement('span');
      label.textContent = T.role;
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
  stage.appendChild(mediaElement(url, { title: project.title || T.projectMedia, viewer: true }));
  if (counter) counter.textContent = faDigits(activeCaseStudy.index + 1) + ' / ' + faDigits(media.length);
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
  // One event per open: this is the number that says whether the work section
  // is doing its job.
  if (window.portfolioTracking && project) {
    window.portfolioTracking.track('case_open', { projectId: String(project.id || ''), title: String(project.title || '') });
  }

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
  const back = button('case-study-back', T.backToAll, ICONS.back);
  const backText = document.createElement('span');
  backText.textContent = currentBrand ? currentBrand.name : T.allProjects;
  back.appendChild(backText);
  const mediaLabel = document.createElement('span');
  mediaLabel.className = 'case-study-toolbar-label';
  mediaLabel.textContent = T.caseStudy;
  toolbar.append(back, mediaLabel);

  const viewer = document.createElement('div');
  viewer.className = 'case-study-viewer';
  const stage = document.createElement('div');
  stage.className = 'case-study-stage';
  viewer.appendChild(stage);

  let counter = null;
  if (media.length) {
    const expand = button('case-study-expand', T.viewFullscreen, ICONS.expand);
    expand.addEventListener('click', () => openMediaLightbox(media, activeCaseStudy ? activeCaseStudy.index : 0, project.title, expand));
    viewer.appendChild(expand);
  }

  if (media.length > 1) {
    const previous = button('case-study-nav is-previous', T.previousMedia, ICONS.arrowLeft);
    const next = button('case-study-nav is-next', T.nextMedia, ICONS.arrowRight);
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
    thumbs.setAttribute('aria-label', T.projectMedia);
    media.forEach((url, index) => {
      const thumb = button('case-study-thumb', T.showMedia + faDigits(index + 1) + T.ofWord + faDigits(media.length));
      thumb.appendChild(mediaElement(url, { title: (project.title || T.untitled) + T.mediaTitleSuffix + faDigits(index + 1) }));
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
    missing.textContent = T.noMediaAdded;
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

function lightboxThumb(url, index, total, label) {
  const thumb = button('media-lightbox-thumb', T.showMedia + faDigits(index + 1) + T.ofWord + faDigits(total || index + 1));
  thumb.appendChild(mediaElement(url, {
    title: (label || T.mediaShort) + T.thumbSuffix + faDigits(index + 1),
    altFallback: (label || T.mediaShort) + T.thumbSuffix + faDigits(index + 1)
  }));
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
  stage.appendChild(mediaElement(url, { title: title || T.mediaShort, viewer: true }));
  counter.textContent = faDigits(activeLightbox.index + 1) + ' / ' + faDigits(media.length);
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
  lightbox.setAttribute('aria-label', (title || T.mediaShort) + T.mediaViewerSuffix);

  const top = document.createElement('div');
  top.className = 'media-lightbox-top';
  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = title || T.mediaShort;
  const counter = document.createElement('span');
  counter.setAttribute('aria-live', 'polite');
  identity.append(name, counter);
  const close = button('media-lightbox-close', T.closeViewer, ICONS.close);
  top.append(identity, close);

  const stage = document.createElement('div');
  stage.className = 'media-lightbox-stage';
  lightbox.append(top, stage);

  let previous = null;
  let next = null;
  if (media.length > 1) {
    previous = button('media-lightbox-nav is-previous', T.previousMedia, ICONS.arrowLeft);
    next = button('media-lightbox-nav is-next', T.nextMedia, ICONS.arrowRight);
    previous.addEventListener('click', () => updateMediaLightbox(activeLightbox.index - 1));
    next.addEventListener('click', () => updateMediaLightbox(activeLightbox.index + 1));
    lightbox.append(previous, next);
  }

  let thumbs = null;
  if (media.length > 1) {
    thumbs = document.createElement('div');
    thumbs.className = 'media-lightbox-thumbs';
    media.forEach((url, thumbIndex) => thumbs.appendChild(lightboxThumb(url, thumbIndex, media.length, title)));
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
  disconnectGalleryLayout();
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
  filterProjects: () => allPortfolioProjects,
  // Exposed so the automated tests can prove the two language packs stay in
  // step — a Persian key that goes missing is what renders "undefined".
  portfolioStrings: STRINGS,
  portfolioCopy: T
});
