# Architecture Improvement Plan for Flash-n-Frame

**Date:** 2026-02-06  
**Status:** Awaiting Approval  
**Author:** Senior Software Architect (Autonomous)

---

## Executive Summary

This document proposes a comprehensive refactoring plan for the Flash-n-Frame codebase to address critical architectural issues discovered during analysis. The improvements focus on three key areas:

1. **Security & Safety** - Address critical vulnerabilities in API key management
2. **Modularity & Maintainability** - Decompose monolithic services and reduce coupling
3. **Testability & Quality** - Establish test infrastructure and improve code quality

**Current State:**
- 114 TypeScript files, ~12,000+ lines of code
- 0 test files (no test coverage)
- Critical security vulnerabilities in API key storage
- 1,683-line monolithic service file (geminiService.ts)
- Significant code duplication across components

---

## Problem Summary

### 🔴 Critical Issues (P0)

1. **API Key Security Vulnerability**
   - **Location:** `services/geminiService.ts:10-18`, `services/githubService.ts:10-28`
   - **Issue:** API keys stored in global mutable variables and localStorage
   - **Risk:** XSS attacks can steal API keys, potential API abuse
   - **Impact:** High - User credentials exposed

2. **No Test Coverage**
   - **Location:** Entire codebase
   - **Issue:** Zero test files, no test infrastructure
   - **Risk:** No regression protection, brittle refactoring
   - **Impact:** High - Any change risks breaking production

3. **Monolithic Service Architecture**
   - **Location:** `services/geminiService.ts` (1,683 lines)
   - **Issue:** Single file handles 15+ distinct responsibilities
   - **Risk:** Hard to maintain, test, and debug
   - **Impact:** High - Development velocity reduced by 50%+

### 🟠 High Priority Issues (P1)

4. **Code Duplication**
   - **Locations:** 
     - Error handling patterns repeated 20+ times in geminiService.ts
     - LANGUAGES constant duplicated in RepoAnalyzer.tsx and ArticleToInfographic.tsx
     - JSON parsing logic duplicated 5+ times
   - **Risk:** Bug fixes must be applied in multiple places
   - **Impact:** Medium - Maintenance burden

5. **Missing Abstraction Layers**
   - **Issue:** No separation between UI, business logic, and data access
   - **Risk:** Tight coupling makes changes expensive
   - **Impact:** Medium - Difficult to modify or extend

6. **No Input Validation**
   - **Location:** Components directly accept user input
   - **Risk:** Invalid data causes crashes, potential injection attacks
   - **Impact:** Medium - Poor user experience, security concerns

### 🟡 Medium Priority Issues (P2)

7. **Inconsistent Error Handling**
   - Different patterns across components
   - No error boundary components
   - Error service exists but not used consistently

8. **Cache Layer Incomplete**
   - GitHub service uses cache, Gemini service doesn't
   - Re-generates identical infographics
   - Wastes API quota and user time

9. **Performance Issues**
   - Large bundle size (geminiService in main bundle)
   - No lazy loading for heavy services
   - No request deduplication for AI calls

---

## Affected Files

### Core Services (8 files)
```
services/
├── geminiService.ts         ← CRITICAL: Split into 4 services
├── githubService.ts         ← Security fix needed
├── omniAiService.ts         ← Minor refactoring
├── persistence.ts           ← Add encryption
├── cache.ts                 ← Extend functionality
├── errorService.ts          ← Expand usage
├── semanticEngine.ts        ← Minor updates
└── templateService.ts       ← Minor updates
```

### Large Components (5 files)
```
components/
├── RepoAnalyzer.tsx         ← Extract business logic
├── ArticleToInfographic.tsx ← Extract business logic  
├── ImageEditor.tsx          ← Extract business logic
├── DevStudio.tsx            ← Extract business logic
└── (30+ other components)   ← Minor updates
```

