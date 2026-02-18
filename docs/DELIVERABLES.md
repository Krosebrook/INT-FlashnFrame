# Flash-n-Frame Deliverables

**Last Updated:** February 2026

This document describes the actual implemented state of the Flash-n-Frame system. It covers all delivered features, capabilities, and architecture decisions currently in production.

---

## 1. Authentication & Authorization

### Replit OIDC Integration
- **Endpoint:** `GET /api/login`
  - Initiates Replit OpenID Connect (OIDC) login flow
  - Requests scopes: `openid`, `email`, `profile`, `offline_access`
  - Dynamically registers passport strategies per hostname for multi-tenant support

- **Endpoint:** `GET /api/callback`
  - OIDC callback handler
  - Upserts user record to PostgreSQL from OIDC claims
  - Establishes server session via Passport.js
  - Redirects to home on success, login on failure

- **Endpoint:** `GET /api/logout`
  - Destroys session
  - Redirects to Replit OIDC end-session endpoint for full logout
  - Clears cookies

### Email/Password Authentication
- **Endpoint:** `POST /api/auth/signup`
  - Creates local user account with email and password
  - Input validation:
    - Email: regex pattern validation
    - Password: minimum 8 characters, requires uppercase, lowercase, digit, and special character
  - Password hashing: bcrypt with 12 salt rounds
  - Duplicate email prevention via unique constraint
  - CSRF protected (double-submit cookie)
  - Rate limited: 20 requests per 15 minutes

- **Endpoint:** `POST /api/auth/login`
  - Authenticates email/password credentials
  - Bcrypt comparison against stored hash
  - Creates server session on success
  - CSRF protected
  - Rate limited: 20 requests per 15 minutes

### Current User
- **Endpoint:** `GET /api/auth/me` (via `GET /api/auth/user` in routes.ts)
  - Returns authenticated user profile
  - Requires active session
  - Returns: id, email, firstName, lastName, profileImageUrl, emailVerified

### Placeholder Endpoints (Not Implemented)
- **Endpoint:** `POST /api/auth/magic-link`
  - Returns HTTP 501 (Not Implemented)
  - Requires SendGrid integration

- **Endpoint:** `POST /api/auth/phone`
  - Returns HTTP 501 (Not Implemented)
  - Requires Twilio integration

---

## 2. Application APIs

### API Key Management
- **Endpoint:** `GET /api/ai/key`
  - Returns Gemini API key from environment
  - Requires authentication
  - Returns 401 if unauthenticated
  - Returns 404 if key not configured

### GitHub Integration
- **Endpoint:** `GET /api/github/tree/:owner/:repo`
  - Fetches GitHub repository tree structure
  - Attempts main branch, falls back to master
  - Proxies to GitHub REST API
  - Supports optional client authorization via bearer token
  - Falls back to server GITHUB_TOKEN if client not provided
  - Returns 404 if repo not found or uses non-standard default branch
  - Returns 429 if GitHub API rate limit exceeded
  - Error handling for transient failures

### CSRF Token Issuance
- **Endpoint:** `GET /api/csrf-token`
  - Issues CSRF token via double-submit cookie pattern
  - Generates 32-byte random hex token
  - Sets HTTP-only cookie (httpOnly: false for client access)
  - Secure flag enabled in production
  - SameSite: lax
  - Max-Age: 7 days
  - Returns token in JSON response

### Health & Liveness Checks
- **Endpoint:** `GET /api/health`
  - Returns system health status
  - Includes: status, uptime, current timestamp, environment (production/development)

- **Endpoint:** `GET /api/ping`
  - Simple liveness probe returning `{ pong: true }`

- **Endpoint:** `HEAD /api/ping`
  - Lightweight liveness probe, minimal payload

---

## 3. Security Architecture

### Middleware Stack
- **Helmet Security Headers**
  - Content Security Policy (CSP): **Disabled** for SPA compatibility
  - Cross-Origin Embedder Policy (COEP): **Disabled**
  - Other standard headers: enabled

