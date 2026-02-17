# Changelog

All notable changes to Flash-n-Frame are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Additional AI model integrations
- Team collaboration features
- Export to additional formats
- Comprehensive test suite (vitest + @testing-library)
- Service architecture refactoring

---

## [3.1.0] - 2026-02-17

### Fixed
- **Manifest.json cleanup**: Removed references to non-existent screenshot files (`desktop-home.png`, `mobile-home.png`), missing shortcut icons (`shortcut-gitflow.png`, etc.), and unused `icon-security.png`. Only 3 existing SVG icons remain.
- **Gemini model fallback on 429/quota**: `withModelFallback` now retries with cheaper fallback models (e.g., `gemini-2.5-flash`) when the primary model hits a 429 rate limit or quota exceeded error, instead of failing immediately.
- **GitHub API proxy**: Added `/api/github/tree/:owner/:repo` backend endpoint to route GitHub API calls server-side, fixing browser rate-limit and CORS issues. User-provided GitHub tokens are forwarded for private repo access. Service worker excludes `/api/github/` from caching.

---

## [3.0.0] - 2026-02-06

### Added
- **Server-side API key management**: Gemini API key moved from client-side bundle to server-side `/api/ai/key` endpoint. Vite no longer injects API keys into the frontend.
- **GitHub API proxy endpoint**: `/api/github/tree/:owner/:repo` routes GitHub API calls through the backend server.
- **Health check endpoint**: `GET /api/health` returns status, uptime, timestamp, and environment info.
- **Ping endpoint**: `GET /api/ping` for simple connectivity checks.
- **Security hardening**: Added Helmet HTTP headers, CORS origin restrictions for production (`*.replit.app`, `*.replit.dev`), server-side rate limiting (auth: 20/15min, general: 100/min).
- **Email/password authentication**: Bcrypt hashing (12 rounds), signup/login endpoints with password complexity validation.
- **CSRF token endpoint**: `GET /api/csrf-token` for form protection.
- **React ErrorBoundary**: Wraps AppContent for crash recovery UI.
- **ToastProvider**: Notification system for user feedback (success/error/warning/info).
- **ARIA labels**: Added to navigation tabs for accessibility.
- **Reduce-motion support**: Splash screen respects `prefers-reduced-motion`. Skip-splash preference saved to localStorage.

### Changed
- **Deployment**: Changed from static deployment to autoscale for full backend support.
- **Cookie security**: `secure` flag is now environment-aware (true in production, false in dev) instead of hardcoded `true`.
- **Vite proxy**: Target changed from `0.0.0.0:3001` to `localhost:3001`.
- **Express SPA route**: Changed from `/{*splat}` to `/*` for Express 5 compatibility.
- **Manifest.json**: Moved to `public/` for proper inclusion in production builds.
- **Static file serving**: Now production-only to prevent stale dist files in dev.
- **Consolidated workflows**: Removed separate Auth Server workflow, combined into single "Start application" workflow.
- **Gemini model names**: Updated to use `-preview` suffix (gemini-3-pro-image-preview, gemini-3-pro-preview).
- **Intelligent model fallback**: IMAGE_MODELS and TEXT_MODELS arrays with automatic retry on 404/model-not-available errors.

### Fixed
- **PWA API key handling**: `clearApiKey` and `clearAllKeys` now properly reset in-memory service variables, preventing stale keys.
- **API key validation**: Gemini and GitHub keys validated on save with user feedback (loading spinner, success/error messages). Invalid keys rejected.
- **Service worker**: `/api/ai/key` endpoint excluded from SW caching to prevent stale key data in PWA mode.
- **Error messages**: Invalid API key errors now show clear, actionable messages instead of generic errors.
- **omniAiService.ts**: Fixed to use `ensureAiClient()` instead of checking `process.env.API_KEY` (empty in browser).

### Security
- Server-side rate limiting on auth endpoints (20 requests/15 minutes) and general API (100 requests/minute)
- Trust proxy set to `1` for correct IP detection behind Replit's proxy
- HTTP-only session cookies with environment-aware secure flag and SameSite=Lax

---

## [2.7.0] - 2026-01-24

### Added
- **Branded Neon-Style Images Integration**
  - Home Page Feature Cards: Branded icons for GitHub (cloud), SiteSketch (analytics), RealityEngine (creative palette), DevStudio (projects folder)
  - Splash Page: Floating animated icons with float animation (security, cloud, analytics, creative, projects)
  - Navigation Tabs: Small image icons replace Lucide icons for visual consistency
  - PWA Manifest: Added branded icon-security.png to manifest icons array
  - All images stored in `/public/images/` with descriptive naming convention

### Changed
- Feature card backgrounds now display branded images with hover effects
- NavigationTabs component simplified by removing unused Lucide icon imports

---

## [2.6.0] - 2026-01-24

### Added
- **Resource Efficiency Optimizations**
  - API Caching: `services/cache.ts` with TTL-based memory cache, request deduplication, and exponential backoff
  - GitHub Service: 5-minute caching and concurrent request deduplication
  - Animation Optimizations: All canvas animations FPS-capped (20-30 FPS) and pause when tab hidden via Page Visibility API

