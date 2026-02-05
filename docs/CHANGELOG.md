# Changelog

All notable changes to Flash-n-Frame are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Additional AI model integrations
- Team collaboration features
- Export to additional formats

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