- **CORS Configuration**
  - **Production** (`REPLIT_DEPLOYMENT=1` or `NODE_ENV=production`):
    - Allowed origins: `*.replit.app`, `*.replit.dev`
    - Credentials: true
  - **Development**:
    - All origins allowed
    - Credentials: true

- **Rate Limiting**
  - **Auth endpoints** (`/api/auth/login`, `/api/auth/signup`):
    - 20 requests per 15 minutes per IP
  - **General API** (`/api/*`):
    - 100 requests per minute per IP
  - Uses `express-rate-limit` with standard headers
  - Returns standardized 429 rate limit messages

- **CSRF Protection**
  - Double-submit cookie pattern
  - Protects all mutation endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/magic-link`, `/api/auth/phone`
  - Token validation: checks both cookie and `x-csrf-token` header
  - Returns 403 on mismatch

### Session Management
- **Storage:** PostgreSQL (via `connect-pg-simple`)
- **Table:** `sessions` (auto-managed by Passport.js + connect-pg-simple)
- **Cookie Configuration:**
  - HTTP-only: true (prevents JavaScript access)
  - Secure: true in production only
  - SameSite: lax
  - Max-Age: 7 days (604800000 ms)
- **Session TTL:** 7 days with automatic cleanup

### Password Security
- **Hash Algorithm:** bcrypt (2^12 rounds = 4096 iterations)
- **Strength Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character from: `!@#$%^&*(),.?":{}|<>`

### Token Refresh
- **OIDC Token Refresh:** Automatic via `refresh_token` grant
- **Flow:** Tokens refreshed when expired before next request
- **Expiration:** 7-day default session timeout

---

## 4. Data Models

### PostgreSQL (Drizzle ORM)

#### `users` Table
```sql
id           VARCHAR PRIMARY KEY (auto-generated UUID)
email        VARCHAR UNIQUE NOT NULL
password_hash VARCHAR (nullable for OIDC-only accounts)
first_name   VARCHAR
last_name    VARCHAR
profile_image_url VARCHAR
email_verified TIMESTAMP (nullable)
created_at   TIMESTAMP DEFAULT now()
updated_at   TIMESTAMP DEFAULT now()
```
- **Constraints:** Email uniqueness
- **Indexes:** Standard primary key

#### `sessions` Table
```sql
sid    VARCHAR PRIMARY KEY
sess   JSONB NOT NULL
expire TIMESTAMP NOT NULL
```
- **Indexes:** IDX_session_expire on expire column for cleanup queries
- **Purpose:** Stores session data and expiration for all authenticated users

### IndexedDB (Client-Side Persistence)

**Database Name:** `flash_n_frame_db` (Version: 2)

**Object Stores:**
1. **`repo_history`** (keyPath: id)
   - Stores analysis history entries from GitHub repository analyses
   - Sorted in-memory by date descending
   - Limited to ~20 most recent items to manage memory

2. **`article_history`** (keyPath: id)
   - Stores analysis history entries from article/document analyses
   - Sorted in-memory by date descending

3. **`tasks`** (keyPath: id)
   - Stores task list items created by user
   - Supports CRUD operations

4. **`project`** (no keyPath)
   - Stores current DevStudioState snapshot
   - Single "current" key for active project state

5. **`user_preferences`** (no keyPath)
   - Stores user preference key-value pairs
   - Theme preference, API key selections, etc.

6. **`offline_queue`** (keyPath: id, autoIncrement: true)
   - Stores pending operations for offline-first sync
   - Contains: type, payload, timestamp
   - Cleared after successful sync

### localStorage

**Non-sensitive Storage:**
- Theme preference (light/dark mode)
- Splash screen skip flag
- UI preference hints (e.g., sidebar state)

**API Key Storage:**
- Per-service API keys stored locally, never transmitted to server
- Keys managed by client-side services

---

## 5. Authentication Flows

