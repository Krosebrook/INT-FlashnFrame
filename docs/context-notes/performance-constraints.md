# Performance Constraints

**Date:** 2026-01-24
**Type:** Constraint

## The Rules
1. **Idle CPU Usage:** Must remain below 5%.
2. **Animation FPS:** Capped at 30 FPS.
3. **Visibility Awareness:** All background tasks must pause when the tab is hidden.

## Why This Matters
High resource usage triggers Replit's auto-sleep and degrades the user experience on mobile devices.

## How to Verify
Use Chrome DevTools Performance tab to monitor CPU and FPS.

## Related
- [Architecture Overview](../explanation/architecture-overview.md)
