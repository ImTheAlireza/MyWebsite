/**
 * Admin Panel — Portfolio CMS
 * Login, projects, hero, about, assets, settings
 */
(function () {
  'use strict';

  const API = '/api.php?_query=';
  let token = null;
  let projects = [];
  let assets = [];
  let editingId = null;
  let hasUnsavedChanges = false;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ============================================
  // TOAST (stackable)
  // ============================================
  const toastContainer = $('#toastContainer');
  function showToast(msg, type = 'info', ms = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 200);
    }, ms);
  }

  // ============================================
  // AUTH
  // ============================================
  async function api(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(API + url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...opts,
      headers
    });
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    const text = await res.text();
    let d = {};
    try { d = text ? JSON.parse(text) : {}; } catch { d = { error: text || 'Request failed' }; }
    if (!res.ok || d.error) throw new Error(d.error || 'Request failed');
    return d;
  }

  function findProject(id) {
    return projects.find(x => String(x.id) === String(id));
  }

  async function checkAuth() {
    try { await api('auth/check'); showDashboard(); } catch { showLogin(); }
  }

  function showLogin() {
    $('#loginScreen').classList.remove('hidden');
    $('#dashboard').classList.add('hidden');
  }

  function showDashboard() {
    $('#loginScreen').classList.add('hidden');
    $('#dashboard').classList.remove('hidden');
    loadProjects();
    loadHero();
    loadAbout();
    loadAssets();
    loadSettings();
    loadStatistics();
    loadMessages();
    loadCategories();
    updateMessagesBadge();
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('#loginError').textContent = '';
    const username = $('#loginUsername').value.trim();
    const password = $('#loginPassword').value;
    try {
      const d = await fetch(API + 'auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }).then(r => r.json());
      if (d.error) { $('#loginError').textContent = d.error; return; }
      token = null;
      showDashboard();
    } catch { $('#loginError').textContent = 'Connection error.'; }
  });

  function logout() {
    token = null;
    fetch(API + 'auth/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  }

  $('#logoutBtn').addEventListener('click', logout);

  // ============================================
  // NAVIGATION
  // ============================================
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.view').forEach(v => v.classList.remove('active'));
      $(`#${btn.dataset.view}View`).classList.add('active');

      // Refresh data when switching views
      if (btn.dataset.view === 'assets') loadAssets();
      if (btn.dataset.view === 'timeline') loadTimeline();
      if (btn.dataset.view === 'statistics') loadStatistics();
      if (btn.dataset.view === 'messages') { loadMessages(); updateMessagesBadge(); }
    });
  });

  // ============================================
  // IMAGE UPLOAD COMPONENT
  // ============================================
  function setupImageUpload({ dropzoneId, fileInputId, previewId, previewImgId, removeBtnId, hiddenInputId, urlInputId }) {
    const dropzone = $(dropzoneId);
    const fileInput = $(fileInputId);
    const preview = $(previewId);
    const previewImg = $(previewImgId);
    const removeBtn = $(removeBtnId);
    const hiddenInput = $(hiddenInputId);
    const urlInput = urlInputId ? $(urlInputId) : null;

    if (!dropzone || !fileInput) return;

    // Click dropzone to open file picker
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag & drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0]);
    });

    // File input change
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) handleImageSelect(e.target.files[0]);
      fileInput.value = '';
    });

    // Remove button
    removeBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      hiddenInput.value = '';
      if (urlInput) urlInput.value = '';
      previewImg.src = '';
      preview.classList.add('hidden');
      dropzone.classList.remove('hidden');
    });

    // URL input
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const v = urlInput.value.trim();
        if (v) {
          previewImg.onload = () => {
            hiddenInput.value = v;
            preview.classList.remove('hidden');
            dropzone.classList.add('hidden');
          };
          previewImg.onerror = () => {
            preview.classList.add('hidden');
            dropzone.classList.remove('hidden');
          };
          previewImg.src = v;
        } else {
          hiddenInput.value = '';
          previewImg.src = '';
          preview.classList.add('hidden');
          dropzone.classList.remove('hidden');
        }
      });
    }

    async function handleImageSelect(file) {
      if (file.size > 50 * 1024 * 1024) { showToast('File too large. Max 50MB.', 'error'); return; }
      // Show immediate local preview
      const localUrl = URL.createObjectURL(file);
      previewImg.src = localUrl;
      preview.classList.remove('hidden');
      dropzone.classList.add('hidden');

      // Upload to server
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch(API + 'upload', {
          method: 'POST',
          body: fd,
          credentials: 'same-origin'
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        URL.revokeObjectURL(localUrl);
        hiddenInput.value = d.url;
        previewImg.src = d.url;
        showToast('Image uploaded', 'success');
      } catch (err) {
        URL.revokeObjectURL(localUrl);
        showToast('Upload failed: ' + err.message, 'error');
        preview.classList.add('hidden');
        dropzone.classList.remove('hidden');
      }
    }

    // Public API for loading existing images
    return {
      setImage(url) {
        if (!url) return;
        hiddenInput.value = url;
        previewImg.src = url;
        preview.classList.remove('hidden');
        dropzone.classList.add('hidden');
      },
      clearImage() {
        hiddenInput.value = '';
        if (urlInput) urlInput.value = '';
        previewImg.src = '';
        preview.classList.add('hidden');
        dropzone.classList.remove('hidden');
      }
    };
  }

  // Initialize all image upload components
  const uploads = {
    portraitDark: setupImageUpload({
      dropzoneId: '#portraitDarkDropzone', fileInputId: '#portraitDarkFileInput',
      previewId: '#portraitDarkPreview', previewImgId: '#portraitDarkPreviewImg',
      removeBtnId: '#portraitDarkRemoveBtn', hiddenInputId: '#heroPortraitDark',
      urlInputId: '#heroPortraitDarkUrl'
    }),
    portraitLight: setupImageUpload({
      dropzoneId: '#portraitLightDropzone', fileInputId: '#portraitLightFileInput',
      previewId: '#portraitLightPreview', previewImgId: '#portraitLightPreviewImg',
      removeBtnId: '#portraitLightRemoveBtn', hiddenInputId: '#heroPortraitLight',
      urlInputId: '#heroPortraitLightUrl'
    }),
    about: setupImageUpload({
      dropzoneId: '#aboutDropzone', fileInputId: '#aboutFileInput',
      previewId: '#aboutPreview', previewImgId: '#aboutPreviewImg',
      removeBtnId: '#aboutRemoveBtn', hiddenInputId: '#aboutImage',
      urlInputId: '#aboutImageUrl'
    }),
    thumb: setupImageUpload({
      dropzoneId: '#thumbDropzone', fileInputId: '#thumbFileInput',
      previewId: '#thumbPreview', previewImgId: '#thumbPreviewImg',
      removeBtnId: '#thumbRemoveBtn', hiddenInputId: '#projectThumbnailUrl',
      urlInputId: '#projectThumbUrl'
    })
  };

  // Resume file upload (non-image)
  const resumeDropzone = $('#resumeDropzone');
  const resumeFileInput = $('#resumeFileInput');
  const resumePreview = $('#resumePreview');
  const resumeFileName = $('#resumeFileName');
  const resumeRemoveBtn = $('#resumeRemoveBtn');
  const resumeHidden = $('#aboutResumeUrl');

  if (resumeDropzone) {
    resumeDropzone.addEventListener('click', () => resumeFileInput.click());
    resumeDropzone.addEventListener('dragover', e => { e.preventDefault(); resumeDropzone.classList.add('dragover'); });
    resumeDropzone.addEventListener('dragleave', () => resumeDropzone.classList.remove('dragover'));
    resumeDropzone.addEventListener('drop', e => {
      e.preventDefault(); resumeDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleResumeUpload(e.dataTransfer.files[0]);
    });
    resumeFileInput.addEventListener('change', e => {
      if (e.target.files[0]) handleResumeUpload(e.target.files[0]);
      resumeFileInput.value = '';
    });
    resumeRemoveBtn.addEventListener('click', e => {
      e.stopPropagation();
      resumeHidden.value = '';
      resumeFileName.textContent = 'resume.pdf';
      resumePreview.classList.add('hidden');
      resumeDropzone.classList.remove('hidden');
    });
  }

  async function handleResumeUpload(file) {
    if (file.size > 50 * 1024 * 1024) { showToast('File too large. Max 50MB.'); return; }
    resumeFileName.textContent = file.name;
    resumePreview.classList.remove('hidden');
    resumeDropzone.classList.add('hidden');

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(API + 'upload', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      resumeHidden.value = d.url;
      showToast('Resume uploaded', 'success');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
      resumePreview.classList.add('hidden');
      resumeDropzone.classList.remove('hidden');
    }
  }

  // ============================================
  // PROJECTS
  // ============================================
  let categories = [];
  let projectLayout = '2col';
  let projectSearchQuery = '';
  let projectStatusFilter = 'all';
  let dragProjectId = null;

  function getCategoryLabel(val) {
    const cat = categories.find(c => getCategorySlug(c) === getCategorySlug(val));
    return cat || (val ? 'Uncategorized' : '');
  }

  function getCategorySlug(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, '');
  }

  function isDirectVideoUrl(value) {
    const clean = String(value || '').trim().split(/[?#]/)[0];
    return /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv)$/i.test(clean);
  }

  function mediaFilename(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      return decodeURIComponent(url.pathname.split('/').pop() || raw);
    } catch {
      return raw;
    }
  }

  function updateProjectVideoPreview(value, displayName) {
    const preview = $('#projectVideoPreview');
    const player = $('#projectVideoPreviewPlayer');
    const name = $('#projectVideoPreviewName');
    if (!preview || !player || !name) return;

    const url = String(value || '').trim();
    if (!url) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.classList.add('hidden');
      preview.classList.remove('is-external');
      preview.classList.add('hidden');
      name.textContent = '';
      return;
    }

    const directVideo = isDirectVideoUrl(url);
    name.textContent = displayName || (directVideo ? mediaFilename(url) : url);
    if (directVideo) {
      if (player.getAttribute('src') !== url) {
        player.src = url;
        player.load();
      }
      player.classList.remove('hidden');
      preview.classList.remove('is-external');
    } else {
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.classList.add('hidden');
      preview.classList.add('is-external');
    }
    preview.classList.remove('hidden');
  }

  function setProjectVideo(value, displayName) {
    const input = $('#projectVideo');
    if (!input) return;
    input.value = value || '';
    updateProjectVideoPreview(input.value, displayName);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function loadProjects() {
    try {
      const data = await api('projects');
      projects = Array.isArray(data.projects) ? data.projects : [];
      if (Array.isArray(data.categories)) {
        categories = data.categories;
        renderCategories();
        populateCategoryDropdown();
      }
      renderProjects();
      checkProjectWarnings();
      return projects;
    } catch (error) {
      console.error(error);
      showToast('Could not load saved projects: ' + error.message, 'error', 7000);
      return null;
    }
  }

  function checkProjectWarnings() {
    const el = $('#projectWarnings');
    if (!el) return;
    const untagged = projects.filter(p => !p.category || String(p.category).trim() === '');
    const drafts = projects.filter(p => p.published === false);
    const issues = [];
    if (untagged.length) {
      issues.push('<div class="project-warnings-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ' + untagged.length + ' project(s) hidden — no category</div><ul class="project-warnings-list">' + untagged.map(p => '<li>' + esc(p.title) + '</li>').join('') + '</ul>');
    }
    if (drafts.length) {
      issues.push('<div class="project-warnings-title" style="margin-top:8px;color:var(--warning)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> ' + drafts.length + ' draft(s) not visible on the site</div>');
    }
    if (!issues.length) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    el.innerHTML = '<div class="project-warnings">' + issues.join('') + '</div>';
  }

  function getFilteredProjects() {
    let list = projects.slice();
    const q = projectSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.year || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q)
      );
    }
    if (projectStatusFilter === 'published') list = list.filter(p => p.published !== false);
    else if (projectStatusFilter === 'draft') list = list.filter(p => p.published === false);
    else if (projectStatusFilter === 'featured') list = list.filter(p => p.featured === true);
    else if (projectStatusFilter === 'uncategorized') list = list.filter(p => !p.category || !String(p.category).trim());
    return list;
  }

  function projectCardHtml(p) {
    const hasCat = p.category && String(p.category).trim() !== '';
    const isDraft = p.published === false;
    const isFeatured = p.featured === true;
    const badges = [];
    if (isDraft) badges.push('<span class="status-badge status-draft">Draft</span>');
    else badges.push('<span class="status-badge status-live">Live</span>');
    if (isFeatured) badges.push('<span class="status-badge status-featured">Featured</span>');
    if (p.video) badges.push('<span class="status-badge status-video">Video</span>');
    const thumbMedia = p.thumbnail
      ? '<img src="' + esc(p.thumbnail) + '" alt="' + esc(p.title) + '" loading="lazy">'
      : (isDirectVideoUrl(p.video)
          ? '<video src="' + esc(p.video) + '" muted playsinline preload="metadata" aria-label="' + esc(p.title) + ' video"></video>'
          : '<div class="project-thumb-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg></div>');
    return '<div class="project-card' + (hasCat ? '' : ' project-card-warning') + (isDraft ? ' is-draft' : '') + (isFeatured ? ' is-featured' : '') + '" data-id="' + esc(String(p.id)) + '" draggable="true">' +
      '<div class="project-drag-handle" title="Drag to reorder" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>' +
      '</div>' +
      '<div class="project-thumb">' + thumbMedia + '</div>' +
      '<div class="project-info">' +
        '<div class="project-badges">' + badges.join('') + '</div>' +
        '<div class="project-category">' + (hasCat ? esc(getCategoryLabel(p.category)) : '<em style="color:var(--danger)">No category</em>') + '</div>' +
        '<div class="project-title">' + esc(p.title) + '</div>' +
        '<div class="project-year">' + esc(p.year || '') + '</div>' +
      '</div>' +
      '<div class="project-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm edit-btn" data-id="' + esc(String(p.id)) + '">Edit</button>' +
        '<button type="button" class="btn btn-ghost btn-sm del-btn" data-id="' + esc(String(p.id)) + '" style="color:var(--danger)">Delete</button>' +
      '</div></div>';
  }

  function bindProjectCardEvents() {
    $$('.edit-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openEditProject(b.dataset.id); }));
    $$('.del-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteProject(b.dataset.id); }));
    $$('.project-card').forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.closest('.project-actions') || e.target.closest('.project-drag-handle')) return;
        openEditProject(c.dataset.id);
      });
      c.addEventListener('dragstart', e => {
        dragProjectId = c.dataset.id;
        c.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', c.dataset.id);
      });
      c.addEventListener('dragend', () => {
        c.classList.remove('is-dragging');
        $$('.project-card').forEach(x => x.classList.remove('drag-over'));
        dragProjectId = null;
      });
      c.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        c.classList.add('drag-over');
      });
      c.addEventListener('dragleave', () => c.classList.remove('drag-over'));
      c.addEventListener('drop', async e => {
        e.preventDefault();
        c.classList.remove('drag-over');
        const fromId = dragProjectId || e.dataTransfer.getData('text/plain');
        const toId = c.dataset.id;
        if (!fromId || fromId === toId) return;
        await reorderProjects(fromId, toId);
      });
    });
  }

  async function reorderProjects(fromId, toId) {
    const ids = projects.map(p => String(p.id));
    const from = ids.indexOf(String(fromId));
    const to = ids.indexOf(String(toId));
    if (from < 0 || to < 0) return;
    const [item] = ids.splice(from, 1);
    ids.splice(to, 0, item);
    // Reorder local array to match
    const map = new Map(projects.map(p => [String(p.id), p]));
    projects = ids.map((id, i) => {
      const p = map.get(id);
      if (p) p.order = i;
      return p;
    }).filter(Boolean);
    renderProjects();
    try {
      await api('projects/reorder', { method: 'PUT', body: JSON.stringify({ ids }) });
      showToast('Order updated', 'success');
    } catch (err) {
      showToast('Reorder failed: ' + err.message, 'error');
      loadProjects();
    }
  }

  function renderProjects() {
    const list = $('#projectsList'), empty = $('#emptyState');
    if (!list) return;
    list.className = 'projects-grid layout-' + projectLayout;
    const filtered = getFilteredProjects();
    if (!projects.length) {
      list.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        empty.querySelector('h3') && (empty.querySelector('h3').textContent = 'No projects yet');
        empty.querySelector('p') && (empty.querySelector('p').textContent = 'Add your first project to get started');
      }
      return;
    }
    if (!filtered.length) {
      list.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        empty.querySelector('h3') && (empty.querySelector('h3').textContent = 'No matches');
        empty.querySelector('p') && (empty.querySelector('p').textContent = 'Try a different search or filter');
      }
      return;
    }
    if (empty) empty.classList.add('hidden');
    list.innerHTML = filtered.map(projectCardHtml).join('');
    bindProjectCardEvents();
  }

  $$('.layout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      $$('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      projectLayout = btn.dataset.layout;
      renderProjects();
      try { await api('settings', { method: 'PUT', body: JSON.stringify({ projectLayout }) }); } catch {}
    });
  });

  function populateCategoryDropdown(selectedValue) {
    const sel = $('#projectCategory');
    if (!sel) return;
    const requested = selectedValue == null ? sel.value : String(selectedValue || '');
    const matching = categories.find(c => getCategorySlug(c) === getCategorySlug(requested));
    sel.innerHTML = categories.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');

    if (requested && !matching) {
      sel.innerHTML += '<option value="' + esc(requested) + '">' + esc(requested) + ' (not in category list)</option>';
    }
    if (!categories.length && !requested) {
      sel.innerHTML = '<option value="" disabled selected>Add a category first</option>';
    } else {
      sel.value = matching || requested || categories[0] || '';
    }
  }

  function openAddProject() {
    editingId = null;
    $('#modalTitle').textContent = 'Add Project';
    $('#projectForm').reset();
    uploads.thumb.clearImage();
    setProjectVideo('');
    if ($('#projectPublished')) $('#projectPublished').checked = true;
    if ($('#projectFeatured')) $('#projectFeatured').checked = false;
    if ($('#projectGallery')) $('#projectGallery').value = '';
    $('#deleteProjectBtn').classList.add('hidden');
    populateCategoryDropdown();
    $('#projectModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    hasUnsavedChanges = false;
  }

  function openEditProject(id) {
    const p = findProject(id);
    if (!p) return;
    editingId = p.id;
    $('#modalTitle').textContent = 'Edit Project';
    $('#projectId').value = p.id;
    $('#projectTitle').value = p.title || '';
    populateCategoryDropdown(p.category || '');
    $('#projectYear').value = p.year || '';
    $('#projectDescription').value = p.description || '';
    $('#projectRole').value = p.role || '';
    $('#projectTools').value = (p.tools || []).join(', ');
    $('#projectVideo').value = p.video || '';
    updateProjectVideoPreview(p.video || '');
    $('#projectThumbUrl').value = p.thumbnail || '';
    if ($('#projectPublished')) $('#projectPublished').checked = p.published !== false;
    if ($('#projectFeatured')) $('#projectFeatured').checked = p.featured === true;
    if ($('#projectGallery')) $('#projectGallery').value = (p.gallery || []).join('\n');
    if (p.thumbnail) uploads.thumb.setImage(p.thumbnail);
    else uploads.thumb.clearImage();
    $('#deleteProjectBtn').classList.remove('hidden');
    $('#projectModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    hasUnsavedChanges = false;
  }

  function closeModal() {
    if (hasUnsavedChanges && !$('#projectModal').classList.contains('hidden')) {
      // allow close without blocking — form is modal; user can cancel intentionally
    }
    $('#projectModal').classList.add('hidden');
    document.body.style.overflow = '';
    editingId = null;
    hasUnsavedChanges = false;
  }

  $('#addProjectBtn').addEventListener('click', openAddProject);
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', closeModal);
  $('#cancelBtn').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' &&
        $('#assetPickerModal').classList.contains('hidden') &&
        !$('#projectModal').classList.contains('hidden')) closeModal();
  });

  $('#projectVideo').addEventListener('input', e => updateProjectVideoPreview(e.target.value));
  $('#browseProjectVideoBtn').addEventListener('click', () => {
    openAssetPicker((url, name) => setProjectVideo(url, name), 'video');
  });
  $('#clearProjectVideoBtn').addEventListener('click', () => setProjectVideo(''));

  $('#projectForm').addEventListener('submit', async e => {
    e.preventDefault();
    const galleryRaw = ($('#projectGallery')?.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const payload = {
      title: $('#projectTitle').value.trim(),
      category: $('#projectCategory').value,
      year: $('#projectYear').value.trim(),
      description: $('#projectDescription').value.trim(),
      role: $('#projectRole').value.trim(),
      tools: $('#projectTools').value.split(',').map(t => t.trim()).filter(Boolean),
      video: $('#projectVideo').value.trim(),
      thumbnail: $('#projectThumbnailUrl').value || $('#projectThumbUrl').value.trim(),
      published: $('#projectPublished') ? $('#projectPublished').checked : true,
      featured: $('#projectFeatured') ? $('#projectFeatured').checked : false,
      gallery: galleryRaw
    };
    if (!payload.title) { showToast('Title is required', 'error'); return; }
    if (!payload.category) { showToast('Add and select a category before saving the project', 'error', 5000); return; }
    const submitBtn = e.target.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }
    const wasEdit = !!editingId;
    try {
      const saved = editingId
        ? await api(`/projects/${encodeURIComponent(editingId)}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('projects', { method: 'POST', body: JSON.stringify(payload) });

      if (!saved || !saved.id) throw new Error('The server did not confirm the project was saved');

      // Read it back from persistent storage before reporting success. This
      // prevents a temporary UI card from disappearing on the next refresh.
      const persisted = await api('projects');
      const persistedProjects = Array.isArray(persisted.projects) ? persisted.projects : [];
      if (!persistedProjects.some(project => String(project.id) === String(saved.id))) {
        throw new Error('The project could not be verified in persistent storage');
      }

      projects = persistedProjects;
      if (Array.isArray(persisted.categories)) categories = persisted.categories;
      renderCategories();
      populateCategoryDropdown(saved.category || '');
      renderProjects();
      checkProjectWarnings();
      hasUnsavedChanges = false;
      closeModal();
      showToast(wasEdit ? 'Project updated and saved' : 'Project saved permanently', 'success');
    } catch (err) { showToast('Save failed: ' + err.message, 'error', 6000); }
    finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Project'; }
    }
  });

  async function deleteProject(id) {
    const p = findProject(id);
    const confirmed = await showConfirm('Delete Project', `Delete "${p ? p.title : 'this project'}"? Unused thumbnail files may be removed. This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadProjects();
      closeModal();
      showToast('Project deleted', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  $('#deleteProjectBtn').addEventListener('click', () => { if (editingId) deleteProject(editingId); });

  // Project search + status filter
  const projectSearchInput = $('#projectSearch');
  if (projectSearchInput) {
    let searchTimeout = null;
    projectSearchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        projectSearchQuery = projectSearchInput.value;
        renderProjects();
      }, 150);
    });
  }
  const statusFilterEl = $('#projectStatusFilter');
  if (statusFilterEl) {
    statusFilterEl.addEventListener('change', () => {
      projectStatusFilter = statusFilterEl.value;
      renderProjects();
    });
  }

  // ============================================
  // HERO
  // ============================================
  async function loadHero() {
    try {
      const d = await api('settings');
      ['heroEyebrow','heroFirstName','heroLastName','heroSubtitle','heroAvailability',
       'heroStat1Value','heroStat1Label','heroStat2Value','heroStat2Label','heroStat3Value','heroStat3Label',
       'heroCtaText','heroCtaLink','heroShowreelUrl'].forEach(k => {
        const el = $(`#${k}`);
        if (el && d[k] != null) el.value = d[k];
      });

      if (d.heroPortraitDark) uploads.portraitDark.setImage(d.heroPortraitDark);
      $('#heroPortraitDarkOpacity').value = d.heroPortraitDarkOpacity ?? 0.18;
      $('#heroPortraitDarkOpacityVal').textContent = $('#heroPortraitDarkOpacity').value;
      $('#heroPortraitDarkScale').value = d.heroPortraitDarkScale ?? 1;
      $('#heroPortraitDarkScaleVal').textContent = $('#heroPortraitDarkScale').value;

      if (d.heroPortraitLight) uploads.portraitLight.setImage(d.heroPortraitLight);
      $('#heroPortraitLightOpacity').value = d.heroPortraitLightOpacity ?? 0.12;
      $('#heroPortraitLightOpacityVal').textContent = $('#heroPortraitLightOpacity').value;
      $('#heroPortraitLightScale').value = d.heroPortraitLightScale ?? 1;
      $('#heroPortraitLightScaleVal').textContent = $('#heroPortraitLightScale').value;
    } catch (e) { console.error(e); }
  }

  ['heroPortraitDarkOpacity','heroPortraitDarkScale','heroPortraitLightOpacity','heroPortraitLightScale'].forEach(id => {
    const el = $(`#${id}`);
    if (el) el.addEventListener('input', () => { $(`#${id}Val`).textContent = el.value; });
  });

  $('#heroForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const updated = {
        heroEyebrow: $('#heroEyebrow').value.trim(),
        heroFirstName: $('#heroFirstName').value.trim(),
        heroLastName: $('#heroLastName').value.trim(),
        heroSubtitle: $('#heroSubtitle').value.trim(),
        heroAvailability: $('#heroAvailability').value.trim(),
        heroStat1Value: $('#heroStat1Value').value.trim(),
        heroStat1Label: $('#heroStat1Label').value.trim(),
        heroStat2Value: $('#heroStat2Value').value.trim(),
        heroStat2Label: $('#heroStat2Label').value.trim(),
        heroStat3Value: $('#heroStat3Value').value.trim(),
        heroStat3Label: $('#heroStat3Label').value.trim(),
        heroCtaText: $('#heroCtaText').value.trim(),
        heroCtaLink: $('#heroCtaLink').value.trim(),
        heroShowreelUrl: $('#heroShowreelUrl').value.trim(),
        heroPortraitDark: $('#heroPortraitDark').value || '',
        heroPortraitDarkOpacity: parseFloat($('#heroPortraitDarkOpacity').value),
        heroPortraitDarkScale: parseFloat($('#heroPortraitDarkScale').value),
        heroPortraitLight: $('#heroPortraitLight').value || '',
        heroPortraitLightOpacity: parseFloat($('#heroPortraitLightOpacity').value),
        heroPortraitLightScale: parseFloat($('#heroPortraitLightScale').value)
      };
      await api('settings', { method: 'PUT', body: JSON.stringify(updated) });
      hasUnsavedChanges = false;
      $('#heroSuccess').classList.remove('hidden');
      setTimeout(() => $('#heroSuccess').classList.add('hidden'), 3000);
      showToast('Hero settings saved', 'success');
      clearDraft();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // ============================================
  // ABOUT — Markdown Editor
  // ============================================
  function parseMd(text) {
    if (!text) return '';
    let h = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^- (.+)$/gm, '<li>$1</li>');
    h = h.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    h = h.split(/\n\n+/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<[hul]/.test(block)) return block;
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    return h;
  }

  const aboutTa = $('#aboutText');
  const mdPreview = $('#mdPreview');
  const mdPreviewToggle = $('#mdPreviewToggle');
  let mdPreviewActive = false;

  function updateMdPreview() {
    if (aboutTa && mdPreview) mdPreview.innerHTML = parseMd(aboutTa.value);
  }

  if (mdPreviewToggle) {
    mdPreviewToggle.addEventListener('click', () => {
      mdPreviewActive = !mdPreviewActive;
      mdPreviewToggle.dataset.active = mdPreviewActive;
      if (mdPreviewActive) {
        mdPreview.classList.add('active');
        aboutTa.style.display = 'none';
        updateMdPreview();
      } else {
        mdPreview.classList.remove('active');
        aboutTa.style.display = '';
      }
    });
  }

  // Toolbar actions
  $$('.md-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!aboutTa) return;
      const a = btn.dataset.action;
      const s = aboutTa.selectionStart;
      const e = aboutTa.selectionEnd;
      const sel = aboutTa.value.substring(s, e);
      let pre = '', post = '', rep = '';

      if (a === 'bold') { pre = '**'; post = '**'; rep = sel || 'bold text'; }
      else if (a === 'italic') { pre = '*'; post = '*'; rep = sel || 'italic text'; }
      else if (a === 'code') { pre = '`'; post = '`'; rep = sel || 'code'; }
      else if (a === 'link') { rep = '[' + (sel || 'link text') + '](https://...)'; }
      else if (a === 'list') { pre = '- '; rep = (sel || 'item').replace(/\n/g, '\n- '); }
      else if (a === 'heading') { pre = '## '; rep = sel || 'Heading'; }

      aboutTa.value = aboutTa.value.substring(0, s) + pre + rep + post + aboutTa.value.substring(e);
      aboutTa.focus();
      aboutTa.selectionStart = s + pre.length;
      aboutTa.selectionEnd = s + pre.length + rep.length;
      if (mdPreviewActive) updateMdPreview();
    });
  });

  // Keyboard shortcuts
  if (aboutTa) {
    aboutTa.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); $$('.md-btn[data-action="bold"]')[0]?.click(); }
        else if (e.key === 'i') { e.preventDefault(); $$('.md-btn[data-action="italic"]')[0]?.click(); }
      }
      // Tab support
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = aboutTa.selectionStart;
        aboutTa.value = aboutTa.value.substring(0, s) + '  ' + aboutTa.value.substring(aboutTa.selectionEnd);
        aboutTa.selectionStart = aboutTa.selectionEnd = s + 2;
      }
    });
    aboutTa.addEventListener('input', () => { if (mdPreviewActive) updateMdPreview(); });
  }

  async function loadAbout() {
    try {
      const d = await api('settings');
      let text = d.aboutText || '';
      if (!text && (d.aboutText1 || d.aboutText2)) {
        text = (d.aboutText1 || '') + '\n\n' + (d.aboutText2 || '');
      }
      if (aboutTa) { aboutTa.value = text; }
      if (d.aboutSkills) $('#aboutSkills').value = d.aboutSkills;
      if (d.aboutImage) uploads.about.setImage(d.aboutImage);
      if (d.aboutResumeUrl) {
        resumeHidden.value = d.aboutResumeUrl;
        const fileName = d.aboutResumeUrl.split('/').pop() || 'resume.pdf';
        resumeFileName.textContent = decodeURIComponent(fileName);
        resumePreview.classList.remove('hidden');
        resumeDropzone.classList.add('hidden');
      }
    } catch (e) { console.error(e); }
  }

  $('#aboutForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const updated = {
        aboutImage: $('#aboutImage').value || '',
        aboutText: aboutTa ? aboutTa.value.trim() : '',
        aboutSkills: $('#aboutSkills').value.trim(),
        aboutResumeUrl: $('#aboutResumeUrl').value.trim()
      };
      await api('settings', { method: 'PUT', body: JSON.stringify(updated) });
      hasUnsavedChanges = false;
      $('#aboutSuccess').classList.remove('hidden');
      setTimeout(() => $('#aboutSuccess').classList.add('hidden'), 3000);
      showToast('About section saved', 'success');
      clearDraft();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // ============================================
  // ASSETS
  // ============================================
  async function loadAssets() {
    try {
      const d = await api('assets');
      assets = d.files || [];
      renderAssets();
    } catch (e) {
      console.error('Failed to load assets:', e);
      assets = [];
      renderAssets();
    }
  }

  function renderAssets() {
    const list = $('#assetsList'), empty = $('#assetsEmptyState');
    const orphanBar = $('#orphanAssetsBar');
    if (!list || !empty) return;

    if (!assets.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      if (orphanBar) {
        orphanBar.classList.add('hidden');
        orphanBar.innerHTML = '';
      }
      return;
    }

    empty.classList.add('hidden');

    const typeIcons = {
      image: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
      video: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
      audio: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
      document: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
      design: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>',
      archive: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
      other: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>'
    };

    const typeColors = {
      image: '#22c55e', video: '#ef4444', audio: '#a855f7',
      document: '#3b82f6', design: '#f59e0b', archive: '#6b7280', other: '#6b7280'
    };

    const orphanCount = assets.filter(f => f.orphan).length;
    if (orphanBar) {
      if (orphanCount) {
        orphanBar.classList.remove('hidden');
        orphanBar.innerHTML = '<span>' + orphanCount + ' unused file(s)</span><button type="button" class="btn btn-ghost btn-sm" id="purgeOrphansBtn">Delete unused</button>';
        const purgeBtn = $('#purgeOrphansBtn');
        if (purgeBtn) {
          purgeBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Delete Unused Assets', `Permanently delete ${orphanCount} file(s) not referenced by projects or settings?`, 'Delete unused');
            if (!confirmed) return;
            try {
              const r = await api('assets/purge-orphans', { method: 'POST', body: '{}' });
              showToast('Deleted ' + (r.deleted || 0) + ' unused file(s)', 'success');
              loadAssets();
            } catch (err) { showToast('Error: ' + err.message, 'error'); }
          });
        }
      } else {
        orphanBar.classList.add('hidden');
        orphanBar.innerHTML = '';
      }
    }

    list.innerHTML = assets.map(f => {
      const icon = typeIcons[f.type] || typeIcons.other;
      const color = typeColors[f.type] || typeColors.other;
      const isImage = f.type === 'image' || f.isImage;
      const preview = isImage
        ? '<img src="' + esc(f.url) + '" alt="' + esc(f.filename) + '" loading="lazy" onerror="this.style.display=\'none\'">'
        : (f.type === 'video'
            ? '<video src="' + esc(f.url) + '" controls muted playsinline preload="metadata" aria-label="Preview ' + esc(f.filename) + '"></video>'
            : '<div class="asset-icon" style="color:' + color + '">' + icon + '</div>');

      return '<div class="asset-card' + (f.orphan ? ' is-orphan' : '') + '" data-filename="' + esc(f.filename) + '" data-type="' + f.type + '">' +
        '<div class="asset-preview">' + preview + '</div>' +
        '<div class="asset-info">' +
          '<div class="asset-name" title="' + esc(f.filename) + '">' + esc(f.filename) + '</div>' +
          '<div class="asset-meta">' +
            '<span class="asset-type-badge" style="background:' + color + '20;color:' + color + '">' + f.type + '</span> ' +
            (f.orphan ? '<span class="asset-type-badge" style="background:var(--warning-subtle);color:var(--warning)">unused</span> ' : '<span class="asset-type-badge" style="background:var(--success-subtle);color:var(--success)">in use</span> ') +
            f.sizeFormatted + ' &middot; ' + new Date(f.modified).toLocaleDateString() +
          '</div>' +
        '</div>' +
        '<div class="asset-actions">' +
          '<button class="btn btn-ghost btn-sm copy-url" data-url="' + esc(f.url) + '" title="Copy URL">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
          '</button>' +
          '<a href="' + esc(f.url) + '" download="' + esc(f.filename) + '" class="btn btn-ghost btn-sm" title="Download">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
          '</a>' +
          '<button class="btn btn-ghost btn-sm del-asset" data-filename="' + esc(f.filename) + '" title="Delete" style="color:var(--danger)">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Bind events
    $$('.copy-url').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(window.location.origin + b.dataset.url)
        .then(() => showToast('URL copied', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
    }));

    $$('.del-asset').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      const name = b.dataset.filename;
      const confirmed = await showConfirm('Delete Asset', `Delete "${name}"? This cannot be undone.`);
      if (!confirmed) return;
      try {
        await api(`/upload/${encodeURIComponent(name)}`, { method: 'DELETE' });
        showToast('Asset deleted', 'success');
        loadAssets();
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    }));
  }

  // Upload media from the Assets page (picker or drag and drop)
  const assetFileInput = $('#assetFileInput');
  const assetUploadDropzone = $('#assetUploadDropzone');
  const assetUploadProgress = $('#assetUploadProgress');
  const assetUploadProgressTitle = $('#assetUploadProgressTitle');
  const assetUploadProgressFile = $('#assetUploadProgressFile');
  const assetUploadProgressPercent = $('#assetUploadProgressPercent');
  const assetUploadProgressTrack = $('#assetUploadProgressTrack');
  const assetUploadProgressFill = $('#assetUploadProgressFill');
  const assetUploadProgressCount = $('#assetUploadProgressCount');
  const assetUploadProgressSize = $('#assetUploadProgressSize');
  const uploadAssetBtn = $('#uploadAssetBtn');
  let assetUploadRunning = false;
  let assetProgressHideTimer = null;

  function formatUploadBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const amount = value / Math.pow(1024, unit);
    return (unit === 0 || amount >= 10 ? Math.round(amount) : amount.toFixed(1)) + ' ' + units[unit];
  }

  function updateAssetUploadProgress(percent, loadedBytes, totalBytes) {
    const safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
    assetUploadProgressPercent.textContent = safePercent + '%';
    assetUploadProgressFill.style.width = safePercent + '%';
    assetUploadProgressTrack.setAttribute('aria-valuenow', String(safePercent));
    assetUploadProgressTrack.setAttribute('aria-valuetext', safePercent + '% uploaded');
    assetUploadProgressSize.textContent = formatUploadBytes(loadedBytes) + ' / ' + formatUploadBytes(totalBytes);
  }

  function uploadAssetFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('file', file);

      xhr.open('POST', API + 'upload', true);
      xhr.withCredentials = true;
      xhr.upload.addEventListener('progress', event => {
        const total = event.lengthComputable ? event.total : file.size;
        const loaded = Math.min(event.loaded, total);
        // Reaching the server is not the same as being saved. Hold at 95%
        // until the API confirms the file exists, instead of showing a false 100%.
        const confirmedLoaded = total > 0 ? (loaded / total) * file.size * 0.95 : 0;
        onProgress(confirmedLoaded, file.size, loaded >= total ? 'processing' : 'uploading');
      });
      xhr.addEventListener('load', () => {
        let data = {};
        try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300 && data.url && data.filename) {
          onProgress(file.size, file.size, 'complete');
          resolve(data);
        } else {
          if (xhr.status === 401) logout();
          const invalidResponse = xhr.status >= 200 && xhr.status < 300
            ? 'The server did not confirm that the file was saved'
            : 'Server rejected the upload';
          reject(new Error(data.error || (xhr.status === 413 ? 'File is larger than the server limit' : invalidResponse)));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error while uploading')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));
      xhr.send(fd);
    });
  }

  async function uploadAssetFiles(fileList) {
    if (assetUploadRunning) {
      showToast('Please wait for the current upload to finish.', 'info');
      return;
    }

    const files = Array.from(fileList || []);
    if (!files.length) return;

    const accepted = files.filter(file => {
      if (file.size <= 50 * 1024 * 1024) return true;
      showToast(file.name + ' is too large. Max 50MB.', 'error', 5000);
      return false;
    });
    if (!accepted.length) {
      assetFileInput.value = '';
      return;
    }

    clearTimeout(assetProgressHideTimer);
    assetUploadRunning = true;
    assetUploadDropzone.classList.add('is-uploading');
    assetUploadDropzone.setAttribute('aria-busy', 'true');
    uploadAssetBtn.disabled = true;
    assetUploadProgress.classList.remove('hidden', 'is-complete', 'is-error');
    assetUploadProgressTitle.textContent = accepted.length === 1 ? 'Uploading media' : 'Uploading ' + accepted.length + ' files';
    assetUploadProgressFile.textContent = 'Preparing your upload…';

    const totalBytes = accepted.reduce((sum, file) => sum + file.size, 0);
    let confirmedBytes = 0;
    let uploaded = 0;
    let failed = 0;
    updateAssetUploadProgress(0, 0, totalBytes);

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const confirmedBeforeFile = confirmedBytes;
      let currentVisibleBytes = 0;
      assetUploadProgressTitle.textContent = 'Uploading media';
      assetUploadProgressFile.textContent = file.name;
      assetUploadProgressCount.textContent = 'File ' + (i + 1) + ' of ' + accepted.length;

      try {
        await uploadAssetFile(file, (loaded, fileTotal, phase) => {
          currentVisibleBytes = Math.min(file.size, Math.max(0, loaded || 0));
          const overallLoaded = confirmedBeforeFile + currentVisibleBytes;
          updateAssetUploadProgress((overallLoaded / totalBytes) * 100, overallLoaded, totalBytes);
          if (phase === 'processing') {
            assetUploadProgressTitle.textContent = 'Saving media on server…';
            assetUploadProgressFile.textContent = 'Confirming ' + file.name;
            assetUploadProgressSize.textContent = formatUploadBytes(confirmedBeforeFile + file.size) + ' / ' + formatUploadBytes(totalBytes);
          }
        });
        uploaded++;
        confirmedBytes = confirmedBeforeFile + file.size;
        updateAssetUploadProgress((confirmedBytes / totalBytes) * 100, confirmedBytes, totalBytes);
      } catch (err) {
        failed++;
        // Keep the bar below completion when the server did not save the file.
        confirmedBytes = confirmedBeforeFile + currentVisibleBytes;
        updateAssetUploadProgress((confirmedBytes / totalBytes) * 100, confirmedBytes, totalBytes);
        showToast('Could not upload ' + file.name + ': ' + err.message, 'error', 7000);
      }
    }

    assetUploadRunning = false;
    assetUploadDropzone.classList.remove('is-uploading');
    assetUploadDropzone.removeAttribute('aria-busy');
    uploadAssetBtn.disabled = false;
    assetFileInput.value = '';

    if (failed) {
      assetUploadProgress.classList.add('is-error');
      assetUploadProgressPercent.textContent = uploaded ? 'Issue' : 'Failed';
      assetUploadProgressTitle.textContent = uploaded ? 'Upload finished with an issue' : 'Upload failed';
      assetUploadProgressFile.textContent = uploaded
        ? uploaded + ' uploaded · ' + failed + ' failed'
        : 'The server did not save this media. See the error message and try again.';
      assetUploadProgressTrack.setAttribute('aria-valuetext', uploaded ? 'Some files failed to upload' : 'Upload failed');
    } else {
      updateAssetUploadProgress(100, totalBytes, totalBytes);
      assetUploadProgress.classList.add('is-complete');
      assetUploadProgressTitle.textContent = uploaded === 1 ? 'Upload complete' : 'All uploads complete';
      assetUploadProgressFile.textContent = uploaded === 1 ? accepted[0].name : uploaded + ' files are ready to use';
      showToast(uploaded + (uploaded === 1 ? ' file uploaded' : ' files uploaded'), 'success');
    }
    assetUploadProgressCount.textContent = uploaded + ' uploaded' + (failed ? ' · ' + failed + ' failed' : '');

    if (uploaded) await loadAssets();

    assetProgressHideTimer = setTimeout(() => {
      assetUploadProgress.classList.add('hidden');
      assetUploadProgress.classList.remove('is-complete', 'is-error');
    }, 4500);
  }

  uploadAssetBtn.addEventListener('click', () => {
    if (!assetUploadRunning) assetFileInput.click();
  });
  $('#refreshAssetsBtn').addEventListener('click', () => { loadAssets(); showToast('Refreshed', 'info'); });
  assetFileInput.addEventListener('change', e => uploadAssetFiles(e.target.files));
  assetUploadDropzone.addEventListener('click', () => {
    if (!assetUploadRunning) assetFileInput.click();
  });
  assetUploadDropzone.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !assetUploadRunning) {
      e.preventDefault();
      assetFileInput.click();
    }
  });
  assetUploadDropzone.addEventListener('dragover', e => {
    e.preventDefault();
    if (!assetUploadRunning) assetUploadDropzone.classList.add('dragover');
  });
  assetUploadDropzone.addEventListener('dragleave', () => assetUploadDropzone.classList.remove('dragover'));
  assetUploadDropzone.addEventListener('drop', e => {
    e.preventDefault();
    assetUploadDropzone.classList.remove('dragover');
    uploadAssetFiles(e.dataTransfer.files);
  });


  // ============================================
  // SETTINGS (General)
  // ============================================
  async function loadSettings() {
    try {
      const d = await api('settings');
      ['siteName','siteTitle','tagline','email','phone','location','linkedin','behance','instagram','footerCopy','footerNote'].forEach(k => {
        const el = $(`#setting${k.charAt(0).toUpperCase() + k.slice(1)}`);
        if (el && d[k] != null) el.value = d[k];
      });
      // Empty is a valid saved state; never reintroduce removed defaults.
      categories = Array.isArray(d.categories) ? d.categories : [];
      projectLayout = d.projectLayout || '2col';
      renderCategories();
      populateCategoryDropdown();
      // Set active layout button
      $$('.layout-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.layout === projectLayout);
      });
    } catch (e) { console.error(e); }
  }

  function renderCategories() {
    const list = $('#categoriesList');
    if (!list) return;
    list.innerHTML = categories.length
      ? categories.map(c =>
          '<div class="category-tag">' + esc(c) + '<button type="button" class="category-tag-remove" data-cat="' + esc(c) + '">&times;</button></div>'
        ).join('')
      : '<span class="categories-empty">No categories saved yet.</span>';
    $$('.category-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => removeCategory(btn.dataset.cat));
    });
  }

  async function persistCategoryList(nextCategories) {
    const saved = await api('settings', {
      method: 'PUT',
      body: JSON.stringify({ categories: nextCategories })
    });
    if (!Array.isArray(saved.categories)) throw new Error('The server did not confirm the category list');

    const verified = await api('settings');
    if (!Array.isArray(verified.categories)) throw new Error('The saved category list could not be read back');
    const expected = nextCategories.map(getCategorySlug);
    const actual = verified.categories.map(getCategorySlug);
    if (expected.length !== actual.length || expected.some((category, index) => category !== actual[index])) {
      throw new Error('The category list did not persist correctly');
    }
    return verified.categories;
  }

  async function removeCategory(name) {
    const catProjects = projects.filter(p => p.category && getCategorySlug(p.category) === getCategorySlug(name));
    if (catProjects.length) {
      const confirmed = await showConfirm('Remove Category', `Removing "${name}" will untag ${catProjects.length} project(s). Continue?`);
      if (!confirmed) return;
    }

    const nextCategories = categories.filter(c => getCategorySlug(c) !== getCategorySlug(name));
    try {
      for (const project of catProjects) {
        await api('projects/' + encodeURIComponent(project.id), {
          method: 'PUT',
          body: JSON.stringify({ category: '' })
        });
      }
      categories = await persistCategoryList(nextCategories);
      await loadProjects();
      renderCategories();
      populateCategoryDropdown();
      showToast('Category removed and saved', 'success');
    } catch (err) {
      showToast('Could not remove category: ' + err.message, 'error', 6000);
      await loadSettings();
      await loadProjects();
    }
  }

  $('#addCategoryBtn').addEventListener('click', async () => {
    const input = $('#newCategoryInput');
    const name = input.value.trim();
    if (!name) return;
    if (categories.some(c => getCategorySlug(c) === getCategorySlug(name))) {
      showToast('Category already exists', 'error');
      return;
    }

    const nextCategories = categories.concat(name);
    try {
      categories = await persistCategoryList(nextCategories);
      if (!categories.some(c => getCategorySlug(c) === getCategorySlug(name))) {
        throw new Error('The new category was not found after saving');
      }
      input.value = '';
      renderCategories();
      populateCategoryDropdown(name);
      showToast('Category added and saved', 'success');
    } catch (err) {
      showToast('Could not save category: ' + err.message, 'error', 6000);
    }
  });

  $('#newCategoryInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('#addCategoryBtn').click(); }
  });

  $('#settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      // Partial update — only general site fields (server merges known keys)
      const form = Object.fromEntries(new FormData($('#settingsForm')));
      await api('settings', { method: 'PUT', body: JSON.stringify(form) });
      hasUnsavedChanges = false;
      $('#settingsSuccess').classList.remove('hidden');
      setTimeout(() => $('#settingsSuccess').classList.add('hidden'), 3000);
      showToast('Settings saved', 'success');
      clearDraft();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // Password change
  const passwordForm = $('#passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = $('#passwordError');
      const okEl = $('#passwordSuccess');
      if (errEl) errEl.textContent = '';
      if (okEl) okEl.classList.add('hidden');
      const currentPassword = $('#currentPassword')?.value || '';
      const newPassword = $('#newPassword')?.value || '';
      const confirmPassword = $('#confirmPassword')?.value || '';
      if (newPassword.length < 8) {
        if (errEl) errEl.textContent = 'New password must be at least 8 characters.';
        return;
      }
      if (newPassword !== confirmPassword) {
        if (errEl) errEl.textContent = 'New passwords do not match.';
        return;
      }
      try {
        await api('auth/password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        passwordForm.reset();
        if (okEl) { okEl.classList.remove('hidden'); setTimeout(() => okEl.classList.add('hidden'), 3000); }
        showToast('Password updated', 'success');
      } catch (err) {
        if (errEl) errEl.textContent = err.message;
        showToast('Error: ' + err.message, 'error');
      }
    });
  }

  // Backup download / restore
  $('#downloadBackupBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch(API + 'backup', { credentials: 'same-origin' });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Backup downloaded', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  $('#restoreBackupBtn')?.addEventListener('click', () => $('#restoreBackupInput')?.click());
  $('#restoreBackupInput')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const confirmed = await showConfirm('Restore Backup', 'Restore will overwrite projects, settings, messages, and analytics from this file. Continue?', 'Restore');
    if (!confirmed) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api('backup/restore', { method: 'POST', body: JSON.stringify(data) });
      const status = $('#backupStatus');
      if (status) {
        status.textContent = 'Backup restored successfully.';
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 4000);
      }
      showToast('Backup restored', 'success');
      showDashboard();
    } catch (err) { showToast('Restore failed: ' + err.message, 'error'); }
  });

  // ============================================
  // UTILS
  // ============================================
  // ASSET PICKER
  // ============================================
  let pickerCallback = null;
  let pickerFilter = 'all';
  const pickerModal = $('#assetPickerModal');
  const pickerGrid = $('#assetPickerGrid');
  const pickerEmpty = $('#assetPickerEmpty');
  const pickerEmptyText = $('#assetPickerEmptyText');
  const pickerTitle = $('#assetPickerTitle');
  const pickerSearch = $('#assetPickerSearch');

  function openAssetPicker(callback, filter) {
    pickerCallback = callback;
    pickerFilter = filter || 'all';
    pickerModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    pickerSearch.value = '';
    pickerTitle.textContent = pickerFilter === 'video' ? 'Choose a Project Video' : 'Browse Assets';
    pickerSearch.placeholder = pickerFilter === 'video' ? 'Search videos...' : 'Search assets...';
    pickerEmptyText.textContent = pickerFilter === 'video'
      ? 'No videos found. Upload one in the Assets tab first.'
      : 'No assets found. Upload files in the Assets tab first.';
    renderPickerAssets(assets);
  }

  function closeAssetPicker() {
    pickerModal.classList.add('hidden');
    const projectModalOpen = !$('#projectModal').classList.contains('hidden');
    document.body.style.overflow = projectModalOpen ? 'hidden' : '';
    pickerCallback = null;
  }

  function renderPickerAssets(list) {
    let filtered = list;
    if (pickerFilter === 'image') filtered = list.filter(f => f.type === 'image');
    else if (pickerFilter === 'video') filtered = list.filter(f => f.type === 'video');
    else if (pickerFilter === 'document') filtered = list.filter(f => f.type === 'document' || /\.(pdf|doc|docx|txt)$/i.test(f.filename));

    if (!filtered.length) {
      pickerGrid.innerHTML = '';
      pickerEmpty.classList.remove('hidden');
      return;
    }
    pickerEmpty.classList.add('hidden');

    const typeIcons = {
      image: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
      document: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
      video: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
      other: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>'
    };

    pickerGrid.innerHTML = filtered.map(f => {
      const isImg = f.type === 'image';
      const isVideo = f.type === 'video';
      const preview = isImg
        ? '<img src="' + esc(f.url) + '" alt="' + esc(f.filename) + '" loading="lazy" onerror="this.style.display=\'none\'">'
        : (isVideo
            ? '<video src="' + esc(f.url) + '" muted playsinline preload="metadata" aria-label="' + esc(f.filename) + '"></video><span class="asset-video-play"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 3 21 12 7 21 7 3"></polygon></svg></span>'
            : '<div class="asset-icon" style="color:var(--text-dim)">' + (typeIcons[f.type] || typeIcons.other) + '</div>');

      return '<div class="asset-card picker-card" data-url="' + esc(f.url) + '" data-name="' + esc(f.filename) + '" style="cursor:pointer">' +
        '<div class="asset-preview' + (isVideo ? ' asset-preview-picker' : '') + '">' + preview + '</div>' +
        '<div class="asset-info"><div class="asset-name" title="' + esc(f.filename) + '">' + esc(f.filename) + '</div>' +
        '<div class="asset-meta">' + f.sizeFormatted + '</div></div>' +
      '</div>';
    }).join('');

    $$('.picker-card').forEach(card => {
      card.addEventListener('click', () => {
        if (pickerCallback) pickerCallback(card.dataset.url, card.dataset.name);
        closeAssetPicker();
      });
    });
  }

  pickerSearch.addEventListener('input', () => {
    const q = pickerSearch.value.toLowerCase();
    const filtered = assets.filter(f => f.filename.toLowerCase().includes(q));
    renderPickerAssets(filtered);
  });

  $('#assetPickerClose').addEventListener('click', closeAssetPicker);
  $('#assetPickerBackdrop').addEventListener('click', closeAssetPicker);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !pickerModal.classList.contains('hidden')) closeAssetPicker();
  });

  // Browse buttons — images
  $$('.image-upload-browse-btn[data-picker]:not([data-picker="resume"])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const picker = btn.dataset.picker;
      openAssetPicker(url => {
        const upload = uploads[picker];
        if (upload) upload.setImage(url);
      }, 'image');
    });
  });

  // Browse button — resume (documents)
  const resumeBrowseBtn = document.querySelector('.image-upload-browse-btn[data-picker="resume"]');
  if (resumeBrowseBtn) {
    resumeBrowseBtn.addEventListener('click', e => {
      e.stopPropagation();
      openAssetPicker((url, name) => {
        resumeHidden.value = url;
        resumeFileName.textContent = name || 'resume.pdf';
        resumePreview.classList.remove('hidden');
        resumeDropzone.classList.add('hidden');
      }, 'document');
    });
  }

  // ============================================
  // TIMELINE MANAGEMENT
  // ============================================
  let experienceData = [];
  let educationData = [];

  const chevronSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  const gripSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>';
  const upSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  const downSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  const trashSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

  function renderTimelineCard(item, type, index, total) {
    return `
      <div class="timeline-admin-card" data-type="${type}" data-index="${index}">
        <div class="card-header">
          <span class="card-grip">${gripSvg}</span>
          <span class="card-number">${index + 1}</span>
          <div class="card-preview">
            <div class="card-preview-title">${esc(item.title || 'Untitled')}</div>
            <div class="card-preview-sub">${esc(item.subtitle || 'No organization')} &middot; ${esc(item.date || 'No date')}</div>
          </div>
          <div class="card-actions-bar">
            <button type="button" class="card-action-btn move-btn" data-dir="up" title="Move up" ${index === 0 ? 'disabled style="opacity:0.3;pointer-events:none"' : ''}>${upSvg}</button>
            <button type="button" class="card-action-btn move-btn" data-dir="down" title="Move down" ${index === total - 1 ? 'disabled style="opacity:0.3;pointer-events:none"' : ''}>${downSvg}</button>
            <button type="button" class="card-action-btn delete-btn" title="Remove entry">${trashSvg}</button>
          </div>
          <span class="card-chevron">${chevronSvg}</span>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-row">
              <label>Date / Period</label>
              <input type="text" name="date" value="${esc(item.date || '')}" placeholder="e.g. 2022 — Present">
            </div>
            <div class="form-row">
              <label>Organization</label>
              <input type="text" name="subtitle" value="${esc(item.subtitle || '')}" placeholder="e.g. Google, Stanford University">
            </div>
          </div>
          <div class="form-row">
            <label>Title / Role</label>
            <input type="text" name="title" value="${esc(item.title || '')}" placeholder="e.g. Senior Motion Designer">
          </div>
          <div class="form-row">
            <label>Description</label>
            <textarea name="desc" rows="2" placeholder="Brief description of your role or achievements...">${esc(item.desc || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  function renderTimelineLists() {
    const expList = $('#experienceList');
    const eduList = $('#educationList');
    const expEmpty = $('#expEmpty');
    const eduEmpty = $('#eduEmpty');
    const expCount = $('#expCount');
    const eduCount = $('#eduCount');

    if (expList) {
      expList.innerHTML = experienceData.map((item, i) => renderTimelineCard(item, 'experience', i, experienceData.length)).join('');
      if (expEmpty) expEmpty.classList.toggle('hidden', experienceData.length > 0);
      if (expCount) expCount.textContent = experienceData.length + ' entr' + (experienceData.length === 1 ? 'y' : 'ies');
    }
    if (eduList) {
      eduList.innerHTML = educationData.map((item, i) => renderTimelineCard(item, 'education', i, educationData.length)).join('');
      if (eduEmpty) eduEmpty.classList.toggle('hidden', educationData.length > 0);
      if (eduCount) eduCount.textContent = educationData.length + ' entr' + (educationData.length === 1 ? 'y' : 'ies');
    }

    // Bind move/delete handlers
    $$('.timeline-admin-card .card-header').forEach(header => {
      header.addEventListener('click', () => header.parentElement.classList.toggle('expanded'));
    });

    $$('.timeline-admin-card .card-actions-bar').forEach(bar => {
      bar.addEventListener('click', e => e.stopPropagation());
    });

    $$('.timeline-admin-card .move-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest('.timeline-admin-card');
        const type = card.dataset.type;
        const index = parseInt(card.dataset.index);
        const dir = btn.dataset.dir;
        const arr = type === 'experience' ? experienceData : educationData;
        const swap = dir === 'up' ? index - 1 : index + 1;
        if (swap < 0 || swap >= arr.length) return;
        [arr[index], arr[swap]] = [arr[swap], arr[index]];
        renderTimelineLists();
      });
    });

    $$('.timeline-admin-card .delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest('.timeline-admin-card');
        const type = card.dataset.type;
        const index = parseInt(card.dataset.index);
        if (type === 'experience') experienceData.splice(index, 1);
        else educationData.splice(index, 1);
        renderTimelineLists();
      });
    });
  }

  async function loadTimeline() {
    try {
      const data = await api('settings');
      experienceData = Array.isArray(data.experience) ? JSON.parse(JSON.stringify(data.experience)) : [];
      educationData = Array.isArray(data.education) ? JSON.parse(JSON.stringify(data.education)) : [];
      renderTimelineLists();
    } catch (e) { console.error(e); }
  }

  function collectTimelineData() {
    const result = { experience: [], education: [] };
    $$('.timeline-admin-card').forEach(card => {
      const type = card.dataset.type;
      result[type].push({
        date: card.querySelector('[name="date"]').value.trim(),
        title: card.querySelector('[name="title"]').value.trim(),
        subtitle: card.querySelector('[name="subtitle"]').value.trim(),
        desc: card.querySelector('[name="desc"]').value.trim()
      });
    });
    return result;
  }

  const addExpBtn = $('#addExperienceBtn');
  if (addExpBtn) addExpBtn.addEventListener('click', () => {
    experienceData.push({ date: '', title: '', subtitle: '', desc: '' });
    renderTimelineLists();
    // Auto-expand the new card
    const cards = $$('#experienceList .timeline-admin-card');
    const last = cards[cards.length - 1];
    if (last) {
      last.classList.add('expanded');
      last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const addEduBtn = $('#addEducationBtn');
  if (addEduBtn) addEduBtn.addEventListener('click', () => {
    educationData.push({ date: '', title: '', subtitle: '', desc: '' });
    renderTimelineLists();
    const cards = $$('#educationList .timeline-admin-card');
    const last = cards[cards.length - 1];
    if (last) {
      last.classList.add('expanded');
      last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const saveTimelineBtn = $('#saveTimelineBtn');
  if (saveTimelineBtn) saveTimelineBtn.addEventListener('click', async () => {
    const data = collectTimelineData();
    saveTimelineBtn.disabled = true;
    saveTimelineBtn.textContent = 'Saving...';
    try {
      // Partial merge — only experience/education keys (server-side schema)
      await api('settings', { method: 'PUT', body: JSON.stringify(data) });
      hasUnsavedChanges = false;
      showToast('Timeline saved!', 'success');
      const success = $('#timelineSuccess');
      if (success) { success.classList.remove('hidden'); setTimeout(() => success.classList.add('hidden'), 2500); }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      saveTimelineBtn.disabled = false;
      saveTimelineBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Changes';
    }
  });

  // ============================================
  // STATISTICS
  // ============================================
  async function loadStatistics() {
    try {
      const d = await api('statistics');
      $('#statProjects').textContent = d.projectCount;
      $('#statViews').textContent = d.totalViews;
      $('#statVisitors').textContent = d.uniqueVisitors;
      $('#statDownloads').textContent = d.resumeDownloads;
      $('#statLikes').textContent = d.totalLikes;

      // Format avg time
      const avgSec = d.avgTimeSpent || 0;
      $('#statAvgTime').textContent = avgSec < 60 ? avgSec + 's' : Math.floor(avgSec / 60) + 'm ' + (avgSec % 60) + 's';

      // Page views
      const pageViewsList = $('#pageViewsList');
      if (pageViewsList && d.pageViews) {
        const pages = Object.entries(d.pageViews);
        const maxPage = Math.max(...pages.map(([,v]) => v), 1);
        pageViewsList.innerHTML = pages.map(([page, count]) => `
          <div class="stats-bar-item">
            <span class="stats-bar-label">${esc(page || '/')}</span>
            <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(count/maxPage)*100}%"></div></div>
            <span class="stats-bar-count">${count}</span>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No page views yet</p>';
      }

      // Top locations
      const topLocationsList = $('#topLocationsList');
      if (topLocationsList && d.topLocations) {
        const maxLoc = Math.max(...d.topLocations.map(([,v]) => v), 1);
        topLocationsList.innerHTML = d.topLocations.map(([loc, count]) => `
          <div class="stats-bar-item">
            <span class="stats-bar-label">${esc(loc)}</span>
            <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(count/maxLoc)*100}%"></div></div>
            <span class="stats-bar-count">${count}</span>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No location data yet</p>';
      }

      // Full title map (all projects, not only recent 5)
      const idToTitle = { ...(d.projectTitles || {}) };
      (d.allProjects || d.recentProjects || []).forEach(p => { idToTitle[String(p.id)] = p.title; });

      // Project clicks
      const projectClicksList = $('#projectClicksList');
      if (projectClicksList && d.projectClicks) {
        const clicks = Object.entries(d.projectClicks).sort((a, b) => b[1] - a[1]);
        const maxClick = Math.max(...clicks.map(([,v]) => v), 1);
        projectClicksList.innerHTML = clicks.map(([id, count]) => `
          <div class="stats-bar-item">
            <span class="stats-bar-label">${esc(idToTitle[id] || idToTitle[String(id)] || 'Project ' + id)}</span>
            <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(count/maxClick)*100}%"></div></div>
            <span class="stats-bar-count">${count}</span>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No project clicks yet</p>';
      }

      // Project likes
      const projectLikesList = $('#projectLikesList');
      if (projectLikesList && d.likesPerProject) {
        const likes = Object.entries(d.likesPerProject).filter(([,v]) => v > 0).sort((a, b) => b[1] - a[1]);
        const maxLike = Math.max(...likes.map(([,v]) => v), 1);
        projectLikesList.innerHTML = likes.map(([id, count]) => `
          <div class="stats-bar-item">
            <span class="stats-bar-label">${esc(idToTitle[id] || idToTitle[String(id)] || 'Project ' + id)}</span>
            <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(count/maxLike)*100}%;background:#ef4444"></div></div>
            <span class="stats-bar-count">${count}</span>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No likes yet</p>';
      }

      // Recent projects
      const recentList = $('#recentProjectsList');
      if (recentList && d.recentProjects) {
        recentList.innerHTML = d.recentProjects.map(p => `
          <div class="stats-list-item">
            <div class="stats-list-thumb">${p.thumbnail ? '<img src="' + esc(p.thumbnail) + '" alt="">' : ''}</div>
            <div class="stats-list-info">
              <div class="stats-list-title">${esc(p.title)}</div>
              <div class="stats-list-meta">${esc(p.category || 'No category')} &middot; ${esc(p.year || '')}</div>
            </div>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No projects yet</p>';
      }

      // Category breakdown
      const breakdown = $('#categoryBreakdown');
      if (breakdown && d.categories) {
        const cats = Object.entries(d.categories);
        const max = Math.max(...cats.map(([,v]) => v), 1);
        breakdown.innerHTML = cats.map(([cat, count]) => `
          <div class="stats-bar-item">
            <span class="stats-bar-label">${esc(cat)}</span>
            <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(count/max)*100}%"></div></div>
            <span class="stats-bar-count">${count}</span>
          </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.875rem">No categories</p>';
      }
    } catch (e) { console.error('Stats load error:', e); }
  }

  $('#refreshStatsBtn')?.addEventListener('click', () => { loadStatistics(); showToast('Statistics refreshed', 'info'); });

  // Export stats as CSV
  $('#exportStatsBtn')?.addEventListener('click', async () => {
    try {
      const d = await api('statistics');
      const rows = [];

      // Summary section
      rows.push(['SECTION', 'METRIC', 'VALUE']);
      rows.push(['Summary', 'Total Projects', d.projectCount]);
      rows.push(['Summary', 'Total Views', d.totalViews]);
      rows.push(['Summary', 'Unique Visitors', d.uniqueVisitors]);
      rows.push(['Summary', 'Avg Time Spent (sec)', d.avgTimeSpent]);
      rows.push(['Summary', 'Resume Downloads', d.resumeDownloads]);
      rows.push(['Summary', 'Total Likes', d.totalLikes]);
      rows.push(['Summary', 'Messages', d.messageCount]);
      rows.push(['Summary', 'Skills', d.skillCount]);
      rows.push([]);

      // Page views
      rows.push(['PAGE VIEWS', 'PAGE', 'VIEWS']);
      for (const [page, count] of Object.entries(d.pageViews || {})) {
        rows.push(['Page Views', page, count]);
      }
      rows.push([]);

      // Top locations
      rows.push(['TOP LOCATIONS', 'LOCATION', 'VISITS']);
      for (const [loc, count] of d.topLocations || []) {
        rows.push(['Locations', loc, count]);
      }
      rows.push([]);

      // Project clicks
      rows.push(['PROJECT CLICKS', 'PROJECT', 'CLICKS']);
      const idToTitle = { ...(d.projectTitles || {}) };
      (d.allProjects || d.recentProjects || []).forEach(p => { idToTitle[String(p.id)] = p.title; });
      for (const [id, count] of Object.entries(d.projectClicks || {})) {
        rows.push(['Clicks', idToTitle[id] || idToTitle[String(id)] || id, count]);
      }
      rows.push([]);

      // Category breakdown
      rows.push(['CATEGORIES', 'CATEGORY', 'COUNT']);
      for (const [cat, count] of Object.entries(d.categories || {})) {
        rows.push(['Categories', cat, count]);
      }

      // Convert to CSV
      const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-analytics-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Analytics exported as CSV', 'success');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
  });

  // Reset all tracking data
  $('#resetStatsBtn')?.addEventListener('click', async () => {
    const confirmed = await showConfirm('Reset Analytics', 'Delete ALL tracking data, likes, and visitor history? This cannot be undone.');
    if (!confirmed) return;
    try {
      const res = await fetch(API + 'tracking/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });
      if (!res.ok) throw new Error('Reset failed');
      loadStatistics();
      showToast('Analytics reset', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // ============================================
  // MESSAGES
  // ============================================
  let allMessages = [];

  async function loadMessages() {
    try {
      const d = await api('messages');
      allMessages = d.messages || [];
      renderMessages();
      updateMessagesBadge();
    } catch (e) { console.error('Messages load error:', e); }
  }

  function renderMessages() {
    const list = $('#messagesList');
    const empty = $('#messagesEmptyState');
    if (!list || !empty) return;

    if (!allMessages.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    list.innerHTML = allMessages.map(m => `
      <div class="message-card ${m.read ? '' : 'is-unread'}" data-id="${esc(String(m.id))}">
        <div class="message-header">
          <div>
            <span class="message-sender">${esc(m.name)}</span>
            <span class="message-email">&lt;${esc(m.email)}&gt;</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="message-time">${new Date(m.createdAt).toLocaleDateString()} ${new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
            <span class="card-chevron"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
          </div>
        </div>
        <div class="message-body">
          <div class="message-text">${esc(m.message).replace(/\n/g, '<br>')}</div>
          <div class="message-actions">
            <a href="mailto:${esc(m.email)}" class="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              Reply via Email
            </a>
            <button class="btn btn-ghost btn-sm msg-mark-read" data-id="${m.id}">${m.read ? 'Mark Unread' : 'Mark Read'}</button>
            <button class="btn btn-ghost btn-sm msg-delete" data-id="${m.id}" style="color:var(--danger)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Bind events
    $$('.message-header').forEach(h => {
      h.addEventListener('click', () => {
        const card = h.closest('.message-card');
        const isExpanded = card.classList.contains('is-expanded');
        // Collapse all
        $$('.message-card').forEach(c => c.classList.remove('is-expanded'));
        if (!isExpanded) {
          card.classList.add('is-expanded');
          // Mark as read
          const id = String(card.dataset.id);
          const msg = allMessages.find(m => String(m.id) === id);
          if (msg && !msg.read) {
            msg.read = true;
            card.classList.remove('is-unread');
            api(`/messages/${encodeURIComponent(id)}/read`, { method: 'PUT' }).catch(() => {});
            updateMessagesBadge();
          }
        }
      });
    });

    $$('.msg-mark-read').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        const id = String(b.dataset.id);
        const msg = allMessages.find(m => String(m.id) === id);
        if (msg) {
          msg.read = !msg.read;
          const card = $(`.message-card[data-id="${CSS.escape(id)}"]`);
          if (card) card.classList.toggle('is-unread', !msg.read);
          await api(`/messages/${encodeURIComponent(id)}/read`, { method: 'PUT' }).catch(() => {});
          updateMessagesBadge();
        }
      });
    });

    $$('.msg-delete').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        const id = String(b.dataset.id);
        const confirmed = await showConfirm('Delete Message', 'Delete this message? This cannot be undone.');
        if (!confirmed) return;
        try {
          await api(`/messages/${encodeURIComponent(id)}`, { method: 'DELETE' });
          allMessages = allMessages.filter(m => String(m.id) !== id);
          renderMessages();
          updateMessagesBadge();
          showToast('Message deleted', 'success');
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
      });
    });
  }

  function updateMessagesBadge() {
    const badge = $('#messagesBadge');
    if (!badge) return;
    const unread = allMessages.filter(m => !m.read).length;
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }

  $('#clearAllMessagesBtn')?.addEventListener('click', async () => {
    if (!allMessages.length) return;
    const confirmed = await showConfirm('Clear All Messages', `Delete all ${allMessages.length} messages? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api('messages', { method: 'DELETE' });
      allMessages = [];
      renderMessages();
      updateMessagesBadge();
      showToast('All messages cleared', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // ============================================
  // CATEGORIES (moved to Projects view)
  // ============================================
  function loadCategories() {
    renderCategories();
    populateCategoryDropdown();
  }

  const toggleCategoriesBtn = $('#toggleCategoriesBtn');
  if (toggleCategoriesBtn) {
    toggleCategoriesBtn.addEventListener('click', () => {
      const body = $('#categoriesBody');
      body.classList.toggle('is-collapsed');
      const icon = toggleCategoriesBtn.querySelector('svg');
      icon.style.transform = body.classList.contains('is-collapsed') ? 'rotate(-90deg)' : '';
    });
  }

  // ============================================
  // UTILS
  // ============================================
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ============================================
  // CONFIRM DIALOG
  // ============================================
  let confirmResolve = null;
  const confirmDialog = $('#confirmDialog');
  const confirmTitle = $('#confirmTitle');
  const confirmMessage = $('#confirmMessage');
  const confirmOk = $('#confirmOk');
  const confirmCancel = $('#confirmCancel');
  const confirmBackdrop = $('#confirmBackdrop');

  function showConfirm(title, message, okLabel = 'Delete') {
    return new Promise(resolve => {
      confirmResolve = resolve;
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmOk.textContent = okLabel;
      confirmDialog.classList.remove('hidden');
    });
  }

  function closeConfirm(result) {
    confirmDialog.classList.add('hidden');
    if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
  }

  if (confirmOk) confirmOk.addEventListener('click', () => closeConfirm(true));
  if (confirmCancel) confirmCancel.addEventListener('click', () => closeConfirm(false));
  if (confirmBackdrop) confirmBackdrop.addEventListener('click', () => closeConfirm(false));

  // ============================================
  // MOBILE NAV
  // ============================================
  const mobileNav = $('#mobileNav');
  function updateMobileNav() {
    if (!mobileNav) return;
    const isMobile = window.innerWidth <= 768;
    mobileNav.classList.toggle('hidden', !isMobile);
  }
  updateMobileNav();
  window.addEventListener('resize', updateMobileNav);

  if (mobileNav) {
    mobileNav.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        mobileNav.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $$('.nav-item').forEach(b => b.classList.remove('active'));
        const target = btn.dataset.view;
        const sidebarBtn = $(`.nav-item[data-view="${target}"]`);
        if (sidebarBtn) sidebarBtn.classList.add('active');
        $$('.view').forEach(v => v.classList.remove('active'));
        $(`#${target}View`).classList.add('active');
        if (target === 'assets') loadAssets();
        if (target === 'timeline') loadTimeline();
        if (target === 'statistics') loadStatistics();
        if (target === 'messages') { loadMessages(); updateMessagesBadge(); }
      });
    });
  }

  // ============================================
  // SEARCH (debounced)
  // ============================================
  let searchTimeout = null;
  function addSearchBar() {
    const viewHeader = document.querySelector('#projectsView .view-header');
    if (!viewHeader || document.querySelector('.search-bar')) return;
    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar';
    searchBar.innerHTML = '<svg class="search-bar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="projectSearch" placeholder="Search projects...">';
    viewHeader.parentNode.insertBefore(searchBar, viewHeader.nextSibling);

    const input = searchBar.querySelector('input');
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        if (!q) { renderProjects(); return; }
        const filtered = projects.filter(p =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.year || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
        const list = $('#projectsList'), empty = $('#emptyState');
        if (!filtered.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        list.innerHTML = filtered.map(p => {
          const hasCat = p.category && p.category.trim() !== '';
          return '<div class="project-card' + (hasCat ? '' : ' project-card-warning') + '" data-id="' + p.id + '"><div class="project-thumb">' + (p.thumbnail ? '<img src="' + p.thumbnail + '" alt="' + esc(p.title) + '" loading="lazy">' : '<div class="project-thumb-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg></div>') + '</div><div class="project-info"><div class="project-category">' + (hasCat ? getCategoryLabel(p.category) : '<em style="color:var(--danger)">No category</em>') + '</div><div class="project-title">' + esc(p.title) + '</div><div class="project-year">' + esc(p.year || '') + '</div></div><div class="project-actions"><button class="btn btn-ghost btn-sm edit-btn" data-id="' + p.id + '">Edit</button><button class="btn btn-ghost btn-sm del-btn" data-id="' + p.id + '" style="color:var(--danger)">Delete</button></div></div>';
        }).join('');
        $$('.edit-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openEditProject(+b.dataset.id); }));
        $$('.del-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteProject(+b.dataset.id); }));
        $$('.project-card').forEach(c => c.addEventListener('click', () => openEditProject(+c.dataset.id)));
      }, 200);
    });
  }
  addSearchBar();

  // ============================================
  // LIVE PREVIEW
  // ============================================
  const previewOverlay = $('#previewOverlay');
  const previewFrame = $('#previewFrame');
  const previewBtn = $('#previewBtn');
  const previewCloseBtn = $('#previewCloseBtn');
  const previewRefreshBtn = $('#previewRefreshBtn');
  const breadcrumb = $('#topbarBreadcrumb');

  function openPreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (previewFrame) previewFrame.src = '/';
  }

  function closePreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (previewBtn) previewBtn.addEventListener('click', openPreview);
  if (previewCloseBtn) previewCloseBtn.addEventListener('click', closePreview);
  if (previewRefreshBtn) previewRefreshBtn.addEventListener('click', () => {
    if (previewFrame) previewFrame.src = previewFrame.src;
  });

  // Device toggle
  $$('.preview-device').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.preview-device').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (previewFrame) {
        previewFrame.classList.toggle('is-mobile', btn.dataset.device === 'mobile');
      }
    });
  });

  // Auto-refresh preview after saves
  const originalShowToast = showToast;
  window.showToast = function(msg, type, ms) {
    originalShowToast(msg, type, ms);
    if (type === 'success' && previewFrame && !previewOverlay?.classList.contains('hidden')) {
      syncDraftToPreview();
      setTimeout(() => { previewFrame.src = previewFrame.src; }, 500);
    }
  };

  // ============================================
  // PREVIEW DRAFT SYNC (real-time)
  // ============================================
  let draftRefreshTimeout = null;

  function clearDraft() {
    localStorage.removeItem('portfolio-preview-draft');
  }

  function collectHeroDraft() {
    const draft = {};
    ['heroEyebrow','heroFirstName','heroLastName','heroSubtitle','heroAvailability',
     'heroStat1Value','heroStat1Label','heroStat2Value','heroStat2Label','heroStat3Value','heroStat3Label',
     'heroCtaText','heroCtaLink'].forEach(k => {
      const el = $(`#${k}`);
      if (el) draft[k] = el.value.trim();
    });
    const portraitDark = $('#heroPortraitDark');
    if (portraitDark) draft.heroPortraitDark = portraitDark.value || '';
    return draft;
  }

  function collectAboutDraft() {
    const draft = {};
    const aboutText = $('#aboutText');
    if (aboutText) draft.aboutText = aboutText.value;
    const aboutSkills = $('#aboutSkills');
    if (aboutSkills) draft.aboutSkills = aboutSkills.value.trim();
    const aboutImage = $('#aboutImage');
    if (aboutImage) draft.aboutImage = aboutImage.value || '';
    return draft;
  }

  function collectSettingsDraft() {
    const draft = {};
    ['siteName','siteTitle','tagline','email','phone','location','linkedin','behance','instagram','footerCopy','footerNote'].forEach(k => {
      const el = $(`#setting${k.charAt(0).toUpperCase() + k.slice(1)}`);
      if (el) draft[k] = el.value.trim();
    });
    return draft;
  }

  function syncDraftToPreview() {
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;

    let draft = {};
    const viewId = activeView.id;
    if (viewId === 'heroView') draft = collectHeroDraft();
    else if (viewId === 'aboutView') draft = collectAboutDraft();
    else if (viewId === 'settingsView') draft = collectSettingsDraft();

    if (Object.keys(draft).length) {
      // Merge with existing draft
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem('portfolio-preview-draft') || '{}'); } catch {}
      const merged = { ...existing, ...draft };
      localStorage.setItem('portfolio-preview-draft', JSON.stringify(merged));

      // Debounced iframe refresh
      clearTimeout(draftRefreshTimeout);
      draftRefreshTimeout = setTimeout(() => {
        if (previewFrame && !previewOverlay?.classList.contains('hidden')) {
          previewFrame.src = previewFrame.src;
        }
      }, 800);
    }
  }

  // Listen for input changes on all form fields
  document.addEventListener('input', e => {
    if (e.target.closest('.settings-form, .modal-form')) {
      syncDraftToPreview();
    }
  });

  // Also sync on select change
  document.addEventListener('change', e => {
    if (e.target.closest('.settings-form, .modal-form')) {
      syncDraftToPreview();
    }
  });

  // ============================================
  // COMMAND PALETTE
  // ============================================
  const cmdPalette = $('#commandPalette');
  const cmdInput = $('#commandInput');
  const cmdResults = $('#commandResults');
  const cmdBackdrop = $('#commandBackdrop');
  let cmdActiveIndex = 0;

  const commands = [
    { group: 'Navigation', label: 'Projects', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>', action: () => navigateTo('projects'), shortcut: 'G P' },
    { group: 'Navigation', label: 'Hero', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>', action: () => navigateTo('hero'), shortcut: 'G H' },
    { group: 'Navigation', label: 'About', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>', action: () => navigateTo('about'), shortcut: 'G A' },
    { group: 'Navigation', label: 'Timeline', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', action: () => navigateTo('timeline'), shortcut: 'G T' },
    { group: 'Navigation', label: 'Statistics', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>', action: () => navigateTo('statistics'), shortcut: 'G S' },
    { group: 'Navigation', label: 'Messages', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>', action: () => navigateTo('messages'), shortcut: 'G M' },
    { group: 'Navigation', label: 'Assets', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>', action: () => navigateTo('assets'), shortcut: 'G L' },
    { group: 'Navigation', label: 'Settings', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', action: () => navigateTo('settings'), shortcut: 'G ,' },
    { group: 'Actions', label: 'Add Project', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>', action: () => { navigateTo('projects'); setTimeout(() => openAddProject(), 100); } },
    { group: 'Actions', label: 'Upload Asset', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>', action: () => { navigateTo('assets'); setTimeout(() => $('#assetFileInput')?.click(), 100); } },
    { group: 'Actions', label: 'Refresh Data', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>', action: () => { loadProjects(); loadStatistics(); loadMessages(); showToast('Data refreshed', 'info'); } },
    { group: 'Actions', label: 'View Site', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>', action: () => window.open('/', '_blank') },
    { group: 'Actions', label: 'Logout', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>', action: () => logout() },
  ];

  function navigateTo(view) {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    const btn = $(`.nav-item[data-view="${view}"]`);
    if (btn) btn.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#${view}View`)?.classList.add('active');
    if (view === 'assets') loadAssets();
    if (view === 'timeline') loadTimeline();
    if (view === 'statistics') loadStatistics();
    if (view === 'messages') { loadMessages(); updateMessagesBadge(); }
  }

  // Update breadcrumb on nav
  const originalNavigateTo = navigateTo;
  function navigateToWithBreadcrumb(view) {
    originalNavigateTo(view);
    if (breadcrumb) {
      const labels = { projects: 'Projects', hero: 'Hero', about: 'About', timeline: 'Timeline', statistics: 'Statistics', messages: 'Messages', assets: 'Assets', settings: 'General' };
      breadcrumb.textContent = labels[view] || view;
    }
  }
  // Override navigateTo references
  commands.forEach(cmd => {
    if (cmd.action && cmd.label && !cmd.label.includes('Add') && !cmd.label.includes('Upload') && !cmd.label.includes('Refresh') && !cmd.label.includes('View') && !cmd.label.includes('Logout')) {
      const view = cmd.label.toLowerCase();
      cmd.action = () => navigateToWithBreadcrumb(view);
    }
  });

  function openCommandPalette() {
    if (!cmdPalette) return;
    cmdPalette.classList.remove('hidden');
    cmdInput.value = '';
    cmdActiveIndex = 0;
    renderCommandResults('');
    setTimeout(() => cmdInput.focus(), 50);
  }

  function closeCommandPalette() {
    if (!cmdPalette) return;
    cmdPalette.classList.add('hidden');
    cmdInput.value = '';
  }

  function renderCommandResults(query) {
    const q = query.toLowerCase().trim();
    let filtered = commands;
    if (q) {
      filtered = commands.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    }

    if (!filtered.length) {
      cmdResults.innerHTML = '<div class="command-empty">No results found</div>';
      return;
    }

    let html = '';
    let lastGroup = '';
    let idx = 0;
    filtered.forEach(cmd => {
      if (cmd.group !== lastGroup) {
        html += `<div class="command-group-label">${esc(cmd.group)}</div>`;
        lastGroup = cmd.group;
      }
      html += `<div class="command-item${idx === cmdActiveIndex ? ' is-active' : ''}" data-index="${idx}" data-cmd="${esc(cmd.label)}">
        <span class="command-item-icon">${cmd.icon}</span>
        <span>${esc(cmd.label)}</span>
        ${cmd.shortcut ? `<span class="command-item-shortcut">${cmd.shortcut}</span>` : ''}
      </div>`;
      idx++;
    });

    cmdResults.innerHTML = html;

    // Bind click
    $$('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        const cmd = commands.find(c => c.label === item.dataset.cmd);
        if (cmd) { closeCommandPalette(); cmd.action(); }
      });
      item.addEventListener('mouseenter', () => {
        cmdActiveIndex = parseInt(item.dataset.index);
        $$('.command-item').forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
      });
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', () => {
      cmdActiveIndex = 0;
      renderCommandResults(cmdInput.value);
    });

    cmdInput.addEventListener('keydown', e => {
      const items = $$('.command-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdActiveIndex = Math.min(cmdActiveIndex + 1, items.length - 1);
        items.forEach(i => i.classList.remove('is-active'));
        items[cmdActiveIndex]?.classList.add('is-active');
        items[cmdActiveIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0);
        items.forEach(i => i.classList.remove('is-active'));
        items[cmdActiveIndex]?.classList.add('is-active');
        items[cmdActiveIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[cmdActiveIndex]?.click();
      } else if (e.key === 'Escape') {
        closeCommandPalette();
      }
    });
  }

  if (cmdBackdrop) cmdBackdrop.addEventListener('click', closeCommandPalette);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  document.addEventListener('keydown', e => {
    // Cmd/Ctrl + K = command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (cmdPalette?.classList.contains('hidden')) openCommandPalette();
      else closeCommandPalette();
    }
    // Cmd/Ctrl + P = preview
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      if (previewOverlay?.classList.contains('hidden')) openPreview();
      else closePreview();
    }
    // Cmd/Ctrl + S = save current form
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      const activeView = document.querySelector('.view.active');
      if (!activeView) return;
      const form = activeView.querySelector('form');
      if (form) form.requestSubmit();
    }
    // Escape = close palette or preview
    if (e.key === 'Escape') {
      if (!cmdPalette?.classList.contains('hidden')) closeCommandPalette();
      else if (!previewOverlay?.classList.contains('hidden')) closePreview();
    }
  });

  // ============================================
  // UNSAVED CHANGES WARNING
  // ============================================
  window.addEventListener('beforeunload', e => {
    if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
  });

  // Mark as unsaved on form changes
  document.addEventListener('input', e => {
    if (e.target.closest('.settings-form, .modal-form, .timeline-admin-card')) {
      hasUnsavedChanges = true;
    }
  });

  // Clear on save
  document.addEventListener('submit', () => { hasUnsavedChanges = false; }, true);

  // ============================================
  // INIT
  // ============================================
  checkAuth();
})();