### Replit OIDC Login Flow
1. User accesses login screen
2. Clicks "Sign in with Replit"
3. **Request:** `GET /api/login`
4. Server redirects to `https://replit.com/oidc` with:
   - `client_id`: REPL_ID environment variable
   - `redirect_uri`: `https://{hostname}/api/callback`
   - `scope`: openid, email, profile, offline_access
5. User authenticates with Replit credentials
6. Replit redirects to callback with authorization code
7. **Request:** `GET /api/callback` with code
8. Server exchanges code for tokens via OpenID Connect token endpoint
9. **Flow:** `upsertUser` called with OIDC claims:
   - id ← claims.sub
   - email ← claims.email
   - firstName ← claims.first_name
   - lastName ← claims.last_name
   - profileImageUrl ← claims.profile_image_url
10. Passport.js creates session
11. Session stored in PostgreSQL `sessions` table
12. Browser receives session cookie
13. Redirect to home page

### Token Refresh (OIDC)
- Access tokens expire based on OIDC provider settings
- Refresh token stored in session
- `refreshTokenGrant` called automatically when token expired
- New access token obtained without user interaction
- Session updated with new token set

### Email/Password Registration Flow
1. User provides email, password, first name, last name
2. **Request:** `POST /api/auth/signup` (CSRF protected)
3. Server validates:
   - Email regex pattern
   - Password complexity (8+ chars, case, digit, special)
   - Email uniqueness
4. Password hashed with bcrypt (12 rounds)
5. User record inserted into PostgreSQL
6. Passport.js `req.login()` called to create session
7. Session established in PostgreSQL
8. Response: user data + success message
9. Browser receives session cookie

### Email/Password Login Flow
1. User provides email and password
2. **Request:** `POST /api/auth/login` (CSRF protected)
3. Server queries user by email
4. Bcrypt comparison: `bcrypt.compare(password, hash)`
5. On success:
   - Passport.js `req.login()` creates session
   - Session stored in PostgreSQL
   - Response: user data + success message
6. On failure: 401 error with generic message (no user enumeration)

---

## 6. Deployment Architecture

### Target Platform
- **Hosting:** Replit Autoscale
- **Port:** 5000
- **Process:** Single unified server (API + static files)

### Build Process
```bash
npm run build
```
- **Tool:** Vite
- **Input:** TypeScript React + Express (src files)
- **Output:** `dist/` directory
- **Bundling:** Vite default splitting (client-side assets)
- **PWA Assets:** `public/manifest.json`, `public/sw.js`, `public/offline.html` copied to dist

### Runtime Execution
```bash
npx tsx server/index.ts
```
- **Runtime:** Node.js with tsx (TypeScript runner)
- **Entry Point:** `server/index.ts`
- **Binding:** `0.0.0.0:5000` (all interfaces)
- **Static Serving:** Serves `dist/` directory with:
  - HTML: no-cache directive
  - Assets: 1-hour max-age with cache control

### Database Setup
```bash
npm run db:push
```
- **Driver:** PostgreSQL via Drizzle ORM
- **Provider:** Neon (Replit managed)
- **Connection:** DATABASE_URL environment variable (Replit provisioned)
- **Schema:** Auto-synced from `shared/models/auth.ts`
- **Migrations:** Handled by Drizzle tooling (no manual migration files)

