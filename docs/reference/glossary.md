# Glossary

Key terms and concepts used in Flash-n-Frame.

## Product Terms

| Term | Definition |
|------|-----------|
| **Flash-n-Frame** | The visual intelligence platform built by INT Inc. |
| **GitFlow** | Feature that converts GitHub repositories into visual architectural blueprints. Not related to the Git branching model. |
| **SiteSketch** | Feature that transforms web articles into visual infographic summaries. |
| **Reality Engine** | Feature providing AI-powered style transfer, wireframe-to-code generation, and component scanning. |
| **DevStudio** | Interactive development environment with D3-based force-directed graph visualization for exploring repository structures. |

## Technical Terms

| Term | Definition |
|------|-----------|
| **Autoscale Deployment** | Replit deployment type that scales server instances with traffic and sleeps when idle. Used for apps with backend requirements. |
| **Drizzle ORM** | Type-safe SQL toolkit used for database queries and schema management. |
| **Force-Directed Graph** | D3.js visualization technique where nodes repel and edges attract, creating organic layouts for repository file structures. |
| **Glassmorphism** | UI design style using frosted-glass effects with transparency and blur, used throughout Flash-n-Frame's interface. |
| **IndexedDB** | Browser-based database used for client-side persistence (history, tasks, project state). |
| **Model Fallback** | Automatic retry mechanism where Gemini API calls try alternative (cheaper) models when the primary model fails or hits rate limits. |
| **PWA (Progressive Web App)** | Web application that can be installed on devices and work offline, using service workers and web app manifest. |
| **Rate Limiting** | Server-side restriction on API request frequency to prevent abuse (auth: 20/15min, general: 100/min). |
| **Replit Auth** | OpenID Connect authentication integration provided by Replit, supporting OAuth via Google, GitHub, X, and Apple. |
| **Service Worker** | Background script (`public/sw.js`) that caches assets for offline use and manages network requests. |
| **Toast** | Brief notification message that appears temporarily to provide user feedback (success, error, warning, info). |

## API Terms

| Term | Definition |
|------|-----------|
| **ADR** | Architecture Decision Record - document capturing a significant design decision with context, options, and rationale. |
| **Bcrypt** | Password hashing algorithm used with 12 salt rounds for secure password storage. |
| **CORS** | Cross-Origin Resource Sharing - security mechanism controlling which domains can make API requests. |
| **CSRF** | Cross-Site Request Forgery - attack prevented via token-based validation. |
| **Helmet** | Express middleware that sets HTTP security headers. |
| **SPA** | Single Page Application - the frontend is a single HTML page with client-side routing. |
| **TTL** | Time To Live - duration that cached data remains valid before expiring (text: 5min, images: 10min). |

## Environment Terms

| Term | Definition |
|------|-----------|
| **Replit Secrets** | Encrypted environment variables stored in Replit's platform, used for API keys and credentials. |
| **Neon** | PostgreSQL provider that backs Replit's built-in database. |
| **Vite** | Frontend build tool that provides fast development server with hot module replacement (HMR). |
