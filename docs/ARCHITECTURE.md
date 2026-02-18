# Flash-n-Frame Architecture

> Last Updated: February 18, 2026

## Overview

Flash-n-Frame is a visual intelligence platform built with React, TypeScript, and Express. It transforms content sources (GitHub repositories, articles, designs) into professional infographics using Google Gemini AI. The system uses a full-stack architecture with server-side authentication, security middleware, and both server-side (PostgreSQL) and client-side (IndexedDB) persistence.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React 19 + TypeScript                     │    │
│  │                    Vite 6 Dev / dist/ Prod                   │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Contexts:                                                   │    │
│  │  ├── ThemeContext (dark / light / solarized)                 │    │
│  │  ├── ProjectContext (repo state, file trees, graphs)         │    │
│  │  ├── UserSettingsContext (API keys in localStorage)          │    │
│  │  └── RateLimitContext (Gemini rate limit UI sync)            │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Views (lazy-loaded):                                        │    │
│  │  ├── Home ─────────────── Landing / splash                   │    │
│  │  ├── RepoAnalyzer ─────── GitFlow (GitHub → infographic)     │    │
│  │  ├── ArticleToInfographic  SiteSketch (URL → infographic)    │    │
│  │  ├── ImageEditor ──────── Reality Engine (style transfer)     │    │
│  │  └── DevStudio ────────── D3 force-directed graph explorer   │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Services:                                                   │    │
│  │  ├── geminiService ────── Gemini API (retry, cache, dedup)   │    │
│  │  ├── githubService ────── GitHub REST API                    │    │
│  │  ├── omniAiService ────── AI widget generation               │    │
│  │  ├── persistence ──────── IndexedDB CRUD                     │    │
│  │  ├── cache ────────────── In-memory response cache           │    │
│  │  ├── semanticEngine ───── Semantic analysis                  │    │
│  │  ├── templateService ──── Layout templates                   │    │
│  │  └── errorService ─────── Error handling                     │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Persistence (client-side):                                  │    │
│  │  ├── IndexedDB: history, tasks, projects, offline queue      │    │
│  │  └── localStorage: theme, API keys, splash pref              │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  PWA Layer:                                                  │    │
│  │  ├── Service Worker (sw.js) ── offline caching               │    │
│  │  ├── manifest.json ── install prompt                         │    │
│  │  └── offline.html ── fallback page                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXPRESS SERVER (server/index.ts)                 │
│                     Port 5000 (prod) / 3001 (dev API)               │
│                                                                     │
│  ┌─────────────────── Security Middleware ────────────────────┐     │
│  │  Helmet ─── HTTP headers (CSP off, COEP off)              │     │
│  │  CORS ───── prod: *.replit.app/*.replit.dev │ dev: all     │     │
│  │  Rate Limit  auth: 20/15min │ API: 100/min                │     │
│  │  CSRF ───── double-submit cookie on auth mutations         │     │
│  │  Trust Proxy 1                                             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────── Auth System ────────────────────────────┐     │
│  │  Replit OIDC ── /api/login, /api/callback, /api/logout     │     │
│  │  Email/Pass ─── /api/auth/signup, /api/auth/login          │     │
│  │  Stubs ──────── /api/auth/magic-link (501)                 │     │
│  │                  /api/auth/phone (501)                      │     │
│  │  Session ────── connect-pg-simple → PostgreSQL             │     │
│  │  Password ───── bcrypt (12 rounds)                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────── API Endpoints ──────────────────────────┐     │
│  │  GET  /api/ai/key ────── Gemini key (auth required)        │     │
│  │  GET  /api/github/tree/:owner/:repo ── tree proxy          │     │
│  │  GET  /api/csrf-token ── CSRF token issuer                 │     │
│  │  GET  /api/health ────── status + uptime + env             │     │
│  │  GET  /api/ping ──────── liveness probe                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────── Static Serving (prod only) ─────────────┐     │
│  │  express.static(dist/) with cache headers                  │     │
│  │  HTML: no-cache │ Assets: 1-year cache                     │     │
│  │  SPA fallback: /* → index.html                             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────── Process Resilience ─────────────────────┐     │
│  │  SIGTERM / SIGINT → graceful shutdown (10s timeout)        │     │
│  │  unhandledRejection → log + continue                       │     │
│  │  uncaughtException → log + exit(1)                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   PostgreSQL      │  │  Google Gemini   │  │  GitHub REST     │  │
│  │   (Neon-backed)   │  │  API             │  │  API             │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │  users table      │  │  Text gen        │  │  /repos/:o/:r/   │  │
│  │  sessions table   │  │  Image gen       │  │    git/trees     │  │
│  │                   │  │  Code gen        │  │  Branch fallback │  │
│  │  Drizzle ORM      │  │  Model fallback  │  │    main→master   │  │
│  │  drizzle-kit push │  │  Smart retry     │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

```
Browser Request
      │
      ▼
  Helmet (security headers)
      │
      ▼
  CORS (origin check)
      │
      ▼
  Rate Limiter (IP-based)
      │
      ▼
  Cookie Parser + JSON Parser (10MB limit)
      │
      ▼
  Session Middleware (PostgreSQL-backed)
      │
      ├── /api/auth/* ──► CSRF check ──► Auth handler
      │
      ├── /api/ai/key ──► Auth check ──► Return key or 401
      │
      ├── /api/github/* ──► GitHub proxy
      │
      ├── /api/health ──► Health response
      │
      └── /* (prod) ──► Static files / SPA fallback
```

---

## Directory Structure

```
flash-n-frame/
├── server/                     # Express backend
│   ├── index.ts                # Server entry, routes, middleware
│   ├── db.ts                   # PostgreSQL pool (via DATABASE_URL)
│   ├── vite.ts                 # Dev-mode Vite middleware loader
│   └── replit_integrations/
│       └── auth/
│           ├── replitAuth.ts   # OIDC setup (passport, session)
│           ├── routes.ts       # /api/login, /callback, /logout, /auth/me
│           └── storage.ts      # User upsert/find (Drizzle queries)
├── shared/
│   └── models/
│       └── auth.ts             # Drizzle schema (users, sessions)
├── db/
│   ├── schema.ts               # Re-exports shared/models/auth
│   └── index.ts                # Drizzle client instance
├── components/                 # React components
│   ├── backgrounds/            # Canvas effects (Aurora, Noise, Dots)
│   ├── drawer/                 # Side drawer panels (5 panels)
│   ├── modals/                 # Modal dialogs (About, Help, etc.)
│   ├── pwa/                    # PWA UI (InstallPrompt, Offline)
│   ├── viz/                    # Data viz (Chart, Bar, Heatmap, etc.)
│   ├── AppHeader.tsx           # Navigation header
│   ├── Home.tsx                # Landing page
│   ├── RepoAnalyzer.tsx        # GitFlow view
│   ├── ArticleToInfographic.tsx # SiteSketch view
│   ├── ImageEditor.tsx         # Reality Engine view
│   ├── DevStudio.tsx           # Code explorer view
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── Toast.tsx               # Toast notifications
│   └── RateLimitBanner.tsx     # Rate limit UI
├── contexts/                   # React contexts (4)
│   ├── ThemeContext.tsx
│   ├── ProjectContext.tsx
│   ├── UserSettingsContext.tsx
│   └── RateLimitContext.tsx
├── hooks/                      # Custom hooks (15)
├── services/                   # Business logic (8 services)
├── utils/                      # Utilities (3 files)
├── docs/                       # Documentation (26+ files)
├── public/                     # PWA assets (manifest, sw, icons)
├── App.tsx                     # Root component
├── index.tsx                   # React entry point
├── types.ts                    # TypeScript definitions
├── constants.ts                # App constants
├── index.css                   # Global styles + CSS variables
├── vite.config.ts              # Vite build config
├── tsconfig.json               # TypeScript config
├── drizzle.config.ts           # Drizzle ORM config
└── package.json                # Dependencies + scripts
```

---

## Core Components

### App.tsx
- Application root with React.lazy() code splitting
- Keyboard shortcut handling (Alt+1-5, Shift+?)
- View navigation state management
- Context providers: Theme → UserSettings → Project → RateLimit → Toast → ErrorBoundary

### Contexts

| Context | Purpose | Storage |
|---------|---------|---------|
| ThemeContext | dark / light / solarized | localStorage |
| ProjectContext | Current repo, file tree, graph, history | In-memory |
| UserSettingsContext | Per-service API keys | localStorage |
| RateLimitContext | Gemini rate limit cooldown sync | In-memory |

### Views (Lazy-Loaded)

| View | Component | Feature Name | Status |
|------|-----------|-------------|--------|
| Home | Home.tsx | Landing | Implemented |
| GitFlow | RepoAnalyzer.tsx | Repo → Infographic | Implemented |
| SiteSketch | ArticleToInfographic.tsx | Article → Infographic | Implemented |
| Reality Engine | ImageEditor.tsx | Style transfer / wireframe-to-code | Implemented |
| DevStudio | DevStudio.tsx | D3 graph explorer | Implemented |

---

## Data Flow

### Repository Analysis Flow

```
1. User enters "owner/repo"
       ↓
2. githubService.fetchRepoFileTree()
   └── GET /api/github/tree/:owner/:repo (server proxy)
       └── GitHub API: /repos/:o/:r/git/trees/:branch?recursive=1
       └── Tries 'main', falls back to 'master'
       └── Filters: code files only, excludes node_modules/dist/build
       ↓
3. File tree stored in ProjectContext
       ↓
4a. "Generate Infographic" → geminiService.generateInfographic()
    └── Gemini API call with retry + cache + dedup
    └── Result displayed in InfographicResultCard
       ↓
4b. "Explore in DevStudio" → graphBuilder.buildGraphFromFileTree()
    └── Converts to D3 node/link format
    └── DevStudio renders force-directed graph
```

### Infographic Generation Flow

```
1. User provides content (URL or repo data)
       ↓
2. Pre-flight check: checkBeforeCall() (rate limit guard)
       ↓
3. geminiService.generateInfographic()
   ├── Check apiCache (5min TTL for text, 10min for images)
   ├── Check deduplicatedFetch (prevent duplicate in-flight)
   ├── Gemini API call with exponential backoff (2 retries, 2s base)
   ├── Skip retry on: 429, 403, 404, safety errors
   └── On 429: update globalRateLimitUntil → RateLimitContext
       ↓
4. Result displayed + saved to IndexedDB history
```

### Authentication Flow

```
Replit OIDC:
  Browser → GET /api/login → Redirect to Replit OIDC
  Replit → GET /api/callback → Passport verify → Upsert user → Session
  Browser → GET /api/auth/me → Return user profile

Email/Password:
  Browser → POST /api/auth/signup → Validate email + password → bcrypt hash → Insert user → Session
  Browser → POST /api/auth/login → Find user → bcrypt compare → Session
```

---

## State Management

| Layer | Technology | Data | TTL |
|-------|-----------|------|-----|
| Component | useState | UI state, forms, loading | Session |
| Context | React Context | Theme, project, keys, rate limit | Session |
| IndexedDB | persistence.ts | History, tasks, projects | Permanent |
| localStorage | Native | Theme, API keys, splash pref | Permanent |
| PostgreSQL | Drizzle ORM | Users, sessions | Permanent |
| In-memory cache | services/cache.ts | API responses | 5-10 min |

---

## Styling Architecture

### CSS Variables (index.css)

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --text-primary: #e0e0e0;
  --accent-primary: #8b5cf6;
  --border-color: #2a2a3a;
}

[data-theme="light"] { --bg-primary: #ffffff; ... }
[data-theme="solarized"] { --bg-primary: #002b36; ... }
```

### Tailwind CSS v4
- Utility-first with `@tailwindcss/vite` plugin
- Custom glassmorphism patterns
- Neon-style accent colors

---

## Build & Deployment

### Development
```bash
npm run dev          # Vite dev server on port 5000
npm run dev:server   # Express API on port 3001
```

### Production
```bash
npm run build        # Vite builds frontend to dist/
npx tsx server/index.ts  # Serves API + static on port 5000
```

### Database
```bash
npm run db:push      # Sync Drizzle schema to PostgreSQL
```

### Deployment Target
- Replit Autoscale
- Build: `npm run build`
- Run: `npx tsx server/index.ts`
- Static files served from `dist/` with cache headers

---

## Environment Variables

| Variable | Required | Source | Purpose |
|----------|----------|--------|---------|
| DATABASE_URL | Yes | Replit DB | PostgreSQL connection |
| SESSION_SECRET | Yes | Replit Secrets | Express session signing |
| GEMINI_API_KEY | Yes | Replit Secrets | Google Gemini AI |
| REPL_ID | Auto | Replit runtime | App identifier |
| REPLIT_DEPLOYMENT | Auto | Replit runtime | Production flag |
| PORT | Auto | Replit runtime | Server port |
| GITHUB_TOKEN | Optional | User/env | Private repo access |
| SENDGRID_API_KEY | Optional | Env | Magic link email (not configured) |
| TWILIO_AUTH_TOKEN | Optional | Env | Phone auth (not configured) |

---

## Security Considerations

1. **API Key Protection** — `/api/ai/key` requires authentication (returns 401 for anonymous)
2. **Password Hashing** — bcrypt with 12 salt rounds, regex complexity validation
3. **Session Security** — httpOnly cookies, secure flag in production, sameSite lax
4. **Rate Limiting** — IP-based: 20/15min for auth, 100/min for general API
5. **CSRF** — Double-submit cookie pattern on auth mutations
6. **CORS** — Restricted to `*.replit.app` / `*.replit.dev` in production
7. **Input Validation** — Email regex, password complexity, parameterized queries via Drizzle

### Not Implemented
- Content Security Policy (disabled for SPA)
- Structured logging
- Error tracking (Sentry)
- Per-user rate limiting
- Audit logging

See [RISK_REGISTER.md](RISK_REGISTER.md) for full security audit findings.

---

## Performance Optimizations

1. **Code Splitting** — React.lazy() for 5 view components
2. **API Caching** — In-memory cache with 5-10min TTL
3. **Request Dedup** — Prevents duplicate in-flight API calls
4. **Smart Retry** — Exponential backoff with skip-retry for known failures
5. **Static Caching** — 1-year cache for hashed assets, no-cache for HTML
6. **D3 Rendering** — requestAnimationFrame for force simulation

### Known Bottleneck
- Main bundle ~619KB (above 500KB warning). See [ROADMAP.md](ROADMAP.md) for optimization plan.

---

## Related Documentation

- [FEATURES.md](FEATURES.md) — Feature descriptions and status matrix
- [DELIVERABLES.md](DELIVERABLES.md) — APIs, data models, auth flows, deployment
- [RISK_REGISTER.md](RISK_REGISTER.md) — Security audit findings
- [ROADMAP.md](ROADMAP.md) — WSJF-prioritized improvement plan
- [API.md](API.md) — API reference
- [reference/database-schema.md](reference/database-schema.md) — Database schema
- [reference/deployment-runbook.md](reference/deployment-runbook.md) — Deployment procedures
