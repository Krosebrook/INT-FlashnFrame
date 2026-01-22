# replit.md

## Overview

Flash-n-Frame is a visual intelligence platform that transforms content into professional infographics. It offers these core features:

1. **GitFlow (GitHub Repository Analyzer)** - Converts GitHub repository structures into visual architectural blueprints and data flow diagrams
2. **SiteSketch (Article to Infographic)** - Transforms web articles into concise, professional infographics
3. **Reality Engine** - AI-powered style transfer and wireframe-to-code generation
4. **DevStudio** - Interactive development environment for exploring repository graphs with D3 visualization

The application is powered by Google's Gemini AI for generating visual content from structured data.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Jan 22, 2026**: Complete Progressive Web App (PWA) implementation:
  - **Enhanced Manifest**: Icons (72x72, 192x192, 512x512), shortcuts, file handlers, share target
  - **Advanced Service Worker**: Multiple caching strategies (network-first, cache-first, stale-while-revalidate)
  - **Offline Support**: Dedicated offline.html page with auto-reconnect
  - **PWA Hooks**: useInstallPrompt, useOnlineStatus, useServiceWorker, useLocalStorage
  - **File Handling**: useFileUpload, useFileDownload, useDragAndDrop hooks
  - **PWA UI Components**: InstallPrompt, OfflineIndicator, OnlineIndicator, UpdatePrompt
  - **Background Sync**: Ready for offline data synchronization
  - **Push Notifications**: Infrastructure ready for push notification support
- **Jan 22, 2026**: Comprehensive authentication system with multiple providers:
  - **Replit Auth (Primary)**: OpenID Connect with Google, GitHub, X, Apple, email/password
  - **AuthModal Component**: Multi-tab UI (Social, Email, Magic Link, Phone, SSO)
  - **Password Requirements**: 8+ chars, uppercase, lowercase, number, special character
  - **Captcha Placeholder**: Ready for reCAPTCHA integration
  - **Magic Link**: Prepared for SendGrid integration
  - **Phone Auth**: Prepared for Twilio integration  
  - **SSO Tab**: Placeholder for enterprise Okta/Azure AD/OneLogin/Auth0
  - Auth server runs on port 3001, proxied by Vite
  - User sessions stored in PostgreSQL
  - Routes: /api/login, /api/logout, /api/auth/user, /api/auth/magic-link, /api/auth/phone
- **Jan 22, 2026**: Expanded API key management with enterprise integrations:
  - **AWS Services**: Access Key, Secret Key, Region
  - **CRM & Support**: HubSpot API Key, Freshdesk API Key + Domain
  - **Security**: Bitwarden Client ID + Secret
  - **Enterprise**: vsaX API Key
  - **Microsoft 365**: Client ID/Secret/Tenant ID, Teams Webhook, SharePoint Site URL, Power Apps Environment
  - Settings modal now organized into 7 sections for easier navigation
- **Jan 22, 2026**: Added user-specific API key management system:
  - UserSettingsContext stores keys in browser localStorage (private to each user)
  - UserSettingsModal for entering GitHub, Gemini, OpenAI, Anthropic, Notion, Google Drive keys
  - Settings button added to header (gear icon, glows green when keys are configured)
  - Updated geminiService and githubService to use user-provided keys with fallback to environment variables
  - Users can now access their own private GitHub repositories with personal tokens
