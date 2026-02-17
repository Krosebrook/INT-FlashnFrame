# Troubleshooting Guide

Common issues and their solutions for Flash-n-Frame.

---

## Application Won't Start

### Problem: Port 5000 already in use
**Symptoms:** Error message about port 5000 being occupied.

**Solution:**
```bash
# Find and kill the process using port 5000
lsof -i :5000
kill -9 <PID>
# Restart the app
npm run dev:server & npm run dev
```

### Problem: Database connection failed
**Symptoms:** Error mentioning `DATABASE_URL` or PostgreSQL connection refused.

**Solution:**
1. Verify `DATABASE_URL` is set in Replit Secrets or your `.env` file
2. On Replit, the PostgreSQL database should be auto-configured
3. Push the schema: `npm run db:push`
4. If the database was recently created, restart the application

### Problem: "GEMINI_API_KEY not configured"
**Symptoms:** AI features don't work, health check shows missing key.

**Solution:**
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add it as `GEMINI_API_KEY` in Replit Secrets
3. Restart the application
4. Alternatively, users can set their own key via the Settings modal (gear icon)

---

## Authentication Issues

### Problem: 401 Unauthorized on page load
**Symptoms:** Browser console shows `401` error from `/api/auth/user`.

**This is expected behavior.** When no user is logged in, the app checks for an existing session and receives a 401. The frontend handles this gracefully by showing the "not logged in" state. No action needed.

### Problem: Login redirect fails
**Symptoms:** Clicking Login redirects but never completes.

**Solution:**
1. Ensure `SESSION_SECRET` is set in environment variables
2. Verify the cookie `secure` flag matches your environment (HTTPS in production, HTTP in dev)
3. Check that the Express server is running on port 3001
4. Clear browser cookies and try again

### Problem: "Magic Link" or "Phone Auth" returns error
**Symptoms:** 501 Not Implemented response.

**Expected behavior.** These authentication methods are placeholder endpoints that require SendGrid (magic link) or Twilio (phone) to be configured. Use Replit Auth or email/password login instead.

---

## AI/Gemini Issues

### Problem: Rate limit errors (429)
**Symptoms:** "Rate limit exceeded" or "quota exceeded" messages.

**Solution:**
1. Wait for the rate limit countdown to expire (shown in the UI banner)
2. The app automatically tries cheaper fallback models (e.g., `gemini-2.5-flash`) when primary models hit rate limits
3. For higher limits, use your own Gemini API key via Settings (gear icon)
4. Cached results remain accessible during rate limit periods

### Problem: "Model not found" errors
**Symptoms:** 404 errors mentioning Gemini model names.

**Solution:** The app has automatic model fallback. If you see persistent 404s:
1. Check that your Gemini API key is valid at [Google AI Studio](https://aistudio.google.com/)
2. The model list is in `services/geminiService.ts` - ensure models are current
3. Fallback order: primary model → alternative models → error message

### Problem: Infographic generation returns blank or error
**Symptoms:** No image generated, or generic error message.

**Solution:**
1. Check browser console for specific error details
2. Verify Gemini API key is set (Settings → gear icon, or environment variable)
3. Try a different/simpler repository or article URL
4. Clear the API cache by refreshing the page

---

## GitHub Integration Issues

### Problem: "Repository not found" for public repos
**Symptoms:** Error when analyzing a valid public GitHub repository.

**Solution:**
1. Verify the URL format: `https://github.com/owner/repo`
2. GitHub API has rate limits (60/hour without token, 5000/hour with token)
3. Add a GitHub Personal Access Token in Settings for higher limits
4. The app uses a server-side proxy (`/api/github/tree/`) - check server logs

### Problem: Can't access private repositories
**Symptoms:** 404 or forbidden errors for private repos.

**Solution:**
1. Open Settings (gear icon in header)
2. Add your GitHub Personal Access Token (needs `repo` scope)
3. Generate a token at [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
4. The token is forwarded server-side to GitHub for authentication

---

## PWA Issues

### Problem: App doesn't install / no install prompt
**Symptoms:** No "Install" button appears.

**Solution:**
1. PWA install only works in Chrome, Edge, and Samsung Internet
2. The app must be served over HTTPS (automatic on Replit deployments)
3. The `beforeinstallprompt` event fires only once per session
4. Try clearing the browser's PWA cache and refreshing
5. Check Chrome DevTools > Application > Manifest for errors

### Problem: Stale data after update
**Symptoms:** Old content shown even after deploying changes.

**Solution:**
1. The service worker may be serving cached content
2. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. Chrome DevTools > Application > Service Workers > "Update on reload"
4. Clear site data: DevTools > Application > Storage > "Clear site data"

---

## Build/Deployment Issues

### Problem: Build fails
**Symptoms:** `npm run build` returns errors.

**Solution:**
1. Check for TypeScript errors: `npx tsc --noEmit`
2. Ensure all dependencies are installed: `npm install`
3. Check for import errors (missing files, wrong paths)
4. Review the build output for specific error messages

### Problem: Production app shows blank page
**Symptoms:** Deployed app loads but shows nothing.

**Solution:**
1. Ensure the build succeeded (`dist/` directory has files)
2. Check that Express serves static files from `dist/` in production
3. Verify the SPA catch-all route is working (`app.get("/*")`)
4. Check deployment logs for server startup errors
5. Verify `DATABASE_URL` and `GEMINI_API_KEY` are set in production secrets

### Problem: CORS errors in production
**Symptoms:** Browser console shows CORS-related errors.

**Solution:**
1. Production CORS only allows `*.replit.app` and `*.replit.dev` origins
2. Ensure you're accessing the app through the Replit deployment URL
3. Custom domains need to be added to the CORS allowlist in `server/index.ts`

---

## Performance Issues

### Problem: High CPU usage when idle
**Symptoms:** Browser tab uses excessive CPU when app is in background.

**Solution:**
1. All animations should pause when the tab is hidden (Page Visibility API)
2. Canvas animations are FPS-capped (20-30 FPS)
3. If you notice high CPU, check Chrome DevTools > Performance for the culprit
4. Report persistent high CPU issues with the Performance tab recording

### Problem: Slow initial load
**Symptoms:** App takes several seconds to become interactive.

**Solution:**
1. Components are lazy-loaded; first load downloads the active view
2. Service worker caches assets after first visit
3. In development, Vite's HMR is slower than production builds
4. Production builds are optimized with tree-shaking and minification

---

## Still Stuck?

1. Check the browser console (F12 > Console) for error details
2. Check the server logs in the Replit console
3. Review the [API Reference](../API.md) for endpoint details
4. Check the [Security Invariants](../context-notes/security-invariants.md)
5. Ask the development team for help
