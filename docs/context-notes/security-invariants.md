# Security Invariants

**Date:** 2026-01-24
**Type:** Invariant

## The Rule
API Keys MUST NEVER be logged to the console or stored in the database in plain text.

## Why This Matters
Logging keys exposes them in service logs, and plain-text DB storage creates a massive security risk if the database is compromised.

## The Right Way
Use `UserContext` to manage keys in browser `localStorage` for client-side use, or use Replit Secrets for server-side processing.

## Related
- ADR-002: Authentication Strategy
- [Environment Variables](../reference/env-vars.md)
