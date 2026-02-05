# Flash-n-Frame Documentation

Visual intelligence platform that transforms content into professional infographics.

**TL;DR:** Flash-n-Frame converts GitHub repositories and web articles into visual infographics using Google Gemini AI. It features a glassmorphism UI, PWA support, and multi-provider authentication.

## Navigation

### Core Documentation
- **[Architecture Overview](explanation/architecture-overview.md)** - High-level system design
- **[API Reference](api/auth.md)** - Authentication API contracts
- **[Changelog](../docs/CHANGELOG.md)** - Version history

### Architecture Decision Records (ADRs)
- **[ADR-001: Database](decisions/ADR-001-database.md)** - PostgreSQL with Drizzle ORM
- **[ADR-002: Authentication](decisions/ADR-002-auth.md)** - Hybrid Replit Auth + Custom Email/Password
- **[ADR-003: Deployment](decisions/ADR-003-deployment.md)** - Static deployment with API proxy

### Context Notes
- **[Security Invariants](context-notes/security-invariants.md)** - Critical security rules
- **[Performance Constraints](context-notes/performance-constraints.md)** - FPS caps, CPU targets

### Diagrams
- **[System Context](diagrams/system-context.mmd)** - C4 Level 1 diagram (Mermaid)

### Reference
- **[Environment Variables](.env.example)** - Required configuration

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values
3. Run `npm install`
4. Run `npm run db:push` to sync database schema
5. Run `npm run dev` to start development server

---
*Last Updated: 2026-02-05*
