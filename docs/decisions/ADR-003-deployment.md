# [ADR-003] Static Deployment with API Proxy

## Status
Accepted | 2026-01-24

## Context and Problem Statement
Flash-n-Frame is a React-based SPA with a Node.js backend. We need a deployment strategy that handles both effectively on Replit.

## Decision Drivers
- Performance (CDN delivery)
- Ease of deployment
- Seamless API communication

## Decision Outcome
**Chosen:** Static Deployment with Backend Service

**Rationale:**
- Replit's static deployment is optimized for SPAs.
- Backend API runs as a persistent service, proxied via Vite during development and reachable via absolute URLs in production.

## Consequences
### Positive
- Fast initial load times
- Simplified infrastructure
### Negative
- Requires careful CORS and environment variable configuration
