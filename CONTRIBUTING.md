# Contributing to Flash-n-Frame

Thank you for contributing to Flash-n-Frame! This guide outlines the workflow and standards for the INT Inc. development team.

## Getting Started

1. **Set up your environment** - See the [Onboarding Guide](docs/how-to-guides/onboarding.md)
2. **Read the architecture** - Review [Architecture Overview](docs/ARCHITECTURE.md)
3. **Check the roadmap** - See [Refactoring Roadmap](docs/REFACTORING_ROADMAP.md) for planned work

## Development Workflow

### Branch Strategy

- `main` - Production-ready code (deployed via Replit)
- `feature/*` - New features (branch from `main`)
- `fix/*` - Bug fixes (branch from `main`)
- `docs/*` - Documentation updates

### Making Changes

1. Create a branch from `main`
2. Make your changes following the code standards below
3. Test your changes locally (`npm run dev:server & npm run dev`)
4. Verify the build succeeds (`npm run build`)
5. Submit for code review

### Code Review Checklist

- [ ] Code follows the project conventions (see below)
- [ ] No console.log statements left in production code
- [ ] No API keys, secrets, or credentials in code
- [ ] UI changes tested across dark, light, and solarized themes
- [ ] New API endpoints include rate limiting consideration
- [ ] Accessibility: Interactive elements have ARIA labels

## Code Standards

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `RepoAnalyzer.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase with descriptive name | `geminiService.ts` |
| Contexts | PascalCase with `Context` suffix | `ThemeContext.tsx` |
| Types/Interfaces | PascalCase | `UserSettings` |

### Component Guidelines

- Use functional components with TypeScript
- Manage state via React Context (ThemeContext, ProjectContext, UserSettingsContext)
- Use Tailwind CSS utility classes; avoid custom CSS files
- Lazy-load heavy components using `React.lazy()`
- Check `checkBeforeCall()` before any Gemini API request

### Service Guidelines

- All external API calls should go through server-side proxy endpoints when possible
- Use exponential backoff for retries (see `geminiService.ts` pattern)
- Cache API responses using `services/cache.ts`
- Deduplicate in-flight requests with `deduplicatedFetch`

### Security Rules

- Never log API keys to the console
- Never store secrets in code or localStorage (use Replit Secrets for server-side keys)
- Use parameterized queries via Drizzle ORM (no raw SQL)
- Validate all user inputs with Zod schemas
- Set HTTP-only, Secure, SameSite cookies for sessions

## Environment Setup

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SESSION_SECRET` | Yes | Express session encryption |

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Personal access token for higher GitHub API limits |

## Reporting Issues

When reporting a bug:

1. Describe what you expected to happen
2. Describe what actually happened
3. Include browser console errors if applicable
4. Note which theme and browser you were using
5. Include the steps to reproduce

## Architecture Decision Records

For significant architectural changes, create an ADR in `docs/decisions/`:

- Use the format `ADR-NNN-short-description.md`
- Follow the template in existing ADRs (see `docs/decisions/ADR-001-database.md`)
- Include: Status, Context, Decision Drivers, Decision Outcome, Consequences

## Questions?

Review the [Documentation Hub](docs/DOCUMENTATION.md) or reach out to the architecture team.