- **Jan 22, 2026**: Integrated 30+ components from 3 external projects (INFOGenius, OmniGen-dashboards, DashBoardGen):
  - **Data Visualization (components/viz/)**: ChartRenderer, VizBar, VizArea, VizScatter, VizHeatmap, VizTreemap, VizKPI, VizTooltip, WidgetContainer
  - **Background Effects (components/backgrounds/)**: AuroraBackground, AmbientBackgroundNoiseCanvas, DottedGlowBackground, NoiseOverlay
  - **Dashboard UI (components/)**: MagicBar (AI command palette), AnalysisPanel, OmniSidebar, CodeEditor, ArtifactCard, SideDrawer, InfoGraphicDisplay, SearchResults
  - **Modals (components/modals/)**: AboutModal, HelpModal, ConfirmationModal, PreviewModal
  - **Drawer Panels (components/drawer/)**: EnhancePanel, HistoryPanel, LayoutsPanel, SettingsPanel, VariationsPanel
  - **New Services**: omniAiService (AI widgets), semanticEngine, templateService, errorService
  - **New Hooks**: useDataManager (CSV/JSON upload), useHistory (undo/redo)
  - **New Utils**: aiHelpers, storage
  - Installed recharts for data visualization charts
- **Jan 19, 2026**: Major feature expansion with 10 new capabilities:
  - GitFlow: Dependency Graph Generator with multi-ecosystem support (npm, pip, cargo, go), version badges, and AI security analysis
  - SiteSketch: Multi-Source Comparison mode (2-3 URLs) and Key Stats Extractor
  - Reality Engine: Component Library Scanner, Responsive Variant Generator, Dashboard Generator
  - DevStudio: AI Code Review, Test Case Generator, Documentation Generator, Gap/Bottleneck Catcher
- **Jan 18, 2026**: Fixed critical context integration bugs in RepoAnalyzer, ArticleToInfographic, and DevStudio (components now use useProjectContext hook instead of props)
- **Jan 18, 2026**: Added "Explore in DevStudio" button to RepoAnalyzer with buildGraphFromFileTree utility
- **Jan 18, 2026**: Added theme toggle button to AppHeader (cycles dark → light → solarized)
- **Jan 2026**: Installed Tailwind CSS properly via @tailwindcss/vite plugin (removed CDN usage)
- **Jan 2026**: Added Reality Engine and DevStudio to Home page and Navigation tabs
- **Jan 2026**: Merged comprehensive feature set including Reality Engine (Style Transfer + UI-to-Code), DevStudio, Task Management, Theme System (dark/light/solarized), PWA support, and keyboard shortcuts
- **Jan 2026**: Implemented centralized state management with ProjectContext and ThemeContext
- **Jan 2026**: Added IndexedDB persistence for history and tasks
- **Jan 20, 2026**: Rebranded from Link2Ink to Flash-n-Frame throughout the codebase
- **Jan 2026**: Updated branding from Flash-n-Link to Link2Ink throughout the codebase

## User Flow Testing Summary

### Navigation Paths (All Working)
- Home cards → GitFlow, SiteSketch, Reality Engine, DevStudio
- NavigationTabs → All 4 main features
- Keyboard shortcuts (Alt+1-5, Shift+?)
- DevStudio empty state → Return to Analyzer button

### GitFlow → DevStudio Integration
- RepoAnalyzer fetches GitHub file tree
- "Explore in DevStudio" button generates D3 graph data via buildGraphFromFileTree
- Saves project state to context and navigates to DevStudio
- DevStudio displays interactive force-directed graph

### Components Using ProjectContext
- RepoAnalyzer: history, addToHistory
- ArticleToInfographic: history, addToHistory  
- DevStudio: currentProject (repoName, fileTree, graphData)

### Theme System
- ThemeContext provides: theme, setTheme, cycleTheme
- AppHeader displays theme toggle button with dynamic icon
- Themes: dark (Moon), light (Sun), solarized (Palette)

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[API.md](docs/API.md)** - API reference for all services (Gemini, GitHub, User Settings, Persistence)
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, data flow diagrams, directory structure
- **[FEATURES.md](docs/FEATURES.md)** - Detailed feature descriptions for all modules
- **[CHANGELOG.md](docs/CHANGELOG.md)** - Version history and release notes
- **[BEST_PRACTICES.md](docs/BEST_PRACTICES.md)** - Development guidelines, code style, security, testing

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6 with @tailwindcss/vite plugin
- **Styling**: Tailwind CSS v4 with custom theme configuration
- **Visualization**: D3.js for interactive force-directed graph rendering
- **Icons**: Lucide React icon library
- **State Management**: React Context API (ThemeContext, ProjectContext)
- **PWA**: Progressive Web App with service worker and offline capabilities

