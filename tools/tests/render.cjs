/* Render smoke test: loads the real pages in jsdom, runs the real scripts,
   and asserts the things the owner reported as broken. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..');

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

function boot(file, { apiDown = false, settings = null, projects = null } = {}) {
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
  window.gsap = undefined; // animation library absent on purpose: reveals must fail soft

  window.fetch = async (url) => {
    const target = String(url);
    if (apiDown) throw new Error('network down');
    if (target.includes('settings')) {
      return { ok: true, json: async () => settings || {} };
    }
    if (target.includes('projects')) {
      return { ok: true, json: async () => projects || { projects: [], brands: [], categories: [] } };
    }
    return { ok: true, json: async () => ({}) };
  };

  ['js/data.js', 'js/main.js'].forEach(script => {
    window.eval(fs.readFileSync(path.join(ROOT, script), 'utf8'));
  });
  return window;
}

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/settings.json'), 'utf8'));

(async () => {
  for (const page of ['index.html', 'fa.html']) {
    console.log('\n== ' + page + ' (API unreachable) ==');
    let w = boot(page, { apiDown: true });
    await new Promise(r => setTimeout(r, 400));
    let d = w.document;
    check('timeline section visible', !d.getElementById('timeline').hidden);
    check('experience entries rendered', d.querySelectorAll('#experiencePanel .timeline-item').length >= 3,
      'got ' + d.querySelectorAll('#experiencePanel .timeline-item').length);
    check('education entries rendered', d.querySelectorAll('#educationPanel .timeline-item').length >= 3);
    check('education heading visible', !d.getElementById('educationGroup').hidden);
    check('service cards rendered', d.querySelectorAll('#servicesGrid .service-card').length === 3);
    check('contact form present', !!d.getElementById('contactForm'));
    check('contact list rows', d.querySelectorAll('.contact-list .contact-info-item').length === 5);
    check('contact steps', d.querySelectorAll('.contact-steps-list li').length === 3);
    check('no English placeholder for the name', !d.body.innerHTML.includes('Sara Ahmadi'));
    check('timeline items are not invisible', [...d.querySelectorAll('#timeline .timeline-item')]
      .every(el => el.classList.contains('reveal-pending') === false));
  }

  console.log('\n== index.html (CMS answers with real content) ==');
  let w = boot('index.html', { settings });
  await new Promise(r => setTimeout(r, 400));
  let d = w.document;
  check('timeline still exactly 6 entries', d.querySelectorAll('#timeline .timeline-item').length === 6,
    'got ' + d.querySelectorAll('#timeline .timeline-item').length);
  check('services not duplicated', d.querySelectorAll('#servicesGrid .service-card').length === 3,
    'got ' + d.querySelectorAll('#servicesGrid .service-card').length);

  console.log('\n== index.html (CMS answers: empty lists) ==');
  w = boot('index.html', { settings: { experience: [], education: [], services: [] } });
  await new Promise(r => setTimeout(r, 400));
  d = w.document;
  check('timeline hidden when the owner deleted everything', d.getElementById('timeline').hidden === true);

  console.log('\n== fa.html (CMS answers with real content) ==');
  w = boot('fa.html', { settings });
  await new Promise(r => setTimeout(r, 400));
  d = w.document;
  const faText = d.getElementById('experiencePanel').textContent;
  check('Persian timeline entries render', faText.includes('طراح موشن گرافیک'), faText.slice(0, 60));
  check('Persian services render', d.getElementById('servicesGrid').textContent.includes('ویدیوی توضیحی'),
    d.getElementById('servicesGrid').textContent.slice(0, 60));
  check('Persian availability badge', d.querySelector('.availability-badge').textContent.includes('جای پروژهٔ جدید باز است'),
    d.querySelector('.availability-badge').textContent);

  console.log('\n== offer + scope (CMS answers) ==');
  for (const page of ['index.html', 'fa.html']) {
    const wa = boot(page, { settings });
    await new Promise(r => setTimeout(r, 400));
    const da = wa.document;
    const section = da.getElementById('what-you-get');
    check(page + ': "what you get" is visible', section.hidden === false);
    check(page + ': price/availability rows stay hidden when empty',
      da.querySelector('[data-setting="offerFrom"]').closest('.offer-row').hidden === true &&
      da.querySelector('[data-setting="offerAvailability"]').closest('.offer-row').hidden === true);
    check(page + ': scope list rendered', da.querySelectorAll('#scopeList li').length === 3,
      'got ' + da.querySelectorAll('#scopeList li').length);
    check(page + ': scope block visible', da.getElementById('scopeBlock').hidden === false);
  }

  console.log('\n== why it matters (projects payload) ==');
  const project = {
    id: 'p1', title: 'Onboarding explainer', year: '2025',
    description: 'Short product film.', client: 'Acme', deliverable: '60s explainer',
    whyMatters: { text: 'Replaced three support pages for new accounts.', metrics: [{ value: '40%', label: 'fewer tickets' }] },
    brand: 'b1',
    whyMattersFa: { text: 'جای سه صفحهٔ راهنما را گرفت.', metrics: [{ value: '40%', label: 'کاهش تیکت' }] },
    published: true, featured: true, gallery: []
  };
  const brand = { id: 'b1', name: 'Demo brand', mode: 'projects', order: 0 };
  w = boot('index.html', { projects: { projects: [project], brands: [brand], categories: [] } });
  await new Promise(r => setTimeout(r, 400));
  d = w.document;
  d.querySelector('.brand-card').click();          // project cards live inside the brand modal
  await new Promise(r => setTimeout(r, 200));
  const card = d.querySelector('.portfolio-project-why');
  check('card shows the why block', !!card && card.textContent.includes('Replaced three support pages'),
    d.querySelector('#workGrid').textContent.slice(0, 80));
  check('card why-label is in English on index.html', card && card.textContent.includes('Why it matters'));

  w = boot('fa.html', { projects: { projects: [project], brands: [brand], categories: [] } });
  await new Promise(r => setTimeout(r, 400));
  d = w.document;
  d.querySelector('.brand-card').click();
  await new Promise(r => setTimeout(r, 200));
  const faCard = d.querySelector('.portfolio-project-why');
  check('Persian card uses the Persian why text', !!faCard && faCard.textContent.includes('جای سه صفحهٔ راهنما'),
    d.querySelector('#workGrid').textContent.slice(0, 80));
  check('card only holds valid inline children', faCard && [...faCard.children].every(el => ['SPAN'].includes(el.tagName)));

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
