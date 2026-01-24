# [ADR-002] Multi-Provider Authentication Strategy

## Status
Accepted | 2026-01-22

## Context and Problem Statement
Users need a secure way to authenticate. We need to support both social logins (for low friction) and traditional email/password (for accessibility).

## Decision Drivers
- Ease of use for Replit users
- Security of password storage
- Support for mobile/PWA environment

## Decision Outcome
**Chosen:** Hybrid Replit Auth + Custom Email/Password (bcrypt)

**Rationale:**
- Replit Auth provides seamless one-click login for the primary audience.
- Custom email/password with bcrypt ensures users without Replit accounts can still use the platform securely.
- Using a separate Auth Server allows for better separation of concerns and scaling.

## Consequences
### Positive
- Flexible onboarding for all user types
- Secure password hashing out of the box
### Negative
- Complexity of managing two authentication flows
- Need for session synchronization between Vite proxy and Auth Server
