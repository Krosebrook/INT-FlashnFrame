# Refactoring Roadmap - Quick Reference

## Current Architecture Issues

### 🔴 Critical (Must Fix)
| Issue | Location | Impact | Effort |
|-------|----------|--------|--------|
| API keys in localStorage | `contexts/UserSettingsContext.tsx` | Security vulnerability | High |
| No test coverage | Entire codebase | No regression protection | Medium |
| 1,683-line service file | `services/geminiService.ts` | Unmaintainable | High |

### 🟠 High Priority
| Issue | Location | Impact | Effort |
|-------|----------|--------|--------|
| Code duplication | Multiple files | Maintenance burden | Low |
| No input validation | All components | Security & UX | Medium |
| Tight coupling | Services ↔ Components | Hard to change | Medium |

### 🟡 Medium Priority
| Issue | Location | Impact | Effort |
|-------|----------|--------|--------|
| Inconsistent caching | AI services | Performance & cost | Low |
| Large bundle size | Main bundle includes all services | Slow initial load | Low |
| No error boundaries | React tree | Poor error handling | Low |

---

## Proposed New Architecture

### Directory Structure (After Refactoring)

```
flash-n-frame/
├── services/
│   ├── ai/                          # ← NEW: Split from geminiService.ts
│   │   ├── BaseAiService.ts         #    Common AI utilities
│   │   ├── InfographicService.ts    #    ~400 lines
│   │   ├── CodeAnalysisService.ts   #    ~500 lines
│   │   ├── ImageService.ts          #    ~300 lines
│   │   └── UIGenerationService.ts   #    ~400 lines
│   ├── security/                    # ← NEW: Security layer
│   │   ├── ApiKeyManager.ts         #    Encrypted key storage
│   │   ├── EncryptionService.ts     #    Web Crypto API wrapper
│   │   └── InputValidator.ts        #    Zod-based validation
│   ├── http/                        # ← NEW: HTTP abstraction
│   │   ├── HttpClient.ts            #    Base HTTP client
│   │   ├── GeminiClient.ts          #    Gemini API wrapper
│   │   ├── GitHubClient.ts          #    GitHub API wrapper
│   │   └── interceptors/
│   │       ├── RateLimitInterceptor.ts
│   │       └── CacheInterceptor.ts
│   ├── cache/                       # ← EXTEND: Better caching
│   │   ├── CacheManager.ts
│   │   └── strategies/
│   ├── errors/                      # ← NEW: Error handling
│   │   ├── ErrorHandler.ts
│   │   └── ErrorBoundary.tsx
│   └── monitoring/                  # ← NEW: Performance tracking
│       └── PerformanceMonitor.ts
├── hooks/
│   ├── business/                    # ← NEW: Business logic hooks
│   │   ├── useRepositoryAnalysis.ts
│   │   ├── useInfographicGeneration.ts
│   │   └── useImageProcessing.ts
│   └── (existing hooks)
├── __tests__/                       # ← NEW: Test infrastructure
│   ├── services/
│   ├── hooks/
│   ├── components/
│   └── integration/
└── (existing structure)
```

---

## Implementation Phases

### Phase 1: Critical Security & Structure (Week 1-2)
**Goal:** Fix security vulnerabilities and break up monolithic service

```
✓ Setup test infrastructure (vitest + testing-library)
✓ Create ApiKeyManager with Web Crypto encryption
✓ Migrate localStorage keys to encrypted storage
✓ Create BaseAiService with common utilities
✓ Extract InfographicService from geminiService.ts
✓ Extract CodeAnalysisService from geminiService.ts
✓ Extract ImageService from geminiService.ts
✓ Extract UIGenerationService from geminiService.ts
✓ Update all imports in components
✓ Add unit tests for all new services (target: 40% coverage)
```

**Deliverables:**
- 🔒 Encrypted API key storage
- 📦 4 focused services instead of 1 monolith
- 🧪 40% test coverage
- 📝 Migration guide for users

**Risk Mitigation:**
- Keep old geminiService.ts for 1 release with deprecation warnings
- Feature flag for new encryption system
- User notification about re-entering API keys

---

### Phase 2: Modularity & Testability (Week 3-4)
**Goal:** Add abstraction layers and improve code organization