### Environment Configuration
- **Secrets Required:**
  - `SESSION_SECRET`: Random string for session signing
  - `DATABASE_URL`: PostgreSQL connection string
  - `GEMINI_API_KEY`: Google Gemini API key
  - `REPL_ID`: Replit application ID (auto-provisioned)
  - `ISSUER_URL`: OIDC issuer (defaults to https://replit.com/oidc)

- **Optional Secrets:**
  - `GITHUB_TOKEN`: GitHub API token for repo analysis (fallback if client not provided)
  - `SENDGRID_API_KEY`: SendGrid for magic link (not yet implemented)
  - `TWILIO_ACCOUNT_SID`: Twilio for phone auth (not yet implemented)
  - `TWILIO_AUTH_TOKEN`: Twilio for phone auth (not yet implemented)

### Progressive Web App (PWA)
- **Manifest:** `public/manifest.json` (included in dist)
  - Short name, icons, theme colors
- **Service Worker:** `public/sw.js` (static asset)
  - Offline support
  - Cache strategies (TBD per individual config)
- **Offline Page:** `public/offline.html` (fallback for offline navigation)
- **Installation:** Supported on compatible browsers (Android, some desktop)

### Graceful Shutdown
- **Signals Handled:** SIGTERM, SIGINT
- **Process:**
  1. Stop accepting new connections
  2. Close HTTP server
  3. Close database connection pool
  4. Exit with code 0
- **Timeout:** 10-second hard deadline before forced exit

### Error Handling
- **Unhandled Rejection:** Logged to console, process continues
- **Uncaught Exception:** Logged to console, process exits with code 1
- **Middleware Errors:** 500 responses with generic messages (no stack traces to client)

---

## 7. Security Posture

### Implemented Protections

| Category | Mechanism | Status |
|----------|-----------|--------|
| **Access Control** | Session-based auth via Passport.js | ✅ Implemented |
| **Authentication** | OIDC + Email/Password with bcrypt | ✅ Implemented |
| **Password Hashing** | bcrypt 12 rounds | ✅ Implemented |
| **CSRF** | Double-submit cookie pattern | ✅ Implemented |
| **Rate Limiting** | IP-based per endpoint | ✅ Implemented |
| **HTTPS** | Enforced in production (Replit managed) | ✅ Implemented |
| **Session Cookies** | httpOnly, secure, sameSite=lax | ✅ Implemented |
| **Input Validation** | Email regex, password strength, type checking | ✅ Implemented |
| **SQL Injection** | Parameterized queries via Drizzle ORM | ✅ Implemented |
| **API Key Protection** | Authenticated endpoint only | ✅ Implemented |
| **CORS Restriction** | Whitelist in production | ✅ Implemented |
| **Security Headers** | Helmet middleware (partial) | ✅ Implemented |
| **Transitive Deps** | npm audit, lockfile pinning | ✅ Implemented |

### NOT Implemented

| Feature | Reason |
|---------|--------|
| **Content Security Policy (CSP)** | Disabled for React SPA compatibility; would require nonce injection |
| **Structured Logging** | Currently console.log only; no log aggregation |
| **Error Tracking** | No Sentry or similar integration |
| **Audit Logging** | No compliance event logging |
| **Per-User Rate Limiting** | Currently IP-based only |
| **Secrets Rotation** | Manual rotation required (no automatic refresh) |
| **API Gateway** | Direct Replit hosting, no WAF or DDoS protection configured |

### Known Gaps (See Risk Register)

- **R9:** Structured logging needed for production observability
- **R10:** Error tracking service needed (Sentry recommended)
- **R11:** Request metrics (latency, throughput) not instrumented
- **R12:** No database migration history tracking
- **R13:** No automated CI/CD pipeline
- **R16:** Main JavaScript bundle exceeds 500KB (code splitting needed)

---

## 8. Observability & Monitoring

### Implemented

| Feature | Endpoint | Details |
|---------|----------|---------|
| **Liveness Check** | `GET /api/ping`, `HEAD /api/ping` | Simple 200 response |
| **Readiness Check** | `GET /api/health` | Status, uptime, timestamp, environment |
| **Console Logging** | stdout/stderr | Error messages, startup, shutdown |
| **Graceful Shutdown** | SIGTERM/SIGINT | 10-second timeout for cleanup |
| **Unhandled Errors** | Process-level handlers | Logs before exit/continue |

### NOT Implemented

- **Request Metrics:** No latency, throughput, or endpoint counters
- **Custom Logging:** No structured JSON logs (no Winston, Pino, or Bunyan)
- **Error Tracking:** No Sentry, Rollbar, or equivalent
- **Distributed Tracing:** No correlation IDs, no trace spans
- **Alerting:** No alerts for errors, performance, or anomalies
- **Dashboard:** No Grafana, DataDog, or other visualization

---

## 9. Feature Completeness

### Core Features
- ✅ User authentication (OIDC + local)
- ✅ Session management (PostgreSQL-backed)
- ✅ API key protection (Gemini)
- ✅ GitHub repository analysis proxy
- ✅ Offline-first client (IndexedDB + localStorage)
- ✅ Task management (client-side)
- ✅ Analysis history (client-side)
- ✅ PWA support (manifest, service worker)

### Partially Implemented
- ⚠️ Magic link authentication (501 Not Implemented, needs SendGrid)
- ⚠️ Phone authentication (501 Not Implemented, needs Twilio)

### Architecture & DevOps
- ✅ Database schema (users, sessions via Drizzle)
- ✅ Environment-based configuration
- ✅ Production/development modes
- ✅ Graceful shutdown
- ✅ CORS and security middleware
- ⚠️ PWA offline strategies (defined, specific caching varies by component)
- ❌ Structured observability (no metrics, logs, or traces)
- ❌ Automated CI/CD
- ❌ Load testing or performance baselines

---

## 10. Performance Characteristics

### Bundle Size
- **Main JavaScript:** ~500-600 KB (uncompressed)
- **Concern:** Exceeds recommended <500 KB threshold (see R16)
- **Recommendation:** Implement code splitting, lazy loading

### Database Performance
- **Queries:** Parameterized via Drizzle ORM
- **Connection Pooling:** Via `pg` module
- **Indexes:** Standard PK + session expiration index
- **No Query Monitoring:** Slow query logs not configured

### Request Latency
- **Measurement:** Not instrumented
- **Estimation:** ~100-500ms for API calls (dependent on DB, network, CPU)

---

## 11. Third-Party Integrations

### Replit Ecosystem
- **Replit Auth (OIDC):** ✅ Integrated
  - Auto-provisioned credentials
  - Session storage via Replit PostgreSQL
- **Replit Database (Neon):** ✅ Integrated
  - Automatic provisioning
  - Connection string via `DATABASE_URL`
  - No cost for development tier

### External Services (Optional)
- **Google Gemini API:** ✅ Integrated (optional)
  - Requires `GEMINI_API_KEY`
  - Used by client-side AI services
- **GitHub REST API:** ✅ Integrated
  - Public repo access without token
  - Token-gated for private repos (optional `GITHUB_TOKEN`)
- **SendGrid:** ⚠️ Supported but not implemented
  - Magic link auth endpoint returns 501
- **Twilio:** ⚠️ Supported but not implemented
  - Phone auth endpoint returns 501

### Build & Development Tools
- **Vite:** React bundler
- **Tailwind CSS:** Utility-first styling
- **Drizzle ORM:** Type-safe database access
- **Express.js:** REST API framework
- **Passport.js:** Authentication middleware

---

## 12. Known Issues & Limitations

### Critical
- None identified at deployment time

### Major
- **Bundle Size (R16):** Main JS > 500 KB; requires code splitting
- **No Error Tracking (R10):** Production errors not monitored
- **No Structured Logging (R9):** Difficult to debug in production

### Minor
- **No Request Metrics (R11):** Cannot identify performance bottlenecks
- **No DB Migration History (R12):** Manual tracking required
- **No CI/CD (R13):** Manual deployment process

### Workarounds in Place
- **Rate Limiting:** IP-based (not per-user); may be too strict for shared networks
- **CORS:** Tight in production; may require adjustment for proxy scenarios
- **CSP Disabled:** Accept risk for SPA compatibility; monitor for XSS

---

## 13. Deployment Checklist

Before pushing to production:

- [ ] Set `SESSION_SECRET` in Secrets tab (strong random string, 32+ chars)
- [ ] Confirm `DATABASE_URL` is provisioned and accessible
- [ ] Set `GEMINI_API_KEY` if AI features required
- [ ] Verify `REPL_ID` auto-provisioned (Replit handles this)
- [ ] Test OIDC flow end-to-end
- [ ] Test email/password signup and login
- [ ] Run `npm run db:push` to sync schema
- [ ] Run `npm run build` to bundle frontend
- [ ] Verify `/api/health` returns 200
- [ ] Test session persistence across page reloads
- [ ] Verify CORS headers correct for production domains
- [ ] Test logout clears session and cookies
- [ ] Load test with anticipated traffic (no baselines established)

---

## 14. File Structure & Key Artifacts

### Backend (Express.js)
```
server/
├── index.ts                          # Main server & API endpoints
├── db.ts                             # Drizzle ORM connection pool
└── replit_integrations/
    └── auth/
        ├── replitAuth.ts             # OIDC strategy & session setup
        ├── routes.ts                 # Auth routes (/api/auth/user)
        ├── storage.ts                # User & session persistence
        └── index.ts                  # Exports
```

### Data Models
```
shared/
└── models/
    └── auth.ts                       # Drizzle schema (users, sessions)
```

### Client-Side
```
services/
├── persistence.ts                    # IndexedDB & localStorage access
├── geminiService.ts                  # Google Gemini AI client
├── githubService.ts                  # GitHub API proxy
├── cache.ts                          # In-memory caching
├── omniAiService.ts                  # Aggregated AI services
└── ...                               # Other services

hooks/
├── useAuth.ts                        # Authentication hook
├── useHistory.ts                     # History persistence hook
├── usePWA.ts                         # PWA installation/updates
├── useServiceWorker.ts               # Service worker lifecycle
└── ...                               # Other hooks

components/
├── AuthModal.tsx                     # Login/signup UI
├── UserSettingsModal.tsx             # User profile management
└── ...                               # Feature components
```

### Configuration
```
vite.config.ts                        # Frontend build config
tsconfig.json                         # TypeScript settings
tailwind.config.js                    # Tailwind CSS theme
drizzle.config.ts                     # Drizzle ORM migrations
package.json                          # Dependencies & scripts
```

### Public Assets
```
public/
├── manifest.json                     # PWA manifest
├── sw.js                             # Service worker
├── offline.html                      # Offline fallback page
├── images/                           # Branding images
└── icons/                            # PWA icons
```

---

## 15. How to Extend This System

### Adding a New Authentication Method
1. Create endpoint in `server/index.ts`
2. Implement user upsert logic in `server/replit_integrations/auth/storage.ts`
3. Add route to `registerAuthRoutes()` in `server/replit_integrations/auth/routes.ts`
4. Update session creation logic (via Passport.js or custom)

### Adding Database Tables
1. Define schema in `shared/models/` (Drizzle syntax)
2. Run `npm run db:push` to sync
3. Create storage service in `server/replit_integrations/` or `services/`

### Adding API Endpoints
1. Add route handler to `server/index.ts`
2. Apply middleware (CSRF, rate limiting, auth) as needed
3. Document in this file

### Adding Client-Side Features
1. Create service in `services/` (if data/async)
2. Create hook in `hooks/` (if state management)
3. Create component in `components/` (if UI)
4. Update `App.tsx` to wire in navigation/routing

---

## 16. Support & References

### Key Configuration Files
- Environment: See `.env` template (create from `package.json` scripts)
- Database: `shared/models/auth.ts`
- API: `server/index.ts`
- PWA: `public/manifest.json`, `public/sw.js`

### Documentation
- API Details: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Risk Register: `docs/RISK_REGISTER.md`
- Decisions: `docs/decisions/`

### Monitoring & Debugging
- Health Check: `GET http://localhost:5000/api/health`
- Logs: Check console output of `npm run dev:server`
- Session: Check PostgreSQL `sessions` table
- Client State: Check browser DevTools (IndexedDB, localStorage, network)

---

## Conclusion

Flash-n-Frame is a production-ready, multi-authentication system with offline-first capabilities and progressive web app support. All endpoints and features documented above have been verified against the current codebase as of February 2026. The system prioritizes security, user autonomy (local API key storage), and offline resilience while remaining deployable on Replit's autoscale infrastructure.

For the latest risk assessments and performance metrics, consult `docs/RISK_REGISTER.md`.