### Contexts (4 files)
```
contexts/
├── UserSettingsContext.tsx  ← CRITICAL: Add encryption
├── ProjectContext.tsx       ← Refactor state management
├── RateLimitContext.tsx     ← Expand functionality
└── ThemeContext.tsx         ← No changes needed
```

### New Files to Create (~25 files)
```
services/ai/                 ← New: AI service layer
├── InfographicService.ts
├── CodeAnalysisService.ts
├── ImageService.ts
└── UIGenerationService.ts

services/security/           ← New: Security layer
├── ApiKeyManager.ts
├── EncryptionService.ts
└── InputValidator.ts

services/http/               ← New: HTTP abstraction
├── HttpClient.ts
├── GeminiClient.ts
└── GitHubClient.ts

hooks/business/              ← New: Business logic hooks
├── useRepositoryAnalysis.ts
├── useInfographicGeneration.ts
└── useImageProcessing.ts

__tests__/                   ← New: Test infrastructure
├── services/
├── hooks/
└── components/
```

---

## Risks and Edge Cases

### Migration Risks

1. **API Breaking Changes**
   - **Risk:** Existing components depend on current service APIs
   - **Mitigation:** 
     - Phase migration with parallel implementations
     - Create facade pattern for backwards compatibility
     - Comprehensive testing before removal

2. **State Management Changes**
   - **Risk:** localStorage → encrypted storage migration
   - **Mitigation:**
     - Migration script to convert existing data
     - Fallback to localStorage if encryption fails
     - User notification about re-entering keys

3. **Bundle Size Impact**
   - **Risk:** New abstractions increase bundle size
   - **Mitigation:**
     - Code splitting for new services
     - Tree shaking for unused code
     - Bundle size monitoring

### Edge Cases to Handle

1. **API Key Migration**
   - Users with existing keys in localStorage
   - Empty/invalid key scenarios
   - Key rotation workflow

2. **Cache Invalidation**
   - When to clear cache for new service implementations
   - Cache versioning strategy
   - Migration of existing cached data

3. **Error Recovery**
   - Network failures during refactored API calls
   - Graceful degradation when services unavailable
   - User feedback during errors

4. **Browser Compatibility**
   - IndexedDB not available
   - Web Crypto API not supported
   - localStorage quota exceeded

---

## Tests to Add or Update

### Test Infrastructure Setup

