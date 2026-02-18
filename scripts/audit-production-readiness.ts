#!/usr/bin/env tsx
/**
 * Production Readiness Audit Tool
 * 
 * Comprehensive audit framework for evaluating software readiness for:
 * - Employee/Internal Use
 * - Public Beta
 * - Production-Grade Launch
 * 
 * Usage:
 *   npx tsx scripts/audit-production-readiness.ts [--repo-path=./] [--deployment-url=https://...] [--intended-audience=employee|public|both] [--handles-pii=yes|no] [--handles-payments=yes|no] [--handles-secrets=yes|no]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';

interface AuditConfig {
  repoPath: string;
  deploymentUrl?: string;
  intendedAudience: 'employee' | 'public' | 'both';
  handlesPII: boolean;
  handlesPayments: boolean;
  handlesSecrets: boolean;
}

interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  findings: string[];
  recommendations: string[];
}

interface AuditReport {
  config: AuditConfig;
  timestamp: string;
  categories: CategoryScore[];
  totalScore: number;
  maxTotalScore: number;
  readinessLevel: string;
  criticalBlockers: string[];
  publicLaunchBlockers: string[];
  topImprovements: string[];
  runtimeChecks?: RuntimeCheckResults;
  executiveSummary: ExecutiveSummary;
}

interface RuntimeCheckResults {
  available: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  securityHeaders?: Record<string, string>;
  authBehavior?: string;
  errors?: string[];
}

interface ExecutiveSummary {
  safeForEmployees: boolean;
  safeForCustomers: boolean;
  likelyFailurePoints: string[];
  securityConcerns: string[];
}

class ProductionReadinessAuditor {
  private config: AuditConfig;
  private repoPath: string;
  private categories: CategoryScore[] = [];

  constructor(config: AuditConfig) {
    this.config = config;
    this.repoPath = path.resolve(config.repoPath);
  }

  private fileExists(filepath: string): boolean {
    try {
      return fs.existsSync(path.join(this.repoPath, filepath));
    } catch {
      return false;
    }
  }

  private readFile(filepath: string): string | null {
    try {
      return fs.readFileSync(path.join(this.repoPath, filepath), 'utf-8');
    } catch {
      return null;
    }
  }

  private findFiles(pattern: string): string[] {
    try {
      // Use array format to avoid shell injection
      const result = spawnSync('find', [this.repoPath, '-type', 'f', '-name', pattern], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      if (result.error) {
        return [];
      }
      
      return (result.stdout || '').split('\n').filter(f => f.trim() && !f.includes('node_modules'));
    } catch {
      return [];
    }
  }

  private searchInFiles(pattern: string, fileExtensions: string[] = ['*']): number {
    try {
      let count = 0;
      for (const ext of fileExtensions) {
        // Use array format to avoid shell injection
        const result = spawnSync('grep', [
          '-r',
          pattern,
          this.repoPath,
          `--include=*.${ext}`
        ], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // grep returns exit code 1 when no matches found, which is not an error
        if (result.stdout) {
          const lines = result.stdout.split('\n').filter(l => l.trim());
          count += lines.length;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  // PHASE 1 - CATEGORY AUDITS

  private auditIdentityAccessControl(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check authentication implementation
    const authFiles = this.findFiles('*auth*');
    if (authFiles.length > 0) {
      findings.push(`✓ Authentication files found: ${authFiles.length} file(s)`);
      score += 1.5;
    } else {
      findings.push('✗ No authentication implementation found');
      recommendations.push('Implement authentication system');
    }

    // Check for session management
    const sessionManagement = this.searchInFiles('express-session|passport|jwt', ['ts', 'js', 'json']);
    if (sessionManagement > 0) {
      findings.push('✓ Session management libraries detected');
      score += 1;
    } else {
      findings.push('✗ No session management detected');
      recommendations.push('Implement secure session management');
    }

    // Check for role-based access control
    const rbacPatterns = this.searchInFiles('role|permission|authorization', ['ts', 'js']);
    if (rbacPatterns > 5) {
      findings.push('✓ Role-based access control patterns found');
      score += 1;
    } else {
      findings.push('⚠ Limited or no RBAC implementation');
      recommendations.push('Implement comprehensive RBAC');
    }

    // Check for hardcoded credentials (using simpler pattern for safety)
    const hardcodedCreds = this.searchInFiles('password.*=|api.*key.*=', ['ts', 'js']);
    if (hardcodedCreds === 0) {
      findings.push('✓ No obvious hardcoded credentials found');
      score += 1.5;
    } else {
      findings.push(`✗ CRITICAL: Found ${hardcodedCreds} potential hardcoded credentials`);
      recommendations.push('URGENT: Remove all hardcoded credentials');
    }

    return {
      category: '1. Identity & Access Control',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditSecretsConfiguration(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for .env file handling
    if (this.fileExists('.env.example') || this.fileExists('.env.sample')) {
      findings.push('✓ Environment configuration template found');
      score += 1;
    } else {
      findings.push('⚠ No .env.example file for configuration documentation');
      recommendations.push('Create .env.example with all required variables');
    }

    // Check .gitignore for secrets
    const gitignore = this.readFile('.gitignore');
    if (gitignore?.includes('.env') && gitignore?.includes('*.key') || gitignore?.includes('secrets')) {
      findings.push('✓ .gitignore properly configured for secrets');
      score += 1;
    } else {
      findings.push('⚠ .gitignore may not exclude all secret files');
      recommendations.push('Update .gitignore to exclude .env, *.key, secrets/');
    }

    // Check if secrets are committed
    const envFiles = this.findFiles('.env');
    const keyFiles = this.findFiles('*.key');
    const secretsCommitted = envFiles.length + keyFiles.length;
    if (secretsCommitted === 0) {
      findings.push('✓ No secret files found in repository');
      score += 1.5;
    } else {
      findings.push(`✗ CRITICAL: Found ${secretsCommitted} secret files in repository`);
      recommendations.push('URGENT: Remove committed secrets and rotate them');
    }

    // Check configuration documentation
    const readme = this.readFile('README.md');
    if (readme?.includes('environment') || readme?.includes('configuration') || readme?.includes('DATABASE_URL')) {
      findings.push('✓ Configuration documented in README');
      score += 1;
    } else {
      findings.push('⚠ Configuration not documented');
      recommendations.push('Document all required environment variables');
    }

    // Check for secret rotation capability
    const hasSecretRotation = this.searchInFiles('rotate|refresh.*token|regenerate.*key', ['ts', 'js']);
    if (hasSecretRotation > 0) {
      findings.push('✓ Secret rotation patterns detected');
      score += 0.5;
    } else {
      findings.push('⚠ No secret rotation mechanism detected');
      recommendations.push('Implement secret rotation capability');
    }

    return {
      category: '2. Secrets & Configuration Hygiene',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditDataSafetyPrivacy(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check database usage
    const dbFiles = this.findFiles('*db*');
    const dbConnections = this.searchInFiles('database|postgres|mysql|mongodb', ['ts', 'js', 'json']);
    if (dbConnections > 0) {
      findings.push('✓ Database layer implemented');
      score += 1;
    } else {
      findings.push('⚠ No database implementation found');
    }

    // Check encryption usage
    const encryption = this.searchInFiles('encrypt|crypto|bcrypt|scrypt', ['ts', 'js']);
    if (encryption > 5) {
      findings.push('✓ Encryption libraries in use');
      score += 1;
    } else {
      findings.push('⚠ Limited or no encryption detected');
      recommendations.push('Implement encryption for sensitive data');
    }

    // Check backup strategy
    const hasBackupDocs = this.searchInFiles('backup|restore|recovery', ['md', 'txt']);
    if (hasBackupDocs > 0) {
      findings.push('✓ Backup documentation found');
      score += 1;
    } else {
      findings.push('✗ No backup strategy documented');
      recommendations.push('Document backup and recovery procedures');
    }

    // Check data retention
    const hasRetention = this.searchInFiles('retention|cleanup|purge|delete.*old', ['ts', 'js', 'md']);
    if (hasRetention > 0) {
      findings.push('✓ Data retention considerations found');
      score += 1;
    } else {
      findings.push('⚠ No data retention policy detected');
      recommendations.push('Define and implement data retention policy');
    }

    // PII handling check
    if (this.config.handlesPII) {
      const piiProtection = this.searchInFiles('anonymize|pseudonymize|gdpr|ccpa', ['ts', 'js', 'md']);
      if (piiProtection > 0) {
        findings.push('✓ PII protection measures found');
        score += 1;
      } else {
        findings.push('✗ CRITICAL: Handles PII but no protection measures found');
        recommendations.push('URGENT: Implement PII protection (anonymization, GDPR compliance)');
      }
    } else {
      score += 1;
    }

    return {
      category: '3. Data Safety & Privacy',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditReliabilityErrorHandling(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check error handling
    const tryCatchBlocks = this.searchInFiles('try.*{', ['ts', 'js']);
    const errorHandlers = this.searchInFiles('catch|\.catch\\(|error|Error', ['ts', 'js']);
    if (errorHandlers > 20) {
      findings.push(`✓ Error handling implemented (${errorHandlers} error handlers found)`);
      score += 1.5;
    } else {
      findings.push('⚠ Limited error handling');
      recommendations.push('Add comprehensive error handling to all async operations');
    }

    // Check timeout implementation
    const timeouts = this.searchInFiles('timeout|setTimeout|AbortController', ['ts', 'js']);
    if (timeouts > 5) {
      findings.push('✓ Timeout mechanisms detected');
      score += 1;
    } else {
      findings.push('⚠ Limited or no timeout handling');
      recommendations.push('Implement timeouts for all external calls');
    }

    // Check retry logic
    const retries = this.searchInFiles('retry|retries|exponential.*back', ['ts', 'js']);
    if (retries > 0) {
      findings.push('✓ Retry logic detected');
      score += 1;
    } else {
      findings.push('⚠ No retry logic found');
      recommendations.push('Implement retry logic with exponential backoff');
    }

    // Check graceful degradation
    const fallbacks = this.searchInFiles('fallback|default|graceful', ['ts', 'js']);
    if (fallbacks > 5) {
      findings.push('✓ Fallback mechanisms detected');
      score += 1;
    } else {
      findings.push('⚠ Limited graceful degradation');
      recommendations.push('Add fallback mechanisms for critical features');
    }

    // Check for circuit breakers
    const circuitBreaker = this.searchInFiles('circuit.*breaker|rate.*limit', ['ts', 'js']);
    if (circuitBreaker > 0) {
      findings.push('✓ Circuit breaker or rate limiting detected');
      score += 0.5;
    } else {
      findings.push('⚠ No circuit breaker pattern detected');
      recommendations.push('Consider implementing circuit breaker pattern');
    }

    return {
      category: '4. Reliability & Error Handling',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditObservabilityMonitoring(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check logging implementation
    const logging = this.searchInFiles('console\\.log|logger|log\\.|winston|pino|bunyan', ['ts', 'js']);
    if (logging > 10) {
      findings.push(`✓ Logging implemented (${logging} log statements found)`);
      score += 1;
    } else {
      findings.push('⚠ Limited logging implementation');
      recommendations.push('Add comprehensive logging throughout application');
    }

    // Check structured logging
    const structuredLogs = this.searchInFiles('JSON\\.stringify|structured.*log|log.*level', ['ts', 'js']);
    if (structuredLogs > 5) {
      findings.push('✓ Structured logging patterns detected');
      score += 1;
    } else {
      findings.push('⚠ No structured logging detected');
      recommendations.push('Implement structured logging with consistent format');
    }

    // Check error tracking
    const errorTracking = this.searchInFiles('sentry|bugsnag|rollbar|errortracking', ['ts', 'js', 'json']);
    if (errorTracking > 0) {
      findings.push('✓ Error tracking service detected');
      score += 1;
    } else {
      findings.push('✗ No error tracking service found');
      recommendations.push('Integrate error tracking (Sentry, Bugsnag, etc.)');
    }

    // Check metrics
    const metrics = this.searchInFiles('metric|prometheus|statsd|datadog', ['ts', 'js', 'json']);
    if (metrics > 0) {
      findings.push('✓ Metrics collection detected');
      score += 1;
    } else {
      findings.push('⚠ No metrics collection found');
      recommendations.push('Implement metrics collection for key operations');
    }

    // Check alerting
    const alerting = this.searchInFiles('alert|notification|webhook|pagerduty|opsgenie', ['ts', 'js', 'json', 'yml', 'yaml']);
    if (alerting > 0) {
      findings.push('✓ Alerting configuration detected');
      score += 1;
    } else {
      findings.push('✗ No alerting system configured');
      recommendations.push('Configure alerting for critical failures');
    }

    return {
      category: '5. Observability & Monitoring',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditCICDDeployment(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check CI configuration
    const ciFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.circleci/config.yml',
      'azure-pipelines.yml',
      '.travis.yml'
    ];
    const hasCi = ciFiles.some(f => this.fileExists(f));
    if (hasCi) {
      findings.push('✓ CI configuration found');
      score += 1;
    } else {
      findings.push('✗ No CI configuration found');
      recommendations.push('Set up CI pipeline (GitHub Actions, GitLab CI, etc.)');
    }

    // Check if tests run in CI
    const packageJson = this.readFile('package.json');
    const hasTestScript = packageJson?.includes('"test"');
    if (hasTestScript) {
      findings.push('✓ Test script defined');
      score += 1;
    } else {
      findings.push('⚠ No test script in package.json');
      recommendations.push('Add test script to package.json');
    }

    // Check linting
    const hasLintScript = packageJson?.includes('"lint"') || this.fileExists('.eslintrc');
    if (hasLintScript) {
      findings.push('✓ Linting configured');
      score += 1;
    } else {
      findings.push('⚠ No linting configured');
      recommendations.push('Configure linting (ESLint, etc.)');
    }

    // Check build verification
    const hasBuildScript = packageJson?.includes('"build"');
    if (hasBuildScript) {
      findings.push('✓ Build script defined');
      score += 1;
    } else {
      findings.push('⚠ No build script found');
      recommendations.push('Add build script and verification');
    }

    // Check rollback strategy
    const hasRollbackDocs = this.searchInFiles('rollback|revert|deployment.*strategy', ['md', 'yml', 'yaml']);
    if (hasRollbackDocs > 0) {
      findings.push('✓ Rollback documentation found');
      score += 1;
    } else {
      findings.push('⚠ No rollback strategy documented');
      recommendations.push('Document rollback procedures');
    }

    return {
      category: '6. CI/CD & Deployment Safety',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditSecurityHardening(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check security headers (Helmet)
    const helmet = this.searchInFiles('helmet|security.*headers', ['ts', 'js', 'json']);
    if (helmet > 0) {
      findings.push('✓ Security headers (Helmet) detected');
      score += 1;
    } else {
      findings.push('⚠ No security headers middleware found');
      recommendations.push('Implement security headers using Helmet');
    }

    // Check input validation
    const validation = this.searchInFiles('validate|sanitize|zod|joi|yup', ['ts', 'js', 'json']);
    if (validation > 10) {
      findings.push('✓ Input validation implemented');
      score += 1;
    } else {
      findings.push('⚠ Limited input validation');
      recommendations.push('Implement comprehensive input validation');
    }

    // Check rate limiting
    const rateLimiting = this.searchInFiles('rate.*limit|express-rate-limit|throttle', ['ts', 'js', 'json']);
    if (rateLimiting > 0) {
      findings.push('✓ Rate limiting implemented');
      score += 1;
    } else {
      findings.push('✗ No rate limiting found');
      recommendations.push('Implement rate limiting for all public endpoints');
    }

    // Check CORS
    const cors = this.searchInFiles('cors', ['ts', 'js', 'json']);
    if (cors > 0) {
      findings.push('✓ CORS configured');
      score += 0.5;
    } else {
      findings.push('⚠ CORS not explicitly configured');
      recommendations.push('Configure CORS properly');
    }

    // Check CSP
    const csp = this.searchInFiles('contentSecurityPolicy|CSP', ['ts', 'js']);
    if (csp > 0) {
      findings.push('✓ Content Security Policy detected');
      score += 0.5;
    } else {
      findings.push('⚠ No CSP headers detected');
      recommendations.push('Consider implementing Content Security Policy');
    }

    // Check dependency scanning
    const securityMd = this.fileExists('SECURITY.md');
    const dependabotConfig = this.fileExists('.github/dependabot.yml');
    if (securityMd || dependabotConfig) {
      findings.push('✓ Security policy or dependency scanning configured');
      score += 1;
    } else {
      findings.push('⚠ No dependency scanning configured');
      recommendations.push('Enable Dependabot or similar tool for dependency scanning');
    }

    return {
      category: '7. Security Hardening',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditTestingCoverage(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for test files
    const testFiles = [
      ...this.findFiles('*.test.*'),
      ...this.findFiles('*.spec.*'),
    ];
    if (testFiles.length > 10) {
      findings.push(`✓ Comprehensive test suite (${testFiles.length} test files)`);
      score += 2;
    } else if (testFiles.length > 0) {
      findings.push(`⚠ Limited tests (${testFiles.length} test files)`);
      score += 1;
      recommendations.push('Expand test coverage');
    } else {
      findings.push('✗ No test files found');
      recommendations.push('CRITICAL: Add unit and integration tests');
    }

    // Check test frameworks
    const packageJson = this.readFile('package.json');
    const testFrameworks = ['jest', 'mocha', 'vitest', 'jasmine', 'ava'];
    const hasTestFramework = testFrameworks.some(f => packageJson?.includes(f));
    if (hasTestFramework) {
      findings.push('✓ Test framework configured');
      score += 1;
    } else {
      findings.push('⚠ No test framework detected');
      recommendations.push('Configure test framework');
    }

    // Check integration tests
    const integrationTests = this.searchInFiles('integration.*test|e2e.*test|api.*test', ['ts', 'js']);
    if (integrationTests > 0) {
      findings.push('✓ Integration/E2E tests detected');
      score += 1;
    } else {
      findings.push('⚠ No integration tests found');
      recommendations.push('Add integration/E2E tests for critical flows');
    }

    // Check coverage configuration
    const hasCoverage = packageJson?.includes('coverage') || this.fileExists('.coveragerc');
    if (hasCoverage) {
      findings.push('✓ Test coverage tracking configured');
      score += 1;
    } else {
      findings.push('⚠ No test coverage tracking');
      recommendations.push('Configure test coverage reporting');
    }

    return {
      category: '8. Testing Coverage',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditPerformanceCost(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check API rate limits
    const rateLimits = this.searchInFiles('rate.*limit|throttle|max.*requests', ['ts', 'js']);
    if (rateLimits > 2) {
      findings.push('✓ API rate limiting implemented');
      score += 1.5;
    } else {
      findings.push('⚠ Limited API rate limiting');
      recommendations.push('Implement rate limiting on all API endpoints');
    }

    // Check resource limits
    const resourceLimits = this.searchInFiles('limit.*size|max.*upload|memory.*limit', ['ts', 'js']);
    if (resourceLimits > 2) {
      findings.push('✓ Resource limits configured');
      score += 1;
    } else {
      findings.push('⚠ Resource limits not evident');
      recommendations.push('Configure resource limits (file size, memory, etc.)');
    }

    // Check caching
    const caching = this.searchInFiles('cache|redis|memcache|etag', ['ts', 'js', 'json']);
    if (caching > 5) {
      findings.push('✓ Caching strategy detected');
      score += 1.5;
    } else {
      findings.push('⚠ Limited or no caching');
      recommendations.push('Implement caching for expensive operations');
    }

    // Check performance monitoring
    const perfMonitoring = this.searchInFiles('performance|timing|benchmark', ['ts', 'js']);
    if (perfMonitoring > 5) {
      findings.push('✓ Performance monitoring detected');
      score += 1;
    } else {
      findings.push('⚠ No performance monitoring found');
      recommendations.push('Add performance monitoring and budgets');
    }

    return {
      category: '9. Performance & Cost Controls',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  private auditDocumentationOperational(): CategoryScore {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check README
    const readme = this.readFile('README.md');
    if (readme && readme.length > 1000) {
      findings.push('✓ Comprehensive README present');
      score += 1.5;
    } else if (readme) {
      findings.push('⚠ README exists but may be incomplete');
      score += 0.5;
      recommendations.push('Expand README with more details');
    } else {
      findings.push('✗ No README found');
      recommendations.push('Create comprehensive README');
    }

    // Check setup instructions
    if (readme?.includes('install') || readme?.includes('setup') || readme?.includes('getting started')) {
      findings.push('✓ Setup instructions present');
      score += 1;
    } else {
      findings.push('⚠ No setup instructions in README');
      recommendations.push('Add detailed setup instructions');
    }

    // Check runbook
    const hasRunbook = this.findFiles('*runbook*').length > 0 || this.searchInFiles('runbook|playbook|operations', ['md']) > 0;
    if (hasRunbook) {
      findings.push('✓ Runbook/operations guide found');
      score += 1.5;
    } else {
      findings.push('✗ No runbook found');
      recommendations.push('Create operational runbook');
    }

    // Check incident procedures
    const hasIncidentDocs = this.searchInFiles('incident|escalation|on-call', ['md']);
    if (hasIncidentDocs > 0) {
      findings.push('✓ Incident procedures documented');
      score += 1;
    } else {
      findings.push('⚠ No incident procedures found');
      recommendations.push('Document incident response procedures');
    }

    return {
      category: '10. Documentation & Operational Readiness',
      score,
      maxScore: 5,
      findings,
      recommendations
    };
  }

  // PHASE 2 - RUNTIME CHECKS

  private async performRuntimeChecks(): Promise<RuntimeCheckResults> {
    if (!this.config.deploymentUrl) {
      return { available: false };
    }

    const results: RuntimeCheckResults = {
      available: true,
      errors: []
    };

    try {
      const startTime = Date.now();
      const response = await fetch(this.config.deploymentUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'ProductionReadinessAudit/1.0' }
      });
      const endTime = Date.now();

      results.httpStatus = response.status;
      results.responseTimeMs = endTime - startTime;

      // Collect security headers
      results.securityHeaders = {};
      const securityHeaderKeys = [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'content-security-policy',
        'referrer-policy'
      ];

      securityHeaderKeys.forEach(key => {
        const value = response.headers.get(key);
        if (value) {
          results.securityHeaders![key] = value;
        }
      });

    } catch (error: any) {
      results.errors?.push(`Failed to reach deployment: ${error.message}`);
    }

    return results;
  }

  // PHASE 3 - READINESS CLASSIFICATION

  private classifyReadiness(totalScore: number): string {
    if (totalScore >= 51) return 'Production Ready';
    if (totalScore >= 43) return 'Public Beta Ready';
    if (totalScore >= 36) return 'Employee Pilot Ready (with conditions)';
    if (totalScore >= 26) return 'Dev Preview';
    return 'Prototype';
  }

  private identifyCriticalBlockers(): string[] {
    const blockers: string[] = [];

    this.categories.forEach(cat => {
      // Critical blockers are severe issues that must be fixed
      if (cat.category.includes('Identity & Access') && cat.score < 3) {
        blockers.push('Insufficient authentication and access control');
      }
      if (cat.category.includes('Secrets') && cat.score < 3) {
        blockers.push('Poor secrets management - risk of credential exposure');
      }
      if (cat.category.includes('Security Hardening') && cat.score < 3) {
        blockers.push('Inadequate security hardening for production use');
      }
      if (cat.category.includes('Testing') && cat.score < 2) {
        blockers.push('Insufficient test coverage - high risk of bugs');
      }
    });

    if (this.config.handlesPII) {
      const dataSafety = this.categories.find(c => c.category.includes('Data Safety'));
      if (dataSafety && dataSafety.score < 4) {
        blockers.push('CRITICAL: Handles PII but inadequate data protection measures');
      }
    }

    if (this.config.handlesPayments) {
      blockers.push('CRITICAL: Payment handling requires PCI-DSS compliance audit');
    }

    return blockers;
  }

  private identifyPublicLaunchBlockers(): string[] {
    const blockers: string[] = [];

    this.categories.forEach(cat => {
      if (cat.score < cat.maxScore * 0.6) {
        blockers.push(`${cat.category}: Score too low (${cat.score}/${cat.maxScore})`);
      }
    });

    const observability = this.categories.find(c => c.category.includes('Observability'));
    if (observability && observability.score < 3) {
      blockers.push('Insufficient observability for production debugging');
    }

    const cicd = this.categories.find(c => c.category.includes('CI/CD'));
    if (cicd && cicd.score < 3) {
      blockers.push('No CI/CD pipeline for safe deployments');
    }

    return blockers;
  }

  private extractCategoryShortName(category: string): string {
    // Extract short name from "1. Category Name" format
    const parts = category.split('.');
    if (parts.length >= 2) {
      return parts.slice(1).join('.').trim();
    }
    return category.trim();
  }

  private identifyTopImprovements(): string[] {
    const improvements: string[] = [];

    // Collect all recommendations with their scores
    const weightedRecs: Array<{ rec: string; priority: number }> = [];

    this.categories.forEach(cat => {
      const scoreDiff = cat.maxScore - cat.score;
      cat.recommendations.forEach(rec => {
        weightedRecs.push({
          rec: `${this.extractCategoryShortName(cat.category)}: ${rec}`,
          priority: scoreDiff
        });
      });
    });

    // Sort by priority and take top 5
    weightedRecs.sort((a, b) => b.priority - a.priority);
    return weightedRecs.slice(0, 5).map(w => w.rec);
  }

  // PHASE 4 - EXECUTIVE SUMMARY

  private generateExecutiveSummary(): ExecutiveSummary {
    const totalScore = this.categories.reduce((sum, cat) => sum + cat.score, 0);
    const readinessLevel = this.classifyReadiness(totalScore);

    const safeForEmployees = totalScore >= 36 && this.identifyCriticalBlockers().length === 0;
    const safeForCustomers = totalScore >= 43 && this.identifyPublicLaunchBlockers().length === 0;

    const likelyFailurePoints: string[] = [];
    const securityConcerns: string[] = [];

    // Analyze weak points
    this.categories.forEach(cat => {
      if (cat.score < cat.maxScore * 0.4) {
        likelyFailurePoints.push(`${this.extractCategoryShortName(cat.category)}: Very weak (${cat.score}/${cat.maxScore})`);
      }
    });

    // Security concerns
    const securityCat = this.categories.find(c => c.category.includes('Security'));
    if (securityCat && securityCat.score < 3) {
      securityConcerns.push('Inadequate security hardening');
    }

    const secretsCat = this.categories.find(c => c.category.includes('Secrets'));
    if (secretsCat && secretsCat.score < 3) {
      securityConcerns.push('Poor secrets management');
    }

    const authCat = this.categories.find(c => c.category.includes('Identity'));
    if (authCat && authCat.score < 3) {
      securityConcerns.push('Weak authentication and authorization');
    }

    if (this.config.handlesPII || this.config.handlesPayments) {
      securityConcerns.push('Handles sensitive data - requires additional scrutiny');
    }

    if (likelyFailurePoints.length === 0) {
      likelyFailurePoints.push('Under normal load: reasonable stability expected');
    }

    if (securityConcerns.length === 0) {
      securityConcerns.push('Basic security measures in place, but review recommended');
    }

    return {
      safeForEmployees,
      safeForCustomers,
      likelyFailurePoints,
      securityConcerns
    };
  }

  // MAIN AUDIT EXECUTION

  async performAudit(): Promise<AuditReport> {
    console.log('\n🔍 Starting Production Readiness Audit...\n');

    // Run all category audits
    this.categories = [
      this.auditIdentityAccessControl(),
      this.auditSecretsConfiguration(),
      this.auditDataSafetyPrivacy(),
      this.auditReliabilityErrorHandling(),
      this.auditObservabilityMonitoring(),
      this.auditCICDDeployment(),
      this.auditSecurityHardening(),
      this.auditTestingCoverage(),
      this.auditPerformanceCost(),
      this.auditDocumentationOperational()
    ];

    // Calculate total score
    const totalScore = this.categories.reduce((sum, cat) => sum + cat.score, 0);
    const maxTotalScore = this.categories.reduce((sum, cat) => sum + cat.maxScore, 0);

    // Runtime checks
    let runtimeChecks: RuntimeCheckResults | undefined;
    if (this.config.deploymentUrl) {
      console.log('🌐 Performing runtime checks...\n');
      runtimeChecks = await this.performRuntimeChecks();
    }

    // Generate report
    const report: AuditReport = {
      config: this.config,
      timestamp: new Date().toISOString(),
      categories: this.categories,
      totalScore,
      maxTotalScore,
      readinessLevel: this.classifyReadiness(totalScore),
      criticalBlockers: this.identifyCriticalBlockers(),
      publicLaunchBlockers: this.identifyPublicLaunchBlockers(),
      topImprovements: this.identifyTopImprovements(),
      runtimeChecks,
      executiveSummary: this.generateExecutiveSummary()
    };

    return report;
  }

  // REPORT FORMATTING

  static formatReport(report: AuditReport): string {
    let output = '';

    output += '═══════════════════════════════════════════════════════════════════\n';
    output += '                 PRODUCTION READINESS AUDIT REPORT\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    output += `📅 Audit Date: ${new Date(report.timestamp).toLocaleString()}\n`;
    output += `📁 Repository: ${report.config.repoPath}\n`;
    if (report.config.deploymentUrl) {
      output += `🌐 Deployment: ${report.config.deploymentUrl}\n`;
    }
    output += `👥 Intended Audience: ${report.config.intendedAudience}\n`;
    output += `🔒 Handles PII: ${report.config.handlesPII ? 'Yes' : 'No'}\n`;
    output += `💳 Handles Payments: ${report.config.handlesPayments ? 'Yes' : 'No'}\n`;
    output += `🔑 Handles Secrets: ${report.config.handlesSecrets ? 'Yes' : 'No'}\n\n`;

    // SECTION A - SCORECARD TABLE
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'SECTION A — SCORECARD TABLE\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    report.categories.forEach(cat => {
      const percentage = ((cat.score / cat.maxScore) * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(cat.score)) + '░'.repeat(cat.maxScore - Math.floor(cat.score));
      output += `${cat.category.padEnd(45)} ${cat.score.toFixed(1)}/${cat.maxScore} ${bar} (${percentage}%)\n`;
    });

    output += '\n' + '─'.repeat(67) + '\n';
    output += `${'TOTAL SCORE'.padEnd(45)} ${report.totalScore.toFixed(1)}/${report.maxTotalScore}\n`;
    output += `${'READINESS LEVEL'.padEnd(45)} ${report.readinessLevel}\n`;
    output += '─'.repeat(67) + '\n\n';

    // Score Interpretation Guide
    output += 'Score Interpretation:\n';
    output += '  0-25  → Prototype\n';
    output += '  26-35 → Dev Preview\n';
    output += '  36-42 → Employee Pilot Ready (with conditions)\n';
    output += '  43-50 → Public Beta Ready\n';
    output += '  51+   → Production Ready\n\n';

    // SECTION B - DETAILED FINDINGS
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'SECTION B — DETAILED FINDINGS\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    report.categories.forEach(cat => {
      output += `\n${cat.category} [${cat.score.toFixed(1)}/${cat.maxScore}]\n`;
      output += '─'.repeat(67) + '\n';
      
      if (cat.findings.length > 0) {
        output += 'Findings:\n';
        cat.findings.forEach(finding => {
          output += `  ${finding}\n`;
        });
      }
      
      if (cat.recommendations.length > 0) {
        output += '\nRecommendations:\n';
        cat.recommendations.forEach(rec => {
          output += `  • ${rec}\n`;
        });
      }
      output += '\n';
    });

    // Runtime Checks
    if (report.runtimeChecks && report.runtimeChecks.available) {
      output += '═══════════════════════════════════════════════════════════════════\n';
      output += 'PHASE 2 — RUNTIME CHECK RESULTS\n';
      output += '═══════════════════════════════════════════════════════════════════\n\n';

      if (report.runtimeChecks.httpStatus) {
        output += `HTTP Status: ${report.runtimeChecks.httpStatus}\n`;
        output += `Response Time: ${report.runtimeChecks.responseTimeMs}ms\n\n`;
      }

      if (report.runtimeChecks.securityHeaders) {
        output += 'Security Headers:\n';
        Object.entries(report.runtimeChecks.securityHeaders).forEach(([key, value]) => {
          output += `  ✓ ${key}: ${value}\n`;
        });
        output += '\n';
      }

      if (report.runtimeChecks.errors && report.runtimeChecks.errors.length > 0) {
        output += 'Errors:\n';
        report.runtimeChecks.errors.forEach(err => {
          output += `  ✗ ${err}\n`;
        });
        output += '\n';
      }
    }

    // SECTION C - BLOCKERS
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'SECTION C — BLOCKERS\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    if (report.criticalBlockers.length > 0) {
      output += '🚨 CRITICAL BLOCKERS (Must fix before employee use):\n\n';
      report.criticalBlockers.forEach((blocker, i) => {
        output += `  ${i + 1}. ${blocker}\n`;
      });
      output += '\n';
    } else {
      output += '✓ No critical blockers identified for employee use.\n\n';
    }

    if (report.publicLaunchBlockers.length > 0) {
      output += '⚠️  PUBLIC LAUNCH BLOCKERS:\n\n';
      report.publicLaunchBlockers.forEach((blocker, i) => {
        output += `  ${i + 1}. ${blocker}\n`;
      });
      output += '\n';
    } else {
      output += '✓ No public launch blockers identified.\n\n';
    }

    // SECTION D - READINESS VERDICT
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'SECTION D — READINESS VERDICT\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    output += `Readiness Level: ${report.readinessLevel}\n`;
    output += `Total Score: ${report.totalScore.toFixed(1)}/${report.maxTotalScore}\n\n`;

    output += `Safe for Employees: ${report.executiveSummary.safeForEmployees ? '✓ YES' : '✗ NO'}\n`;
    output += `Safe for Customers: ${report.executiveSummary.safeForCustomers ? '✓ YES' : '✗ NO'}\n\n`;

    // SECTION E - IMMEDIATE ACTION PLAN
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'SECTION E — IMMEDIATE ACTION PLAN (Prioritized by Impact)\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    if (report.topImprovements.length > 0) {
      report.topImprovements.forEach((improvement, i) => {
        output += `  ${i + 1}. ${improvement}\n`;
      });
      output += '\n';
    }

    // EXECUTIVE SUMMARY
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += 'PHASE 4 — EXECUTIVE SUMMARY\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    output += '🔍 IS THIS SAFE FOR EMPLOYEES?\n';
    if (report.executiveSummary.safeForEmployees) {
      output += '✓ YES - With appropriate onboarding and monitoring.\n\n';
    } else {
      output += '✗ NO - Critical blockers must be addressed first.\n\n';
    }

    output += '🔍 IS THIS SAFE FOR CUSTOMERS?\n';
    if (report.executiveSummary.safeForCustomers) {
      output += '✓ YES - Meets public beta requirements.\n\n';
    } else {
      output += '✗ NO - Additional hardening required.\n\n';
    }

    output += '🔍 WHAT WOULD BREAK FIRST UNDER REAL USAGE?\n';
    report.executiveSummary.likelyFailurePoints.forEach(point => {
      output += `  • ${point}\n`;
    });
    output += '\n';

    output += '🔍 WHAT WOULD SCARE A SECURITY REVIEW?\n';
    report.executiveSummary.securityConcerns.forEach(concern => {
      output += `  • ${concern}\n`;
    });
    output += '\n';

    output += '═══════════════════════════════════════════════════════════════════\n';
    output += '                         END OF REPORT\n';
    output += '═══════════════════════════════════════════════════════════════════\n';

    return output;
  }
}

import { pathToFileURL } from "url";

// CLI Interface

async function main() {
  const args = process.argv.slice(2);
  const config: AuditConfig = {
    repoPath: './',
    intendedAudience: 'employee',
    handlesPII: false,
    handlesPayments: false,
    handlesSecrets: false
  };

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--repo-path=')) {
      config.repoPath = arg.split('=')[1];
    } else if (arg.startsWith('--deployment-url=')) {
      config.deploymentUrl = arg.split('=')[1];
    } else if (arg.startsWith('--intended-audience=')) {
      const audience = arg.split('=')[1] as 'employee' | 'public' | 'both';
      config.intendedAudience = audience;
    } else if (arg.startsWith('--handles-pii=')) {
      config.handlesPII = arg.split('=')[1].toLowerCase() === 'yes';
    } else if (arg.startsWith('--handles-payments=')) {
      config.handlesPayments = arg.split('=')[1].toLowerCase() === 'yes';
    } else if (arg.startsWith('--handles-secrets=')) {
      config.handlesSecrets = arg.split('=')[1].toLowerCase() === 'yes';
    }
  });

  const auditor = new ProductionReadinessAuditor(config);
  const report = await auditor.performAudit();
  const formattedReport = ProductionReadinessAuditor.formatReport(report);

  console.log(formattedReport);

  // Save report to file
  const reportPath = path.join(config.repoPath, 'production-readiness-audit.txt');
  fs.writeFileSync(reportPath, formattedReport, 'utf-8');
  console.log(`\n📄 Report saved to: ${reportPath}\n`);

  // Exit with appropriate code
  const exitCode = report.executiveSummary.safeForEmployees ? 0 : 1;
  process.exit(exitCode);
}

// Check if this module is being run directly
const isMainModule = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ProductionReadinessAuditor, type AuditConfig, type AuditReport };
