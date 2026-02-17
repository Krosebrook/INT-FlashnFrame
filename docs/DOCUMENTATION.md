# Flash-n-Frame Documentation

> **Visual Intelligence Platform** | Version 3.1.0 | February 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [User Guide](#3-user-guide)
4. [Developer Guide](#4-developer-guide)
5. [API Reference](#5-api-reference)
6. [Architecture](#6-architecture)
7. [Configuration Reference](#7-configuration-reference)
8. [Testing & Quality](#8-testing--quality)
9. [Security & Compliance](#9-security--compliance)
10. [Deployment & Operations](#10-deployment--operations)
11. [Troubleshooting](#11-troubleshooting)
12. [Changelog](#12-changelog)
13. [Appendices](#13-appendices)

---

## 1. Overview

### 1.1 Purpose

Flash-n-Frame is a visual intelligence platform that transforms content into professional infographics. It leverages Google's Gemini AI to convert code repositories, articles, and designs into visual representations.

### 1.2 Core Features

| Feature | Description |
|---------|-------------|
| **GitFlow** | Converts GitHub repository structures into visual architectural blueprints |
| **SiteSketch** | Transforms web articles into concise, professional infographics |
| **Reality Engine** | AI-powered style transfer and wireframe-to-code generation |
| **DevStudio** | Interactive development environment with D3 visualization |

### 1.3 Supported Platforms

- **Web Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Android Chrome 90+
- **PWA**: Installable on desktop and mobile devices

### 1.4 Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

---

## 2. Getting Started

### 2.1 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20.x+ | Runtime environment |
| npm | 10.x+ | Package management |
| PostgreSQL | 15+ | Database (auto-configured on Replit) |
| Git | 2.x+ | Version control |

### 2.2 Quick Start

#### Step 1: Clone and Install

```bash
git clone <repository-url>
cd flash-n-frame
npm install
```

#### Step 2: Configure Environment

Create environment variables (or use Replit Secrets):

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your-gemini-api-key
REPLIT_DOMAINS=your-app.replit.app
SESSION_SECRET=your-session-secret
```

#### Step 3: Initialize Database

```bash
npm run db:push
```

#### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 2.3 First-Run Checklist

- [ ] Environment variables configured
- [ ] Database initialized
- [ ] API keys added (Gemini, optionally GitHub)
- [ ] Application loads without errors
- [ ] PWA install prompt appears (optional)

---

## 3. User Guide

### 3.1 Navigation

The application has four main sections accessible via:
- **Home Cards**: Click feature cards on the landing page
- **Navigation Tabs**: Use the tab bar at the top
- **Keyboard Shortcuts**: See [Keyboard Shortcuts](#33-keyboard-shortcuts)

### 3.2 Features Walkthrough

#### 3.2.1 GitFlow (Repository Analyzer)

**Purpose**: Convert GitHub repositories into visual architecture diagrams.

**How to Use**:
1. Navigate to GitFlow tab
2. Enter a GitHub repository URL (e.g., `https://github.com/user/repo`)
3. Click "Analyze"
4. View generated infographic
5. Optionally click "Explore in DevStudio" for interactive graph

**Sub-Features**:
- Dependency Graph Generator
- Multi-ecosystem support (npm, pip, cargo, go)
- Version badges and security analysis

#### 3.2.2 SiteSketch (Article to Infographic)

**Purpose**: Transform web articles into visual infographics.

**How to Use**:
1. Navigate to SiteSketch tab
2. Enter an article URL
3. Select output style (summary, comparison, stats)
4. Click "Generate"
5. Download or share the result

**Sub-Features**:
- Multi-Source Comparison (2-3 URLs)
- Key Stats Extractor
- Custom styling options

#### 3.2.3 Reality Engine

**Purpose**: AI-powered style transfer and code generation.

**How to Use**:
1. Navigate to Reality Engine tab
2. Upload an image or wireframe
3. Select operation (Style Transfer, UI-to-Code, etc.)
4. Configure options
5. Press `Ctrl+Enter` or click "Generate"

**Sub-Features**:
- Component Library Scanner
- Responsive Variant Generator
- Dashboard Generator

#### 3.2.4 DevStudio

**Purpose**: Interactive code exploration with D3 graphs.

**How to Use**:
1. Analyze a repository in GitFlow first
2. Click "Explore in DevStudio"
3. Interact with the force-directed graph
4. Click nodes for details
5. Use AI tools for code review

**Sub-Features**:
- AI Code Review
- Test Case Generator
- Documentation Generator
- Gap/Bottleneck Catcher

### 3.3 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+1` | Navigate to Home |
| `Alt+2` | Navigate to GitFlow |
| `Alt+3` | Navigate to SiteSketch |
| `Alt+4` | Navigate to Reality Engine |
| `Alt+5` | Navigate to DevStudio |
| `Shift+?` | Show shortcuts help |
| `Ctrl+Enter` | Execute render (Reality Engine) |

### 3.4 Theme System

Three themes are available:
- **Dark** (default): Dark background with purple accents
- **Light**: Light background for bright environments
- **Solarized**: Warm color scheme

Toggle themes using the button in the header.

### 3.5 PWA Features

#### Installing the App

1. Look for the install prompt at the bottom of the screen
2. Click "Install" to add to your device
3. Access Flash-n-Frame from your app drawer/home screen

#### Offline Support

- Previously viewed content is cached
- Offline page displays when no connection
- Auto-reconnects when connection returns

---

## 4. Developer Guide

### 4.1 Project Structure

```
flash-n-frame/
├── components/           # React components
│   ├── AppHeader.tsx     # Main navigation header
│   ├── AuthModal.tsx     # Authentication modal
│   ├── Home.tsx          # Landing page
│   ├── RepoAnalyzer.tsx  # GitFlow feature
│   ├── ArticleToInfographic.tsx  # SiteSketch feature
│   ├── ImageEditor.tsx   # Reality Engine
│   ├── DevStudio.tsx     # Code explorer
│   ├── D3FlowChart.tsx   # D3 visualization
│   ├── PWAPrompts.tsx    # PWA UI components
│   ├── backgrounds/      # Background effects
│   ├── drawer/           # Drawer panels
│   ├── modals/           # Modal components
│   └── viz/              # Data visualization
├── contexts/             # React contexts
│   ├── ThemeContext.tsx  # Theme management
│   ├── ProjectContext.tsx # Project state
│   └── UserSettingsContext.tsx # User API keys
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication
│   ├── usePWA.ts         # PWA features
│   ├── useFileHandler.ts # File operations
│   └── useTaskManagement.ts # Task CRUD
├── services/             # External services
│   ├── geminiService.ts  # Gemini AI integration
│   ├── githubService.ts  # GitHub API
│   └── persistence.ts    # IndexedDB storage
├── server/               # Backend
│   └── index.ts          # Express auth server
├── db/                   # Database
│   ├── index.ts          # Drizzle client
│   └── schema.ts         # Database schema
├── public/               # Static assets
│   ├── icons/            # PWA icons
│   └── offline.html      # Offline fallback
├── docs/                 # Documentation
├── sw.js                 # Service worker
├── manifest.json         # PWA manifest
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── vite.config.ts        # Vite configuration
```

### 4.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Build | Vite 6 |
| Visualization | D3.js |
| Icons | Lucide React |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Replit Auth (OpenID Connect) |
| AI | Google Gemini |
| PWA | Service Worker, Web App Manifest |

### 4.3 State Management

#### ThemeContext

```typescript
const { theme, setTheme, cycleTheme } = useTheme();
// theme: 'dark' | 'light' | 'solarized'
```

#### ProjectContext

```typescript
const { 
  currentProject,    // { repoName, fileTree, graphData }
  history,           // Analysis history
  addToHistory,      // Add to history
  setCurrentProject  // Set project
} = useProjectContext();
```

#### UserSettingsContext

```typescript
const {
  settings,        // API keys stored in localStorage
  updateSettings,  // Update keys
  hasKeys          // Check if keys configured
} = useUserSettings();
```

### 4.4 Adding New Features

#### Step 1: Create Component

```typescript
// components/NewFeature.tsx
import { useProjectContext } from '../contexts/ProjectContext';

export function NewFeature() {
  const { history, addToHistory } = useProjectContext();
  
  return (
    <div className="p-6">
      {/* Feature implementation */}
    </div>
  );
}
```

#### Step 2: Add to Navigation

```typescript
// App.tsx - Add to views object
const views: Record<View, React.ReactNode> = {
  // ... existing views
  'newfeature': <NewFeature />
};
```

#### Step 3: Add Keyboard Shortcut (Optional)

```typescript
// App.tsx - Add to useEffect keyboard handler
case '6':
  if (e.altKey) setCurrentView('newfeature');
  break;
```

### 4.5 Code Conventions

- **Components**: PascalCase (e.g., `RepoAnalyzer.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `geminiService.ts`)
- **Types**: PascalCase with descriptive names
- **CSS**: Tailwind utility classes, avoid custom CSS

### 4.6 Inline Documentation

Use JSDoc for functions:

```typescript
/**
 * Generates an infographic from repository data
 * @param repoUrl - GitHub repository URL
 * @param options - Generation options
 * @returns Promise resolving to base64 image data
 */
async function generateInfographic(
  repoUrl: string, 
  options: GenerationOptions
): Promise<string> {
  // Implementation
}
```

---

## 5. API Reference

### 5.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/login` | Initiate Replit OAuth login |
| GET | `/api/callback` | OAuth callback handler |
| GET | `/api/logout` | End user session |
| GET | `/api/auth/user` | Get current user info |
| POST | `/api/auth/magic-link` | Send magic link email |
| POST | `/api/auth/phone` | Initiate phone verification |

### 5.2 User Endpoint Response

```json
GET /api/auth/user

// Authenticated
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "profileImage": "https://..."
}

// Not authenticated
401 Unauthorized
```

### 5.3 Gemini Service API

```typescript
// Generate infographic from text
generateInfographic(content: string, style?: string): Promise<string>

// Edit existing image
editImage(imageBase64: string, prompt: string): Promise<string>

// Convert image to vector
vectorizeImage(imageBase64: string): Promise<string>

// Generate code from wireframe
generateCodeFromWireframe(imageBase64: string, framework: string): Promise<string>

// Q&A about image
askAboutImage(imageBase64: string, question: string): Promise<string>
```

### 5.4 GitHub Service API

```typescript
// Fetch repository file tree
fetchRepoTree(owner: string, repo: string, token?: string): Promise<FileTree>

// Fetch file contents
fetchFileContent(owner: string, repo: string, path: string): Promise<string>
```

### 5.5 Persistence Service API

```typescript
// History operations
saveHistory(item: HistoryItem): Promise<void>
getHistory(): Promise<HistoryItem[]>
clearHistory(): Promise<void>

// Task operations  
saveTasks(tasks: Task[]): Promise<void>
getTasks(): Promise<Task[]>

// Project state
saveProjectState(state: ProjectState): Promise<void>
getProjectState(): Promise<ProjectState | null>
```

---

## 6. Architecture

### 6.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ React UI │  │ Contexts │  │  Hooks   │  │ Service Worker   │ │
│  │ (Vite)   │  │ (State)  │  │ (Logic)  │  │ (Caching/Offline)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │           │
│       └─────────────┴─────────────┴──────────────────┘           │
│                              │                                    │
├──────────────────────────────┼────────────────────────────────────┤
│                         IndexedDB                                 │
│                    (Local Persistence)                            │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────┴───────┐     ┌───────┴───────┐
            │  Auth Server  │     │ External APIs │
            │  (Port 3001)  │     │               │
            │   - Sessions  │     │ - Gemini AI   │
            │   - OAuth     │     │ - GitHub API  │
            └───────┬───────┘     └───────────────┘
                    │
            ┌───────┴───────┐
            │  PostgreSQL   │
            │   (Neon DB)   │
            └───────────────┘
```

### 6.2 Data Flow

#### Repository Analysis Flow

```
User Input (URL)
      │
      ▼
GitHub API ──► File Tree Extraction
      │
      ▼
Gemini AI ──► Infographic Generation
      │
      ▼
Display + Cache ──► IndexedDB (History)
      │
      ▼
Optional: DevStudio ──► D3 Graph
```

#### Authentication Flow

```
User Click Login
      │
      ▼
Redirect to Replit OAuth
      │
      ▼
User Authenticates (Google/GitHub/etc)
      │
      ▼
Callback with Auth Code
      │
      ▼
Exchange for Tokens
      │
      ▼
Create Session ──► PostgreSQL
      │
      ▼
Set Cookie + Redirect
```

### 6.3 Component Hierarchy

```
App
├── AppHeader
│   ├── NavigationTabs
│   ├── ThemeToggle
│   ├── UserSettingsButton
│   └── AuthButton
├── Main Content (View-based)
│   ├── Home
│   ├── RepoAnalyzer (GitFlow)
│   ├── ArticleToInfographic (SiteSketch)
│   ├── ImageEditor (Reality Engine)
│   └── DevStudio
├── Modals
│   ├── AuthModal
│   ├── UserSettingsModal
│   ├── KeyboardShortcutsModal
│   └── AboutModal
└── PWA Components
    ├── InstallPrompt
    ├── OfflineIndicator
    └── UpdatePrompt
```

---

## 7. Configuration Reference

### 7.1 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://...` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIza...` |
| `SESSION_SECRET` | Yes | Session encryption key | `random-32-char-string` |
| `REPLIT_DOMAINS` | Auto | Replit domain for OAuth | `app.replit.app` |
| `REPL_ID` | Auto | Replit instance ID | `uuid` |

### 7.2 User-Configurable API Keys

Stored in browser localStorage via Settings modal:

| Key | Purpose |
|-----|---------|
| `GITHUB_TOKEN` | Access private repositories |
| `GEMINI_API_KEY` | Override default Gemini key |
| `OPENAI_API_KEY` | Alternative AI provider |
| `ANTHROPIC_API_KEY` | Alternative AI provider |
| `NOTION_API_KEY` | Notion integration |
| `GOOGLE_DRIVE_API_KEY` | Google Drive access |

### 7.3 Vite Configuration

Key settings in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,  // Required for Replit proxy
    proxy: {
      '/api': 'http://localhost:3001'  // Auth server
    }
  }
});
```

### 7.4 Database Schema

```typescript
// Users table
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Sessions table  
export const sessions = pgTable('sessions', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull()
});
```

---

## 8. Testing & Quality

### 8.1 Test Coverage Expectations

| Area | Target Coverage |
|------|-----------------|
| Services | 80%+ |
| Hooks | 70%+ |
| Components | 60%+ |
| Utilities | 90%+ |

### 8.2 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- services/geminiService.test.ts

# Watch mode
npm run test:watch
```

### 8.3 Smoke Checks

Manual verification checklist before deployment:

- [ ] App loads without console errors
- [ ] Theme toggle works
- [ ] GitFlow can analyze a public repo
- [ ] Authentication flow completes
- [ ] PWA install prompt appears
- [ ] Offline page displays when disconnected

### 8.4 CI Integration

GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

---

## 9. Security & Compliance

### 9.1 Authentication Flows

#### Replit OAuth (Primary)

1. User clicks "Login"
2. Redirect to Replit OAuth (`/api/login`)
3. User authenticates with Replit (supports Google, GitHub, X, Apple)
4. Callback receives auth code
5. Exchange code for tokens
6. Create session in PostgreSQL
7. Set secure HTTP-only cookie

#### Magic Link (Prepared)

1. User enters email
2. Server generates secure token
3. Email sent via SendGrid (integration ready)
4. User clicks link with token
5. Token validated, session created

### 9.2 OWASP Considerations

| Vulnerability | Mitigation |
|---------------|------------|
| XSS | React's built-in escaping, CSP headers |
| CSRF | SameSite cookies, origin validation |
| SQL Injection | Parameterized queries via Drizzle ORM |
| Session Hijacking | HTTP-only secure cookies, session rotation |
| Sensitive Data Exposure | Environment variables for secrets |

### 9.3 Secrets Handling

- **Server-side**: Environment variables (never committed)
- **Client-side**: User API keys in localStorage (per-user isolation)
- **Sessions**: Encrypted in PostgreSQL with expiration
- **Cookies**: HTTP-only, Secure, SameSite=Lax

### 9.4 Secure Defaults

- HTTPS enforced in production
- CORS restricted to allowed origins
- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- No sensitive data in error messages

---

## 10. Deployment & Operations

### 10.1 Deployment Target

Flash-n-Frame is deployed on Replit as a static site with:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Deployment type**: Autoscale

### 10.2 CI/CD Pipeline

```
Push to main
     │
     ▼
Run Tests & Lint
     │
     ▼
Build Production Bundle
     │
     ▼
Deploy to Replit
     │
     ▼
Invalidate CDN Cache
```

### 10.3 Monitoring

#### Health Checks

- Auth server: `GET /api/auth/user` returns 401 or user data
- Frontend: Service worker registration succeeds
- Database: Connection pool status via Drizzle

#### Logging Conventions

```typescript
// Log levels
console.error('Critical failure:', error);  // Errors
console.warn('Deprecated API used');         // Warnings  
console.info('User authenticated');          // Info
console.debug('API response:', data);        // Debug (dev only)
```

### 10.4 Metrics & Dashboards

Recommended metrics to track:
- Active sessions count
- API response times
- Error rates by endpoint
- PWA install conversions
- Feature usage (GitFlow, SiteSketch, etc.)

### 10.5 Backup & Restore

#### Database Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

#### User Data

- IndexedDB data is browser-local (no server backup)
- History can be exported via DevTools

### 10.6 Rollback Procedures

1. **Code rollback**: Use Replit Checkpoints
2. **Database rollback**: Restore from backup
3. **Configuration rollback**: Revert environment variables

---

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank screen | JavaScript error | Check browser console, clear cache |
| Auth loop | Cookie issues | Clear cookies, check SESSION_SECRET |
| API 401 | Expired session | Re-login |
| No infographic | Missing API key | Add GEMINI_API_KEY |
| Graph not loading | D3 error | Check DevStudio console output |
| PWA won't install | HTTPS required | Use production URL |
| Offline page stuck | SW cache | Clear service worker cache |

### 11.2 Debug Mode

Enable verbose logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

### 11.3 Service Worker Issues

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### 11.4 Database Issues

```bash
# Check connection
npm run db:push

# Force schema sync (destructive)
npm run db:push --force

# View tables
npx drizzle-kit studio
```

---

## 12. Changelog

### Version 2.0.0 (January 2026)

#### Added
- Progressive Web App with offline support
- Comprehensive authentication (Replit Auth, magic link, phone, SSO)
- 30+ new components from external projects
- User-specific API key management
- Advanced service worker with multiple caching strategies
- File upload/download hooks with progress tracking
- Drag-and-drop file handling

#### Changed
- Rebranded to Flash-n-Frame
- Enhanced manifest with shortcuts and file handlers
- Improved D3 graph performance

#### Fixed
- Context integration bugs in RepoAnalyzer
- Theme toggle state persistence
- DevStudio empty state navigation

### Version 1.5.0 (January 2026)

#### Added
- Reality Engine: Style Transfer, UI-to-Code
- DevStudio: AI Code Review, Test Generator
- GitFlow: Dependency Graph Generator
- SiteSketch: Multi-Source Comparison

### Version 1.0.0 (December 2025)

- Initial release
- GitFlow repository analyzer
- SiteSketch article converter
- Basic theme support

---

## 13. Appendices

### Appendix A: Style Guide

#### Terminology

| Term | Definition |
|------|------------|
| GitFlow | Repository analysis feature |
| SiteSketch | Article-to-infographic feature |
| Reality Engine | Image processing feature |
| DevStudio | Code exploration feature |
| Infographic | Generated visual output |

#### Formatting

- **Code**: Use backticks for inline code, fenced blocks for multi-line
- **Paths**: Use forward slashes, relative to project root
- **Keys**: ALL_CAPS_SNAKE_CASE for environment variables
- **Components**: PascalCase for React components

#### Code Style

```typescript
// Imports: External first, then internal
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Types: Explicit, descriptive
interface AnalysisResult {
  success: boolean;
  data: string;
  error?: string;
}

// Functions: Arrow functions for components
export const MyComponent = () => {
  // State at top
  const [loading, setLoading] = useState(false);
  
  // Effects after state
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers before return
  const handleClick = () => {
    // ...
  };
  
  // Render
  return <div>...</div>;
};
```

### Appendix B: Keyboard Reference

| Category | Shortcut | Action |
|----------|----------|--------|
| Navigation | `Alt+1` | Home |
| Navigation | `Alt+2` | GitFlow |
| Navigation | `Alt+3` | SiteSketch |
| Navigation | `Alt+4` | Reality Engine |
| Navigation | `Alt+5` | DevStudio |
| Help | `Shift+?` | Shortcuts modal |
| Action | `Ctrl+Enter` | Execute (Reality Engine) |

### Appendix C: API Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| Gemini AI | 60 requests | per minute |
| GitHub API | 60 requests (unauth) | per hour |
| GitHub API | 5000 requests (auth) | per hour |

### Appendix D: Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Limited PWA |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | iOS 14+ required |
| Chrome Android | 90+ | Full PWA support |

---

*Documentation generated January 2026 | Flash-n-Frame v2.0.0*
