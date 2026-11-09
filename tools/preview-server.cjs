#!/usr/bin/env node
/**
 * tools/preview-server.cjs — local preview only (never deployed)
 *
 * The real site is plain PHP. This sandbox has no PHP binary, so this tiny
 * server serves the static files and answers the handful of /api.php?_query=
 * reads from data/*.json, which is enough to look at the design in a browser.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

function json(res, body, status = 200) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(payload);
}

function readData(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name), 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function api(req, res, url) {
  const query = (url.searchParams.get('_query') || '').replace(/^\/+/, '');
  if (query === 'settings') return json(res, readData('settings.json', {}));
  if (query === 'projects') {
    const data = readData('projects.json', { projects: [], brands: [] });
    // The public API hides drafts; the preview does the same so what you see
    // is what a visitor gets.
    return json(res, {
      projects: (data.projects || []).filter(p => p.published !== false),
      brands: data.brands || [],
      categories: []
    });
  }
  if (query === 'messages') return json(res, { ok: true });
  return json(res, { ok: true });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api.php') return api(req, res, url);

  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/' || filePath === '') {
    // index.php decides between the Persian page and the English one; the
    // preview just shows the English homepage.
    filePath = '/index.html';
  } else if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }
  if (filePath === '/index.php') filePath = '/index.html';
  const full = path.join(ROOT, filePath);
  if (!full.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(full, (error, buffer) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found: ' + filePath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buffer);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Preview on http://0.0.0.0:' + PORT);
});
