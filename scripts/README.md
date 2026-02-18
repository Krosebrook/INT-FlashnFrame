# Production Readiness Audit Tool

## Overview

The Production Readiness Audit Tool is a comprehensive framework for evaluating software readiness across multiple dimensions. It provides evidence-based assessment to determine if software is ready for:

1. **Employee/Internal Use**
2. **Public Beta**
3. **Production-Grade Launch**

This tool follows a strict, no-fluff approach: if something cannot be verified from the repository, deployment configuration, or runtime behavior, it is marked as "UNVERIFIED — ASSUME MISSING."

## Features

### Phase 1: Repository & Deployment Audit

The tool evaluates 10 critical categories, each scored 0-5:

1. **Identity & Access Control**
   - Authentication implementation
   - Role-based access control
   - Least privilege principles
   - Hardcoded credentials detection

2. **Secrets & Configuration Hygiene**
   - Environment variable handling
   - Secrets in version control
   - Configuration documentation
   - Secret rotation capability

3. **Data Safety & Privacy**
   - Data storage strategy
   - Encryption implementation
   - Backup procedures
   - Data retention policies
   - PII handling (if applicable)

4. **Reliability & Error Handling**
   - Error handling coverage
   - Timeout mechanisms
   - Retry logic
   - Graceful degradation
   - Circuit breakers

5. **Observability & Monitoring**
   - Logging implementation
   - Structured logging
   - Error tracking services
   - Metrics collection
   - Alerting configuration

6. **CI/CD & Deployment Safety**
   - CI pipeline presence
   - Automated testing
   - Linting configuration
   - Build verification
   - Rollback strategy

7. **Security Hardening**
   - Security headers (OWASP basics)
   - Input validation
   - Rate limiting
   - CORS configuration
   - Content Security Policy
   - Dependency scanning

8. **Testing Coverage**
   - Unit tests
   - Integration tests
   - Test framework configuration
   - Coverage tracking

9. **Performance & Cost Controls**
   - API rate limits
   - Resource limits
   - Caching strategy
   - Performance monitoring

10. **Documentation & Operational Readiness**
    - README quality
    - Setup instructions
    - Operational runbook
    - Incident procedures

### Phase 2: Runtime Checks (Optional)

If a deployment URL is provided, the tool performs:

- HTTP health checks
- Response time measurement
- Security header inspection
- Basic availability testing

### Phase 3: Readiness Classification

Based on total score (0-50):

- **0-25**: Prototype
- **26-35**: Dev Preview
- **36-42**: Employee Pilot Ready (with conditions)
- **43-50**: Public Beta Ready
- **51+**: Production Ready

### Phase 4: Executive Summary

Provides a blunt, evidence-based assessment:

- Is this safe for employees?
- Is this safe for customers?
- What would break first under real usage?
- What would scare a security review?

## Usage

### Basic Usage

Run the audit on the current repository:

```bash
npm run audit:readiness
```

### With Deployment URL

Include runtime checks:

```bash
npx tsx scripts/audit-production-readiness.ts --deployment-url=https://your-app.com
```

### Full Configuration

```bash
npx tsx scripts/audit-production-readiness.ts \
  --repo-path=./ \
  --deployment-url=https://your-app.com \
  --intended-audience=public \
  --handles-pii=yes \
  --handles-payments=no \
  --handles-secrets=yes
```

### Command Line Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `--repo-path` | Path | `./` | Path to repository to audit |
| `--deployment-url` | URL | None | Live deployment URL for runtime checks |
| `--intended-audience` | `employee`, `public`, `both` | `employee` | Target audience |
| `--handles-pii` | `yes`, `no` | `no` | Whether application handles PII |
| `--handles-payments` | `yes`, `no` | `no` | Whether application handles payments |
| `--handles-secrets` | `yes`, `no` | `no` | Whether application manages API keys/secrets |

## Output

### Console Output

The tool prints a comprehensive report to the console with:

- Scorecard table with visual indicators
- Detailed findings per category
- Critical blockers
- Public launch blockers
- Prioritized improvement recommendations
- Executive summary

