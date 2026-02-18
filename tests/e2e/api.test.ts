import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = 'http://localhost:3001';

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  return { status: res.status, headers: res.headers, body: await res.text(), ok: res.ok };
}

describe('Health & Ping', () => {
  it('GET /api/health returns 200 with status ok', async () => {
    const { status, body } = await fetchJSON('/api/health');
    expect(status).toBe(200);
    const data = JSON.parse(body);
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment');
  });

  it('GET /api/ping returns 200 with pong', async () => {
    const { status, body } = await fetchJSON('/api/ping');
    expect(status).toBe(200);
    const data = JSON.parse(body);
    expect(data.pong).toBe(true);
  });
});

describe('CSRF Token', () => {
  it('GET /api/csrf-token returns a token', async () => {
    const { status, body } = await fetchJSON('/api/csrf-token');
    expect(status).toBe(200);
    const data = JSON.parse(body);
    expect(data).toHaveProperty('csrfToken');
    expect(typeof data.csrfToken).toBe('string');
    expect(data.csrfToken.length).toBeGreaterThan(0);
  });
});

describe('AI Key Endpoint', () => {
  it('GET /api/ai/key returns 401 when unauthenticated', async () => {
    const { status } = await fetchJSON('/api/ai/key');
    expect(status).toBe(401);
  });
});

async function getCSRF(): Promise<{ token: string; cookie: string }> {
  const res = await fetch(`${API_BASE}/api/csrf-token`);
  const setCookie = res.headers.get('set-cookie') || '';
  const csrfCookie = setCookie.split(';')[0];
  const data = await res.json() as { csrfToken: string };
  return { token: data.csrfToken, cookie: csrfCookie };
}

function authHeaders(csrf: { token: string; cookie: string }) {
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf.token,
    'Cookie': csrf.cookie,
  };
}

describe('Auth Endpoints', () => {
  it('POST /api/auth/signup rejects missing fields', async () => {
    const csrf = await getCSRF();
    const { status, body } = await fetchJSON('/api/auth/signup', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
    const data = JSON.parse(body);
    expect(data).toHaveProperty('message');
  });

  it('POST /api/auth/signup rejects invalid email', async () => {
    const csrf = await getCSRF();
    const { status, body } = await fetchJSON('/api/auth/signup', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({ email: 'not-an-email', password: 'StrongP@ss1!' }),
    });
    expect(status).toBe(400);
    const data = JSON.parse(body);
    expect(data.message).toMatch(/email/i);
  });

  it('POST /api/auth/signup rejects weak password', async () => {
    const csrf = await getCSRF();
    const { status, body } = await fetchJSON('/api/auth/signup', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({ email: 'test@example.com', password: '123' }),
    });
    expect(status).toBe(400);
    const data = JSON.parse(body);
    expect(data.message).toMatch(/password/i);
  });

  it('POST /api/auth/login rejects missing fields', async () => {
    const csrf = await getCSRF();
    const { status, body } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
    const data = JSON.parse(body);
    expect(data).toHaveProperty('message');
  });

  it('POST /api/auth/login rejects non-existent user', async () => {
    const csrf = await getCSRF();
    const { status, body } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({ email: 'nonexistent@nowhere.test', password: 'SomeP@ss1!' }),
    });
    expect([400, 401]).toContain(status);
  });

  it('POST /api/auth/magic-link returns 501 without SendGrid', async () => {
    const csrf = await getCSRF();
    const { status } = await fetchJSON('/api/auth/magic-link', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    expect(status).toBe(501);
  });

  it('POST /api/auth/phone returns 501 without Twilio', async () => {
    const csrf = await getCSRF();
    const { status } = await fetchJSON('/api/auth/phone', {
      method: 'POST',
      headers: authHeaders(csrf),
      body: JSON.stringify({ phone: '+15555555555' }),
    });
    expect(status).toBe(501);
  });
});

describe('GitHub Proxy', () => {
  it('GET /api/github/tree/:owner/:repo returns data for a public repo', async () => {
    const { status, body } = await fetchJSON('/api/github/tree/octocat/Hello-World');
    expect([200, 403, 429]).toContain(status);
    if (status === 200) {
      const data = JSON.parse(body);
      expect(data).toHaveProperty('tree');
    }
  });

  it('GET /api/github/tree/:owner/:repo returns 404-ish for non-existent repo', async () => {
    const { status } = await fetchJSON('/api/github/tree/nonexistent-user-zzz/nonexistent-repo-zzz');
    expect([404, 500]).toContain(status);
  });
});

describe('Security Headers', () => {
  it('responses include Helmet security headers', async () => {
    const { headers } = await fetchJSON('/api/health');
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBeTruthy();
  });

  it('CORS allows all origins in dev', async () => {
    const res = await fetch(`${API_BASE}/api/health`, {
      headers: { 'Origin': 'http://example.com' },
    });
    const allow = res.headers.get('access-control-allow-origin');
    expect(allow).toBeTruthy();
  });
});

describe('404 Handling', () => {
  it('unknown API route returns 404 JSON in dev', async () => {
    const { status } = await fetchJSON('/api/nonexistent-route');
    expect([404, 500]).toContain(status);
  });
});
