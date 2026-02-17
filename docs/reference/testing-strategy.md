# Testing Strategy

This document outlines the testing approach and coverage goals for Flash-n-Frame.

## Current State

As of February 2026, Flash-n-Frame has **no automated test coverage**. This document defines the target testing strategy for implementation.

## Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     Critical user flows only
     /------\    
    /        \   Integration Tests (15%)
   /          \  Service interactions, API mocking
  /------------\
 /              \
/________________\ Unit Tests (80%)
                   All services, hooks, utilities
```

## Recommended Tools

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and assertion library |
| @testing-library/react | Component testing with user-centric queries |
| @testing-library/user-event | Simulating user interactions |
| @vitest/coverage-v8 | Code coverage reporting |
| jsdom | Browser environment simulation |
| MSW (Mock Service Worker) | API mocking for integration tests |

## Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Services (`services/`) | 80%+ | High |
| Hooks (`hooks/`) | 70%+ | High |
| Utilities | 90%+ | Medium |
| Components (`components/`) | 60%+ | Medium |
| Server (`server/`) | 70%+ | High |

## What to Test

### Unit Tests (Priority: High)

**Services:**
- `geminiService.ts` - Model fallback logic, caching, retry behavior, error handling
- `githubService.ts` - URL parsing, token forwarding, response parsing
- `cache.ts` - TTL expiration, deduplication, cache invalidation
- `persistence.ts` - IndexedDB read/write operations

**Hooks:**
- `useAuth.ts` - Authentication state management, login/logout flows
- `useInstallPrompt.ts` - PWA install prompt handling
- `useTaskManagement.ts` - Task CRUD operations

**Server:**
- Auth endpoints - signup validation, login, session management
- GitHub proxy - request forwarding, token handling, error responses
- Rate limiting - request counting, window expiration
- Health check - response format

### Integration Tests (Priority: Medium)

- Repository analysis flow (URL input → GitHub API → Gemini → display)
- Authentication flow (signup → login → session → protected routes)
- API key management (set key → validate → use in requests)
- Cache behavior (first request → cached response → TTL expiry)

### E2E Tests (Priority: Low)

- Complete GitFlow workflow (enter URL, generate infographic, view result)
- Login/signup flow through the UI
- Theme switching across all views
- PWA install flow

## Test File Conventions

```
project/
├── __tests__/
│   ├── services/
│   │   ├── geminiService.test.ts
│   │   ├── githubService.test.ts
│   │   └── cache.test.ts
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useInstallPrompt.test.ts
│   ├── components/
│   │   ├── Home.test.tsx
│   │   └── RepoAnalyzer.test.tsx
│   ├── server/
│   │   ├── auth.test.ts
│   │   └── github-proxy.test.ts
│   └── integration/
│       └── repo-analysis.test.ts
```

## Running Tests (Future)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- services/geminiService.test.ts

# Watch mode
npm run test:watch
```

## Smoke Test Checklist (Manual)

Until automated tests are in place, verify these before each deployment:

- [ ] App loads without console errors
- [ ] Splash screen displays and transitions to home
- [ ] Theme toggle cycles through dark → light → solarized
- [ ] GitFlow can analyze a public repo (e.g., `expressjs/express`)
- [ ] Login/signup flow completes successfully
- [ ] PWA manifest loads without errors (DevTools > Application)
- [ ] Offline page displays when disconnected
- [ ] Settings modal opens and saves API keys
- [ ] Rate limit banner appears and counts down correctly

## Related

- [Best Practices](../BEST_PRACTICES.md) - Testing guidelines section
- [Refactoring Roadmap](../REFACTORING_ROADMAP.md) - Testing phases