```
✓ Create HttpClient base class
✓ Create GeminiClient extending HttpClient
✓ Create GitHubClient extending HttpClient
✓ Add RateLimitInterceptor
✓ Add CacheInterceptor
✓ Create InputValidator using Zod
✓ Extract useRepositoryAnalysis hook
✓ Extract useInfographicGeneration hook
✓ Extract useImageProcessing hook
✓ Refactor RepoAnalyzer to use new hook
✓ Refactor ArticleToInfographic to use new hook
✓ Refactor ImageEditor to use new hook
✓ Consolidate constants (remove duplicates)
✓ Create ErrorHandler class
✓ Add ErrorBoundary components
✓ Add integration tests (target: 60% coverage)
```

**Deliverables:**
- 🔌 Pluggable HTTP clients
- 🎣 Reusable business logic hooks
- ✅ Input validation on all forms
- 🚨 Error boundaries for better UX
- 🧪 60% test coverage

---

### Phase 3: Performance & Polish (Week 5-6)
**Goal:** Optimize performance and complete test coverage

```
✓ Implement CacheManager
✓ Add caching strategies for AI services
✓ Apply caching to all expensive operations
✓ Update vite.config for better code splitting
✓ Lazy load heavy AI services
✓ Add PerformanceMonitor
✓ Implement request deduplication for AI calls
✓ Add performance traces
✓ Complete component tests
✓ Complete hook tests
✓ Complete integration tests (target: 80% coverage)
✓ Update documentation
✓ Create migration guide
```

**Deliverables:**
- ⚡ 20% performance improvement
- 💾 60% cache hit rate
- 📦 Optimized bundle sizes
- 🧪 80% test coverage
- 📚 Complete documentation

---

## Migration Guide

### For Developers

**Old Code (Before):**
```typescript
// Component directly imports service
import { generateInfographic } from '../services/geminiService';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const data = await generateInfographic(repo, files, style);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={handleGenerate}>Generate</button>;
}
```

**New Code (After Phase 2):**
```typescript
// Component uses business logic hook
import { useInfographicGeneration } from '../hooks/business/useInfographicGeneration';

function MyComponent() {
  const { generate, loading, result, error } = useInfographicGeneration();
  
  const handleGenerate = async () => {
    await generate(repo, files, style);
  };
  
  return (
    <>
      {error && <ErrorBanner message={error} />}
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </>
  );
}
```

### For Users