### Component Structure
- `App.tsx` - Root component with lazy loading, view navigation, and keyboard shortcuts
- `components/AppHeader.tsx` - Main navigation header with theme toggle
- `components/NavigationTabs.tsx` - Tab-based navigation (GitFlow, SiteSketch, RealityEngine, DevStudio)
- `components/Home.tsx` - Landing page with navigation cards to all features
- `components/RepoAnalyzer.tsx` - GitHub repository analysis interface (GitFlow)
- `components/ArticleToInfographic.tsx` - Article-to-infographic conversion (SiteSketch)
- `components/ImageEditor.tsx` - Reality Engine (Style Transfer + UI-to-Code)
- `components/DevStudio.tsx` - Interactive code exploration with D3 graphs
- `components/D3FlowChart.tsx` - D3-based interactive graph visualization
- `components/IntroAnimation.tsx` - Canvas-based intro animation (7.5s duration)
- `components/HistoryGrid.tsx` - Grid display of analysis history
- `components/InfographicResultCard.tsx` - Card for displaying generated infographics
- `components/KeyboardShortcutsModal.tsx` - Keyboard shortcuts help modal
- `components/TaskList.tsx` - Task management UI

### Contexts
- `contexts/ThemeContext.tsx` - Theme management (dark/light/solarized) with CSS variables
- `contexts/ProjectContext.tsx` - Centralized state management for projects

### Hooks
- `hooks/useTaskManagement.ts` - Task CRUD operations with IndexedDB persistence

### Services
- `services/geminiService.ts` - Gemini AI integration for image generation, editing, vectorization, and code generation
- `services/persistence.ts` - IndexedDB wrapper for local storage (history, tasks, project state)

### Data Flow
1. User provides GitHub repo URL or article URL
2. For repos: GitHub API fetches file tree, filtered for code files
3. Content sent to Gemini AI for infographic generation
4. Generated images displayed with download and fullscreen viewing options
5. History persisted to IndexedDB for offline access

### API Key Management
- Gemini API key is configured via the `GEMINI_API_KEY` environment variable
- The key is injected at build time through Vite config

### Keyboard Shortcuts
- `Alt+1` - Home
- `Alt+2` - GitFlow (Repo Analyzer)
- `Alt+3` - SiteSketch (Article to Infographic)
- `Alt+4` - Reality Engine (Style Transfer)
- `Alt+5` - DevStudio (Code Explorer)
- `Shift+?` - Show keyboard shortcuts help
- `Ctrl+Enter` - Execute render in Reality Engine

## External Dependencies

### Third-Party APIs
- **Google Gemini AI** (`@google/genai`) - Core AI service for generating infographics, image editing, vectorization, and Q&A
- **GitHub REST API** - Fetches repository file trees (tries `main` then `master` branches)

### Database
- **PostgreSQL** - Primary database, configured via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database queries with PostgreSQL dialect
- **Drizzle Kit** - Database migration tooling (`npm run db:push`)
- **IndexedDB** - Client-side persistence for history, tasks, and project state

### Key NPM Packages
- `react` / `react-dom` - UI framework
- `d3` - Data visualization for force-directed graphs
- `drizzle-orm` / `drizzle-zod` - Database ORM and schema validation
- `pg` - PostgreSQL client
- `zod` - Runtime type validation
- `lucide-react` - Icon components
- `tailwindcss` / `@tailwindcss/vite` - CSS framework with Vite integration

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key for AI features

## Deployment

The app uses static deployment:
- Build command: `npm run build`
- Output directory: `dist`
- Deployment target: Static hosting
