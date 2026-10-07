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
  console.log(errors.length ? '\n' + errors.length + ' error(s)' : '\nadmin.js loaded clean');
  process.exit(errors.length ? 1 : 0);
}, 500);
