# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Flash-n-Frame, please report it responsibly:

1. **Do not** create a public issue
2. Contact the INT Inc. security team directly
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible
5. Allow reasonable time for a fix before any disclosure

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x | Yes |
| 2.x | Security fixes only |
| 1.x | No |

## Security Measures

### Authentication

- **Replit Auth (OpenID Connect)**: Primary authentication via OAuth (supports Google, GitHub, X, Apple sign-in)
- **Email/Password**: Bcrypt hashing with 12 salt rounds; password complexity validation enforced
- **Session Management**: PostgreSQL-backed sessions via `connect-pg-simple`; HTTP-only cookies with `Secure` flag (environment-aware) and `SameSite=Lax`
- **Placeholder Auth**: Magic link (SendGrid) and phone (Twilio) endpoints return 501 until configured

### API Security

- **Server-Side API Keys**: The core Gemini API key is stored server-side and never exposed to the frontend bundle
- **Rate Limiting**: Auth endpoints limited to 20 requests per 15 minutes; general API limited to 100 requests per minute
- **CORS**: Production restricts origins to `*.replit.app` and `*.replit.dev` domains
- **Trust Proxy**: Set to `1` for correct IP detection behind Replit's reverse proxy

### HTTP Security Headers (Helmet)

All responses include security headers via Helmet middleware:
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy: no-referrer

CSP is disabled for SPA compatibility. COEP is disabled for cross-origin resources (Gemini AI, GitHub API).

### Data Protection

- **Database**: PostgreSQL with parameterized queries via Drizzle ORM (prevents SQL injection)
- **Passwords**: Bcrypt with 12 salt rounds, regex-based complexity requirements
- **Sessions**: Encrypted session data stored in PostgreSQL with expiration
- **Client Storage**: User-provided optional API keys stored in browser localStorage (per-user isolation)

### Service Worker

- API endpoints (`/api/ai/key`, `/api/github/`, `/api/auth/`) are excluded from service worker caching to prevent stale security-sensitive data
- Network-first strategy for API routes

## Known Limitations

- User-provided optional API keys (GitHub token, etc.) are stored in browser localStorage without encryption. A Web Crypto API encryption layer is planned.
- CSP headers are disabled to allow SPA inline scripts and styles. This is a common trade-off for React applications.
- Magic link and phone authentication are placeholder implementations (return 501).

## Dependencies

Security-relevant dependencies are kept up to date:
- `helmet` - HTTP security headers
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `bcryptjs` - Password hashing
- `connect-pg-simple` - Secure session storage
- `express-session` - Session management

## Security Invariants

See [Security Invariants](docs/context-notes/security-invariants.md) for rules that must never be violated.
