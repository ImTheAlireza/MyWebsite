/**
 * js/work.js — renders every CMS-driven section
 *
 * Work grid → brand hub → case study, brand galleries, services, process,
 * experience/education, toolkit and rates. All copy comes from the CMS;
 * every element that has nothing to say is left out rather than faked.
 */
(function () {
  'use strict';

  var PAGE_LANG = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';
  var PROJECTS_URL = '/api.php?_query=projects';

  var state = {
    settings: {},
    brands: [],
    projects: [],
    filter: 'all',
    dialogStack: [],
    lightbox: null,
    currentBrand: null
  };

  function setText(key, value) {
    var node = document.querySelector('[data-setting="' + key + '"]');
    if (node && hasValue(value)) node.textContent = value;
  }
  function T(key) {
    return window.SiteI18n ? window.SiteI18n.t(key) : key;
  }
  function UI() { return window.SiteUI || {}; }
  function setting(key) { return UI().pick ? UI().pick(key) : state.settings[key]; }
  function hasValue(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  }
  function faDigits(value) {
    if (PAGE_LANG !== 'fa' || value == null) return value;
    return String(value).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[Number(d)]; });
  }
  function langField(base, faKey, enKey) {
    if (PAGE_LANG === 'fa') {
      var fa = base[faKey];
      if (hasValue(fa)) return fa;
    }
    return base[enKey] || '';
  }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    var paths = {
      arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
      arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
      back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
      play: '<path d="M8 5v14l11-7z"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
      gallery: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      screen: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
      film: '<polygon points="5 3 19 12 5 21 5 3"/>',
      share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 6.5M15.7 17.5 8.5 10.5"/>',
      spark: '<path d="M12 2 13.5 8.5H20l-5.5 4 2 6.5L12 15l-4.5 4 2-6.5L4 8.5h6.5L12 2z"/>',
      zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
      check: '<path d="M20 6 9 17l-5-5"/>'
    };
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="' + (name === 'play' ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' + (paths[name] || paths.screen) + '</svg>';
  }

  // ------------------------------------------------------------------ data
  function normaliseProjects(payload) {
    var projects = Array.isArray(payload.projects) ? payload.projects : [];
    var brands = Array.isArray(payload.brands) ? payload.brands : [];
    // The API only sends published projects to visitors; the admin preview keeps
    // drafts, so anything the API sent is fair game here.
    state.projects = projects.filter(function (p) { return !!p && p.published !== false; });
    state.brands = brands.slice().sort(function (a, b) {
      return (Number(a.order) || 0) - (Number(b.order) || 0);
    });
  }

  function brandProjects(brand) {
    return state.projects.filter(function (project) { return String(project.brand) === String(brand.id); });
  }
  function brandGallery(brand) {
    var seen = {};
    return (Array.isArray(brand.gallery) ? brand.gallery : []).filter(function (url) {
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }
  function brandMode(brand) { return brand && brand.mode === 'gallery' ? 'gallery' : 'projects'; }
  function projectMedia(project) {
    var media = [];
    var seen = {};
    var push = function (url) {
      if (!url || seen[url]) return;
      seen[url] = true;
      media.push(url);
    };
    push(project.video);
    (Array.isArray(project.gallery) ? project.gallery : []).forEach(push);
    push(project.thumbnail);
    return media;
  }
  function projectCover(project) {
    if (!project) return '';
    return project.thumbnail || project.video || (Array.isArray(project.gallery) ? project.gallery[0] : '') || '';
  }
  function whyMatters(project) {
    var raw = PAGE_LANG === 'fa' && project.whyMattersFa && hasValue(project.whyMattersFa.text || (project.whyMattersFa.metrics || []).length)
      ? project.whyMattersFa
      : project.whyMatters;
    if (!raw) return null;
    var source = typeof raw === 'string' ? { text: raw, metrics: [] } : raw;
    var text = typeof source.text === 'string' ? source.text.trim() : '';
    var metrics = Array.isArray(source.metrics) ? source.metrics.filter(function (m) {
      return m && (hasValue(m.value) || hasValue(m.label));
    }).slice(0, 3) : [];
    if (!text && !metrics.length) return null;
    return { text: text, metrics: metrics };
  }
  function categorySlug(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '');
  }
  var FILTER_SYNONYMS = {
    ui: ['ui', 'motion', 'موشن', 'product-motion', 'ui-motion'],
    explainer: ['explainer', 'explainers', 'e-learning', 'elearning', 'learning', 'اکسپلینر', 'آموزشی']
  };
  // The reference groups work three ways: all of it, by client brand, or by
  // the two service lanes. Draft-only brands are skipped by this filter so the
  // tile list stays honest.
  function brandMatchesFilter(brand, filter) {
    if (filter === 'all' || filter === 'brands') return true;
    if (brandMode(brand) === 'gallery') return false;
    return brandProjects(brand).some(function (project) { return projectMatchesFilter(project, filter); });
  }

  function projectMatchesFilter(project, filter) {
    if (filter === 'all') return true;
    var slug = categorySlug(project.category || '');
    var words = FILTER_SYNONYMS[filter] || [filter];
    if (words.indexOf(slug) > -1) return true;
    return words.some(function (word) {
      return slug.indexOf(categorySlug(word)) > -1 && categorySlug(word).length > 2;
    });
  }

  // ------------------------------------------------------------ work grid
  function visibleBrands() {
    return state.brands.filter(function (brand) {
      if (brandMode(brand) === 'gallery') return brandGallery(brand).length > 0;
      // A brand with its case studies still in draft keeps its card: opening it
      // shows the work in progress instead of a brand that leads nowhere.
      return true;
    }).filter(function (brand) {
      return brandMatchesFilter(brand, state.filter);
    });
  }

  function brandCard(brand, index) {
    var mode = brandMode(brand);
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'case-card';
    card.style.setProperty('--case-order', index);

    var projects = brandProjects(brand);
    var gallery = brandGallery(brand);
    var lead = mode === 'projects' ? projects[0] : null;
    var cover = mode === 'gallery' ? (brand.thumbnail || gallery[0]) : (brand.thumbnail || projectCover(lead));

    var media = el('div', 'case-card-media');
    if (cover) {
      var image = document.createElement('img');
      image.className = 'case-card-img';
      image.src = UI().safeHref ? UI().safeHref(cover) : cover;
      image.alt = brand.name || T('caseUntitledBrand');
      image.loading = index < 2 ? 'eager' : 'lazy';
      image.decoding = 'async';
      media.appendChild(image);
    } else {
      media.classList.add('is-empty');
      media.textContent = T('caseNoMedia');
    }

    var badges = el('div', 'case-card-badges');
    if (!cover) badges.appendChild(el('span', 'work-pill is-draft', T('draftBadge')));
    var kind = el('span', 'work-pill work-pill-accent',
      mode === 'gallery' ? T('caseGallery') : T('caseSelectedWork'));
    badges.appendChild(kind);
    if (lead && lead.year) badges.appendChild(el('span', 'work-pill', lead.year));
    media.appendChild(badges);

    if (mode === 'projects' && lead && UI().isVideoFile && UI().isVideoFile(lead.video || '')) {
      var play = el('span', 'case-card-play');
      play.innerHTML = icon('play');
      media.appendChild(play);
    }

    var body = el('div', 'case-card-body');
    var text = el('div');
    var clientRow = el('div', 'case-card-client');
    clientRow.textContent = brand.name || T('caseUntitledBrand');
    text.appendChild(clientRow);

    var titleText = mode === 'gallery'
      ? T('caseGallery')
      : (lead ? langField(lead, 'titleFa', 'title') : brand.name);
    text.appendChild(el('h3', 'case-card-title', titleText || T('caseUntitled')));

    var summary = mode === 'gallery'
      ? (gallery.length + ' ' + T('caseMediaCount'))
      : (lead ? langField(lead, 'descriptionFa', 'description') : '');
    if (hasValue(summary)) text.appendChild(el('p', 'case-card-summary', summary));

    var why = lead ? whyMatters(lead) : null;
    if (why && why.text) {
      var whyBlock = el('div', 'case-card-why');
      whyBlock.appendChild(el('strong', null, T('caseWhy')));
      whyBlock.appendChild(document.createTextNode(why.text));
      text.appendChild(whyBlock);
    }
    body.appendChild(text);

    var proof = el('div', 'case-card-proof');
    var metric = el('div', 'proof-metric');
    var count = mode === 'gallery' ? gallery.length : projects.length;
    metric.appendChild(el('strong', null,
      faDigits(count) + ' ' + (mode === 'gallery' ? T('caseMediaCount') : T('countCases'))));
    if (lead && hasValue(lead.client)) metric.appendChild(el('span', null, lead.client));
    proof.appendChild(metric);
    var arrow = el('span', 'case-card-arrow');
    arrow.innerHTML = icon('arrow');
    proof.appendChild(arrow);
    body.appendChild(proof);

    card.append(media, body);
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', function () {
      openBrand(brand, card);
    });
    return card;
  }

  function ctaCard() {
    var card = document.createElement('a');
    card.href = '#contact';
    card.className = 'work-cta-card';
    card.innerHTML =
      '<span class="work-cta-plus" aria-hidden="true">+</span>' +
      '<h3>' + escapeHtml(T('ctaCardTitle')) + '</h3>' +
      '<p>' + escapeHtml(T('ctaCardSub')) + '</p>' +
      '<span class="btn btn-primary btn-sm">' + escapeHtml(T('ctaCardAction')) + '</span>';
    return card;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderWork() {
    setText('workTitle', setting('workTitle'));
    setText('workIntro', setting('workIntro'));
    var grid = document.getElementById('workGrid');
    var badge = document.getElementById('workCountBadge');
    if (!grid) return;
    grid.innerHTML = '';

    var brands = visibleBrands();
    if (badge) {
      var total = brands.length;
      var noun = state.filter === 'brands' ? T('countBrands') : T('countCases');
      badge.textContent = PAGE_LANG === 'fa'
        ? faDigits(total) + ' ' + noun
        : total + ' ' + noun;
    }

    if (!brands.length) {
      var empty = el('div', 'work-empty');
      empty.appendChild(el('h3', null, T('workEmptyTitle')));
      empty.appendChild(el('p', null, T('workEmptyCopy')));
      var cta = document.createElement('a');
      cta.href = '#contact';
      cta.className = 'btn btn-primary';
      cta.textContent = T('workEmptyCta');
      empty.appendChild(cta);
      grid.appendChild(empty);
      return;
    }

    brands.forEach(function (brand, index) {
      grid.appendChild(brandCard(brand, index));
    });
    grid.appendChild(ctaCard());
    if (UI().revealItems) UI().revealItems(grid, '.case-card');
  }

  function wireFilters() {
    var buttons = document.querySelectorAll('#workFilters .filter-pill');
    var available = {};
    state.projects.forEach(function (project) {
      available[categorySlug(project.category || '')] = true;
    });
    buttons.forEach(function (btn) {
      var filter = btn.getAttribute('data-filter');
      if (filter && filter !== 'all') {
        var words = FILTER_SYNONYMS[filter] || [filter];
        var used = Object.keys(available).some(function (slug) {
          return words.some(function (word) { return slug === categorySlug(word); });
        });
        // No project carries this category yet: keep the pill but explain it.
        btn.setAttribute('aria-disabled', used ? 'false' : 'true');
        btn.style.opacity = used ? '' : '0.45';
      }
      btn.addEventListener('click', function () {
        buttons.forEach(function (other) {
          other.classList.remove('is-active');
          other.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        state.filter = filter || 'all';
        renderWork();
      });
    });
  }

  // ----------------------------------------------------------- brand view
  function openDialog() {
    var dialog = document.getElementById('portfolioDialog');
    if (!dialog) return null;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    return dialog;
  }

  function setDialogHead(kicker, title) {
    var k = document.getElementById('dialogKicker');
    var t = document.getElementById('dialogTitle');
    if (k) k.textContent = kicker;
    if (t) t.textContent = title;
  }

  function updateBackButton() {
    var back = document.getElementById('dialogBackBtn');
    if (!back) return;
    back.hidden = state.dialogStack.length < 2;
    back.onclick = function () {
      state.dialogStack.pop();
      var previous = state.dialogStack[state.dialogStack.length - 1];
      if (previous && previous.render) previous.render();
      else closeDialog();
    };
  }

  function mount(renderFn) {
    var dialog = openDialog();
    var body = document.getElementById('dialogMount');
    if (!dialog || !body) return;
    body.innerHTML = '';
    body.scrollTop = 0;
    renderFn(body);
    updateBackButton();
  }

  function openBrand(brand, trigger) {
    state.currentBrand = brand;
    var mode = brandMode(brand);
    state.dialogStack = [{
      type: 'brand',
      brand: brand,
      render: function () { renderBrand(); }
    }];
    if (trigger) state.lastTrigger = trigger;
    function renderBrand() {
      setDialogHead(mode === 'gallery' ? T('caseGallery') : T('caseSelectedWork'),
        brand.name || T('caseUntitledBrand'));
      mount(function (body) {
        renderBrandHero(body, brand);
        if (mode === 'gallery') renderGallery(body, brand);
        else renderProjectList(body, brand);
      });
    }
    renderBrand();
    if (window.portfolioTracking) window.portfolioTracking.track('brand_open', { brand: brand.name || '' });
  }

  function renderBrandHero(body, brand) {
    var hero = el('header', 'brand-hero');
    var cover = brand.thumbnail || (brandMode(brand) === 'gallery' ? brandGallery(brand)[0] : projectCover(brandProjects(brand)[0]));
    if (cover) {
      var image = document.createElement('img');
      image.src = UI().safeHref ? UI().safeHref(cover) : cover;
      image.alt = brand.name || '';
      hero.appendChild(image);
    }
    var copy = el('div', 'brand-hero-copy');
    var kind = el('span', 'brand-hero-kind');
    kind.innerHTML = (brandMode(brand) === 'gallery' ? icon('gallery') : icon('grid')) +
      '<span>' + escapeHtml(brandMode(brand) === 'gallery' ? T('caseGallery') : T('caseSelectedWork')) + '</span>';
    copy.appendChild(kind);
    copy.appendChild(el('h2', null, brand.name || T('caseUntitledBrand')));
    var count = brandMode(brand) === 'gallery' ? brandGallery(brand).length : brandProjects(brand).length;
    copy.appendChild(el('p', null, faDigits(count) + ' ' +
      (brandMode(brand) === 'gallery' ? T('caseMediaCount') : T('countCases'))));
    hero.appendChild(copy);
    body.appendChild(hero);
    body.appendChild(el('div', null, '')).style.height = '1.5rem';
  }

  function renderProjectList(body, brand) {
    var grid = el('div', 'work-bento-grid has-cms-cards');
    var projects = brandProjects(brand).filter(function (project) {
      return state.filter === 'all' || projectMatchesFilter(project, state.filter);
    });
    if (!projects.length) projects = brandProjects(brand);
    if (!projects.length) {
      // Nothing published for this brand yet: say so plainly rather than
      // opening an empty panel.
      var note = el('p', 'brand-empty-note', T('caseNoWork'));
      grid.appendChild(note);
      body.appendChild(grid);
      return;
    }
    projects.forEach(function (project, index) {
      grid.appendChild(projectCard(project, index));
    });
    body.appendChild(grid);
    if (UI().revealItems) UI().revealItems(grid, '.case-card');
  }

  function projectCard(project, index) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'case-card';
    card.style.setProperty('--case-order', index);

    var media = el('div', 'case-card-media');
    var cover = projectCover(project);
    if (cover) {
      var image = document.createElement('img');
      image.src = UI().safeHref ? UI().safeHref(cover) : cover;
      image.alt = langField(project, 'titleFa', 'title') || T('caseUntitled');
      image.loading = 'lazy';
      image.decoding = 'async';
      media.appendChild(image);
    } else {
      media.classList.add('is-empty');
      media.textContent = T('caseNoMedia');
    }

    var badges = el('div', 'case-card-badges');
    if (project.year) badges.appendChild(el('span', 'work-pill', project.year));
    if (project.featured) badges.appendChild(el('span', 'work-pill work-pill-accent', '★'));
    media.appendChild(badges);

    var mediaCount = projectMedia(project).length;
    if (project.video && UI().isVideoFile && UI().isVideoFile(project.video)) {
      var play = el('span', 'case-card-play');
      play.innerHTML = icon('play');
      media.appendChild(play);
    } else if (mediaCount > 1) {
      var countPill = el('span', 'work-pill');
      countPill.style.position = 'absolute';
      countPill.style.insetBlockEnd = '14px';
      countPill.style.insetInlineStart = '14px';
      countPill.textContent = faDigits(mediaCount) + ' ' + T('caseMediaCount');
      media.appendChild(countPill);
    }

    var body = el('div', 'case-card-body');
    var text = el('div');
    if (hasValue(project.client)) {
      var clientRow = el('div', 'case-card-client');
      clientRow.textContent = project.client;
      text.appendChild(clientRow);
    }
    text.appendChild(el('h3', 'case-card-title', langField(project, 'titleFa', 'title') || T('caseUntitled')));
    var summary = langField(project, 'descriptionFa', 'description');
    if (hasValue(summary)) text.appendChild(el('p', 'case-card-summary', summary));

    var why = whyMatters(project);
    if (why && why.text) {
      var whyBlock = el('div', 'case-card-why');
      whyBlock.appendChild(el('strong', null, T('caseWhy')));
      whyBlock.appendChild(document.createTextNode(why.text));
      text.appendChild(whyBlock);
    }
    body.appendChild(text);

    var facts = el('div', 'case-card-proof');
    var factWrap = el('div', 'case-card-facts');
    [project.deliverable, project.outcome].forEach(function (value) {
      if (!hasValue(value)) return;
      factWrap.appendChild(el('span', null, value));
    });
    if (factWrap.children.length) facts.appendChild(factWrap);
    else {
      var metric = el('div', 'proof-metric');
      metric.appendChild(el('strong', null, project.year || T('caseKicker')));
      if (hasValue(project.role)) metric.appendChild(el('span', null, project.role));
      facts.appendChild(metric);
    }
    var arrow = el('span', 'case-card-arrow');
    arrow.innerHTML = icon('arrow');
    facts.appendChild(arrow);
    body.appendChild(facts);

    card.append(media, body);
    card.addEventListener('click', function () { openCaseStudy(project, card); });
    return card;
  }

  function openCaseStudy(project, trigger) {
    state.dialogStack.push({
      type: 'case',
      project: project,
      render: function () { renderCase(); }
    });
    if (window.portfolioTracking) {
      window.portfolioTracking.track('case_open', { projectId: String(project.id || ''), title: String(project.title || '') });
      if (typeof window.portfolioTracking.trackProjectClick === 'function' && project.id) {
        window.portfolioTracking.trackProjectClick(project.id);
      }
    }
    function renderCase() {
      setDialogHead((project.client ? project.client + ' · ' : '') + (project.year || T('caseKicker')),
        langField(project, 'titleFa', 'title') || T('caseUntitled'));
      mount(function (body) { renderCaseBody(body, project, trigger); });
    }
    renderCase();
  }

  function renderCaseBody(body, project, trigger) {
    var media = projectMedia(project);
    var index = 0;

    var stage = el('div', 'case-dialog-media');
    var thumbs = null;
    var counter = null;

    function paint() {
      stage.innerHTML = '';
      var url = media[index];
      var element = UI().buildMedia(url, {
        label: langField(project, 'titleFa', 'title'),
        controls: true,
        force: true
      });
      stage.appendChild(element);
      if (media.length > 1) {
        var prev = el('button', 'case-nav is-previous');
        prev.type = 'button';
        prev.setAttribute('aria-label', T('casePrev'));
        prev.innerHTML = icon('arrowLeft');
        prev.addEventListener('click', function () { index = (index - 1 + media.length) % media.length; paint(); });
        var next = el('button', 'case-nav is-next');
        next.type = 'button';
        next.setAttribute('aria-label', T('caseNext'));
        next.innerHTML = icon('arrow');
        next.addEventListener('click', function () { index = (index + 1) % media.length; paint(); });
        stage.append(prev, next);
        counter = el('span', 'case-counter', faDigits(index + 1) + ' / ' + faDigits(media.length));
        stage.appendChild(counter);
      }
      if (thumbs) {
        Array.prototype.forEach.call(thumbs.children, function (thumb, i) {
          thumb.classList.toggle('is-active', i === index);
          thumb.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      }
    }

    if (media.length) {
      body.appendChild(stage);
      paint();
      if (media.length > 1) {
        thumbs = el('div', 'case-thumbs');
        media.forEach(function (url, i) {
          var thumb = el('button', 'case-thumb');
          thumb.type = 'button';
          thumb.setAttribute('aria-label', T('caseOpen') + ' ' + (i + 1));
          if (UI().isVideoFile && UI().isVideoFile(url)) {
            var mark = el('span');
            mark.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
            thumb.appendChild(mark);
          } else {
            var image = document.createElement('img');
            image.src = UI().safeHref ? UI().safeHref(url) : url;
            image.alt = '';
            image.loading = 'lazy';
            thumb.appendChild(image);
          }
          thumb.addEventListener('click', function () { index = i; paint(); });
          thumbs.appendChild(thumb);
        });
        body.appendChild(thumbs);
      }
    }

    var grid = el('div', 'modal-case-grid');
    var left = el('div');
    var summary = langField(project, 'descriptionFa', 'description');
    if (hasValue(summary)) left.appendChild(el('p', 'modal-case-desc', summary));

    var why = whyMatters(project);
    if (why) {
      var whyBox = el('div', 'modal-why-box');
      whyBox.appendChild(el('h4', null, T('caseWhy')));
      if (why.text) whyBox.appendChild(el('p', null, why.text));
      if (why.metrics.length) {
        var metrics = el('dl', 'case-why-metrics');
        why.metrics.forEach(function (metric) {
          var cell = document.createElement('div');
          var dt = document.createElement('dt');
          dt.textContent = faDigits(metric.value || '');
          var dd = document.createElement('dd');
          dd.textContent = metric.label || '';
          cell.append(dt, dd);
          metrics.appendChild(cell);
        });
        whyBox.appendChild(metrics);
      }
      left.appendChild(whyBox);
    }

    var live = UI().safeHref ? UI().safeHref(project.publishedUrl) : '';
    if (live) {
      var liveLink = el('a', 'case-live-link', T('caseLive') + ' ↗');
      liveLink.href = live;
      liveLink.target = '_blank';
      liveLink.rel = 'noopener';
      left.appendChild(liveLink);
    }

    if (Array.isArray(project.tools) && project.tools.length) {
      var tools = el('div', 'case-tools');
      project.tools.forEach(function (tool) { tools.appendChild(el('span', null, tool)); });
      left.appendChild(tools);
    }

    var aside = el('aside', 'modal-facts-card');
    [
      [T('caseClient'), project.client],
      [T('caseDeliverable'), project.deliverable],
      [T('caseOutcome'), project.outcome],
      [T('caseRole'), project.role],
      ['Year', project.year]
    ].forEach(function (pair) {
      if (!hasValue(pair[1])) return;
      var row = el('div', 'modal-fact-row');
      row.appendChild(el('span', null, pair[0]));
      row.appendChild(el('strong', null, pair[1]));
      aside.appendChild(row);
    });

    grid.append(left, aside);
    body.appendChild(grid);

    if (!media.length) {
      var note = el('p', 'modal-case-desc', T('caseNoMedia'));
      body.appendChild(note);
    }

    if (trigger) trigger.dataset.seen = '1';
  }

  function renderGallery(body, brand) {
    var gallery = brandGallery(brand);
    var grid = el('div', 'brand-gallery');
    gallery.forEach(function (url, index) {
      var tile = el('button', 'brand-gallery-tile');
      tile.type = 'button';
      tile.setAttribute('aria-label', T('galleryOpen') + ' ' + (index + 1));
      var poster = brand.galleryPosters && brand.galleryPosters[url];
      if (UI().isVideoFile && UI().isVideoFile(url)) {
        var video = document.createElement('video');
        video.src = UI().safeHref ? UI().safeHref(url) : url;
        if (poster) video.poster = UI().safeHref ? UI().safeHref(poster) : poster;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-hidden', 'true');
        tile.appendChild(video);
        var mark = el('span', 'tile-play');
        mark.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        tile.appendChild(mark);
        tile.addEventListener('mouseenter', function () {
          var started = video.play();
          if (started && started.catch) started.catch(function () {});
        });
        tile.addEventListener('mouseleave', function () { video.pause(); });
      } else {
        var image = document.createElement('img');
        image.src = UI().safeHref ? UI().safeHref(url) : url;
        image.alt = (brand.name || T('caseUntitledBrand')) + ' — ' + (index + 1);
        image.loading = 'lazy';
        image.decoding = 'async';
        tile.appendChild(image);
      }
      tile.addEventListener('click', function () { openLightbox(gallery, index, brand); });
      grid.appendChild(tile);
    });
    body.appendChild(grid);
  }

  // -------------------------------------------------------------- lightbox
  function openLightbox(media, index, brand) {
    var dialog = document.getElementById('mediaLightbox');
    if (!dialog) return;
    state.lightbox = { media: media, index: index, brand: brand };

    function paint() {
      var stage = document.getElementById('lightboxStage');
      var title = document.getElementById('lightboxTitle');
      var counter = document.getElementById('lightboxCounter');
      var thumbs = document.getElementById('lightboxThumbs');
      if (!stage) return;
      stage.innerHTML = '';
      stage.appendChild(UI().buildMedia(media[state.lightbox.index], {
        label: T('lightboxTitle'),
        controls: true,
        force: true
      }));
      if (title) title.textContent = brand && brand.name ? brand.name : T('lightboxTitle');
      if (counter) counter.textContent = faDigits(state.lightbox.index + 1) + ' / ' + faDigits(media.length);
      if (thumbs) {
        thumbs.innerHTML = '';
        if (media.length > 1) {
          media.forEach(function (url, i) {
            var button = el('button');
            button.type = 'button';
            button.className = i === state.lightbox.index ? 'is-active' : '';
            button.setAttribute('aria-label', T('galleryOpen') + ' ' + (i + 1));
            if (UI().isVideoFile && UI().isVideoFile(url)) {
              var mark = el('span');
              mark.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
              mark.style.display = 'grid';
              mark.style.placeItems = 'center';
              mark.style.height = '100%';
              mark.style.color = '#fff';
              button.appendChild(mark);
            } else {
              var image = document.createElement('img');
              image.src = UI().safeHref ? UI().safeHref(url) : url;
              image.alt = '';
              image.loading = 'lazy';
              button.appendChild(image);
            }
            button.addEventListener('click', function () { state.lightbox.index = i; paint(); });
            thumbs.appendChild(button);
          });
        }
      }
    }

    paint();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    state.lightbox.paint = paint;
  }

  function wireLightbox() {
    var dialog = document.getElementById('mediaLightbox');
    if (!dialog) return;
    dialog.addEventListener('close', function () {
      dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
      state.lightbox = null;
    });
    document.addEventListener('keydown', function (event) {
      if (!state.lightbox) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        var count = state.lightbox.media.length;
        if (count < 2) return;
        state.lightbox.index = (state.lightbox.index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count;
        if (state.lightbox.paint) state.lightbox.paint();
      }
    });
  }

  function closeDialog() {
    var dialog = document.getElementById('portfolioDialog');
    if (!dialog) return;
    dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    state.dialogStack = [];
    state.currentBrand = null;
    var body = document.getElementById('dialogMount');
    if (body) body.innerHTML = '';
  }

  // -------------------------------------------------------------- services
  function renderServices() {
    setText('servicesTitle', setting('servicesTitle'));
    setText('servicesIntro', setting('servicesIntro'));
    var grid = document.getElementById('servicesGrid');
    if (!grid) return;
    var services = setting('services');
    grid.innerHTML = '';
    if (!Array.isArray(services)) return;

    services.forEach(function (item, index) {
      var title = PAGE_LANG === 'fa' && hasValue(item.titleFa) ? item.titleFa : item.title;
      var desc = PAGE_LANG === 'fa' && hasValue(item.descFa) ? item.descFa : item.desc;
      if (!hasValue(title) && !hasValue(desc)) return;

      var card = el('article', 'service-bento-card');

      var kicker = PAGE_LANG === 'fa' && hasValue(item.kickerFa) ? item.kickerFa : item.kicker;
      var top = el('div', 'service-card-top');
      top.appendChild(el('span', 'service-index',
        hasValue(kicker) ? kicker : T('navServices').toUpperCase()));
      var iconBox = el('div', 'service-icon-box');
      iconBox.innerHTML = icon(item.icon || 'screen');
      top.appendChild(iconBox);
      card.appendChild(top);

      card.appendChild(el('h3', 'service-bento-title', title || ''));
      if (hasValue(desc)) card.appendChild(el('p', 'service-bento-desc', desc));

      // Keep the reference's two decorative mini-demos on the first two cards.
      if (index === 0) {
        var demo = el('div', 'service-mini-demo');
        demo.setAttribute('aria-hidden', 'true');
        demo.innerHTML =
          '<div class="mini-ui-window">' +
            '<div class="mini-ui-header"><span class="mini-pill">' + escapeHtml(title || 'UI') + '</span>' +
            '<span class="mini-status">' + escapeHtml('✓') + '</span></div>' +
            '<div class="mini-ui-bars"><div class="mini-bar mini-bar-1"></div><div class="mini-bar mini-bar-2"></div></div>' +
          '</div>';
        card.appendChild(demo);
      } else if (index === 1) {
        var nodes = el('div', 'service-mini-demo service-demo-nodes');
        nodes.setAttribute('aria-hidden', 'true');
        nodes.innerHTML =
          '<div class="node-diagram"><span class="node-circle">01</span><span class="node-connector"></span>' +
          '<span class="node-circle node-active">02</span><span class="node-connector"></span>' +
          '<span class="node-circle">03</span></div>';
        card.appendChild(nodes);
      }

      var bullets = [];
      if (Array.isArray(item.bullets)) bullets = item.bullets.filter(hasValue);
      if (PAGE_LANG === 'fa' && Array.isArray(item.bulletsFa)) {
        var faBullets = item.bulletsFa.filter(hasValue);
        if (faBullets.length) bullets = faBullets;
      }
      if (!bullets.length) bullets = [T('serviceDefaultBullet1'), T('serviceDefaultBullet2')];
      var list = el('ul', 'service-deliverables');
      bullets.slice(0, 5).forEach(function (bullet) {
        list.appendChild(el('li', null, bullet));
      });
      card.appendChild(list);
      grid.appendChild(card);
    });

    if (UI().revealItems) UI().revealItems(grid, '.service-bento-card');
  }

  // --------------------------------------------------------------- process
  function renderProcess() {
    setText('processTitle', setting('processTitle'));
    setText('processIntro', setting('processIntro'));
    var grid = document.getElementById('processGrid');
    var section = document.getElementById('process');
    if (!grid) return;
    var steps = setting('process');
    grid.innerHTML = '';
    if (!Array.isArray(steps) || !steps.length) {
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;
    steps.forEach(function (step, index) {
      var title = PAGE_LANG === 'fa' && hasValue(step.titleFa) ? step.titleFa : step.title;
      var desc = PAGE_LANG === 'fa' && hasValue(step.descFa) ? step.descFa : step.desc;
      var badge = PAGE_LANG === 'fa' && hasValue(step.badgeFa) ? step.badgeFa : step.badge;
      if (!hasValue(title) && !hasValue(desc)) return;
      var card = el('article', 'process-step-card');
      var head = el('div', 'process-step-head');
      head.appendChild(el('span', 'process-step-num', PAGE_LANG === 'fa' ? 'گام ' + faDigits(index + 1) : 'Step ' + (index + 1)));
      if (hasValue(badge)) head.appendChild(el('span', 'process-step-badge', badge));
      card.appendChild(head);
      if (hasValue(title)) card.appendChild(el('h3', 'process-step-title', title));
      if (hasValue(desc)) card.appendChild(el('p', 'process-step-desc', desc));
      grid.appendChild(card);
    });
    if (UI().revealItems) UI().revealItems(grid, '.process-step-card');
  }

  // -------------------------------------------------------------- journey
  function renderJourney() {
    setText('aboutTitle', setting('aboutTitle'));
    setText('aboutIntro', setting('aboutIntro'));
    var columns = [
      { key: 'experience', list: document.getElementById('experiencePanel'), column: document.getElementById('experienceColumn') },
      { key: 'education', list: document.getElementById('educationPanel'), column: document.getElementById('educationGroup') }
    ];
    var section = document.getElementById('timeline');
    var anyVisible = false;

    columns.forEach(function (entry) {
      var items = setting(entry.key);
      var faItems = entry.key === 'experience' ? state.settings.experienceFa : state.settings.educationFa;
      if (!entry.list) return;
      entry.list.innerHTML = '';

      var rows = Array.isArray(items) ? items : [];
      if (PAGE_LANG === 'fa' && Array.isArray(faItems) && faItems.length === rows.length && faItems.length) {
        rows = faItems;
      }

      rows = rows.filter(function (item) {
        return item && (hasValue(item.title) || hasValue(item.subtitle) || hasValue(item.desc));
      });

      if (!rows.length) {
        if (entry.column) entry.column.hidden = true;
        return;
      }
      anyVisible = true;
      if (entry.column) entry.column.hidden = false;

      rows.forEach(function (item, index) {
        var card = el('article', 'journey-card');
        if (index === 0) card.classList.add('is-current');
        var meta = el('div', 'journey-card-meta');
        if (hasValue(item.date)) meta.appendChild(el('span', 'journey-date', faDigits(item.date)));
        // "Current" only describes a job, never a degree — the education
        // column must not wear a collaboration badge.
        if (entry.key === 'experience' && index === 0) meta.appendChild(el('span', 'journey-tag', T('tagCurrent')));
        card.appendChild(meta);
        card.appendChild(el('h4', 'journey-role', item.title || ''));
        if (hasValue(item.subtitle)) card.appendChild(el('p', 'journey-org', item.subtitle));
        if (hasValue(item.desc)) card.appendChild(el('p', 'journey-desc', item.desc));
        entry.list.appendChild(card);
      });
    });

    if (section) section.hidden = !anyVisible;
  }

  // -------------------------------------------------------------- toolkit
  var TOOL_STYLES = [
    { match: /after effects|\bae\b/i, label: 'Ae', className: 'tool-ae' },
    { match: /photoshop|\bps\b/i, label: 'Ps', className: 'tool-ps' },
    { match: /premiere|\bpr\b/i, label: 'Pr', className: 'tool-pr' },
    { match: /illustrator|\bai\b/i, label: 'Ai', className: 'tool-ai' },
    { match: /blender|3d|\bbl\b/i, label: '3D', className: 'tool-bl' },
    { match: /figma/i, label: 'Fg', className: 'tool-fg' },
    { match: /animate|animation/i, label: 'An', className: 'tool-an' }
  ];

  function renderToolkit() {
    var host = document.getElementById('toolkitPills');
    if (!host) return;
    var skills = setting('aboutSkills');
    host.innerHTML = '';
    if (!hasValue(skills)) {
      var block = host.closest('.toolkit-block');
      if (block) block.hidden = true;
      return;
    }
    String(skills).split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (name) {
      var style = TOOL_STYLES.filter(function (entry) { return entry.match.test(name); })[0];
      var chip = el('div', 'tool-chip');
      var badge = el('span', 'tool-badge ' + (style ? style.className : ''), style ? style.label : name.slice(0, 2));
      var meta = el('div', 'tool-meta');
      meta.appendChild(el('strong', null, name));
      chip.append(badge, meta);
      host.appendChild(chip);
    });
  }

  // ---------------------------------------------------------------- rates
  function renderRates() {
    setText('ratesTitle', setting('ratesTitle'));
    setText('ratesIntro', setting('ratesIntro'));
    var grid = document.getElementById('ratesGrid');
    var section = document.getElementById('rates');
    if (!grid) return;
    var rates = setting('rates');
    grid.innerHTML = '';
    if (!Array.isArray(rates)) rates = [];

    var visible = rates.filter(function (rate) {
      return rate && rate.visible !== false &&
        (hasValue(rate.type) || hasValue(rate.price) || hasValue(rate.typeFa));
    });

    if (!visible.length) {
      // No price list configured: the section says so in one line instead of
      // showing invented numbers.
      if (section) {
        var note = el('p', 'section-lead', PAGE_LANG === 'fa'
          ? 'قیمت هر پروژه پس از بررسی بریف، به‌صورت مقطوع اعلام می‌شود.'
          : 'Every project is quoted as a fixed price after the brief.');
        grid.appendChild(note);
      }
      return;
    }

    visible.forEach(function (rate) {
      var type = PAGE_LANG === 'fa' && hasValue(rate.typeFa) ? rate.typeFa : rate.type;
      var price = PAGE_LANG === 'fa' && hasValue(rate.priceFa) ? rate.priceFa : rate.price;
      var unit = PAGE_LANG === 'fa' && hasValue(rate.unitFa) ? rate.unitFa : rate.unit;
      var note = PAGE_LANG === 'fa' && hasValue(rate.noteFa) ? rate.noteFa : rate.note;

      var card = el('article', 'rate-card');
      if (rate.featured) {
        card.classList.add('rate-card-featured');
        card.appendChild(el('div', 'rate-featured-pill', T('rateFeaturedBadge')));
      }
      if (hasValue(type)) card.appendChild(el('span', 'rate-type', type));
      if (hasValue(price)) card.appendChild(el('div', 'rate-price', faDigits(price)));
      else card.appendChild(el('div', 'rate-price', T('rateAskPricing')));
      if (hasValue(unit)) card.appendChild(el('span', 'rate-unit', unit));
      if (hasValue(note)) card.appendChild(el('p', 'rate-note', note));
      grid.appendChild(card);
    });
  }

  // ---------------------------------------------------------------- boot
  function init(settings) {
    state.settings = settings || {};
    wireFilters();
    wireLightbox();
    var dialog = document.getElementById('portfolioDialog');
    if (dialog) {
      dialog.addEventListener('close', function () {
        dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
        state.dialogStack = [];
        state.currentBrand = null;
      });
      UI().closeOnOutsideClick(dialog);
    }

    fetch(PROJECTS_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('projects request failed');
        return response.json();
      })
      .then(function (payload) {
        normaliseProjects(payload || {});
      })
      .catch(function () {
        state.projects = [];
        state.brands = [];
      })
      .then(function () {
        renderWork();
        renderServices();
        renderProcess();
        renderJourney();
        renderToolkit();
        renderRates();
        document.dispatchEvent(new Event('site:labels'));
        document.dispatchEvent(new CustomEvent('projects:rendered'));
      });
  }

  window.SiteWork = { init: init, state: state, openBrand: openBrand, closeDialog: closeDialog };
})();
