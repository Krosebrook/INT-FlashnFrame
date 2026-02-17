# Deployment Runbook

Step-by-step guide for deploying, monitoring, and recovering Flash-n-Frame.

## Deployment Overview

| Item | Value |
|------|-------|
| Platform | Replit |
| Type | Autoscale |
| Build | `npm run build` (Vite → `dist/`) |
| Run | `npx tsx server/index.ts` |
| Port | 5000 |
| Database | PostgreSQL (Neon-backed, Replit-managed) |

## Pre-Deployment Checklist

- [ ] All changes committed and pushed
- [ ] `npm run build` succeeds locally without errors
- [ ] Environment variables set in Replit Secrets:
  - `DATABASE_URL` (auto-configured)
  - `GEMINI_API_KEY`
  - `SESSION_SECRET`
- [ ] Database schema is up to date (`npm run db:push`)
- [ ] Manual smoke tests pass (see [Testing Strategy](testing-strategy.md))
- [ ] No console.log statements with sensitive data

## Deploying

### Via Replit UI

1. Click the **Publish** button in the Replit workspace
2. Select **Autoscale** deployment type
3. Verify the build and run commands:
   - Build: `npm run build`
   - Run: `npx tsx server/index.ts`
4. Click **Publish**
5. Wait for the deployment to complete
6. Verify the live URL loads correctly

### Deployment Configuration

The deployment config is managed via `deploy_config_tool`:
```json
{
  "deployment_target": "autoscale",
  "build": ["npm", "run", "build"],
  "run": ["npx", "tsx", "server/index.ts"]
}
```

## Post-Deployment Verification

### Health Check

```bash
curl https://your-app.replit.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 12.345,
  "timestamp": "2026-02-17T...",
  "environment": "production"
}
```

### Connectivity Check

```bash
curl https://your-app.replit.app/api/ping
```

Expected: `"pong"`

### Full Verification

1. Load the app URL in a browser
2. Verify splash screen appears
3. Navigate to each feature tab
4. Test login flow
5. Test GitFlow with a public repository
6. Check browser console for unexpected errors

## Monitoring

### Server Health

- `GET /api/health` - Returns status, uptime, timestamp, environment
- `GET /api/ping` - Simple connectivity check

### Key Metrics to Watch

| Metric | Where to Check | Concern Threshold |
|--------|----------------|-------------------|
| Response time | Replit deployment logs | > 5 seconds |
| Error rate | Browser console / server logs | > 1% of requests |
| Memory usage | Replit resource monitor | > 512MB |
| Cold start time | First request after idle | > 10 seconds |

### Checking Logs

- **Development**: View logs in the Replit console output
- **Production**: Use Replit's deployment logs viewer
- **Browser**: F12 > Console for frontend errors

## Rollback Procedures

### Quick Rollback (Replit Checkpoints)

1. Open the Replit project
2. Go to the Version History / Checkpoints panel
3. Select the last known-good checkpoint
4. Click "Restore"
5. Re-deploy from the restored state

### Manual Rollback (Git)

```bash
# View recent commits
git log --oneline -10

# Identify the last good commit
# Restore files from that commit (via Replit UI or checkpoint)

# Re-deploy
npm run build
# Click Publish in Replit
```

### Database Rollback

- Replit PostgreSQL supports database rollback via checkpoints
- Drizzle ORM schema changes are forward-only (no down migrations)
- For data issues, use the SQL tool in Replit to inspect and fix records

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P1 - Critical | App completely down | Immediate | Server won't start, database unreachable |
| P2 - Major | Core feature broken | < 1 hour | GitFlow fails, auth broken |
| P3 - Minor | Non-core issue | < 4 hours | Theme toggle broken, PWA install fails |
| P4 - Low | Cosmetic/minor | Next sprint | Typo, alignment issue |

### P1 Response Steps

1. **Assess**: Check deployment logs for error messages
2. **Communicate**: Notify the team
3. **Mitigate**: Roll back to last known-good deployment
4. **Investigate**: Review git diff between current and last-good
5. **Fix**: Apply fix and re-deploy
6. **Post-mortem**: Document what went wrong and prevention

### Common Production Issues

| Issue | Quick Fix |
|-------|-----------|
| Cold start timeout | Hit `/api/health` to warm up; consider VM deployment if frequent |
| Database connection refused | Check `DATABASE_URL` in secrets; verify Replit DB is running |
| Gemini API errors | Check API key validity; model fallback should handle automatically |
| CORS errors | Ensure accessing via `*.replit.app` domain |
| Stale service worker | Users need to hard-refresh (`Ctrl+Shift+R`) |

## Environment Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Port | 5000 (Vite) + 3001 (Express) | 5000 (Express serves all) |
| Static files | Vite dev server | Express from `dist/` |
| CORS | All origins allowed | `*.replit.app`, `*.replit.dev` only |
| Cookies | `secure: false` | `secure: true` |
| API proxy | Vite proxy → localhost:3001 | Direct Express routes |
| Cache headers | No caching | HTML: no-cache, assets: 1 day |

## Related

- [ADR-003: Deployment Decision](../decisions/ADR-003-deployment.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Troubleshooting](../errors/troubleshooting.md)
