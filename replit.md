# Flash-n-Frame

## Overview

Flash-n-Frame is a visual intelligence platform that transforms content into professional infographics using Google's Gemini AI. Its core capabilities include:

-   **GitFlow (GitHub Repository Analyzer)**: Converts GitHub repository structures into visual architectural blueprints and data flow diagrams.
-   **SiteSketch (Article to Infographic)**: Transforms web articles into concise, professional infographics.
-   **Reality Engine**: Provides AI-powered style transfer and wireframe-to-code generation.
-   **DevStudio**: An interactive development environment for exploring repository graphs with D3 visualization.

The platform aims to revolutionize content visualization and development workflow efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
-   **Framework**: React 19 with TypeScript.
-   **Build Tool**: Vite 6 with `@tailwindcss/vite` plugin.
-   **Styling**: Tailwind CSS v4 with custom themes (dark, light, solarized).
-   **Visualization**: D3.js for interactive force-directed graph rendering.
-   **State Management**: React Context API (ThemeContext, ProjectContext).
-   **PWA**: Progressive Web App with service worker for offline capabilities and enhanced user experience.
-   **UI/UX Decisions**: Incorporates branded neon-style images, a dynamic splash page with circuit patterns and animated elements, and consistent theme-based UI elements across the application.

### Component Structure
The application uses a modular component architecture including:
-   Root components for lazy loading and view navigation.
-   Dedicated components for each core feature (RepoAnalyzer, ArticleToInfographic, ImageEditor, DevStudio).
-   Reusable UI components for navigation, history display, and infographic results.
-   Modal components for user interactions (e.g., keyboard shortcuts).

### Data Flow
The system processes user-provided content (GitHub repo URLs or article URLs), sends it to Gemini AI for processing (e.g., infographic generation, image editing), and displays the results. History and project states are persisted locally using IndexedDB.

### API Resilience & Caching
-   **Smart Retry**: All Gemini API calls use exponential backoff (2 retries, 2s initial delay). Rate limit errors (429), permission (403), not-found (404), and safety errors skip retries and fail immediately.
-   **Response Caching**: Text-based API results (code review, tests, docs, gap analysis) cached for 5 minutes. Image results cached for 10 minutes. Uses `apiCache` from `services/cache.ts`.
-   **Request Deduplication**: Infographic generation and DevStudio tools use `deduplicatedFetch` to prevent duplicate in-flight requests.
-   **Service-Level Rate Limit Tracking**: `geminiService.ts` tracks rate limits at the service level (`globalRateLimitUntil`), synced with the UI via `RateLimitContext`.
-   **Pre-Flight Guards**: All 4 feature components check `checkBeforeCall()` before making API requests to prevent wasted calls during cooldown.
-   **Graceful Degradation**: Rate limit banner shows countdown, cached results remain accessible, and network errors are distinguished from rate limits.

### API Key Management
User-specific API keys for services like GitHub, Gemini, OpenAI, etc., can be managed via a dedicated settings modal and stored in browser localStorage. The system falls back to environment variables if user-provided keys are not available.

### Authentication
A full user signup and authentication system is implemented, supporting email/password and social logins (Google, GitHub, X, Apple) via OpenID Connect. User sessions are managed with a PostgreSQL backend.

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

### Environment Variables Required
-   `DATABASE_URL`: PostgreSQL connection string.
-   `GEMINI_API_KEY`: Google Gemini API key.