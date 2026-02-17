# Developer Onboarding Guide

Welcome to Flash-n-Frame! This guide will get you up and running quickly.

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | 20.x+ | Pre-installed on Replit |
| npm | 10.x+ | Comes with Node.js |
| PostgreSQL | 15+ | Auto-configured on Replit |
| Git | 2.x+ | Pre-installed on Replit |

## Step 1: Environment Setup

### On Replit (Recommended)

1. Fork or open the Flash-n-Frame project on Replit
2. The environment is pre-configured with Node.js, PostgreSQL, and all dependencies
3. Set the following secrets in Replit's Secrets tab:

| Secret | How to Get It |
|--------|---------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) - Create a free API key |
| `SESSION_SECRET` | Generate a random 32+ character string |
| `DATABASE_URL` | Auto-configured by Replit PostgreSQL |

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flash-n-frame
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (see `docs/.env.example` for template):
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/flashnframe
   GEMINI_API_KEY=your-key
   SESSION_SECRET=your-secret
   ```

4. Set up PostgreSQL and push the schema:
   ```bash
   npm run db:push
   ```

## Step 2: Start the Application

Run both the backend API server and the frontend dev server:

```bash
npm run dev:server & npm run dev
```

- **Frontend (Vite)**: http://localhost:5000
- **Backend (Express)**: http://localhost:3001 (proxied through Vite)

## Step 3: Verify Everything Works

1. Open http://localhost:5000 in your browser
2. You should see the Flash-n-Frame splash screen
3. After the splash, the home page shows 4 feature cards
4. Check the browser console - a `401` from `/api/auth/user` is normal (means you're not logged in)
5. Try analyzing a public GitHub repo in GitFlow (e.g., `https://github.com/expressjs/express`)

## Step 4: Understand the Architecture

### Key Directories

| Directory | Purpose | Start Here |
|-----------|---------|------------|
| `components/` | React UI components | `Home.tsx`, `RepoAnalyzer.tsx` |
| `contexts/` | Global state (Theme, Project, UserSettings) | `ThemeContext.tsx` |
| `hooks/` | Reusable logic | `useAuth.ts` |
| `services/` | API integrations (Gemini, GitHub, cache) | `geminiService.ts` |
| `server/` | Express backend (auth, proxy, security) | `server/index.ts` |
| `db/` | Database schema and ORM | `db/models/auth.ts` |
| `public/` | Static assets, PWA files | `manifest.json`, `sw.js` |

### Key Concepts

- **Views**: The app has 5 views (Home, GitFlow, SiteSketch, Reality Engine, DevStudio) rendered by `App.tsx`
- **Contexts**: Three React Contexts manage global state - Theme, Project, and UserSettings
- **Service Worker**: `public/sw.js` handles PWA caching but excludes API routes (`/api/*`)
- **Gemini Models**: AI calls use model fallback arrays (tries primary model, falls back to cheaper alternatives on errors)

### Data Flow (Repository Analysis)

```
User enters GitHub URL
    → githubService.ts calls /api/github/tree/:owner/:repo (server proxy)
    → Server fetches from GitHub API (uses token if provided)
    → File tree returned to frontend
    → geminiService.ts sends tree to Gemini AI for infographic generation
    → Result cached in memory (5min TTL) and IndexedDB (persistent)
    → Infographic displayed to user
```

## Step 5: Common Development Tasks

### Adding a New Server Endpoint

1. Open `server/index.ts`
2. Add your route handler (follow existing patterns)
3. Consider rate limiting for public endpoints
4. Restart the server: `npm run dev:server`

### Modifying the UI

1. Components are in `components/`
2. Use Tailwind CSS classes (v4 syntax)
3. Test across all 3 themes (dark, light, solarized)
4. Add ARIA labels to interactive elements

### Working with the Database

1. Schema is in `db/models/auth.ts`
2. Use Drizzle ORM for queries (see `server/index.ts` for examples)
3. Push schema changes: `npm run db:push`

## Helpful Resources

- [Architecture Documentation](../ARCHITECTURE.md)
- [API Reference](../API.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Security Policy](../../SECURITY.md)
- [Troubleshooting](../errors/troubleshooting.md)
- [Glossary](../reference/glossary.md)
