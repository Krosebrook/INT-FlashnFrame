import { describe, it, expect } from 'vitest';

const FRONTEND_BASE = 'http://localhost:5000';

describe('Frontend Serving', () => {
  it('GET / returns 200 with HTML', async () => {
    const res = await fetch(`${FRONTEND_BASE}/`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<div id="root">');
  });

  it('HTML includes Flash-n-Frame in the title or body', async () => {
    const res = await fetch(`${FRONTEND_BASE}/`);
    const body = await res.text();
    expect(body.toLowerCase()).toContain('flash');
  });

  it('Vite dev server proxies /api calls to backend', async () => {
    const res = await fetch(`${FRONTEND_BASE}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('SPA routes return HTML (not 404) via Vite', async () => {
    const res = await fetch(`${FRONTEND_BASE}/some-deep-route`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('text/html');
  });

  it('Static assets are served (CSS/JS bundles)', async () => {
    const res = await fetch(`${FRONTEND_BASE}/`);
    const html = await res.text();
    const scriptMatch = html.match(/src="(\/[^"]+\.js)"/);
    expect(scriptMatch).toBeTruthy();
    if (scriptMatch) {
      const jsRes = await fetch(`${FRONTEND_BASE}${scriptMatch[1]}`);
      expect(jsRes.status).toBe(200);
      const jsType = jsRes.headers.get('content-type') || '';
      expect(jsType).toContain('javascript');
    }
  });
});

describe('PWA Assets', () => {
  it('GET /manifest.json returns valid manifest', async () => {
    const res = await fetch(`${FRONTEND_BASE}/manifest.json`);
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('icons');
  });

  it('GET /sw.js returns service worker', async () => {
    const res = await fetch(`${FRONTEND_BASE}/sw.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('self');
  });

  it('GET /offline.html returns offline page', async () => {
    const res = await fetch(`${FRONTEND_BASE}/offline.html`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain('offline');
  });
});
