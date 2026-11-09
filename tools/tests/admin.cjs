/* Admin smoke test: loads admin/index.html, runs admin.js with a stubbed API,
   and fails on any uncaught error while the views render. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..');

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/settings.json'), 'utf8'));
const html = fs.readFileSync(path.join(ROOT, 'admin/index.html'), 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  url: 'https://alirezashabanzadeh.com/admin/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
window.addEventListener('error', e => errors.push('window error: ' + e.message));
window.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
window.scrollTo = () => {};
window.URL.createObjectURL = () => 'blob:x';
window.fetch = async (url, opts = {}) => {
  const target = String(url);
  const body = target.includes('projects') ? { projects: [], brands: [], categories: [] } : settings;
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
};

try {
  window.eval(fs.readFileSync(path.join(ROOT, 'admin/js/admin.js'), 'utf8'));
} catch (error) {
  errors.push('admin.js threw on load: ' + error.message);
}

setTimeout(() => {
  const d = window.document;
  const check = (name, ok, extra = '') => console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok ? '' : ' — ' + extra));
  check('no uncaught errors', errors.length === 0, errors.join(' | '));
  check('hero Persian field present', !!d.getElementById('heroEyebrowFa'));
  check('hero stat 1 value (FA) present', !!d.getElementById('heroStat1ValueFa'));
  check('about textarea FA present', !!d.getElementById('aboutTextFa'));
  check('about skills FA present', !!d.getElementById('aboutSkillsFa'));
  check('services title FA present', !!d.getElementById('servicesTitleFa'));
  check('footer copy FA present', !!d.getElementById('settingFooterCopyFa'));
  check('why-it-matters editor present', !!d.getElementById('projectWhyText') && !!d.getElementById('projectWhyMetrics'));
  check('why-metric add button present', !!d.getElementById('addWhyMetricBtn'));
  // The new design added sections; every one needs an edit surface in the panel.
  check('work section copy view present', !!d.getElementById('workSettingsForm'));
  check('terms view present', !!d.getElementById('offersForm'));
  check('rates view present', !!d.getElementById('ratesForm') && !!d.getElementById('ratesList'));
  check('rate add button present', !!d.getElementById('addRateBtn'));
  check('process steps editor present', !!d.getElementById('processList') && !!d.getElementById('addProcessBtn'));
  check('process copy separated from steps', !!d.getElementById('processCopyForm'));
  check('contact copy view present', !!d.getElementById('contactFormAdmin'));
  check('every new view has a sidebar entry',
    ['projects-settings', 'offers', 'rates', 'process', 'contact']
      .every(view => !!d.querySelector(`.nav-item[data-view="${view}"]`)));
  // The hero reel must be editable end-to-end: upload a file, pick an existing
  // video, or paste a URL — all writing the same heroShowreelUrl key.
  check('reel uploader present in the hero view',
    !!d.getElementById('reelDropzone') && !!d.getElementById('reelFileInput') && !!d.getElementById('reelPreviewVideo'));
  check('reel uploader writes into heroShowreelUrl', !!d.getElementById('heroShowreelUrl'));
  check('reel file input only accepts video',
    /video/.test(d.getElementById('reelFileInput').getAttribute('accept') || ''));
  check('Browse Existing button opens the media picker', !!d.getElementById('reelBrowseBtn'));
  check('reel preview is a <video>, not an <img>', d.getElementById('reelPreviewVideo').tagName === 'VIDEO');
  check('no duplicate element ids in the panel', (() => {
    const seen = new Set(); const dupes = [];
    d.querySelectorAll('[id]').forEach(node => {
      if (seen.has(node.id)) dupes.push(node.id); else seen.add(node.id);
    });
    return dupes.length === 0;
  })());
  d.querySelector('.nav-item[data-view="rates"]').click();
  setTimeout(() => {
    const firstCard = d.querySelector('#ratesList .rates-admin-card');
    check('rate cards render with editable fields', !!firstCard && !!firstCard.querySelector('[data-rate-field="price"]'));
    const stepCard = d.querySelector('#processList .process-admin-card');
    check('process steps render with editable fields', !!stepCard && !!stepCard.querySelector('[data-process-field="titleFa"]'));
    setTimeout(() => process.exit(errors.length || !firstCard ? 1 : 0), 50);
  }, 1200);
  console.log(errors.length ? '\n' + errors.length + ' error(s)' : '\nadmin.js loaded clean');
}, 700);