**API Key Migration:**
1. After upgrade, you'll see a notification about API key security
2. Re-enter your API keys in Settings (they're now encrypted!)
3. Old keys are automatically cleared for security
4. No other action needed

**What Changes:**
- ✅ Your API keys are now encrypted (more secure)
- ✅ Better error messages
- ✅ Faster performance with caching
- ✅ More reliable (better testing)
- ❌ No breaking changes to features

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     - Critical user flows only
     /------\    
    /        \   Integration Tests (15%)
   /          \  - Service interactions
  /------------\ - API mocking
 /              \
/________________\ Unit Tests (80%)
                   - All services, hooks, utils
                   - Component logic
```

### Coverage Targets by Phase

| Phase | Coverage | Focus |
|-------|----------|-------|
| Phase 1 | 40% | Core services (AI, security) |
| Phase 2 | 60% | Business logic (hooks, HTTP) |
| Phase 3 | 80% | Components + integration |

### Test Categories

**1. Unit Tests (80% of tests)**
- ✅ All service methods
- ✅ All hook behaviors  
- ✅ All utility functions
- ✅ Component rendering
- ✅ Input validation

**2. Integration Tests (15% of tests)**
- ✅ End-to-end workflows
- ✅ Service interactions
- ✅ Context + component integration
- ✅ API error scenarios

**3. E2E Tests (5% of tests)**
- ✅ Critical user paths only
- ✅ Repository analysis flow
- ✅ Infographic generation flow

---

## Risk Assessment

### High Risk Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| API key encryption | Users lose keys | Migration script + notification |
| Service splitting | Import errors | Backwards compatibility facade |
| New HTTP layer | API calls break | Comprehensive tests + feature flag |

### Medium Risk Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Business logic hooks | Components break | Parallel implementation |
| Caching layer | Stale data | Cache invalidation strategy |
| Bundle optimization | Load errors | Gradual rollout + monitoring |

### Low Risk Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Consolidate constants | Import updates | Simple find/replace |
| Error boundaries | None (additive) | None needed |
| Test infrastructure | None (additive) | None needed |

---

## Success Criteria

### Must Have (Phase 1)
- ✅ Zero API keys in localStorage
- ✅ All services under 500 lines
- ✅ 40% test coverage
- ✅ No security vulnerabilities

### Should Have (Phase 2)
- ✅ All user input validated
- ✅ Error boundaries in place
- ✅ Business logic extracted to hooks
- ✅ 60% test coverage

### Nice to Have (Phase 3)
- ✅ 60% cache hit rate
- ✅ 20% performance improvement
- ✅ 80% test coverage
- ✅ Bundle size optimized

---

## Rollback Procedures

### If Phase 1 Fails
```bash
# Revert to old geminiService
git checkout main -- services/geminiService.ts

# Disable encryption
localStorage.setItem('USE_ENCRYPTION', 'false');

# Notify users
// Show banner: "Reverting to legacy system, please update API keys"
```

### If Phase 2 Fails
```bash
# Keep old service implementations
# Components still work via facade pattern

# Disable new hooks
feature.flags.NEW_HOOKS = false;

# Roll back HTTP layer
git checkout main -- services/http/
```

### If Phase 3 Fails
```bash
# Disable caching
feature.flags.ENABLE_CACHE = false;

# Revert bundle config
git checkout main -- vite.config.ts

# Performance changes are additive, easy to disable
```

---

## Dependency Changes

### New Dev Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/ui": "^1.2.0",
    "@vitest/coverage-v8": "^1.2.0",
    "jsdom": "^23.0.0"
  }
}
```

### Existing Dependencies (Already in package.json)
- ✅ `zod` - Use for input validation
- ✅ `@tanstack/react-query` - Already set up for data fetching
- ✅ React, TypeScript, Vite - No changes needed

### No New Production Dependencies
All changes use existing dependencies or standard Web APIs (Web Crypto).

---

## Performance Benchmarks

### Baseline (Current)
- **First Load:** ~2.5s
- **API Call (uncached):** ~3-5s
- **Duplicate API Call:** Full cost (no deduplication)
- **Bundle Size:** ~800KB (estimated)

### Target (After Phase 3)
- **First Load:** ~2.1s (-15%)
- **API Call (cached):** ~0.5s (60% hit rate)
- **Duplicate API Call:** Deduplicated (0 cost)
- **Bundle Size:** ~640KB (-20%)

### Tracking
```typescript
// New performance monitoring
PerformanceMonitor.startTrace('infographic-generation');
// ... operation
PerformanceMonitor.endTrace(trace);

// Logged to console in dev, sent to analytics in prod
```

---

## Questions & Decisions Needed

### Security
- [ ] **Decision:** Use Web Crypto API or server-side encryption?
  - **Recommendation:** Web Crypto API (client-side, no server changes)
  - **Alternative:** Server-side with httpOnly cookies (requires backend)

### Testing
- [ ] **Decision:** Target 80% coverage or higher?
  - **Recommendation:** 80% is industry standard
  - **Alternative:** 70% if time-constrained, 90% for critical apps

### Migration
- [ ] **Decision:** Breaking changes allowed or backwards compatibility required?
  - **Recommendation:** Backwards compatibility for 1 release
  - **Alternative:** Major version bump with breaking changes

### Bundle Size
- [ ] **Decision:** Acceptable increase in abstraction layers?
  - **Recommendation:** +5-10% temporary, then -20% with optimization
  - **Alternative:** Minimize abstractions to keep size down

---

## Next Steps

1. **Review this plan** - Approve approach and priorities
2. **Set up tracking** - Create GitHub issues for each task
3. **Begin Phase 1** - Start with test infrastructure
4. **Weekly check-ins** - Review progress and adjust
5. **Incremental rollout** - Deploy phases gradually

---

**Status:** ⏸️ Awaiting Approval  
**Last Updated:** 2026-02-06  
**Estimated Completion:** 6 weeks from approval
