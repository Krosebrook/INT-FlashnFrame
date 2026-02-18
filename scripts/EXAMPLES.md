# Production Readiness Audit - Example Configurations

This directory contains example configurations for different audit scenarios.

## Quick Examples

### 1. Internal Tool Audit

Audit an internal employee-facing tool:

```bash
npm run audit:readiness -- \
  --intended-audience=employee \
  --handles-secrets=yes
```

### 2. Public Beta Pre-Launch

Audit before public beta launch with PII:

```bash
npm run audit:readiness -- \
  --intended-audience=public \
  --handles-pii=yes \
  --deployment-url=https://staging.example.com
```

### 3. Production-Grade API

Audit a production API service:

```bash
npm run audit:readiness -- \
  --intended-audience=both \
  --handles-pii=yes \
  --handles-secrets=yes \
  --deployment-url=https://api.example.com
```

### 4. E-commerce Application

Audit an e-commerce app (with payments):

```bash
npm run audit:readiness -- \
  --intended-audience=public \
  --handles-pii=yes \
  --handles-payments=yes \
  --handles-secrets=yes \
  --deployment-url=https://shop.example.com
```

## Configuration Matrix

| Scenario | Audience | PII | Payments | Secrets | Deployment URL |
|----------|----------|-----|----------|---------|----------------|
| Internal Dashboard | `employee` | No | No | Yes | Optional |
| Beta Web App | `public` | Yes | No | Yes | Required |
| Production API | `both` | Yes | No | Yes | Required |
| E-commerce Site | `public` | Yes | Yes | Yes | Required |
| Marketing Site | `public` | No | No | No | Required |
| Admin Portal | `employee` | Yes | No | Yes | Optional |

## Understanding Results

### Score Ranges

- **0-25 (Prototype)**: Basic functionality, not suitable for any production use
- **26-35 (Dev Preview)**: Early stage, internal testing only
- **36-42 (Employee Pilot)**: Ready for internal pilot with conditions
- **43-50 (Public Beta)**: Ready for limited public testing
- **51+ (Production)**: Meets production standards

### Critical vs. Warning Findings

**Critical (✗)**: Must be fixed before any production use
**Warning (⚠)**: Should be addressed but not blocking
**Success (✓)**: Meets requirements

### Priority Actions

Focus on categories that:
1. Have the lowest scores (0-2 out of 5)
2. Are marked as critical blockers
3. Affect your intended audience

## Integration Patterns

### Pre-deployment Check

Add to your deployment script:

```json
{
  "scripts": {
    "predeploy": "npm run audit:readiness",
    "deploy": "your-deployment-command"
  }
}
```

### Git Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run audit:readiness
if [ $? -ne 0 ]; then
  echo "Production readiness audit failed. Commit anyway? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi
```

### Scheduled Audits

Use the included GitHub Actions workflow or set up a cron job:

```bash
# Weekly audit on Monday at 9 AM
0 9 * * 1 cd /path/to/repo && npm run audit:readiness && mail -s "Audit Report" team@example.com < production-readiness-audit.txt
```

## Common Issues and Solutions

### Low Testing Score

**Problem**: Few or no test files detected

**Solutions**:
- Add unit tests using Jest, Mocha, or Vitest
- Create integration tests for critical flows
- Configure test coverage reporting

### Low CI/CD Score

**Problem**: No CI configuration found

**Solutions**:
- Add GitHub Actions workflow (`.github/workflows/`)
- Set up GitLab CI (`.gitlab-ci.yml`)
- Configure CircleCI (`.circleci/config.yml`)

### Security Headers Missing

**Problem**: No security headers detected

**Solutions**:
- Install and configure Helmet.js
- Add security headers in nginx/Apache config
- Use a CDN with security features

### No Error Tracking

**Problem**: No error monitoring service found

**Solutions**:
- Integrate Sentry, Bugsnag, or Rollbar
- Add application logging
- Set up alerts for critical errors

## Advanced Usage

### Custom Thresholds

Modify the script to use custom thresholds:

```typescript
// In audit-production-readiness.ts
private classifyReadiness(totalScore: number): string {
  // Custom thresholds for your organization
  if (totalScore >= 45) return 'Production Ready';
  if (totalScore >= 38) return 'Public Beta Ready';
  // ...
}
```

### Additional Categories

Add custom audit categories:

```typescript
private auditMyCustomCategory(): CategoryScore {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Your custom checks here

  return {
    category: '11. My Custom Category',
    score,
    maxScore: 5,
    findings,
    recommendations
  };
}
```

## Feedback and Support

For questions or issues with the audit tool:

1. Check the [main README](../README.md)
2. Review the [scripts documentation](../scripts/README.md)
3. Contact the INT Inc. engineering team
