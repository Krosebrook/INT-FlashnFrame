# [ADR-003] Autoscale Deployment

## Status
Superseded | Updated 2026-02-06 (Originally Accepted 2026-01-24)

## Context and Problem Statement
Flash-n-Frame is a React-based SPA with a Node.js/Express backend providing authentication, session management, API proxying (GitHub, Gemini), and security middleware. The original static deployment could not serve backend routes.

## Decision Drivers
- Backend API endpoints required at runtime (auth, GitHub proxy, AI key management)
- Session management needs a persistent server process
- Rate limiting and security headers require server-side middleware
- PWA service worker and manifest need proper cache headers

## Considered Options
1. **Static Deployment** (original decision) - Replit serves pre-built files from `dist/`
2. **VM Deployment** - Always-on server, suitable for stateful apps
3. **Autoscale Deployment** - Scales with traffic, runs server code, sleeps when idle

## Decision Outcome
**Chosen:** Autoscale Deployment

**Rationale:**
- The app now has server-side routes (`/api/auth/*`, `/api/github/*`, `/api/ai/key`, `/api/health`) that require a running Express server
- Autoscale handles traffic spikes while sleeping during inactivity to save resources
- Express serves both the API and the static frontend bundle from `dist/` in production
- PostgreSQL sessions and Helmet security headers require server-side execution

## Implementation
- **Build command:** `npm run build` (Vite builds frontend to `dist/`)
- **Run command:** `npx tsx server/index.ts` (Express serves API + static files on port 5000)
- **Port:** 5000 (single port for both API and frontend)

## Consequences
### Positive
- Full backend functionality (auth, proxy, rate limiting, security headers)
- Single deployment serves both frontend and API
- Scales automatically with demand
- Cost-effective (sleeps when idle)

### Negative
- Cold starts may add latency for first request after idle period
- Slightly more complex than pure static hosting
- Must ensure Express serves static files with proper cache headers

### Risks
- Cold start latency mitigated by health check endpoint (`/api/health`)
- Static file caching managed with `Cache-Control` headers (HTML: no-cache, assets: 1 day)

## Supersedes
- ADR-003 (2026-01-24): Static Deployment with API Proxy