### Changed
- LoadingState log intervals: 800ms → 2.5s
- useDataManager streaming intervals: 2s → 5s
- Offline check intervals: 5s → 30s
- Splash page particle count reduced: 300 → 200
- All setInterval hooks now skip updates when `document.hidden` is true

### Performance
- Target: <5% CPU idle, minimized memory footprint

---

## [2.5.0] - 2026-01-22

### Added
- **Enterprise API Key Management**
  - AWS Services: Access Key, Secret Key, Region
  - CRM & Support: HubSpot API Key, Freshdesk API Key + Domain
  - Security: Bitwarden Client ID + Secret
  - Enterprise: vsaX API Key
  - Microsoft 365: Client ID/Secret/Tenant ID, Teams Webhook, SharePoint Site URL, Power Apps Environment

### Changed
- Settings modal reorganized into 7 logical sections
- Improved section headers with uppercase styling

---

## [2.4.0] - 2026-01-22

### Added
- **User-Specific API Key Management System**
  - UserSettingsContext for managing API keys
  - UserSettingsModal component for key entry
  - Settings button in header (gear icon)
  - Green glow indicator when keys are configured
  
- **Private Repository Support**
  - GitHub Personal Access Token integration
  - Authentication headers for API requests
  - Access to user's private repositories

### Changed
- geminiService now uses user-provided keys with environment fallback
- githubService now uses user-provided tokens with environment fallback

---

## [2.3.0] - 2026-01-22

### Added
- **Integrated 30+ Components from External Projects**
  
  Data Visualization (components/viz/):
  - ChartRenderer, VizBar, VizArea, VizScatter
  - VizHeatmap, VizTreemap, VizKPI
  - VizTooltip, WidgetContainer
  
  Background Effects (components/backgrounds/):
  - AuroraBackground
  - AmbientBackgroundNoiseCanvas
  - DottedGlowBackground
  - NoiseOverlay
  
  Dashboard UI:
  - MagicBar (AI command palette)
  - AnalysisPanel, OmniSidebar
  - CodeEditor, ArtifactCard
  - SideDrawer, InfoGraphicDisplay, SearchResults
  
  Modals:
  - AboutModal, HelpModal
  - ConfirmationModal, PreviewModal
  
  Drawer Panels:
  - EnhancePanel, HistoryPanel
  - LayoutsPanel, SettingsPanel, VariationsPanel
  
  New Services:
  - omniAiService (AI widgets)
  - semanticEngine
  - templateService
  - errorService
  
  New Hooks:
  - useDataManager (CSV/JSON upload)
  - useHistory (undo/redo)
  
  New Utils:
  - aiHelpers
  - storage

### Dependencies
- Added recharts for data visualization

---

## [2.2.0] - 2026-01-19

### Added
- **GitFlow Enhancements**
  - Dependency Graph Generator
  - Multi-ecosystem support (npm, pip, cargo, go)
  - Version badges
  - AI security analysis

- **SiteSketch Enhancements**
  - Multi-Source Comparison mode (2-3 URLs)
  - Key Stats Extractor

- **Reality Engine Enhancements**
  - Component Library Scanner
  - Responsive Variant Generator
  - Dashboard Generator

- **DevStudio Enhancements**
  - AI Code Review
  - Test Case Generator
  - Documentation Generator
  - Gap/Bottleneck Catcher

---

## [2.1.0] - 2026-01-18

### Fixed
- Critical context integration bugs in RepoAnalyzer
- Context integration bugs in ArticleToInfographic
- Context integration bugs in DevStudio
- Components now use useProjectContext hook instead of props

### Added
- "Explore in DevStudio" button to RepoAnalyzer
- buildGraphFromFileTree utility for D3 graph generation
- Theme toggle button to AppHeader (cycles dark → light → solarized)

---

## [2.0.0] - 2026-01-18

### Added
- **Reality Engine** - Style Transfer + UI-to-Code generation
- **DevStudio** - Interactive code exploration with D3 graphs
- **Task Management** - Persistent task lists with IndexedDB
- **Theme System** - Dark, Light, and Solarized themes
- **PWA Support** - Offline capabilities with service worker
- **Keyboard Shortcuts** - Quick navigation (Alt+1-5, Shift+?)

### Changed
- Centralized state management with ProjectContext
- Centralized theme management with ThemeContext
- Lazy loading for all major views

### Technical
- Installed Tailwind CSS via @tailwindcss/vite plugin
- Removed CDN usage for Tailwind

---

## [1.1.0] - 2026-01-20

### Changed
- Rebranded from Link2Ink to Flash-n-Frame
- Updated all references throughout codebase
- New branding assets and colors

---

## [1.0.0] - 2026-01-15

### Added
- Initial release
- **GitFlow** - GitHub repository analysis
- **SiteSketch** - Article to infographic conversion
- Google Gemini AI integration
- IndexedDB persistence for history
- Responsive design
- Intro animation

---

## Version Naming

- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (0.X.0)**: New features, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements
