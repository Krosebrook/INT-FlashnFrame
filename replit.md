# Flash-n-Frame

## Overview

Flash-n-Frame is a visual intelligence platform that transforms content into professional infographics using Google's Gemini AI. Its core capabilities include:

-   **GitFlow (GitHub Repository Analyzer)**: Converts GitHub repository structures into visual architectural blueprints and data flow diagrams.
-   **SiteSketch (Article to Infographic)**: Transforms web articles into concise, professional infographics.
-   **Reality Engine**: Provides AI-powered style transfer and wireframe-to-code generation.
-   **DevStudio**: An interactive development environment for exploring repository graphs with D3 visualization.

The platform aims to revolutionize content visualization and development workflow efficiency. It is an internal corporate app for INT Inc.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
-   **Framework**: React 19 with TypeScript.
-   **Build Tool**: Vite 6 with `@tailwindcss/vite` plugin.
-   **Styling**: Tailwind CSS v4 with custom themes (dark, light, solarized).
-   **Visualization**: D3.js for interactive force-directed graph rendering.
-   **State Management**: React Context API (ThemeContext, ProjectContext, RateLimitContext).
-   **PWA**: Progressive Web App with service worker (`public/sw.js`) for offline capabilities. Manifest at `public/manifest.json`.
-   **UI/UX Decisions**: Glassmorphism design, branded neon-style images, animated splash page with warp drive canvas effect, circuit-pattern backgrounds. Color scheme: #2B6C85 teal, #33475B slate, #8b5cf6 purple, #ec4899 pink.
-   **Accessibility**: ARIA labels on navigation tabs, reduce-motion support for splash screen, skip-splash preference saved to localStorage.

### Component Structure
The application uses a modular component architecture including:
-   Root components for lazy loading and view navigation.
-   Dedicated components for each core feature (RepoAnalyzer, ArticleToInfographic, ImageEditor, DevStudio).
-   Reusable UI components for navigation (NavigationTabs with ARIA roles), history display, and infographic results.
-   Modal components for user interactions (keyboard shortcuts, API key settings).
-   PWA components (InstallPrompt, OfflineIndicator, OnlineIndicator, UpdatePrompt, ConnectionStatus).

### Server Architecture
-   **Framework**: Express with TypeScript (`server/index.ts`).
-   **Environment Detection**: `isProduction` flag uses `NODE_ENV` and `REPLIT_DEPLOYMENT` env vars.
-   **Port Config**: Port 5000 in production (serves frontend + API), Port 3001 in development (API only, Vite handles frontend).
-   **Static File Serving**: Production-only; serves from `dist/` with cache headers. HTML files use `no-cache`.
-   **SPA Fallback**: `app.get("/*")` catch-all in production serves `index.html` for client-side routing.
-   **Health Check**: `GET /api/health` returns status, uptime, timestamp, environment.

### Security (Hardened)
-   **Helmet**: HTTP security headers (CSP disabled for SPA compatibility, COEP disabled for cross-origin resources).
-   **CORS**: Production restricts origins to `*.replit.app` and `*.replit.dev`. Development allows all origins.
-   **Server-Side Rate Limiting**: Auth endpoints (login/signup) limited to 20 requests per 15 minutes. General API limited to 100 requests per minute.
-   **Session Cookies**: `httpOnly: true`, `sameSite: lax`, `secure` flag is environment-aware (true in production, false in dev).
-   **Trust Proxy**: Set to `1` for correct IP detection behind Replit's proxy.
-   **Password Requirements**: Bcrypt with 12 salt rounds, regex validation for complexity.

### Data Flow
The system processes user-provided content (GitHub repo URLs or article URLs), sends it to Gemini AI for processing (e.g., infographic generation, image editing), and displays the results. History and project states are persisted locally using IndexedDB.

### API Resilience & Caching
-   **Smart Retry**: All Gemini API calls use exponential backoff (2 retries, 2s initial delay). Rate limit errors (429), permission (403), not-found (404), and safety errors skip retries and fail immediately.
-   **Response Caching**: Text-based API results cached for 5 minutes. Image results cached for 10 minutes. Uses `apiCache` from `services/cache.ts`.
-   **Request Deduplication**: Infographic generation and DevStudio tools use `deduplicatedFetch` to prevent duplicate in-flight requests.
-   **Service-Level Rate Limit Tracking**: `geminiService.ts` tracks rate limits at the service level (`globalRateLimitUntil`), synced with the UI via `RateLimitContext`.
-   **Pre-Flight Guards**: All 4 feature components check `checkBeforeCall()` before making API requests to prevent wasted calls during cooldown.
-   **Graceful Degradation**: Rate limit banner shows countdown, cached results remain accessible, and network errors are distinguished from rate limits.

### API Key Management
User-specific API keys for services like GitHub, Gemini, OpenAI, etc., can be managed via a dedicated settings modal and stored in browser localStorage. The system falls back to environment variables if user-provided keys are not available.

### Authentication
A full user signup and authentication system is implemented:
-   **Replit Auth**: OpenID Connect integration via `server/replit_integrations/auth/`.
-   **Email/Password**: Bcrypt hashing (12 rounds), signup/login endpoints with password complexity validation.
-   **Social Logins**: Google, GitHub, X, Apple via OIDC.
-   **Session Storage**: PostgreSQL-backed sessions via `connect-pg-simple`.
-   **Placeholders**: Magic link (requires SendGrid) and phone auth (requires Twilio) endpoints return 501 until configured.

### Deployment
-   **Target**: Autoscale deployment on Replit.
-   **Build**: `npm run build` (Vite builds frontend to `dist/`).
-   **Run**: `npx tsx server/index.ts` serves both API and static files in production.
-   **PWA Assets**: `manifest.json`, `sw.js`, `offline.html`, icons all in `public/` directory (copied to `dist/` during build).

## External Dependencies

### Third-Party APIs
-   **Google Gemini AI** (`@google/genai`): Core AI service for content generation, image manipulation, and code generation.
-   **GitHub REST API**: Used for fetching repository file trees and related data.

### Database
-   **PostgreSQL**: Primary database for user sessions and application data, managed with `DATABASE_URL`.
-   **Drizzle ORM** with `Drizzle Kit`: For type-safe database queries and migrations.
-   **IndexedDB**: Client-side storage for local persistence of history, tasks, and project states.

### Key NPM Packages
-   `react`, `react-dom`: Frontend UI development.
-   `d3`: For advanced data visualizations.
-   `drizzle-orm`, `drizzle-zod`, `pg`: Database interaction and schema validation.
-   `zod`: Runtime type validation.
-   `lucide-react`: Icon library.
-   `tailwindcss`, `@tailwindcss/vite`: CSS framework and integration.
-   `recharts`: For data visualization charts.
-   `helmet`: HTTP security headers.
-   `cors`: Cross-origin resource sharing middleware.
-   `express-rate-limit`: Server-side rate limiting.
-   `bcryptjs`: Password hashing.

### Environment Variables Required
-   `DATABASE_URL`: PostgreSQL connection string.
-   `GEMINI_API_KEY`: Google Gemini API key.
-   `SESSION_SECRET`: Express session secret.
-   `REPL_ID`: Replit application identifier (auto-set by Replit).

## Recent Changes (Feb 2026)
-   Fixed Gemini model names to use `-preview` suffix (gemini-3-pro-image-preview, gemini-3-pro-preview).
-   Added intelligent model fallback: IMAGE_MODELS and TEXT_MODELS arrays with automatic retry on 404/model-not-available errors.
-   **Security**: Moved Gemini API key from client-side bundle to server-side `/api/ai/key` endpoint. Vite no longer injects API keys.
-   Added React ErrorBoundary component wrapping AppContent for crash recovery UI.
-   Added ToastProvider notification system for user feedback (success/error/warning/info).
-   Fixed `omniAiService.ts` to use `ensureAiClient()` instead of checking `process.env.API_KEY` (which is empty in browser).
-   Consolidated workflows: removed separate Auth Server workflow, combined into single "Start application" workflow.
-   Fixed cookie `secure` flag to be environment-aware instead of hardcoded `true`.
-   Fixed Vite proxy target from `0.0.0.0:3001` to `localhost:3001`.
-   Fixed Express 5 SPA catch-all route from `/{*splat}` to `/*`.
-   Moved `manifest.json` to `public/` for proper inclusion in production builds.
-   Added production-only guard for static file serving (prevents stale dist files in dev).
-   Added `/api/health` endpoint for DevOps monitoring.
-   Added helmet, CORS, and server-side rate limiting (Security hardening).
-   Added ARIA labels and roles to navigation tabs (Accessibility).
-   Added reduce-motion support and skip-splash option to splash screen (UX).
-   Updated deployment config from static to autoscale for backend support.
-   **Fixed PWA API key handling**: `clearApiKey` and `clearAllKeys` now properly reset in-memory service variables, preventing stale keys.
-   **API key validation**: Gemini and GitHub keys are now validated on save with user feedback (loading spinner, success/error messages). Invalid keys are rejected.
-   **Service worker fix**: `/api/ai/key` endpoint is now excluded from SW caching to prevent stale key data in PWA mode.
-   **Improved error messages**: Invalid API key errors now show clear, actionable messages instead of generic errors.
-   **GitHub API proxy**: Added `/api/github/tree/:owner/:repo` backend endpoint to route GitHub API calls server-side, fixing browser rate-limit and network issues. Frontend `githubService.ts` now calls the proxy instead of GitHub directly. User-provided GitHub tokens are forwarded to GitHub for higher rate limits and private repo access. Service worker excludes `/api/github/` from caching.
-   **Fixed manifest.json**: Removed references to non-existent screenshot files (`desktop-home.png`, `mobile-home.png`) and missing shortcut icons that caused PWA install errors. Removed unused `icon-security.png` reference. Only existing SVG icons remain.
-   **Gemini model fallback on 429/quota**: `withModelFallback` now retries with cheaper fallback models (e.g., `gemini-2.5-flash`) when the primary model hits a 429 rate limit or quota exceeded error, instead of failing immediately.