### File Output

A complete audit report is saved to:

```
production-readiness-audit.txt
```

This file contains the same information as the console output and can be shared with stakeholders.

## Exit Codes

- **0**: Safe for employees (no critical blockers, score ≥ 36)
- **1**: Not safe for employees or critical issues found

## Interpreting Results

### Critical Blockers

These **must** be fixed before employee use:

- Insufficient authentication/authorization
- Poor secrets management
- Inadequate security hardening
- Insufficient testing
- PII handling without protection measures

### Public Launch Blockers

These block public launch:

- Any category scoring below 60% (< 3/5)
- Insufficient observability
- No CI/CD pipeline
- Low overall score

### Top Improvements

The tool prioritizes improvements by:

1. Score gap (how far below maximum)
2. Category criticality
3. Impact on overall readiness

## Examples

### Example 1: Quick Audit

```bash
npm run audit:readiness
```

**Use Case**: Quick check of current repository state without runtime testing.

### Example 2: Pre-Launch Audit

```bash
npx tsx scripts/audit-production-readiness.ts \
  --deployment-url=https://staging.myapp.com \
  --intended-audience=public \
  --handles-pii=yes
```

**Use Case**: Comprehensive audit before public beta launch, including runtime checks and PII compliance verification.

### Example 3: Internal Tool Audit

```bash
npx tsx scripts/audit-production-readiness.ts \
  --intended-audience=employee \
  --handles-secrets=yes
```

**Use Case**: Audit an internal tool that manages API keys but doesn't handle user PII.

## Integration with CI/CD

Add the audit to your CI pipeline:

```yaml
# .github/workflows/audit.yml
name: Production Readiness Audit

on:
  pull_request:
    branches: [main, production]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run audit:readiness
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: audit-report
          path: production-readiness-audit.txt
```

## Customization

The audit tool is designed to be extended. To add custom checks:

1. Open `scripts/audit-production-readiness.ts`
2. Add new methods to the `ProductionReadinessAuditor` class
3. Update the category scoring in `performAudit()`

## Best Practices

1. **Run regularly**: Schedule audits weekly or before major releases
2. **Track progress**: Compare reports over time to measure improvement
3. **Address blockers first**: Focus on critical blockers before enhancements
4. **Document findings**: Share reports with team and stakeholders
5. **Set standards**: Define minimum scores for each environment (dev/staging/prod)

## Limitations

### What the Tool Checks

- Static code analysis (patterns, files, configuration)
- Runtime availability and headers (if deployment URL provided)
- Documentation presence and quality

### What the Tool Cannot Check

- Code quality or correctness
- Actual data encryption at rest
- Real-world performance under load
- Compliance with specific regulations (beyond patterns)
- Team processes and operational maturity

### False Positives/Negatives

The tool uses pattern matching and heuristics. It may:

- Miss security issues if they don't match known patterns
- Flag false positives for unusual architectures
- Not detect runtime-only issues without deployment URL

**Always supplement with:**

- Manual security reviews
- Penetration testing
- Load testing
- Compliance audits

## Troubleshooting

### "No authentication files found" but we have auth

**Solution**: The tool looks for files with `auth` in the name. Ensure authentication files follow naming conventions or the pattern may need adjustment.

### Exit code 1 when running in CI

**Cause**: The tool found critical blockers or the score is below 36.

**Solution**: Review the report and address critical blockers first.

### Runtime checks failing

**Cause**: Deployment URL may be unreachable or authentication-protected.

**Solution**: Ensure the URL is publicly accessible or skip runtime checks.

## Support

For issues or questions about the Production Readiness Audit Tool:

1. Review the generated audit report for specific findings
2. Check this documentation for interpretation guidance
3. Contact the INT Inc. security and operations team

## Version History

### v1.0.0 (Current)

- Initial release
- 10 category audit framework
- Runtime checks support
- Comprehensive reporting
- CI/CD integration ready

## License

Internal use only - INT Inc. All rights reserved.
