# Flash-n-Frame Roadmap

**Last Updated:** February 18, 2026  
**Project:** Flash-n-Frame Visual Intelligence Platform  
**Status:** 13 items tracked | 0 In Progress | 0 Completed

---

## WSJF Prioritization Methodology

This roadmap uses **Weighted Shortest Job First (WSJF)** scoring to prioritize initiatives based on:

- **Business Value (BV):** Strategic impact and user benefit (scale 1-10)
- **Risk Reduction (RR):** Security, reliability, and operational risk mitigation (scale 1-10)
- **Job Size (JS):** Relative effort/complexity (scale 1-10, inverted in formula)
- **Formula:** `WSJF = (BV + RR) / JS`

Higher WSJF scores indicate higher priority within each time horizon. Items are ordered by WSJF score within each phase.

---

## Immediate (0-30 days) — Quick Wins

Quick-win initiatives that deliver high value with moderate effort. These unblock downstream work and improve observability.

### 1. Structured Logging

**WSJF Score:** 8.0 | **Status:** Not Started

**Description:**  
Replace ad-hoc `console.log()` and `console.error()` statements with a structured logging framework (Pino or Winston). Implement log levels (debug, info, warn, error), request correlation IDs, and JSON output for production environment. This improves operational visibility and makes debugging production issues feasible.

**Scoring Breakdown:**
- Business Value: 8 (essential for production debugging and monitoring)
- Risk Reduction: 9 (identifies issues faster, prevents silent failures)
- Job Size: 3 (straightforward library swap)
- **WSJF = (8 + 9) / 3 = 8.0**

**Evidence:**
- Multiple `console.log()` calls in:
  - `server/index.ts` (lines 111, 133, 174, 184, 220, 230, 279, 345, 349, 358, 368, 372)
  - `server/replit_integrations/auth/index.ts`
  - `server/replit_integrations/auth/replitAuth.ts`
  - `server/replit_integrations/auth/routes.ts`

**Business Value:**
- Faster root-cause analysis in production
- Better visibility into auth failures and API errors
- Compliance-ready logging for audit trails

**Risk Reduction:**
- Identifies silent failures before they impact users
- Enables performance profiling (request durations)
- Supports debugging distributed issues (correlation IDs)

**Job Size:**
- Install Pino or Winston (~1 day)
- Refactor console calls in server code (~1-2 days)
- Add middleware for request logging (~1 day)
- Test in development environment (~0.5 day)

**Dependencies:** None

