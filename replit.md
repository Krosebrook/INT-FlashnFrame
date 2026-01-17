# replit.md

## Overview

Link 2 Ink is a visual intelligence platform that transforms content into professional infographics. It offers two core features:

1. **GitHub Repository Analyzer** - Converts GitHub repository structures into visual architectural blueprints and data flow diagrams
2. **Article to Infographic** - Transforms web articles into concise, professional infographics

The application is powered by Google's Gemini AI (specifically using the "Nano Banana Pro" model reference in the UI) for generating visual content from structured data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (loaded via CDN with custom configuration for glassmorphism effects, neon shadows, and dark theme)
- **Visualization**: D3.js for interactive force-directed graph rendering of repository structures
- **Icons**: Lucide React icon library
- **State Management**: React useState hooks (no external state library)

### Component Structure
- `App.tsx` - Root component managing view navigation and API key state
- `Home.tsx` - Landing page with navigation to main features
- `RepoAnalyzer.tsx` - GitHub repository analysis interface
- `ArticleToInfographic.tsx` - Article-to-infographic conversion interface
- `DevStudio.tsx` - Interactive development environment for exploring repository graphs
- `D3FlowChart.tsx` - D3-based interactive graph visualization
- `IntroAnimation.tsx` - Canvas-based intro animation sequence
- `UserApiKeyModal.tsx` - Modal for user API key input

### Backend Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Database Connection**: `server/db.ts` using node-postgres (pg)
- **Schema Validation**: Zod with drizzle-zod integration

### Data Flow
1. User provides GitHub repo URL or article URL
2. For repos: GitHub API fetches file tree, filtered for code files
3. Content sent to Gemini AI for infographic generation
4. Generated images displayed with download and fullscreen viewing options

### API Key Management
- Gemini API key is configured via the `GEMINI_API_KEY` environment variable
- The key is injected at build time through Vite config

## External Dependencies

### Third-Party APIs
- **Google Gemini AI** (`@google/genai`) - Core AI service for generating infographics from repository structures and articles. Requires user-provided API key.
- **GitHub REST API** - Fetches repository file trees. Uses public endpoints with rate limiting considerations (tries `main` then `master` branches).

### Database
- **PostgreSQL** - Primary database, configured via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database queries with PostgreSQL dialect
- **Drizzle Kit** - Database migration tooling (`npm run db:push`)

### Key NPM Packages
- `react` / `react-dom` - UI framework
- `d3` - Data visualization for force-directed graphs
- `drizzle-orm` / `drizzle-zod` - Database ORM and schema validation
- `pg` - PostgreSQL client
- `zod` - Runtime type validation
- `lucide-react` - Icon components

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Optional server-side default (users can provide their own via UI)