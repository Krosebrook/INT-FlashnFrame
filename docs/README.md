# Flash-n-Frame Documentation

Visual intelligence platform that transforms content into professional infographics.

**TL;DR:** Flash-n-Frame converts GitHub repositories and web articles into visual infographics using Google Gemini AI. It features a glassmorphism UI, PWA support, and multi-provider authentication.

## Navigation

### Core Documentation
- **[Documentation Hub](DOCUMENTATION.md)** - Comprehensive guide (user guide, developer guide, API reference)
- **[Architecture](ARCHITECTURE.md)** - System architecture and data flow
- **[API Reference](API.md)** - Server-side REST API and client-side services
- **[Features](FEATURES.md)** - Detailed feature descriptions
- **[Changelog](CHANGELOG.md)** - Version history

### Getting Started
- **[Onboarding Guide](how-to-guides/onboarding.md)** - New developer setup and walkthrough
- **[Contributing](../CONTRIBUTING.md)** - Contribution workflow and code standards
- **[Environment Variables](.env.example)** - Required configuration template

### Architecture Decision Records (ADRs)
- **[ADR-001: Database](decisions/ADR-001-database.md)** - PostgreSQL with Drizzle ORM
- **[ADR-002: Authentication](decisions/ADR-002-auth.md)** - Hybrid Replit Auth + Custom Email/Password
- **[ADR-003: Deployment](decisions/ADR-003-deployment.md)** - Autoscale deployment on Replit

### Reference
- **[Database Schema](reference/database-schema.md)** - Tables, columns, and data types
- **[Deployment Runbook](reference/deployment-runbook.md)** - Deploy, monitor, and rollback procedures
- **[Testing Strategy](reference/testing-strategy.md)** - Test approach and coverage goals
- **[Glossary](reference/glossary.md)** - Project terminology definitions

### Context Notes
- **[Security Invariants](context-notes/security-invariants.md)** - Critical security rules
- **[Performance Constraints](context-notes/performance-constraints.md)** - FPS caps, CPU targets

### Troubleshooting
- **[Troubleshooting Guide](errors/troubleshooting.md)** - Common issues and solutions

### Diagrams
- **[System Context](diagrams/system-context.mmd)** - C4 Level 1 diagram (Mermaid)

### Planning & Assessment
- **[Executive Summary](EXECUTIVE_SUMMARY.md)** - Architecture assessment and recommendations
- **[Refactoring Roadmap](REFACTORING_ROADMAP.md)** - Planned improvements and progress
- **[Best Practices](BEST_PRACTICES.md)** - Development guidelines

### Security
- **[Security Policy](../SECURITY.md)** - Vulnerability reporting and security measures
- **[Security Invariants](context-notes/security-invariants.md)** - Rules that must never be violated

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values
3. Run `npm install`
4. Run `npm run db:push` to sync database schema
5. Run `npm run dev:server & npm run dev` to start development

See the [Onboarding Guide](how-to-guides/onboarding.md) for detailed instructions.

---
*Last Updated: 2026-02-17*
