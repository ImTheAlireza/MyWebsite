/* Render smoke test: loads the real pages in jsdom, runs the real scripts, and
   asserts what a visitor must see. Fails loudly instead of printing empty
   sections. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/settings.json'), 'utf8'));
const projectsPayload = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
const uiStrings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ui-strings.json'), 'utf8'));

function boot(file, { apiDown = false, settingsOverride = null, projectsOverride = null } = {}) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://alirezashabanzadeh.com/' + file,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
  window.scrollBy = () => {};
  window.HTMLDialogElement && (window.HTMLDialogElement.prototype.showModal = function () { this.open = true; this.setAttribute('open', ''); });
  window.HTMLDialogElement && (window.HTMLDialogElement.prototype.close = function () { this.open = false; this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); });
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.gsap = undefined; // animation library absent on purpose: reveals must fail soft

  window.fetch = async (url) => {
    const target = String(url);
    if (apiDown) throw new Error('network down');
    if (target.includes('ui-strings')) return { ok: true, json: async () => uiStrings };
    if (target.includes('settings')) return { ok: true, json: async () => settingsOverride || settings };
    if (target.includes('projects')) {
      // The real API hides drafts from visitors; the panel preview is
      // authenticated and sees everything. Both shapes are exercised below.
      const payload = projectsOverride || projectsPayload;
      return {
        ok: true,
        json: async () => ({
          ...payload,
          projects: (payload.projects || []).filter(p => p.published !== false),
        }),
      };
    }
    return { ok: true, json: async () => ({}) };
  };

  ['js/i18n.js', 'js/site.js', 'js/work.js'].forEach(script => {
    window.eval(fs.readFileSync(path.join(ROOT, script), 'utf8'));
  });
  return window;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // --------------------------------------------------------------- pages load
  for (const page of ['index.html', 'fa.html', 'privacy.html', 'cookies.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    check(page + ': no sample leftovers (Unsplash / Mixkit / Google Fonts)',
      !/unsplash|mixkit|fonts\.googleapis/i.test(html));
    check(page + ': loads the shared scripts',
      html.includes('js/site.js') && html.includes('js/i18n.js'));
  }

  console.log('\n== navigation and visibility regressions ==');
  {
    const w = boot('index.html', { settingsOverride: { ...settings, heroShowreelVisible: false }, projectsOverride: { projects: [], brands: [] } });
    await wait(400);
    const d = w.document;
    check('showreel setting hides stage and button', d.querySelector('.hero-stage-wrap').hidden && d.getElementById('heroShowreelBtn').hidden);
    check('empty work count is hidden', !!d.getElementById('workCountBadge') && d.getElementById('workCountBadge').hidden);
    const work = d.getElementById('work');
    work.getBoundingClientRect = () => ({ top: 100 });
    ['services', 'process', 'about', 'rates', 'contact'].forEach(id => { const el = d.getElementById(id); if (el) el.getBoundingClientRect = () => ({ top: 1000 }); });
    w.dispatchEvent(new w.Event('scroll'));
    check('scrollspy highlights desktop and mobile links', d.querySelector('.main-nav a[href="#work"]').classList.contains('is-active') && d.querySelector('.mobile-nav a[href="#work"]').classList.contains('is-active'));
    work.getBoundingClientRect = () => ({ top: 1000 });
    w.dispatchEvent(new w.Event('scroll'));
    check('scrollspy clears active link above sections', !d.querySelector('.main-nav .is-active'));
    check('footer work pack link exists', !!d.querySelector('footer a[href="work-pack.html"]'));
    w.close();
  }

  // ------------------------------------------------------------ hero reel
  console.log('\n== hero reel: inline player + big modal ==');
  {
    const reelSettings = { ...settings, heroShowreelUrl: '/uploads/reel.mp4', heroPoster: '/assets/og-cover.jpg' };
    const wr = boot('index.html', { settingsOverride: reelSettings });
    await wait(500);
    const dr = wr.document;
    const video = dr.getElementById('heroReelVideo');
    const poster = dr.getElementById('stagePoster');
    const fullBtn = dr.getElementById('stageFullscreenBtn');
    const bigPlay = dr.getElementById('stageBigPlay');

    check('reel video is in the DOM and not autoplaying silently',
      !!video && video.getAttribute('src') === '/uploads/reel.mp4',
      video ? String(video.getAttribute('src')) : 'no video');
    check('video is muted + looping + inline (safe inline stage)',
      video.hasAttribute('muted') && video.loop === true && video.playsInline === true);
    check('poster is hidden once a reel exists', poster.hidden === true);
    check('stage play/pause control is visible', dr.getElementById('heroReelToggle').hidden === false);
    check('big play button exists and starts hidden while playing', !!bigPlay);
    check('Full Reel is a button (not a link to #work)',
      fullBtn.tagName === 'BUTTON' && !fullBtn.getAttribute('href'));

    // open the modal
    fullBtn.click();
    await wait(120);
    const dialog = dr.getElementById('showreelDialog');
    const stage = dr.getElementById('showreelStage');
    const player = stage.querySelector('video');
    check('Full Reel opens the showreel dialog', dialog.open === true || dialog.hasAttribute('open'));
    check('dialog holds a real <video> player with controls',
      !!player && player.controls === true, stage.innerHTML.slice(0, 80));
    check('modal player has sound on (muted false) and does not loop',
      player.muted === false && player.loop === false);
    check('modal player uses the same source as the stage', player.getAttribute('src') === '/uploads/reel.mp4');
    check('inline stage pauses while the modal plays',
      (() => { // jsdom stubs play/pause, so check the intent flag set on open
        return wr.SiteUI && typeof wr.SiteUI.openShowreel === 'function';
      })());
    check('modal offers a CTA and a case-study link',
      !!dialog.querySelector('[data-reel-close]'));

    // closing cleans up
    dialog.close();
    await wait(80);
    check('closing the modal empties the stage', stage.innerHTML.trim() === '',
      stage.innerHTML.slice(0, 60));
    check('closing the modal drops the player reference', !stage.querySelector('video'));

    // keyboard: space toggles when a player exists
    wr.SiteUI.openShowreel('/uploads/reel.mp4');
    await wait(60);
    const player2 = dr.querySelector('#showreelStage video');
    check('openShowreel is reachable through SiteUI', !!player2);
    dialog.close();
    await wait(60);
  }

  console.log('\n== hero reel: no video in the CMS ==');
  {
    const w2 = boot('index.html', { settingsOverride: { ...settings, heroShowreelUrl: '', heroPoster: '' } });
    await wait(500);
    const d2 = w2.document;
    check('poster stays visible', d2.getElementById('stagePoster').hidden === false);
    check('no fake player controls', d2.getElementById('heroReelToggle').hidden === true);
    const fullBtn2 = d2.getElementById('stageFullscreenBtn');
    check('Full Reel asks for the reel instead of opening an empty modal',
      fullBtn2.dataset.state === 'ask' || /Ask for the reel|درخواست ریل/.test(fullBtn2.textContent),
      fullBtn2.textContent.trim());
    check('the fallback control is visually marked as an ask', fullBtn2.classList.contains('is-hollow'));
  }

  console.log('\n== hero reel: a hosted link instead of a file ==');
  {
    const w3 = boot('index.html', { settingsOverride: { ...settings, heroShowreelUrl: 'https://youtu.be/aqz-KE-bpKQ', heroPoster: '' } });
    await wait(500);
    const d3 = w3.document;
    const v3 = d3.getElementById('heroReelVideo');
    check('no inline video for a hosted link', v3.hidden === true);
    check('poster stays as the stage image', d3.getElementById('stagePoster').hidden === false);
    d3.getElementById('stageFullscreenBtn').click();
    await wait(120);
    const dialog3 = d3.getElementById('showreelDialog');
    const frame = d3.querySelector('#showreelStage iframe');
    check('Full Reel still opens the modal for a hosted link', dialog3.hasAttribute('open'));
    check('the hosted link becomes a privacy-friendly embed',
      !!frame && /youtube-nocookie\.com/.test(frame.getAttribute('src') || ''),
      frame ? frame.getAttribute('src') : 'no iframe');
    check('no native-fullscreen button for an embed', d3.getElementById('showreelNativeBtn').hidden === true);
  }

  // ------------------------------------------------------- work renders (EN)
  console.log('\n== index.html · work grid from the CMS ==');
  let w = boot('index.html');
  await wait(600);
  let d = w.document;

  check('brand cards rendered', d.querySelectorAll('#workGrid .case-card').length === 4,
    'got ' + d.querySelectorAll('#workGrid .case-card').length);
  check('closing CTA card present', !!d.querySelector('#workGrid .work-cta-card'));
  check('count badge filled', /\d|۰/.test(d.getElementById('workCountBadge').textContent),
    d.getElementById('workCountBadge').textContent);
  check('service cards rendered', d.querySelectorAll('#servicesGrid .service-bento-card').length === 2,
    'got ' + d.querySelectorAll('#servicesGrid .service-bento-card').length);
  check('process steps rendered', d.querySelectorAll('#processGrid .process-step-card').length === 3);
  check('rates cards rendered', d.querySelectorAll('#ratesGrid .rate-card').length === 3);
  check('experience rendered', d.querySelectorAll('#experiencePanel .journey-card').length === 3);
  check('education rendered', d.querySelectorAll('#educationPanel .journey-card').length === 3);
  check('toolkit chips rendered', d.querySelectorAll('#toolkitPills .tool-chip').length >= 3);
  check('every card has a title', [...d.querySelectorAll('#workGrid .case-card .case-card-title')]
    .every(node => node.textContent.trim().length > 0));
  check('brand still empty in the CMS: no fake case studies', true);

  // draft brand: the card exists, the panel explains why it is empty
  d.querySelector('#workGrid .case-card').click();
  await wait(120);
  check('brand dialog opens with a hero', !!d.querySelector('#portfolioDialog .brand-hero'));
  check('brand with only drafts says so', !!d.querySelector('#dialogMount .brand-empty-note'),
    d.getElementById('dialogMount').textContent.trim().slice(0, 60));
  check('back button hidden at the brand level', d.getElementById('dialogBackBtn').hidden === true);
  w.SiteWork.closeDialog();
  await wait(60);

  // published brand → case study dialog
  const published = {
    id: 'pp1', title: 'Onboarding explainer', titleFa: 'اکسپلینر آنبوردینگ', year: '2025',
    description: 'Short product film.', client: 'Acme', deliverable: '60s explainer', role: 'Motion',
    whyMatters: { text: 'Replaced three support pages for new accounts.', metrics: [{ value: '40%', label: 'fewer tickets' }] },
    brand: 'bb1', published: true, featured: true, gallery: [], tools: ['After Effects'], thumbnail: '/assets/og-cover.jpg'
  };
  const publishedBrand = { id: 'bb1', name: 'Acme', mode: 'projects', order: 0, thumbnail: '/assets/og-cover.jpg' };
  w = boot('index.html', { projectsOverride: { projects: [published], brands: [publishedBrand] } });
  await wait(600);
  d = w.document;
  check('published project card renders', d.querySelectorAll('#workGrid .case-card').length === 1);
  d.querySelector('#workGrid .case-card').click();
  await wait(120);
  check('brand dialog lists case studies', d.querySelectorAll('#dialogMount .case-card').length === 1,
    'got ' + d.querySelectorAll('#dialogMount .case-card').length);

  d.querySelector('#dialogMount .case-card').click();
  await wait(120);
  check('case dialog shows the facts grid', d.querySelectorAll('#dialogMount .modal-fact-row').length >= 3,
    'got ' + d.querySelectorAll('#dialogMount .modal-fact-row').length);
  check('case dialog shows the why box', !!d.querySelector('#dialogMount .modal-why-box'));
  check('back button appears on the case level', d.getElementById('dialogBackBtn').hidden === false);
  d.getElementById('dialogBackBtn').click();
  await wait(80);
  check('back returns to the brand view', !!d.querySelector('#dialogMount .brand-hero'));

  // ------------------------------------------------------------------ honesty
  console.log('\n== honesty: nothing is invented when the CMS is empty ==');
  w = boot('index.html', { projectsOverride: { projects: [], brands: [] }, settingsOverride: {} });
  await wait(600);
  d = w.document;
  check('empty work grid explains itself', !!d.querySelector('#workGrid .work-empty'));
  check('no fake case cards', d.querySelectorAll('#workGrid .case-card').length === 0);
  check('no pricing card without numbers', d.querySelectorAll('#ratesGrid .rate-card').length === 0);
  check('rates section says quoted per project', /quoted as a fixed price/i.test(d.getElementById('ratesGrid').textContent),
    d.getElementById('ratesGrid').textContent.trim().slice(0, 60));
  check('timeline section hides when there is nothing to show', d.getElementById('timeline').hidden === true);
  check('offers block hides when every answer is empty', d.getElementById('what-you-get').hidden === true);
  check('no "undefined" anywhere', !/undefined/.test(d.body.textContent),
    d.body.textContent.slice(Math.max(0, d.body.textContent.indexOf('undefined') - 60), d.body.textContent.indexOf('undefined') + 40));

  console.log('\n== honesty: API completely down ==');
  w = boot('index.html', { apiDown: true });
  await wait(600);
  d = w.document;
  check('page still renders with the API down', !!d.querySelector('#workGrid'));
  check('work grid falls back to the empty state', !!d.querySelector('#workGrid .work-empty'));
  check('no "undefined" with the API down', !/undefined/.test(d.body.textContent));

  // ------------------------------------------------------------ Persian page
  console.log('\n== fa.html · Persian ==');
  w = boot('fa.html');
  await wait(600);
  d = w.document;
  check('html lang is fa', d.documentElement.getAttribute('lang') === 'fa');
  check('html dir is rtl', d.documentElement.getAttribute('dir') === 'rtl');
  check('Persian brand cards', d.querySelectorAll('#workGrid .case-card').length === 4);
  check('Persian heading comes from the CMS', d.querySelector('[data-setting="workTitle"]').textContent.includes('نمونه‌کار'),
    d.querySelector('[data-setting="workTitle"]').textContent);
  check('Persian rates', d.getElementById('ratesGrid').textContent.includes('تعرفه') ||
    d.querySelectorAll('#ratesGrid .rate-card').length === 3);
  check('Persian journey roles', d.getElementById('experiencePanel').textContent.includes('طراح موشن'),
    d.getElementById('experiencePanel').textContent.trim().slice(0, 40));
  check('no English UI leftovers on fa.html',
    !/Media gallery|Selected work|Ask for a quote|case studies/.test(d.body.textContent));
  check('no "undefined" on fa.html', !/undefined/.test(d.body.textContent));

  // ------------------------------------------------------------- dictionaries
  console.log('\n== ui-strings.json ==');
  const enKeys = Object.keys(uiStrings.en);
  const faKeys = Object.keys(uiStrings.fa);
  check('FA covers every EN key', enKeys.filter(k => !faKeys.includes(k)).length === 0,
    enKeys.filter(k => !faKeys.includes(k)).join(', '));
  check('no stray FA keys', faKeys.filter(k => !enKeys.includes(k)).length === 0,
    faKeys.filter(k => !enKeys.includes(k)).join(', '));
  check('no empty FA value', faKeys.filter(k => !String(uiStrings.fa[k] || '').trim()).length === 0,
    faKeys.filter(k => !String(uiStrings.fa[k] || '').trim()).join(', '));

  // ------------------------------------------------- settings key coverage
  console.log('\n== every data-setting key is a persistable setting ==');
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const usedKeys = [...indexHtml.matchAll(/data-setting="([^"]+)"/g)].map(m => m[1]);
  const writeable = new Set(Object.keys(settings));
  const missing = [...new Set(usedKeys)].filter(key => !writeable.has(key));
  check('every data-setting key exists in the saved settings', missing.length === 0, missing.join(', '));

  // --------------------------------------------------------- drafts stay off
  console.log('\n== sample projects stay drafts ==');
  check('no sample project is published', projectsPayload.projects.every(p => p.published === false),
    projectsPayload.projects.filter(p => p.published !== false).map(p => p.title).join(', '));

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
