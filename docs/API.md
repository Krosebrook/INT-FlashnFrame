# Flash-n-Frame API Documentation

## Overview

Flash-n-Frame provides a full-stack architecture with server-side REST API endpoints for authentication, proxying, and operations, plus client-side services for AI-powered content generation, GitHub integration, and local persistence. This document covers all available APIs.

---

## Table of Contents

1. [Server-Side REST API](#server-side-rest-api)
   - [Authentication Endpoints](#authentication-endpoints)
   - [API Proxy Endpoints](#api-proxy-endpoints)
   - [Operational Endpoints](#operational-endpoints)
   - [Rate Limiting](#rate-limiting)
   - [Security Headers](#security-headers)
   - [CORS Policy](#cors-policy)
2. [Client-Side Services](#client-side-services)
   - [Gemini Service](#gemini-service)
   - [GitHub Service](#github-service)
   - [User Settings API](#user-settings-api)
   - [Persistence Service](#persistence-service)
3. [Error Handling](#error-handling)
4. [Security Notes](#security-notes)

---

## Server-Side REST API

**Base URL:** `/api`
**Server Location:** `server/index.ts`

### Authentication Endpoints

#### `GET /api/csrf-token`

Returns a CSRF token for form submissions.

**Response:**
```json
{ "csrfToken": "..." }
```

---

#### `POST /api/auth/signup`

Register a new user with email and password. Passwords are hashed with bcrypt (12 rounds) and validated for complexity.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "firstName": "John",
  "lastName": "Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | Password (complexity validated) |
| `firstName` | string | No | User first name |
| `lastName` | string | No | User last name |

**Responses:**
- `200` — Returns created user object
- `400` — Validation error (missing fields, weak password, duplicate email)
- `500` — Internal server error

---

#### `POST /api/auth/login`

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1"
}
```

**Responses:**
- `200` — Returns user object and sets session cookie
- `401` — Invalid credentials

---

#### `GET /api/login`

Initiate Replit OAuth login flow. Redirects the user to Replit's OAuth authorization page.

**Response:** `302` redirect to Replit OAuth

---

#### `GET /api/callback`

OAuth callback handler set by the Replit auth integration. Processes the authorization code, creates a session, and redirects the user back to the application.

**Response:** `302` redirect to application

---

#### `GET /api/logout`

End the current user session and clear the session cookie.

**Response:** `302` redirect to home page

---

#### `GET /api/auth/user`

Get the currently authenticated user's information.

**Responses:**
- `200` — Returns user JSON:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://..."
}
```
- `401` — Not authenticated

---

#### `POST /api/auth/magic-link`

Placeholder endpoint for magic link authentication.

**Response:** `501` — Not Implemented (requires SendGrid integration)

---

#### `POST /api/auth/phone`

Placeholder endpoint for phone-based authentication.

**Response:** `501` — Not Implemented (requires Twilio integration)

---

### API Proxy Endpoints

#### `GET /api/github/tree/:owner/:repo`

Proxies GitHub API tree requests server-side, avoiding client-side CORS issues.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | string | Repository owner username |
| `repo` | string | Repository name |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `branch` | string | `main` (falls back to `master`) | Branch name to fetch |
| `token` | string | — | User's GitHub Personal Access Token for private repos |

**Response:** GitHub file tree JSON

**Rate Limiting:** Follows GitHub API limits:
- Unauthenticated: 60 requests/hour
- With token: 5,000 requests/hour

---

#### `GET /api/ai/key`

Returns the server-side Gemini API key to the authenticated frontend.

**Responses:**
- `200` — Key configured:
```json
{ "key": "AIza..." }
```
- `200` — Key not configured:
```json
{ "key": null }
```

---

### Operational Endpoints

#### `GET /api/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "uptime": 123456,
  "timestamp": "2026-02-17T00:00:00.000Z",
  "environment": "production"
}
```

---

#### `GET /api/ping`

Simple connectivity check.

**Response:** `"pong"` (plain text)

---

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Auth endpoints (`/api/auth/*`, `/api/login`, `/api/signup`) | 20 requests | 15 minutes per IP |
| General API | 100 requests | 1 minute per IP |

---

### Security Headers

The server uses [Helmet](https://helmetjs.github.io/) for security headers with the following configuration:

- **Content Security Policy (CSP):** Disabled for SPA compatibility
- **Cross-Origin Embedder Policy (COEP):** Disabled for cross-origin resources
- **All other Helmet defaults:** Enabled

---

### CORS Policy

| Environment | Allowed Origins |
|-------------|----------------|
| Production | `*.replit.app`, `*.replit.dev` |
| Development | All origins |

---

## Client-Side Services

### Gemini Service

**Location:** `services/geminiService.ts`

The Gemini Service provides AI-powered content generation using Google's Gemini API.

#### Configuration

```typescript
import { setUserGeminiKey } from '../services/geminiService';

// Set user-provided API key (takes precedence over environment variable)
setUserGeminiKey('your-api-key');
```

#### Functions

##### `generateInfographic(prompt: string, options?: GenerateOptions): Promise<GeneratedImage>`

Generates an infographic image based on the provided prompt.

**Parameters:**
- `prompt` (string): Description of the infographic to generate
- `options` (optional): Generation options including style, dimensions

**Returns:** Promise resolving to a GeneratedImage object with base64 data

##### `editImage(imageData: string, editPrompt: string): Promise<GeneratedImage>`

Edits an existing image based on the provided prompt.

**Parameters:**
- `imageData` (string): Base64-encoded image data
- `editPrompt` (string): Instructions for how to edit the image

**Returns:** Promise resolving to edited image data

##### `vectorizeImage(imageData: string): Promise<string>`

Converts a raster image to SVG format.

**Parameters:**
- `imageData` (string): Base64-encoded image data

**Returns:** Promise resolving to SVG string

##### `generateCode(designData: object): Promise<string>`

Generates code from design specifications.

**Parameters:**
- `designData` (object): Design specifications including layout, components

**Returns:** Promise resolving to generated code string

---

### GitHub Service

**Location:** `services/githubService.ts`

The GitHub Service provides repository analysis and file fetching capabilities.

#### Configuration

```typescript
import { setUserGitHubToken } from '../services/githubService';

// Set user-provided token for private repo access
setUserGitHubToken('ghp_your-token');
```

#### Functions

##### `fetchRepoFileTree(owner: string, repo: string): Promise<RepoFileTree[]>`

Fetches the complete file tree of a GitHub repository.

**Parameters:**
- `owner` (string): Repository owner username
- `repo` (string): Repository name

**Returns:** Promise resolving to array of file tree items

**Example:**
```typescript
const files = await fetchRepoFileTree('facebook', 'react');
// Returns array of { path: string, type: 'blob' | 'tree', sha: string }
```

##### `fetchFileContent(owner: string, repo: string, path: string, branch?: string): Promise<string | null>`

Fetches raw content of a specific file.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name
- `path` (string): File path within repository
- `branch` (optional): Branch name, defaults to trying 'main' then 'master'

**Returns:** Promise resolving to file content string or null if not found

##### `fetchRepoDependencies(owner: string, repo: string): Promise<DependencyResult>`

Fetches and parses dependency information from a repository.

**Parameters:**
- `owner` (string): Repository owner
- `repo` (string): Repository name

**Returns:** Promise resolving to:
```typescript
{
  dependencies: DependencyInfo[];
  ecosystem: 'npm' | 'pip' | 'cargo' | 'go' | 'unknown';
  manifestFile: string;
}
```

**Supported Ecosystems:**
- npm (package.json)
- pip (requirements.txt)
- Cargo (Cargo.toml)
- Go (go.mod)

---

### User Settings API

**Location:** `contexts/UserSettingsContext.tsx`

The User Settings API provides a React context for managing user-specific API keys.

#### Hook Usage

```typescript
import { useUserSettings } from '../contexts/UserSettingsContext';

function MyComponent() {
  const { apiKeys, setApiKey, hasKey, openSettings } = useUserSettings();
  
  // Check if a key is configured
  if (hasKey('githubToken')) {
    // Use the token
  }
  
  // Set a new key
  setApiKey('geminiKey', 'new-api-key');
  
  // Open settings modal
  openSettings();
}
```

#### Available Keys

| Key | Description |
|-----|-------------|
| `githubToken` | GitHub Personal Access Token |
| `geminiKey` | Google Gemini API Key |
| `openaiKey` | OpenAI API Key |
| `anthropicKey` | Anthropic API Key |
| `notionKey` | Notion Integration Token |
| `googleDriveKey` | Google Drive API Key |
| `awsAccessKey` | AWS Access Key ID |
| `awsSecretKey` | AWS Secret Access Key |
| `awsRegion` | AWS Region |
| `hubspotKey` | HubSpot API Key |
| `freshdeskKey` | Freshdesk API Key |
| `freshdeskDomain` | Freshdesk Domain |
| `bitwardenClientId` | Bitwarden Client ID |
| `bitwardenClientSecret` | Bitwarden Client Secret |
| `vsaxKey` | vsaX API Key |
| `microsoftClientId` | Microsoft App Client ID |
| `microsoftClientSecret` | Microsoft App Client Secret |
| `microsoftTenantId` | Microsoft Tenant ID |
| `teamsWebhook` | Microsoft Teams Webhook URL |
| `sharePointSiteUrl` | SharePoint Site URL |
| `powerAppsEnvironment` | Power Apps Environment ID |

#### Context Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setApiKey` | `(service, value)` | Sets an API key |
| `clearApiKey` | `(service)` | Removes an API key |
| `clearAllKeys` | `()` | Removes all API keys |
| `hasKey` | `(service)` | Checks if key is configured |
| `openSettings` | `()` | Opens settings modal |
| `closeSettings` | `()` | Closes settings modal |

---

### Persistence Service

**Location:** `services/persistence.ts`

The Persistence Service provides IndexedDB-based storage for offline data persistence.

#### Functions

##### `saveHistory(items: HistoryItem[]): Promise<void>`

Saves analysis history to IndexedDB.

##### `loadHistory(): Promise<HistoryItem[]>`

Loads analysis history from IndexedDB.

##### `saveTasks(tasks: Task[]): Promise<void>`

Saves task list to IndexedDB.

##### `loadTasks(): Promise<Task[]>`

Loads task list from IndexedDB.

##### `saveProjectState(state: ProjectState): Promise<void>`

Saves current project state.

##### `loadProjectState(): Promise<ProjectState | null>`

Loads saved project state.

---

## Error Handling

All services throw descriptive errors that should be caught and handled:

```typescript
try {
  const files = await fetchRepoFileTree('owner', 'repo');
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('private')) {
    // Prompt user to add GitHub token
  }
}
```

Server-side endpoints return standard HTTP error codes with JSON error bodies:

```json
{
  "message": "Descriptive error message"
}
```

---

## Security Notes

1. The core Gemini API key is stored server-side as an environment variable and served to the authenticated frontend via `/api/ai/key`
2. User-provided API keys (e.g., GitHub tokens, override Gemini keys) are stored in browser localStorage for per-user isolation
3. Authentication sessions are stored in PostgreSQL with HTTP-only, Secure, SameSite cookies
4. CSRF tokens are required for form-based mutations
5. Rate limiting protects auth endpoints (20 req/15 min) and general API (100 req/min)
6. CORS is restricted to `*.replit.app` and `*.replit.dev` origins in production
7. Helmet security headers are enabled (CSP and COEP disabled for SPA/cross-origin compatibility)
8. Passwords are hashed with bcrypt (12 rounds) and validated for complexity
