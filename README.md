# Flash-n-Frame

**Visual Intelligence Platform** by INT Inc.

Flash-n-Frame transforms content into professional infographics using Google's Gemini AI. It converts GitHub repositories into architectural blueprints, web articles into visual summaries, and provides AI-powered style transfer and code generation.

## Features

| Feature | Description |
|---------|-------------|
| **GitFlow** | Converts GitHub repository structures into visual architectural blueprints and data flow diagrams |
| **SiteSketch** | Transforms web articles into concise, professional infographics |
| **Reality Engine** | AI-powered style transfer, wireframe-to-code generation, and component scanning |
| **DevStudio** | Interactive development environment with D3-based repository graph visualization |

## Quick Start

### Prerequisites

- Node.js 20.x+
- PostgreSQL (auto-configured on Replit)
- Google Gemini API key

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (or use Replit Secrets):
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   GEMINI_API_KEY=your-gemini-api-key
   SESSION_SECRET=your-session-secret
   ```

3. Initialize the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev:server & npm run dev
   ```

The application will be available at `http://localhost:5000`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Visualization | D3.js, Recharts |
| Backend | Express (Node.js) |
| Database | PostgreSQL + Drizzle ORM |
| AI | Google Gemini |
| Auth | Replit Auth (OpenID Connect) + Email/Password |
| PWA | Service Worker, Web App Manifest |

## Project Structure

```
flash-n-frame/
├── components/       # React UI components
├── contexts/         # React Context providers (Theme, Project, UserSettings)
├── hooks/            # Custom React hooks
├── services/         # Client-side services (Gemini, GitHub, persistence)
├── server/           # Express backend (auth, API proxy, security)
├── db/               # Drizzle ORM schema and models
├── public/           # Static assets, PWA manifest, service worker
├── docs/             # Project documentation
└── vite.config.ts    # Vite build configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server (port 5000) |
| `npm run dev:server` | Start Express API server (port 3001) |
| `npm run build` | Build production bundle to `dist/` |
| `npm run db:push` | Push database schema changes |

## Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- **[Documentation Hub](docs/DOCUMENTATION.md)** - Comprehensive guide (user guide, developer guide, API reference)
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and data flow
- **[API Reference](docs/API.md)** - Server and client-side API documentation
- **[Features](docs/FEATURES.md)** - Detailed feature descriptions
- **[Changelog](docs/CHANGELOG.md)** - Version history
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines
- **[Security](SECURITY.md)** - Security policy

## Deployment

Flash-n-Frame deploys on Replit using autoscale deployment:

- **Build:** `npm run build`
- **Run:** `npx tsx server/index.ts`
- **Port:** 5000

See [Deployment Runbook](docs/reference/deployment-runbook.md) for detailed instructions.

## License

Internal use only - INT Inc. All rights reserved.
