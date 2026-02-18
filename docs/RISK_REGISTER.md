# Flash-n-Frame Risk Register

**Last Updated:** February 18, 2026  
**Project:** Flash-n-Frame  
**Type:** Production Readiness Security & Reliability Audit

---

## Summary

| Status | Count |
|--------|-------|
| **Fixed** | 10 |
| **Open** | 4 |
| **Accepted** | 2 |
| **Total Items** | 16 |

- **Critical Issues:** 1 (Fixed)
- **High Priority Issues:** 2 (Fixed)
- **Medium Priority Issues:** 8 (Fixed: 6, Open: 2)
- **Low Priority Issues:** 5 (Fixed: 3, Open: 2)

---

## Risk Register

| ID | Severity | Category | Finding | Evidence | Fix Effort | Status | Verification |
|----|----------|----------|---------|----------|------------|--------|--------------|
| R1 | Critical | Security | `/api/ai/key` returned Gemini API key to unauthenticated users | `server/index.ts:277-291` — both auth branches returned the key | S | FIXED (Feb 2026) | `curl localhost:3001/api/ai/key` returns 401 |
| R2 | High | Reliability | No graceful shutdown handlers — SIGTERM/SIGINT not caught | `server/index.ts` bottom — no process.on handlers | S | FIXED (Feb 2026) | `grep SIGTERM server/index.ts` |
| R3 | High | Security | Signup accepts any string as email — no format validation | `server/index.ts:134` — only checks `!email` | S | FIXED (Feb 2026) | POST /api/auth/signup with invalid email returns 400 |
| R4 | High | Reliability | No unhandledRejection/uncaughtException handlers | `server/index.ts` — missing process error handlers | S | FIXED (Feb 2026) | `grep unhandledRejection server/index.ts` |
| R5 | Medium | Quality | 22 TypeScript errors (ErrorBoundary, missing jszip, missing Icons, missing @types/react) | `npx tsc --noEmit` output | M | FIXED (Feb 2026) | `npm run typecheck` exits 0 |
| R6 | Medium | DevOps | No lint/typecheck scripts in package.json | `package.json` scripts section | S | FIXED (Feb 2026) | `grep typecheck package.json` |
| R7 | Medium | Quality | SESSION_SECRET non-null assertion crashes without helpful error | `server/replit_integrations/auth/replitAuth.ts:31` | S | FIXED (Feb 2026) | Startup guard in startServer() |
| R8 | Medium | Security | CSRF token stored in non-httpOnly cookie | `server/index.ts:76` — `httpOnly: false` | S | ACCEPTED (by design — double-submit pattern requires JS access) | N/A |
| R9 | Medium | Observability | No structured logging — only console.log/console.error | Throughout server/index.ts | M | FIXED (Feb 2026) | `grep "pino" server/index.ts server/logger.ts` |
| R10 | Medium | Observability | No error tracking (Sentry/equivalent) | No Sentry SDK in package.json | M | OPEN | Future: add Sentry integration |
| R11 | Medium | Observability | No request metrics (latency, count) | No metrics middleware | M | OPEN | Future: add basic metrics |
| R12 | Low | DevOps | No DB migration history — uses drizzle-kit push only | No migrations/ directory | M | OPEN | Future: switch to drizzle-kit generate + migrate |
| R13 | Low | DevOps | No CI/CD pipeline or automated tests | No .github/workflows or test files | L | OPEN | Future: add GitHub Actions CI |
| R14 | Low | Hygiene | Stale files in attached_assets/ causing spurious TS errors | attached_assets/*.tsx files | S | FIXED (Feb 2026) | `ls attached_assets/*.tsx` returns empty |
| R15 | Low | Security | Magic link endpoint returns 200 "sent" even without SendGrid configured (only returns 501 if SENDGRID_API_KEY missing) | `server/index.ts:97-101` | S | ACCEPTED (returns 501, no actual send) | Verified: returns 501 without env var |
| R16 | Low | Performance | Main bundle 619KB (warning threshold 500KB) | `npm run build` output | M | FIXED (Feb 2026) | `npm run build` — main chunk now 108KB, no warnings |

---

## Severity Definitions

### Critical
- **Impact:** Complete service compromise or catastrophic failure
- **Example:** Authentication bypass, data exposure, complete availability loss
- **Action Required:** Fix immediately before any deployment

### High
- **Impact:** Significant service degradation or security vulnerability
- **Example:** Unhandled errors causing crashes, missing input validation
- **Action Required:** Fix before production deployment

### Medium
- **Impact:** Notable quality/reliability issue affecting user experience or maintainability
- **Example:** Missing error handlers, lack of observability, type safety issues
- **Action Required:** Plan fix in current or next sprint

### Low
- **Impact:** Minor issues, best practices, or future improvements
- **Example:** Performance warnings, missing CI/CD, refactoring suggestions
- **Action Required:** Include in roadmap for future releases

---

## How to Verify Fixes

### Verified Fixes (Feb 2026)

#### R1: API Key Exposure
```bash
# Verify unauthenticated access is blocked
curl -i localhost:3001/api/ai/key
# Expected: 401 Unauthorized
```

#### R2: Graceful Shutdown
```bash
# Verify SIGTERM handler is in place
grep -n "SIGTERM" server/index.ts
# Expected output: line 363 with process.on("SIGTERM", ...)
```

#### R3: Email Validation
```bash
# Test invalid email rejection
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"TestPass123!","firstName":"Test","lastName":"User"}'
# Expected: 400 Bad Request with "valid email address" message
```

#### R4: Error Handlers
```bash
# Verify unhandledRejection handler exists
grep -n "unhandledRejection" server/index.ts
# Expected output: line 367 with process.on("unhandledRejection", ...)
```

#### R5: TypeScript Compilation
```bash
# Run typecheck and verify no errors
npm run typecheck
# Expected: Exit code 0 with no error output
```

#### R6: Lint/Typecheck Scripts
```bash
# Verify scripts exist in package.json
grep -A 2 '"typecheck"' package.json
# Expected: "typecheck": "tsc --noEmit"
```

#### R7: SESSION_SECRET Guard
```bash
# Start server without SESSION_SECRET and verify helpful error
# (Set in server/index.ts startServer() function)
grep -A 2 "SESSION_SECRET" server/index.ts | head -5
# Expected: Clear error message about required env var
```

#### R14: Stale Asset Files
```bash
# Verify no .tsx files in attached_assets
ls attached_assets/*.tsx 2>/dev/null || echo "No .tsx files found (expected)"
# Expected: "No .tsx files found" message or no output
```

### Accepted Items (By Design)

#### R8: Non-httpOnly CSRF Cookie
- **Reason:** Double-submit CSRF pattern requires JavaScript access to read the token
- **Mitigation:** Token is still cryptographically signed and validated; attack surface limited to same-site context
- **Verification:** N/A (by design decision)

#### R15: Magic Link Returns 501 Without SendGrid
- **Reason:** Graceful degradation: returns 501 Not Implemented when integration not configured
- **Verification:** 
  ```bash
  # Without SENDGRID_API_KEY set
  curl -X POST http://localhost:3001/api/auth/magic-link \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  # Expected: 501 "Magic link authentication requires SendGrid"
  ```

---

## Open Items Roadmap

The following 6 items are tracked in the project roadmap and planned for future sprints:

### High Priority (Medium Effort)
- **R9: Structured Logging** — Replace console.log with structured logging library (pino/winston)
  - Enables centralized log aggregation and better debugging
  - Estimated: 1-2 sprint tasks
  
- **R10: Error Tracking** — Integrate Sentry or equivalent error tracking service
  - Provides real-time visibility into production errors
  - Estimated: 1 sprint task
  
- **R11: Request Metrics** — Add metrics middleware for latency and request counting
  - Essential for monitoring application performance
  - Estimated: 1 sprint task

### Medium Priority (Medium Effort)
- **R12: Database Migrations** — Migrate from `drizzle-kit push` to `generate + migrate` workflow
  - Enables version control of migrations and safer schema evolution
  - Estimated: 1-2 sprint tasks
  
- **R16: Bundle Size Optimization** — Reduce main bundle from 619KB to <500KB
  - Improves initial load time; requires code splitting analysis
  - Estimated: 2-3 sprint tasks

### Lower Priority (Low Effort)
- **R13: CI/CD Pipeline** — Add GitHub Actions for automated testing and deployment
  - Ensures code quality and safe releases
  - Estimated: 1-2 sprint tasks (depends on test infrastructure)

See [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md) for broader project roadmap context.

---

## Fix Effort Legend

| Symbol | Meaning | Typical Time |
|--------|---------|--------------|
| **S** | Small | < 1 hour |
| **M** | Medium | 1-4 hours |
| **L** | Large | > 4 hours |

---

## Audit Methodology

This risk register is based on:
1. **Code Review** — Manual inspection of server/index.ts, auth handlers, and error handling
2. **Static Analysis** — TypeScript compiler checks (`tsc --noEmit`)
3. **Runtime Testing** — Curl tests, endpoint verification, shutdown behavior
4. **Configuration Audit** — package.json, env vars, security headers
5. **Dependency Audit** — Node modules and type definitions

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and components
- [SECURITY.md](../SECURITY.md) — Security policies and guidelines
- [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md) — Future improvements
- [CHANGELOG.md](./CHANGELOG.md) — Release history with fixes
- [API.md](./API.md) — API endpoint documentation
