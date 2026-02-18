# Flash-n-Frame Features

> Last Updated: February 18, 2026

## Overview

Flash-n-Frame is a visual intelligence platform that transforms content into professional infographics. This document describes all features, their implementation status, and acceptance criteria.

---

## Feature Implementation Matrix

### Fully Implemented Features

| # | Feature | Component | Evidence | Status |
|---|---------|-----------|----------|--------|
| F1 | GitHub repo → infographic | RepoAnalyzer.tsx | Fetches tree, generates via Gemini | Shipped |
| F2 | Article URL → infographic | ArticleToInfographic.tsx | Single URL + multi-source modes | Shipped |
| F3 | Multi-source comparison | ArticleToInfographic.tsx | 2-3 URL comparison | Shipped |
| F4 | Key stats extraction | ArticleToInfographic.tsx | Stats-focused mode | Shipped |
| F5 | AI style transfer | ImageEditor.tsx | Upload + style prompt | Shipped |
| F6 | Wireframe to code | ImageEditor.tsx | Upload wireframe → code gen | Shipped |
| F7 | D3 graph explorer | DevStudio.tsx | Force-directed, pan/zoom, select | Shipped |
| F8 | AI code review | DevStudio.tsx | Select file → Gemini analysis | Shipped |
| F9 | Test case generation | DevStudio.tsx | Function → test template | Shipped |
| F10 | Doc generation | DevStudio.tsx | Code → JSDoc/docstrings | Shipped |
| F11 | Gap/bottleneck analysis | DevStudio.tsx | Architecture → suggestions | Shipped |
| F12 | Dependency graph | RepoAnalyzer.tsx | npm/pip/cargo/go manifests | Shipped |
| F13 | Theme system | ThemeContext.tsx | Dark / Light / Solarized | Shipped |
| F14 | Keyboard shortcuts | App.tsx, KeyboardShortcutsModal.tsx | Alt+1-5, Shift+? | Shipped |
| F15 | PWA install | pwa/*.tsx, sw.js, manifest.json | Install prompt, offline mode | Shipped |
| F16 | Replit OIDC auth | server/replit_integrations/auth/ | Login, callback, session | Shipped |
| F17 | Email/password auth | server/index.ts | Signup, login, bcrypt | Shipped |
| F18 | API key management | UserSettingsModal.tsx | Per-service localStorage keys | Shipped |
| F19 | Rate limit handling | RateLimitContext, RateLimitBanner | Cooldown, pre-flight guards | Shipped |
| F20 | Smart retry | geminiService.ts | Exponential backoff, skip on 429 | Shipped |
| F21 | Response caching | services/cache.ts | 5min text, 10min images | Shipped |
| F22 | Request dedup | geminiService.ts | deduplicatedFetch | Shipped |
| F23 | Error boundary | ErrorBoundary.tsx | Catches React render errors | Shipped |
| F24 | Toast notifications | Toast.tsx | Success/error/info toasts | Shipped |
| F25 | Splash animation | SplashPage.tsx | Warp drive canvas, typewriter | Shipped |
| F26 | History persistence | services/persistence.ts | IndexedDB CRUD | Shipped |
| F27 | GitHub tree proxy | server/index.ts | /api/github/tree/:owner/:repo | Shipped |
| F28 | Graceful shutdown | server/index.ts | SIGTERM/SIGINT handlers | Shipped |
| F29 | Security middleware | server/index.ts | Helmet, CORS, rate limit, CSRF | Shipped |

### Partially Implemented Features

| # | Feature | Component | What Works | What's Missing | Evidence |
|---|---------|-----------|-----------|---------------|----------|
| P1 | Social login (Google, GitHub, X, Apple) | AuthModal.tsx | UI buttons displayed | No backend OIDC handlers | `setError('${provider} login coming soon')` in AuthModal.tsx:96 |
| P2 | Magic link auth | server/index.ts | Endpoint exists | Returns 501 (requires SendGrid) | Lines 97-115 |
| P3 | Phone auth | server/index.ts | Endpoint exists | Returns 501 (requires Twilio) | Lines 116-137 |
| P4 | Component library scanner | ImageEditor.tsx | UI present | AI-dependent, quality varies | Part of Reality Engine |
| P5 | Responsive variant gen | ImageEditor.tsx | UI present | AI-dependent, quality varies | Part of Reality Engine |
| P6 | Dashboard generator | ImageEditor.tsx | UI present | AI-dependent, quality varies | Part of Reality Engine |
| P7 | Offline queue sync | services/persistence.ts | Queue store defined | No background sync implementation | `OFFLINE_QUEUE` store name defined |
| P8 | SAML/SSO enterprise auth | AuthModal.tsx | Input field for Okta domain | No backend handler | AuthModal.tsx:488 |

### Not Implemented (Referenced in UI but absent)

| # | Feature | Reference | Status |
|---|---------|-----------|--------|
| N1 | Notion integration | UserSettingsModal.tsx key field | Key stored, no integration code |
| N2 | Google Drive integration | UserSettingsModal.tsx key field | Key stored, no integration code |
| N3 | AWS integration | UserSettingsModal.tsx key fields | Keys stored, no integration code |
| N4 | HubSpot CRM | UserSettingsModal.tsx key field | Key stored, no integration code |
| N5 | Freshdesk support | UserSettingsModal.tsx key fields | Key stored, no integration code |
| N6 | Bitwarden | UserSettingsModal.tsx key fields | Keys stored, no integration code |
| N7 | vsaX enterprise | UserSettingsModal.tsx key field | Key stored, no integration code |
| N8 | Microsoft 365 suite | UserSettingsModal.tsx key fields | Keys stored, no integration code |

---

## Technical Debt Summary

| Category | Item | Severity | File(s) | Impact |
|----------|------|----------|---------|--------|
| Dead Code | 12+ potentially unused components | Low | D3FlowChart, ImageViewer, HistoryGrid, InfographicResultCard, TaskList, DependencyGraph, IntroAnimation, AnalysisPanel, SearchResults, SideDrawer, OmniSidebar, background components | Bundle bloat |
| Logging | No structured logging | Medium | server/index.ts | Debugging difficulty in production |
| Monitoring | No error tracking service | Medium | — | Silent failures |
| Testing | No automated tests | Medium | — | Regression risk |
| Build | Bundle over 500KB warning | Low | vite.config.ts | Slower initial load |
| DB | No migration history | Low | drizzle.config.ts | Risky schema changes |
| Auth stubs | 5 auth methods show UI but don't work | Low | AuthModal.tsx, server/index.ts | User confusion |
| Integration stubs | 8 API key fields with no backend | Low | UserSettingsModal.tsx | User confusion |

See [RISK_REGISTER.md](RISK_REGISTER.md) for the full audit and [ROADMAP.md](ROADMAP.md) for the prioritized fix plan.

---

## Table of Contents

1. [GitFlow (Repository Analyzer)](#gitflow-repository-analyzer)
2. [SiteSketch (Article to Infographic)](#sitesketch-article-to-infographic)
3. [Reality Engine](#reality-engine)
4. [DevStudio](#devstudio)
5. [User Settings & API Keys](#user-settings--api-keys)
6. [Theme System](#theme-system)
7. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## GitFlow (Repository Analyzer)

Transform GitHub repositories into visual architectural blueprints.

### Core Features

#### Repository Structure Visualization
- Fetches complete file tree from any public GitHub repository
- Supports private repositories with user-provided GitHub token
- Filters for relevant code files (JS, TS, Python, Go, Rust, etc.)
- Excludes build artifacts (node_modules, dist, build)

#### AI-Powered Infographic Generation
- Converts repository structure to visual diagrams
- Highlights key files and directories
- Shows technology stack and patterns

#### Dependency Graph Generator
Multi-ecosystem support for dependency visualization:

| Ecosystem | Manifest File | Features |
|-----------|--------------|----------|
| npm | package.json | Production, dev, peer dependencies |
| pip | requirements.txt | Version constraints |
| Cargo | Cargo.toml | Rust crates |
| Go | go.mod | Go modules |

Features:
- Version badges for each dependency
- AI security analysis
- Outdated package detection

#### DevStudio Integration
- "Explore in DevStudio" button on analyzed repos
- Converts file tree to D3 graph data
- Seamless navigation between views

### Edge Cases
- Private repos require GitHub token in User Settings
- Repos with >10,000 files may be truncated by GitHub API
- Rate limits: GitHub API allows 60 req/hr unauthenticated, 5,000 with token

### Acceptance Criteria
- [x] Enter any public GitHub repo URL and see file tree
- [x] Generate infographic from repo structure
- [x] View dependency graph for supported ecosystems
- [x] Navigate to DevStudio from analyzed repo

---

## SiteSketch (Article to Infographic)

Transform web articles into concise, professional infographics.

### Core Features

#### Single URL Mode
- Enter any article URL
- AI extracts key information
- Generates visual summary infographic

#### Multi-Source Comparison Mode
- Compare 2-3 articles simultaneously
- Side-by-side visual comparison
- Identifies common themes and differences

#### Key Stats Extractor
- Automatically identifies statistics in articles
- Highlights numbers, percentages, dates
- Creates data-focused infographics

### Supported Content Types
- News articles
- Blog posts
- Documentation pages
- Research papers (HTML format)

### Edge Cases
- Paywalled articles cannot be fetched
- Non-HTML content (PDFs) not supported
- Very long articles may exceed Gemini context window

### Acceptance Criteria
- [x] Enter article URL and generate infographic
- [x] Use multi-source mode with 2-3 URLs
- [x] Extract key statistics in stats mode
- [x] Choose from multiple visual styles

---

## Reality Engine

AI-powered design transformation tools.

### Style Transfer
- Upload source image
- Apply different visual styles
- Maintain content while changing aesthetics

### Wireframe to Code
- Upload wireframe or mockup images
- AI generates functional code
- Supports multiple frameworks

### Component Library Scanner
- Analyze existing UI components
- Extract design patterns
- Generate component documentation

### Responsive Variant Generator
- Input desktop design
- Generate mobile/tablet variants
- Maintain design consistency

### Dashboard Generator
- Describe desired dashboard
- AI creates layout and components
- Customizable widget placement

### Edge Cases
- Image upload limited to supported formats (PNG, JPG, WebP)
- Large images may need compression before upload
- Code generation quality depends on wireframe clarity

### Acceptance Criteria
- [x] Upload image and apply style transfer
- [x] Upload wireframe and get generated code
- [x] Generate responsive variants from desktop design
- [ ] Component library scanner accuracy varies by input quality (partial)

---

## DevStudio

Interactive development environment for code exploration.

### D3 Visualization
- Force-directed graph layout
- Interactive pan and zoom
- Node selection and details
- Relationship visualization

### AI Code Review
- Select files for review
- AI analyzes code quality
- Provides improvement suggestions
- Identifies potential issues

### Test Case Generator
- Analyze function signatures
- Generate unit test templates
- Support for multiple testing frameworks

### Documentation Generator
- Parse code structure
- Generate JSDoc/docstrings
- Create README sections

### Gap/Bottleneck Catcher
- Analyze codebase architecture
- Identify missing abstractions
- Find performance bottlenecks
- Suggest refactoring opportunities

### Acceptance Criteria
- [x] View repo as interactive force-directed graph
- [x] Select node and see file details
- [x] Run AI code review on selected files
- [x] Generate test cases for functions
- [x] Generate documentation for code
- [x] Get architecture gap analysis

---

## User Settings & API Keys

Manage personal API keys for various services.

### Implemented Integrations

| Service | Key Type | Status | Usage |
|---------|----------|--------|-------|
| GitHub | Personal Access Token | Active | Private repo access |
| Google Gemini | API Key | Active | AI generation (fallback to server key) |
| OpenAI | API Key | Active | AI features |
| Anthropic | API Key | Active | AI features |

### Configured but No Backend

| Service | Key Type | Status | Notes |
|---------|----------|--------|-------|
| Notion | Integration Token | UI only | No integration code |
| Google Drive | API Key | UI only | No integration code |
| AWS | Access Key + Secret + Region | UI only | No integration code |
| HubSpot | API Key | UI only | No integration code |
| Freshdesk | API Key + Domain | UI only | No integration code |
| Bitwarden | Client ID + Secret | UI only | No integration code |
| vsaX | API Key | UI only | No integration code |
| Microsoft 365 | Client ID/Secret/Tenant + more | UI only | No integration code |

### Security
- Keys stored in browser localStorage only
- Never sent to Flash-n-Frame servers
- Private to each user's browser
- Server-side Gemini key available via `/api/ai/key` (auth required)

---

## Theme System

Three visual themes with full CSS variable support.

| Theme | Background | Text | Accent | Best For |
|-------|-----------|------|--------|----------|
| Dark (default) | #0a0a0f | #e0e0e0 | #8b5cf6 | Low-light environments |
| Light | #ffffff | #1a1a2e | #7c3aed | Bright environments |
| Solarized | #002b36 | solarized palette | #2aa198 | Extended reading |

- Toggle in AppHeader: click to cycle Dark → Light → Solarized
- Preference saved to localStorage
- Icons: Moon (dark), Sun (light), Palette (solarized)

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| Alt + 1 | Go to Home |
| Alt + 2 | Go to GitFlow |
| Alt + 3 | Go to SiteSketch |
| Alt + 4 | Go to Reality Engine |
| Alt + 5 | Go to DevStudio |

### Actions

| Shortcut | Action |
|----------|--------|
| Shift + ? | Show keyboard shortcuts help |
| Ctrl + Enter | Execute render (Reality Engine) |

---

## PWA Support

### Features
- Installable to home screen
- Works offline (cached assets via service worker)
- App-like experience with standalone display
- Online/offline status indicators

### Installation
1. Open Flash-n-Frame in browser
2. Click "Install" prompt (or browser menu)
3. App installs to device
4. Launch from home screen/app drawer

---

## Data Persistence

### What's Saved
| Store | Technology | Data | Scope |
|-------|-----------|------|-------|
| History | IndexedDB | Analysis results | Per-browser |
| Tasks | IndexedDB | Task list items | Per-browser |
| Projects | IndexedDB | Project state snapshots | Per-browser |
| API Keys | localStorage | Per-service keys | Per-browser |
| Theme | localStorage | Theme preference | Per-browser |
| Users | PostgreSQL | Account data | Server-wide |
| Sessions | PostgreSQL | Login sessions | Server-wide |

### What's NOT Saved
- Generated images (download to keep)
- Temporary analysis data
- In-flight request state