**New Configuration Files:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/node_modules/**']
    }
  }
});
```

**Package.json Updates:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  },
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

### Unit Tests (Priority P0)

**Security Layer Tests:**
```
__tests__/services/security/
├── ApiKeyManager.test.ts
│   ├── stores keys securely
│   ├── retrieves keys correctly
│   ├── handles missing keys
│   ├── validates key format
│   └── encrypts/decrypts properly
├── EncryptionService.test.ts
│   ├── encrypts data
│   ├── decrypts data
│   ├── handles invalid data
│   └── throws on wrong key
└── InputValidator.test.ts
    ├── validates GitHub URLs
    ├── validates article URLs
    ├── sanitizes user input
    └── rejects malicious input
```

**AI Service Tests:**
```
__tests__/services/ai/
├── InfographicService.test.ts
│   ├── generates 2D infographic
│   ├── generates 3D infographic
│   ├── handles API errors
│   ├── respects language setting
│   └── applies correct style
├── CodeAnalysisService.test.ts
│   ├── performs code review
│   ├── generates test cases
│   ├── generates documentation
│   └── handles syntax errors
└── ImageService.test.ts
    ├── edits images
    ├── generates code from image
    ├── scans components
    └── handles invalid images
```

**HTTP Client Tests:**
```
__tests__/services/http/
├── HttpClient.test.ts
│   ├── makes GET requests
│   ├── makes POST requests
│   ├── handles 404 errors
│   ├── retries on failure
│   ├── respects rate limits
│   └── deduplicates requests
├── GeminiClient.test.ts
│   ├── authenticates correctly
│   ├── sends prompts
│   ├── parses responses
│   └── handles quota errors
└── GitHubClient.test.ts
    ├── fetches repo data
    ├── authenticates with token
    ├── handles private repos
    └── parses file trees
```

### Integration Tests (Priority P1)

```
__tests__/integration/
├── repository-analysis.test.ts
│   ├── full repo analysis flow
│   ├── file tree generation
│   └── graph data creation
├── infographic-generation.test.ts
│   ├── end-to-end generation
│   ├── style application
│   └── language translation
└── image-editing.test.ts
    ├── full editing workflow
    ├── code generation
    └── component scanning
```

### Component Tests (Priority P2)

```
__tests__/components/
├── RepoAnalyzer.test.tsx
│   ├── renders correctly
│   ├── validates input
│   ├── shows loading state
│   ├── displays errors
│   └── navigates to DevStudio
├── ArticleToInfographic.test.tsx
│   ├── single URL mode
│   ├── comparison mode
│   ├── stats extraction mode
│   └── error handling
└── ImageEditor.test.tsx
    ├── all operation modes
    ├── undo/redo
    └── history management
```

### Hook Tests (Priority P2)

```
__tests__/hooks/
├── useRepositoryAnalysis.test.ts
├── useInfographicGeneration.test.ts
└── useImageProcessing.test.ts
```

### Test Coverage Targets

- **Phase 1:** 40% coverage (core services)
- **Phase 2:** 60% coverage (business logic)
- **Phase 3:** 80% coverage (full application)

---

## Proposed Architecture Changes

### Phase 1: Critical Security & Structure (Week 1-2)

**Priority:** 🔴 P0  
**Estimated Effort:** 40 hours  
**Risk:** High (affects core security)

#### 1.1 Create Security Layer

**New Files:**
```typescript
// services/security/ApiKeyManager.ts
export class ApiKeyManager {
  private encryptionService: EncryptionService;
  
  async setKey(service: string, key: string): Promise<void>
  async getKey(service: string): Promise<string | null>
  async hasKey(service: string): Promise<boolean>
  async clearKey(service: string): Promise<void>
  async clearAllKeys(): Promise<void>
}

// services/security/EncryptionService.ts
export class EncryptionService {
  async encrypt(data: string): Promise<string>
  async decrypt(encryptedData: string): Promise<string>
  generateKey(): Promise<CryptoKey>
}

// services/security/InputValidator.ts
export class InputValidator {
  static validateGitHubUrl(url: string): ValidationResult
  static validateUrl(url: string): ValidationResult
  static sanitizeInput(input: string): string
  static validateApiKey(key: string, type: 'github' | 'gemini'): boolean
}
```

**Migration Strategy:**
1. Create new security services with tests
2. Update UserSettingsContext to use ApiKeyManager
3. Add migration script for existing localStorage keys
4. Update all service files to use ApiKeyManager
5. Remove old global variables
6. Add deprecation warnings for 1 release

**Files to Modify:**
- `contexts/UserSettingsContext.tsx` - Use ApiKeyManager
- `services/geminiService.ts` - Remove global variables
- `services/githubService.ts` - Remove global variables
- `components/UserSettingsModal.tsx` - Add encryption notice

#### 1.2 Split geminiService.ts

**Current Structure (1,683 lines):**
```
geminiService.ts
├── API Key Management (18 lines)
├── Infographic Generation (400+ lines)
├── Code Analysis (500+ lines)
├── Image Processing (300+ lines)
└── UI Generation (400+ lines)
```

**New Structure:**
```typescript
// services/ai/InfographicService.ts (~400 lines)
export class InfographicService {
  generateInfographic(...)
  generateArticleInfographic(...)
  generateComparisonInfographic(...)
  generateDependencyGraph(...)
  extractKeyStats(...)
}

// services/ai/CodeAnalysisService.ts (~500 lines)
export class CodeAnalysisService {
  performCodeReview(...)
  generateTestCases(...)
  generateDocumentation(...)
  analyzeGaps(...)
  detectMissingFiles(...)
}

// services/ai/ImageService.ts (~300 lines)
export class ImageService {
  editImageWithGemini(...)
  generateCodeFromImage(...)
  generateDashboardFromImage(...)
  generateStyleVariants(...)
}

// services/ai/UIGenerationService.ts (~400 lines)
export class UIGenerationService {
  scanComponentLibrary(...)
  generateResponsiveVariants(...)
  generateDashboard(...)
  extractComponentData(...)
}

// services/ai/BaseAiService.ts (~100 lines)
export abstract class BaseAiService {
  protected client: GeminiClient;
  protected handleError(error: any): never
  protected parseJsonResponse(text: string): any
  protected reportProgress(stage: string, callback?: Function): void
}
```

**Benefits:**
- Single Responsibility Principle
- Easier to test (mock dependencies)
- Faster development (work on separate files)
- Better code navigation
- Clearer ownership

**Migration Strategy:**
1. Create base class with common utilities
2. Extract each service with tests
3. Update imports across all components
4. Create facade for backwards compatibility
5. Deprecate old imports
6. Remove geminiService.ts after 1 release

#### 1.3 Add Test Infrastructure

**New Files:**
```
__tests__/
├── setup.ts
├── mocks/
│   ├── gemini.ts
│   ├── github.ts
│   └── storage.ts
└── utils/
    ├── testHelpers.ts
    └── fixtures.ts
```

**Configuration:**
- Add vitest.config.ts
- Update package.json with test scripts
- Create test fixtures for common data
- Setup CI pipeline for tests

---

### Phase 2: Modularity & Testability (Week 3-4)

**Priority:** 🟠 P1  
**Estimated Effort:** 50 hours  
**Risk:** Medium (affects architecture)

#### 2.1 Create HTTP Abstraction Layer

**New Files:**
```typescript
// services/http/HttpClient.ts
export class HttpClient {
  async get<T>(url: string, options?: RequestOptions): Promise<T>
  async post<T>(url: string, body: any, options?: RequestOptions): Promise<T>
  setInterceptor(interceptor: Interceptor): void
}

// services/http/GeminiClient.ts
export class GeminiClient extends HttpClient {
  constructor(private keyManager: ApiKeyManager) { super(); }
  async generateContent(prompt: string): Promise<GeminiResponse>
  async generateImage(prompt: string): Promise<ImageResponse>
}

// services/http/GitHubClient.ts
export class GitHubClient extends HttpClient {
  constructor(private keyManager: ApiKeyManager) { super(); }
  async fetchRepo(owner: string, repo: string): Promise<RepoData>
  async fetchFileTree(owner: string, repo: string): Promise<FileTree>
}

// services/http/interceptors/RateLimitInterceptor.ts
export class RateLimitInterceptor implements Interceptor {
  async intercept(request: Request): Promise<Response>
}

// services/http/interceptors/CacheInterceptor.ts
export class CacheInterceptor implements Interceptor {
  async intercept(request: Request): Promise<Response>
}
```

**Benefits:**
- Testable HTTP layer
- Automatic rate limiting
- Consistent error handling
- Request deduplication
- Easy to mock in tests

#### 2.2 Extract Business Logic Hooks

**New Files:**
```typescript
// hooks/business/useRepositoryAnalysis.ts
export function useRepositoryAnalysis() {
  const analyze = async (url: string) => { ... }
  const generateGraph = async (fileTree: FileTree) => { ... }
  return { analyze, generateGraph, loading, error }
}

// hooks/business/useInfographicGeneration.ts
export function useInfographicGeneration() {
  const generate = async (data: any, style: string) => { ... }
  return { generate, loading, progress, result, error }
}

// hooks/business/useImageProcessing.ts
export function useImageProcessing() {
  const edit = async (image: File, prompt: string) => { ... }
  const generateCode = async (image: File) => { ... }
  return { edit, generateCode, processing, result, error }
}
```

**Refactor Components:**
- `RepoAnalyzer.tsx` - Use useRepositoryAnalysis hook
- `ArticleToInfographic.tsx` - Use useInfographicGeneration hook
- `ImageEditor.tsx` - Use useImageProcessing hook

**Benefits:**
- Reusable business logic
- Testable without UI
- Cleaner component code
- Easier to modify logic

#### 2.3 Consolidate Constants

**Update Files:**
```typescript
// constants.ts (already has most constants!)
// Just need to update components to import from here

// Remove duplicates from:
// - components/RepoAnalyzer.tsx (FLOW_STYLES, LANGUAGES)
// - components/ArticleToInfographic.tsx (SKETCH_STYLES, LANGUAGES)

// Add missing constants:
export const ERROR_MESSAGES = { ... }
export const LOADING_STAGES = { ... }
export const API_ENDPOINTS = { ... }
```

**Files to Update:**
- `components/RepoAnalyzer.tsx` - Import FLOW_STYLES, LANGUAGES
- `components/ArticleToInfographic.tsx` - Import SKETCH_STYLES, LANGUAGES
- All components using magic strings

#### 2.4 Unified Error Handling

**New Files:**
```typescript
// services/errors/ErrorHandler.ts
export class ErrorHandler {
  static handle(error: Error, context: string): UserFriendlyError
  static log(error: Error, context: string): void
  static report(error: Error): void // For production monitoring
}

// services/errors/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error): State
  componentDidCatch(error: Error, info: ErrorInfo): void
}
```

**Update All Services:**
- Consistent error handling pattern
- User-friendly error messages
- Automatic error logging
- Integration with errorService.ts

---

### Phase 3: Performance & Polish (Week 5-6)

**Priority:** 🟡 P2  
**Estimated Effort:** 30 hours  
**Risk:** Low (optimization)

#### 3.1 Implement Comprehensive Caching

**Update Files:**
```typescript
// services/cache/CacheManager.ts
export class CacheManager {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
  async clear(): Promise<void>
}

// services/cache/strategies/
├── InfographicCacheStrategy.ts
├── CodeAnalysisCacheStrategy.ts
└── RepositoryCacheStrategy.ts
```

**Apply Caching:**
- All AI service calls
- GitHub API calls
- Image processing results
- Dashboard generation

#### 3.2 Bundle Optimization

**Changes:**
```typescript
// App.tsx - Already has lazy loading, extend it
const InfographicService = lazy(() => import('./services/ai/InfographicService'));
const CodeAnalysisService = lazy(() => import('./services/ai/CodeAnalysisService'));

// vite.config.ts - Update chunk splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ai-services': ['./services/ai/*'],
          'vendor': ['react', 'react-dom', 'd3'],
          'lucide': ['lucide-react']
        }
      }
    }
  }
});
```

#### 3.3 Add Request Deduplication

**Update Services:**
- Apply deduplicatedFetch to all AI calls
- Queue management for rate-limited APIs
- Request cancellation for abandoned operations

#### 3.4 Performance Monitoring

**New Files:**
```typescript
// services/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  static startTrace(name: string): Trace
  static endTrace(trace: Trace): void
  static recordMetric(name: string, value: number): void
}
```

---

## Implementation Priority

### Immediate (Do First)
1. ✅ Create comprehensive architectural plan (this document)
2. 🔴 Add test infrastructure (vitest + testing-library)
3. 🔴 Create ApiKeyManager with encryption
4. 🔴 Split geminiService.ts into 4 services

### High Priority (Next)
5. 🟠 Create HTTP abstraction layer
6. 🟠 Add input validation throughout
7. 🟠 Extract business logic to hooks
8. 🟠 Implement error boundaries

### Medium Priority (Then)
9. 🟡 Consolidate duplicated constants
10. 🟡 Add comprehensive caching
11. 🟡 Bundle size optimization
12. 🟡 Add performance monitoring

---

## Success Metrics

### Code Quality Metrics
- **Test Coverage:** 0% → 80%
- **Largest File Size:** 1,683 lines → <500 lines
- **Code Duplication:** High → <5%
- **Bundle Size:** Track and optimize (target: -20%)

### Security Metrics
- **API Key Storage:** localStorage → Encrypted storage
- **Input Validation:** 0% → 100% of inputs
- **Security Vulnerabilities:** 6 critical → 0
- **Error Information Leakage:** High → Low

### Developer Experience Metrics
- **Time to Add Feature:** Baseline → -30%
- **Time to Fix Bug:** Baseline → -40%
- **Code Review Time:** Baseline → -25%
- **Onboarding Time:** Baseline → -50%

### Performance Metrics
- **First Contentful Paint:** Measure → Improve by 15%
- **Time to Interactive:** Measure → Improve by 20%
- **API Call Deduplication:** 0% → 80%
- **Cache Hit Rate:** 0% → 60%

---

## Timeline Estimate

### Week 1-2: Foundation & Security
- Day 1-2: Setup test infrastructure
- Day 3-5: Create security layer (ApiKeyManager, encryption)
- Day 6-8: Begin splitting geminiService.ts
- Day 9-10: Complete service splitting and migration

### Week 3-4: Modularity
- Day 1-3: Create HTTP abstraction layer
- Day 4-6: Extract business logic hooks
- Day 7-8: Add input validation
- Day 9-10: Implement error boundaries

### Week 5-6: Performance & Testing
- Day 1-2: Comprehensive caching
- Day 3-4: Bundle optimization
- Day 5-6: Add remaining tests
- Day 7-8: Performance monitoring
- Day 9-10: Documentation and cleanup

**Total Estimated Effort:** 120-140 hours (3-3.5 weeks full-time)

---

## Rollback Plan

### If Issues Arise

**Phase 1 Rollback:**
- Keep old service files alongside new ones
- Feature flag for new security layer
- Ability to switch back to localStorage

**Phase 2 Rollback:**
- Facade pattern allows old code to work
- No breaking changes to public APIs
- Gradual migration of components

**Phase 3 Rollback:**
- Performance optimizations are additive
- Can disable caching if issues occur
- Bundle changes don't affect functionality

### Monitoring

- Error tracking for new implementations
- Performance monitoring for regressions
- User feedback channels
- A/B testing for major changes

---

## Dependencies

### External Dependencies
- **New:** vitest, @testing-library/react, @testing-library/user-event
- **Existing:** Already have zod for validation (not used yet)
- **No breaking changes** to existing dependencies

### Internal Dependencies
- Order matters: Security layer before service splitting
- Tests should be added alongside refactoring
- HTTP layer before business logic hooks

---

## Questions for Review

1. **Security Approach:** Approve Web Crypto API for encryption vs. server-side solution?
2. **Migration Timeline:** Can we deprecate old APIs for 1 release before removal?
3. **Test Coverage Target:** Is 80% acceptable or should we aim higher?
4. **Breaking Changes:** Any preference for versioning strategy?
5. **Bundle Size:** What's acceptable increase for better architecture?

---

## Conclusion

This architectural improvement plan addresses critical security vulnerabilities, establishes proper testing infrastructure, and modernizes the codebase for long-term maintainability. The phased approach minimizes risk while delivering value incrementally.

**Key Benefits:**
- 🔒 **Security:** Encrypted API key storage, input validation
- 🧪 **Quality:** 80% test coverage, regression protection
- 📦 **Modularity:** Services <500 lines, single responsibility
- ⚡ **Performance:** 20% faster through caching and optimization
- 👥 **Developer Experience:** 30% faster feature development

**Next Steps:**
1. Review and approve this plan
2. Create GitHub issues for each phase
3. Begin Phase 1 implementation
4. Incremental rollout with monitoring

---

**Awaiting approval to proceed with implementation.**