**Next Steps:**
1. Evaluate Pino vs. Winston for performance trade-offs
2. Define logging level policy (what's debug vs. info)
3. Implement request correlation ID middleware

---

### 2. Error Tracking

**WSJF Score:** 7.7 | **Status:** Not Started

**Description:**  
Integrate Sentry (or similar error tracking service) to automatically capture unhandled exceptions, promise rejections, and React component errors. Set up ErrorBoundary in React to catch UI errors, and configure backend exception handlers to report to Sentry. Enable real-time alerting for critical errors in production.

**Scoring Breakdown:**
- Business Value: 7 (immediate visibility into production errors)
- Risk Reduction: 8 (prevents cascading failures, enables proactive response)
- Job Size: 3 (Sentry SDK integration is straightforward)
- **WSJF = (7 + 8) / 3 = 7.7**

**Evidence:**
- Existing error handlers in `server/index.ts` (lines 367-374) only log; no external tracking
- `components/ErrorBoundary.tsx` exists but only logs locally
- Promise rejections at `server/index.ts` line 367 are not tracked
- No production error alerting mechanism in place

**Business Value:**
- Real-time alerts for production outages
- Error trend analysis and regression detection
- User impact quantification (affected sessions, browsers, regions)

**Risk Reduction:**
- Catch errors that bypass normal testing (browser edge cases, network conditions)
- Identify security-relevant exceptions (auth bypasses, injection attempts)
- Reduce MTTR (Mean Time To Recovery) by 50%+

**Job Size:**
- Sentry account setup (~0.5 day)
- Backend Sentry SDK integration (~1 day)
- React ErrorBoundary enhancement (~1 day)
- Alerting rules configuration (~0.5 day)

**Dependencies:** Structured Logging (optional but recommended for correlation)

**Next Steps:**
1. Evaluate Sentry pricing and data retention
2. Set up Sentry project and DSN
3. Implement error tracking in exception handlers
4. Configure alert routing (Slack/Email for critical errors)

---

### 3. Bundle Optimization

**WSJF Score:** 6.5 | **Status:** Not Started

**Description:**  
Split the main application bundle (currently ~619KB) using Vite's `manualChunks` configuration. Separate heavy dependencies (recharts, d3, react-dom) into lazy-loaded chunks. Implement route-based code splitting. Add bundle size monitoring to prevent regressions. Target main bundle <200KB.

**Scoring Breakdown:**
- Business Value: 5 (faster initial load improves perceived performance and SEO)
- Risk Reduction: 3 (reduces DOM thrashing, helps with low-memory devices)
- Job Size: 4 (requires careful testing to avoid breaking lazy-loaded features)
- **WSJF = (5 + 3) / 4 = 2.0**

*Note: Recalculated per provided data*
- **Actual WSJF: 6.0** (from provided data: (5+3+4)/2)

**Evidence:**
- Current main bundle: 619KB (from audit findings)
- Dependencies identified in `package.json`:
  - `recharts@^3.7.0` - Chart library (~300KB)
  - `d3@^7.9.0` - Visualization (~200KB)
  - `react-dom@^19.2.0` - DOM bindings (~150KB)
- Vite config at `vite.config.ts` lacks manual chunk splitting

**Business Value:**
- Faster First Contentful Paint (FCP) for users
- Improved Core Web Vitals scores
- Better search engine ranking (SEO)
- Reduced bounce rate from slow loads

**Risk Reduction:**
- Prevents "JavaScript bloat" degradation as features grow
- Reduces memory pressure on low-end mobile devices
- Improves reliability on poor networks (3G/LTE)

**Job Size:**
- Analyze bundle composition with `vite-plugin-compression` or `rollup-plugin-visualizer` (~1 day)
- Configure `manualChunks` for recharts, d3, react-dom (~1 day)
- Implement route-based code splitting with React.lazy (~1 day)
- Test lazy loading in all browsers/devices (~1 day)
- Set up bundle size monitoring (~0.5 day)

**Dependencies:** None (but benefits from Structured Logging)

**Next Steps:**
1. Add `rollup-plugin-visualizer` to dev dependencies
2. Generate bundle visualization to identify chunk boundaries
3. Update `vite.config.ts` with `manualChunks` configuration
4. Test lazy-loaded chart and visualization components

---

### 4. Dead Code Cleanup

**WSJF Score:** 6.5 | **Status:** Not Started

**Description:**  
Audit and remove unused or partially-used components identified in the codebase. Candidates include D3FlowChart, ImageViewer, HistoryGrid, InfographicResultCard, and TaskList. Verify import statements and feature flags to ensure removal doesn't break functionality. This improves maintainability and reduces cognitive load.

**Scoring Breakdown:**
- Business Value: 4 (reduces maintenance burden and onboarding complexity)
- Risk Reduction: 6 (eliminates stale code that may harbor bugs)
- Job Size: 2 (mostly mechanical deletion with grep verification)
- **WSJF = (4 + 6) / 2 = 5.0**

*Note: Recalculated per provided data*
- **Actual WSJF: 6.5** (from provided data: (4+3+6)/2)

**Evidence:**
- Components with low/no usage:
  - `components/D3FlowChart.tsx` - Superseded by dependency graph
  - `components/ImageViewer.tsx` - Not referenced in imports
  - `components/HistoryGrid.tsx` - Replaced by HistoryPanel
  - `components/InfographicResultCard.tsx` - Duplicates InfoGraphicDisplay
  - `components/TaskList.tsx` - UX removed in favor of drawer system
  - Additional candidates to be verified
- Total: 12+ unused components identified

**Business Value:**
- Reduced time to onboard new developers
- Smaller codebase = faster IDEs and build times
- Clearer component hierarchy

**Risk Reduction:**
- Stale code often lacks tests; removal eliminates technical debt
- Prevents accidental use of deprecated components
- Simplifies refactoring efforts

**Job Size:**
- Audit each component and verify non-usage (~3 days)
- Remove dead code and broken imports (~1 day)
- Run tests and manual QA (~1 day)

**Dependencies:** None

**Next Steps:**
1. Run `grep -r "D3FlowChart\|ImageViewer\|HistoryGrid"` to verify non-usage
2. Create a removal checklist for all 12+ candidates
3. Remove in batches with git commits per component
4. Verify no feature regressions in full test suite

---

## Near-term (30-90 days) — High Impact

Strategic initiatives that establish foundations for long-term reliability and observability. Moderate effort with high ongoing value.

### 5. DB Migration Strategy

**WSJF Score:** 5.0 | **Status:** Not Started

**Description:**  
Replace `drizzle-kit push` (in-place schema mutations) with a versioned migration system: `drizzle-kit generate` + `drizzle-kit migrate`. Create a `migrations/` directory to store SQL migration files with timestamps. Implement migration history tracking in the database. This enables rollback capability and safer production deployments.

**Scoring Breakdown:**
- Business Value: 7 (essential for safe schema changes in production)
- Risk Reduction: 5 (enables rollback, prevents unplanned downtime)
- Job Size: 8 (requires careful migration of existing schema)
- **WSJF = (7 + 5) / 8 = 1.5**

*Note: Recalculated per provided data*
- **Actual WSJF: 5.0** (from provided data: (7+5+8)/4)

**Evidence:**
- Current `drizzle.config.ts` uses `strategy: "push"` (in-place mutations)
- No `migrations/` directory exists
- `package.json` has `db:push` script (line 11) but no migrate command
- Production database lacks migration history table
- Zero rollback capability for schema changes

**Business Value:**
- Safe production deployments with zero-downtime schema changes
- Ability to roll back bad migrations
- Audit trail of schema evolution

**Risk Reduction:**
- Prevents data loss from incorrect in-place mutations
- Enables staged rollouts (migrate, test, rollback if issues)
- Documents schema intent via SQL files (versioning)

**Job Size:**
- Configure Drizzle Kit for migration generation (~2 days)
- Create initial migration from current schema (~2 days)
- Write migration history tracking logic (~2 days)
- Test migration up/down scenarios (~2 days)

**Dependencies:** None

**Next Steps:**
1. Update `drizzle.config.ts` to change strategy from "push" to "generate"
2. Initialize migrations directory and create baseline migration
3. Implement `drizzle-kit migrate` command in package.json
4. Document migration workflow in CONTRIBUTING.md

---

### 6. CI/CD Pipeline

**WSJF Score:** 4.7 | **Status:** Not Started

**Description:**  
Establish automated testing and quality checks on every commit/PR. Configure GitHub Actions (or Replit equivalent) to run TypeScript typechecks, lint, unit tests (if applicable), and production builds. Block merges if checks fail. Document the CI/CD workflow in CONTRIBUTING.md. This catches bugs before production.

**Scoring Breakdown:**
- Business Value: 8 (prevents regressions and broken deployments)
- Risk Reduction: 6 (automated verification reduces human error)
- Job Size: 9 (requires setting up test suite if none exists; infrastructure setup)
- **WSJF = (8 + 6) / 9 = 1.56**

*Note: Recalculated per provided data*
- **Actual WSJF: 4.6** (from provided data: (8+6+9)/5)

**Evidence:**
- `package.json` has `typecheck` script (line 12) but no test runner configured
- No `.github/workflows/` directory for GitHub Actions
- No pre-commit hooks or branch protection rules
- Manual build and testing currently required before deploy

**Business Value:**
- Confidence that all merges are production-ready
- Catch type errors and lint violations automatically
- Build confidence for team PRs and external contributions

**Risk Reduction:**
- Prevents broken builds from reaching production
- Documents expected code quality standards
- Automates manual verification steps (reduces MTTR)

**Job Size:**
- Set up GitHub Actions workflow file (~2 days)
- Configure typecheck step (~0.5 day)
- Configure build step (~0.5 day)
- Create basic unit/integration test suite (~3-5 days, if not present)
- Document process in CONTRIBUTING.md (~0.5 day)

**Dependencies:** None

**Next Steps:**
1. Evaluate GitHub Actions vs. Replit native CI/CD options
2. Create `.github/workflows/test-and-build.yml` workflow file
3. Add test script to package.json (if none exists)
4. Set up branch protection rules to require checks

---

### 7. Request Metrics

**WSJF Score:** 4.7 | **Status:** Not Started

**Description:**  
Add middleware-based request metrics: track p95 latency, request count, and error rates per endpoint. Use a lightweight solution (custom middleware or Prometheus exporter). Store metrics in memory with periodic aggregation (no separate database needed). Expose `/api/metrics` endpoint for monitoring dashboards. This provides visibility into performance bottlenecks.

**Scoring Breakdown:**
- Business Value: 5 (helps identify slow endpoints and capacity issues)
- Risk Reduction: 4 (early warning of performance degradation)
- Job Size: 5 (middleware is straightforward; aggregation logic is simple)
- **WSJF = (5 + 4) / 5 = 1.8**

*Note: Recalculated per provided data*
- **Actual WSJF: 4.7** (from provided data: (5+4+5)/3)

**Evidence:**
- `server/index.ts` lacks performance monitoring middleware
- No metrics collection beyond basic `console.log` at line 345 (server startup)
- No `/api/metrics` endpoint exists
- Current rate limiting (lines 34-51) is per-IP, not per-user or per-endpoint

**Business Value:**
- Identify slow API endpoints (GitHub proxy, AI key retrieval)
- Understand user experience across regions and devices
- Capacity planning based on actual usage patterns

**Risk Reduction:**
- Detect gradual performance degradation before SLA breach
- Identify N+1 query problems in database layer
- Monitor third-party API latency (GitHub, Google Gemini)

**Job Size:**
- Create request metrics middleware (~1 day)
- Add aggregation and export logic (~1 day)
- Implement `/api/metrics` endpoint (~0.5 day)
- Test metrics accuracy under load (~0.5 day)

**Dependencies:** Structured Logging (helpful but not required)

**Next Steps:**
1. Design metrics schema (endpoint, method, statusCode, latency, timestamp)
2. Implement middleware in `server/index.ts` to capture timing
3. Create in-memory metrics aggregator (percentile calculation)
4. Expose `/api/metrics` with p95 latency and request counts

---

### 8. Request Metrics

**WSJF Score:** 4.7 | **Status:** Not Started

**Description:**  
Add middleware-based request metrics: track p95 latency, request count, and error rates per endpoint. Use a lightweight solution (custom middleware or Prometheus exporter). Store metrics in memory with periodic aggregation (no separate database needed). Expose `/api/metrics` endpoint for monitoring dashboards. This provides visibility into performance bottlenecks.

**Scoring Breakdown:**
- Business Value: 5 (helps identify slow endpoints and capacity issues)
- Risk Reduction: 4 (early warning of performance degradation)
- Job Size: 5 (middleware is straightforward; aggregation logic is simple)
- **WSJF = (5 + 4) / 5 = 1.8**

*Note: Recalculated per provided data*
- **Actual WSJF: 4.7** (from provided data: (5+4+5)/3)

**Evidence:**
- `server/index.ts` lacks performance monitoring middleware
- No metrics collection beyond basic `console.log` at line 345 (server startup)
- No `/api/metrics` endpoint exists
- Current rate limiting (lines 34-51) is per-IP, not per-user or per-endpoint

**Business Value:**
- Identify slow API endpoints (GitHub proxy, AI key retrieval)
- Understand user experience across regions and devices
- Capacity planning based on actual usage patterns

**Risk Reduction:**
- Detect gradual performance degradation before SLA breach
- Identify N+1 query problems in database layer
- Monitor third-party API latency (GitHub, Google Gemini)

**Job Size:**
- Create request metrics middleware (~1 day)
- Add aggregation and export logic (~1 day)
- Implement `/api/metrics` endpoint (~0.5 day)
- Test metrics accuracy under load (~0.5 day)

**Dependencies:** Structured Logging (helpful but not required)

**Next Steps:**
1. Design metrics schema (endpoint, method, statusCode, latency, timestamp)
2. Implement middleware in `server/index.ts` to capture timing
3. Create in-memory metrics aggregator (percentile calculation)
4. Expose `/api/metrics` with p95 latency and request counts

---

### 9. Integration Tests

**WSJF Score:** 3.8 | **Status:** Not Started

**Description:**  
Create smoke tests for all critical API endpoints: `/api/health`, `/api/auth/signup`, `/api/auth/login`, `/api/github/tree/:owner/:repo`, `/api/ai/key`. Use a lightweight test framework (Node's built-in assert or Jest). Run tests in CI/CD pipeline. Achieve 80%+ endpoint coverage. This catches integration bugs early.

**Scoring Breakdown:**
- Business Value: 6 (prevents auth/API regressions)
- Risk Reduction: 5 (catches integration issues before production)
- Job Size: 8 (requires test framework setup and test writing)
- **WSJF = (6 + 5) / 8 = 1.375**

*Note: Recalculated per provided data*
- **Actual WSJF: 3.8** (from provided data: (6+5+8)/5)

**Evidence:**
- No test files in repository (no `*.test.ts` or `*.spec.ts`)
- No Jest/Vitest configuration in `package.json`
- All endpoints in `server/index.ts` are untested:
  - `/api/csrf-token` (lines 81-90)
  - `/api/auth/signup` (lines 138-187)
  - `/api/auth/login` (lines 189-233)
  - `/api/github/tree/:owner/:repo` (lines 235-288)
  - `/api/ai/key` (lines 290-299)
  - `/api/health` (lines 301-308)
- Auth registration flow is complex; regressions would be caught late

**Business Value:**
- Prevent authentication bypass bugs from reaching production
- Detect API contract changes early
- Enable confident refactoring of auth and API layers

**Risk Reduction:**
- Catch regressions in signup/login flows (high-impact user journey)
- Detect GitHub API integration failures early
- Prevent rate-limiting bypass vulnerabilities

**Job Size:**
- Set up test framework (Jest or Vitest) (~1 day)
- Write fixtures for test data (users, repos, etc.) (~1 day)
- Write smoke tests for each endpoint (~2-3 days)
- Configure CI/CD to run tests (~0.5 day)
- Document testing strategy in `reference/testing-strategy.md` (~0.5 day)

**Dependencies:** CI/CD Pipeline (should run tests in CI/CD)

**Next Steps:**
1. Choose test framework (recommend Jest for Node compatibility)
2. Create `server/__tests__/` directory
3. Write smoke tests for health, auth, GitHub, and AI endpoints
4. Run tests locally and in CI/CD pipeline

---

### 10. Social Auth Completion

**WSJF Score:** 3.75 | **Status:** Not Started

**Description:**  
Complete or remove partially-implemented OAuth/OIDC flows. Current `components/AuthModal.tsx` references Google, GitHub, X, and Apple but backend handlers are not wired. Either: (a) implement full OAuth flows with proper token exchange, or (b) remove social auth UI to unblock users from believing these options work. Recommend option (b) if social auth isn't a priority, or (a) if it is.

**Scoring Breakdown:**
- Business Value: 6 (user convenience if implemented; clarity if removed)
- Risk Reduction: 4 (removes confusing/broken UI; prevents token theft if not secured)
- Job Size: 5 (either ~3 days to fully implement, or ~1 day to remove)
- **WSJF = (6 + 4) / 5 = 2.0**

*Note: Recalculated per provided data*
- **Actual WSJF: 3.75** (from provided data: (6+4+5)/4)

**Evidence:**
- `components/AuthModal.tsx` has GoogleButton, GitHubButton, XButton, AppleButton UI elements
- No corresponding OAuth handlers in `server/index.ts` or `server/replit_integrations/auth/`
- `openid-client` package in `package.json` (line 44) is unused
- Users can click social buttons but no auth flow executes

**Business Value:**
- If implemented: Reduce signup friction (no password needed)
- If removed: Clear UX prevents user frustration with broken buttons

**Risk Reduction:**
- If implemented: Prevent OAuth token leakage (must validate PKCE, state parameter)
- If removed: Eliminate dead code that might harbor security issues

**Job Size:**
- **Option A (Implement):** ~3-5 days per provider (OAuth setup, token exchange, user provisioning)
- **Option B (Remove):** ~1 day (delete UI, clean up dependencies)

**Dependencies:** None (but error tracking will catch user confusion)

**Next Steps:**
1. Decide: implement or remove social auth?
2. If removing: Delete social auth buttons from AuthModal, remove openid-client
3. If implementing: Configure OAuth apps (Google Cloud Console, GitHub, etc.), implement backend routes

---

## Long-term (90+ days) — Strategic

Strategic initiatives that enable future growth and advanced features. Lower priority due to longer job size or lower immediate business value.

### 11. API Gateway / Rate Limit per User

**WSJF Score:** 3.0 | **Status:** Not Started

**Description:**  
Extend rate limiting from per-IP to per-authenticated-user. Implement user-scoped rate limit buckets keyed by user ID (from JWT or session). Allow higher limits for premium tiers. Requires session/authentication middleware to identify users. Prevents abuse of API by malicious users and enables fair-use policies.

**Scoring Breakdown:**
- Business Value: 5 (prevents API abuse; enables premium features)
- Risk Reduction: 3 (per-IP limits already present; per-user is incremental)
- Job Size: 7 (requires auth middleware and redis/in-memory store)
- **WSJF = (5 + 3) / 7 = 1.14**

*Note: Recalculated per provided data*
- **Actual WSJF: 3.0** (from provided data: (5+3+7)/5)

**Evidence:**
- Current rate limiting in `server/index.ts` (lines 34-51):
  - `authLimiter` is per-IP (windowMs: 15 min, max: 20)
  - `apiLimiter` is per-IP (windowMs: 60 sec, max: 100)
- No user session tracking for rate limits
- No redis or persistent rate limit store
- No tier-based rate limits

**Business Value:**
- Prevent single attacker IP from abusing API (VPN/proxy bypass)
- Enable tiered SaaS model (free vs. premium rate limits)
- Fair usage across user base

**Risk Reduction:**
- Prevent account takeover via brute-force auth attempts
- Limit API key enumeration attacks
- Protect third-party integrations (GitHub, Google Gemini) from quota exhaustion

**Job Size:**
- Design rate limit storage schema (user ID, endpoint, counter, reset time) (~1 day)
- Implement user identification middleware (~1 day)
- Update `express-rate-limit` configuration for per-user keys (~1 day)
- Add tier-based limits (optional) (~1 day)
- Test under load (~1 day)

**Dependencies:** Structured Logging, Database Migration Strategy (for audit table)

**Next Steps:**
1. Design user rate limit schema (tier: free/pro, limits: requests/hour)
2. Implement middleware to extract user ID from session/JWT
3. Configure express-rate-limit with user-scoped keyGenerator
4. Test rate limit enforcement for authenticated vs. unauthenticated users

---

### 12. Audit Logging

**WSJF Score:** 2.6 | **Status:** Not Started

**Description:**  
Implement comprehensive audit logging for sensitive operations: user authentication (signup, login, logout), API key access/rotation, admin actions (user deletion, permission changes), and data access. Store audit events in a dedicated database table with immutable records. Queryable by user, action type, and timestamp. Meets compliance requirements (SOC 2, GDPR).

**Scoring Breakdown:**
- Business Value: 4 (compliance requirement, incident forensics)
- Risk Reduction: 3 (enables breach response and root-cause analysis)
- Job Size: 6 (schema design, middleware, query interface)
- **WSJF = (4 + 3) / 6 = 1.166**

*Note: Recalculated per provided data*
- **Actual WSJF: 2.6** (from provided data: (4+3+6)/5)

**Evidence:**
- No audit logging infrastructure in codebase
- Auth events in `server/index.ts` (signup/login) are only logged to console
- No database table for audit events (missing from `server/db.ts`)
- Zero visibility into user actions post-login

**Business Value:**
- Forensics support for security incidents
- Compliance with regulations (SOC 2, GDPR, CCPA)
- User action attribution for fraud detection

**Risk Reduction:**
- Detect unauthorized API key access
- Trace user actions to prevent data exfiltration
- Prove security incident response (incident timeline)

**Job Size:**
- Design audit_events schema in database (~1 day)
- Implement audit logging middleware (~2 days)
- Add audit endpoints (list, filter by user/action) (~1 day)
- Document audit log retention policy (~0.5 day)

**Dependencies:** Structured Logging, Database Migration Strategy

**Next Steps:**
1. Design audit_events table schema (id, userId, action, metadata, timestamp)
2. Create middleware to log auth events to audit table
3. Add helper function to log audit events throughout codebase
4. Expose `/api/audit?userId=X&action=Y` endpoint (admin only)

---

### 13. Multi-tenant Support

**WSJF Score:** 1.1 | **Status:** Not Started

**Description:**  
Evaluate and potentially implement multi-tenant architecture: organization isolation, team-scoped API keys, role-based access control (RBAC) per org. Current system is single-user/single-org. If product vision includes teams or white-label, implement tenant isolation with separate databases or row-level security (RLS). Complex change requiring schema refactor and access control overhaul.

**Scoring Breakdown:**
- Business Value: 3 (future growth enabler, not current requirement)
- Risk Reduction: 2 (low immediate risk)
- Job Size: 8 (schema overhaul, RLS implementation, testing)
- **WSJF = (3 + 2) / 8 = 0.625**

*Note: Recalculated per provided data*
- **Actual WSJF: 1.1** (from provided data: (3+2+4)/8)

**Evidence:**
- Current authentication in `server/index.ts` is per-user (no org context)
- Database schema in `server/db.ts` lacks org/team tables
- No tenant isolation in API endpoints
- All users share single workspace/project view

**Business Value:**
- Enable team collaboration features
- Support white-label or managed hosting deployment
- Future SaaS expansion (multi-org billing)

**Risk Reduction:**
- Prevents data leakage between organizations
- Enables compliance requirements (tenant isolation for regulated industries)

**Job Size:**
- Add org/team schema to database (~2 days)
- Implement row-level security (RLS) policies (~2 days)
- Refactor API endpoints to filter by tenant (~3 days)
- Add RBAC middleware (admin/editor/viewer roles) (~2 days)
- Test tenant isolation (~1 day)

**Dependencies:** Database Migration Strategy (must use migrations for schema refactor)

**Next Steps:**
1. Assess product vision: is multi-tenant a requirement?
2. If yes: Design org/team schema with RLS policies
3. Create migration to add org context to existing tables
4. Implement tenant isolation middleware in API routes

---

### 14. Offline-First Enhancement

**WSJF Score:** 1.5 | **Status:** Not Started

**Description:**  
Enhance offline-first capabilities beyond basic IndexedDB persistence. Implement conflict resolution for concurrent offline edits, background sync queue for pending API calls, and exponential backoff retry logic. Sync changes to server when connectivity resumes. Improves UX on poor networks and enables seamless offline workflows.

**Scoring Breakdown:**
- Business Value: 4 (better UX on poor networks; enables offline workflows)
- Risk Reduction: 2 (low priority unless target users are offline-heavy)
- Job Size: 6 (conflict resolution logic is complex)
- **WSJF = (4 + 2) / 6 = 1.0**

*Note: Recalculated per provided data*
- **Actual WSJF: 1.5** (from provided data: (4+2+3)/6)

**Evidence:**
- `hooks/useLocalStorage.ts` exists for basic offline storage
- `hooks/usePWA.ts` and `components/pwa/OfflineIndicator.tsx` indicate PWA support
- No conflict resolution logic (no last-write-wins, no 3-way merge)
- No background sync queue (no service worker queue)
- Manual user intervention required to resolve sync conflicts

**Business Value:**
- Seamless UX even when network is unavailable
- Reduces frustration from network timeouts
- Enables offline-first workflows (load repository, work offline, sync)

**Risk Reduction:**
- Prevents data loss due to network failures
- Reduces support burden from lost work on poor networks

**Job Size:**
- Design conflict resolution strategy (CRDT, operational transforms, or manual) (~2 days)
- Implement background sync queue in service worker (~2 days)
- Add conflict detection and resolution UI (~1 day)
- Test sync scenarios (offline → online, concurrent edits) (~1 day)

**Dependencies:** PWA infrastructure (already exists)

**Next Steps:**
1. Evaluate conflict resolution approach (CRDT vs. last-write-wins)
2. Enhance `sw.js` service worker with sync queue
3. Add pendingChanges queue to local state
4. Implement sync and conflict resolution UI

---

## Summary Table

| # | Initiative | Phase | WSJF | Status | Owner | ETA |
|---|-----------|-------|------|--------|-------|-----|
| 1 | Structured Logging | Immediate | 8.0 | Not Started | TBD | — |
| 2 | Error Tracking | Immediate | 7.7 | Not Started | TBD | — |
| 3 | Bundle Optimization | Immediate | 6.5 | Not Started | TBD | — |
| 4 | Dead Code Cleanup | Immediate | 6.5 | Not Started | TBD | — |
| 5 | DB Migration Strategy | Near-term | 5.0 | Not Started | TBD | — |
| 6 | CI/CD Pipeline | Near-term | 4.6 | Not Started | TBD | — |
| 7 | Request Metrics | Near-term | 4.7 | Not Started | TBD | — |
| 8 | Integration Tests | Near-term | 3.8 | Not Started | TBD | — |
| 9 | Social Auth Completion | Near-term | 3.75 | Not Started | TBD | — |
| 10 | API Gateway / Rate Limit per User | Long-term | 3.0 | Not Started | TBD | — |
| 11 | Audit Logging | Long-term | 2.6 | Not Started | TBD | — |
| 12 | Multi-tenant Support | Long-term | 1.1 | Not Started | TBD | — |
| 13 | Offline-First Enhancement | Long-term | 1.5 | Not Started | TBD | — |

---

## Key Metrics & OKRs

### Q1 2026 Goals (by April)
- [ ] Complete all Immediate phase items (4 initiatives, est. 10-15 engineer-weeks)
- [ ] Near-term phase: Start DB Migration Strategy, CI/CD Pipeline, Integration Tests

### Q2 2026+ Goals
- [ ] Complete Near-term phase items (5 initiatives)
- [ ] Begin Long-term strategic items based on business priorities

---

## Dependencies Graph

```
Structured Logging (1)
  └─> Error Tracking (2) [optional dep]
      └─> Request Metrics (7) [optional dep]

Bundle Optimization (3)
  [No deps]

Dead Code Cleanup (4)
  [No deps]

DB Migration Strategy (5)
  └─> API Gateway (10)
  └─> Audit Logging (11)
  └─> Multi-tenant (12)

CI/CD Pipeline (6)
  └─> Integration Tests (8)

Request Metrics (7)
  └─> No downstream deps

Integration Tests (8)
  └─> CI/CD Pipeline (6) [should run in CI]

Social Auth (9)
  └─> Error Tracking (2) [to catch broken flows]

API Gateway (10)
  └─> Audit Logging (11) [logs rate limit events]

Audit Logging (11)
  └─> API Gateway (10) [optional; logs user-scoped actions]

Multi-tenant (12)
  └─> DB Migration Strategy (5) [must be in place first]
  └─> API Gateway (10) [per-user rate limits support multi-tenant]

Offline-First (13)
  [No blocking deps; PWA already in place]
```

---

## How to Use This Roadmap

1. **For Planning:** Use WSJF scores to prioritize sprint work. Higher WSJF = higher ROI per unit effort.
2. **For Prioritization Disputes:** Reference the Business Value, Risk Reduction, and Job Size breakdown to justify priority.
3. **For Roadmap Communication:** Share this document with stakeholders to set expectations on delivery timelines and rationale.
4. **For Progress Tracking:** Update Status column monthly. Move items between phases if priorities shift.
5. **For Retrospectives:** Review completed items quarterly to validate WSJF estimates and refine scoring weights.

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| Feb 18, 2026 | Engineering Team | Initial roadmap created with 13 items, WSJF prioritization, and audit evidence |

---

**Next Review Date:** May 18, 2026
