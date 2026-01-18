# replit.md

## Overview

Link2Ink is a visual intelligence platform that transforms content into professional infographics. It offers these core features:

1. **GitFlow (GitHub Repository Analyzer)** - Converts GitHub repository structures into visual architectural blueprints and data flow diagrams
2. **SiteSketch (Article to Infographic)** - Transforms web articles into concise, professional infographics
3. **Reality Engine** - AI-powered style transfer and wireframe-to-code generation
4. **DevStudio** - Interactive development environment for exploring repository graphs with D3 visualization

The application is powered by Google's Gemini AI for generating visual content from structured data.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Jan 2026**: Installed Tailwind CSS properly via @tailwindcss/vite plugin (removed CDN usage)
- **Jan 2026**: Added Reality Engine and DevStudio to Home page and Navigation tabs
- **Jan 2026**: Merged comprehensive feature set including Reality Engine (Style Transfer + UI-to-Code), DevStudio, Task Management, Theme System (dark/light/solarized), PWA support, and keyboard shortcuts
- **Jan 2026**: Implemented centralized state management with ProjectContext and ThemeContext
- **Jan 2026**: Added IndexedDB persistence for history and tasks
- **Jan 2026**: Updated branding from Flash-n-Link to Link2Ink throughout the codebase

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
