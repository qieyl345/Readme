#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Security Gate - Evaluate if the build should pass based on security findings
 */

function evaluateSecurityGate() {
  const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || process.env.GITHUB_OUTPUT;
  let criticalIssues = 0;
  let warnings = 0;
  let allReports = [];
  let gateStatus = 'PASS';

  // Read and evaluate ESLint security findings
  try {
    const eslintReport = JSON.parse(fs.readFileSync('security-reports/security-analysis-reports/eslint-security-report.json', 'utf8'));
    if (eslintReport && eslintReport.length > 0) {
      eslintReport.forEach(issue => {
        if (issue.severity === 'error' || issue.ruleId?.includes('security')) {
          criticalIssues++;
        } else {
          warnings++;
        }
      });
      allReports.push({ tool: 'ESLint', issues: eslintReport.length, critical: criticalIssues });
    }
  } catch (error) {
    console.log('ESLint report not found');
  }

  // Read and evaluate Semgrep findings
  try {
    const semgrepReport = JSON.parse(fs.readFileSync('security-reports/security-analysis-reports/semgrep-report.json', 'utf8'));
    if (semgrepReport && semgrepReport.results) {
      const highSeverity = semgrepReport.results.filter(r => r.extra.severity === 'ERROR');
      const mediumSeverity = semgrepReport.results.filter(r => r.extra.severity === 'WARNING');
      
      criticalIssues += highSeverity.length;
      warnings += mediumSeverity.length;
      
      allReports.push({ 
        tool: 'Semgrep', 
        issues: semgrepReport.results.length, 
        critical: highSeverity.length,
        warnings: mediumSeverity.length
      });
    }
  } catch (error) {
    console.log('Semgrep report not found');
  }

  // Read and evaluate Bandit findings
  try {
    const banditReport = JSON.parse(fs.readFileSync('security-reports/security-analysis-reports/bandit-report.json', 'utf8'));
    if (banditReport && banditReport.results) {
      const highSeverity = banditReport.results.filter(r => r.issue_severity === 'HIGH');
      const mediumSeverity = banditReport.results.filter(r => r.issue_severity === 'MEDIUM');
      
      criticalIssues += highSeverity.length;
      warnings += mediumSeverity.length;
      
      allReports.push({ 
        tool: 'Bandit', 
        issues: banditReport.results.length, 
        critical: highSeverity.length,
        warnings: mediumSeverity.length
      });
    }
  } catch (error) {
    console.log('Bandit report not found');
  }

  // Read and evaluate Safety findings
  try {
    const safetyReport = JSON.parse(fs.readFileSync('security-reports/security-analysis-reports/safety-report.json', 'utf8'));
    if (safetyReport && safetyReport.length > 0) {
      // All Safety findings are considered critical (vulnerabilities)
      criticalIssues += safetyReport.length;
      
      allReports.push({ 
        tool: 'Safety', 
        issues: safetyReport.length, 
        critical: safetyReport.length
      });
    }
  } catch (error) {
    console.log('Safety report not found');
  }

  // Evaluate security gate conditions
  console.log('🔍 Security Gate Evaluation:');
  console.log(`   Critical Issues: ${criticalIssues}`);
  console.log(`   Warnings: ${warnings}`);

  // Define gate conditions
  const CRITICAL_THRESHOLD = 0; // No critical issues allowed
  const WARNING_THRESHOLD = 20; // Allow up to 20 warnings

  if (criticalIssues > CRITICAL_THRESHOLD) {
    gateStatus = 'FAIL';
    console.log('❌ Security Gate FAILED: Critical security issues detected');
  } else if (warnings > WARNING_THRESHOLD) {
    gateStatus = 'WARN';
    console.log('⚠️  Security Gate WARNING: Too many security warnings');
  } else {
    console.log('✅ Security Gate PASSED: No critical issues, acceptable warning level');
  }

  // Generate gate report
  let gateReport = `# 🚦 Security Gate Report\n\n`;
  gateReport += `**Timestamp:** ${new Date().toISOString()}\n\n`;
  gateReport += `## 📊 Summary\n\n`;
  gateReport += `- **Critical Issues:** ${criticalIssues}\n`;
  gateReport += `- **Warnings:** ${warnings}\n`;
  gateReport += `- **Gate Status:** ${gateStatus}\n\n`;

  if (allReports.length > 0) {
    gateReport += `## 🔍 Tool Reports\n\n`;
    allReports.forEach(report => {
      gateReport += `- **${report.tool}:** ${report.issues} issues (${report.critical} critical, ${report.warnings || 0} warnings)\n`;
    });
    gateReport += `\n`;
  }

  // Gate decision
  gateReport += `## 🎯 Gate Decision\n\n`;
  if (gateStatus === 'FAIL') {
    gateReport += `❌ **BLOCKED** - Critical security issues must be resolved before merging.\n\n`;
    gateReport += `**Required Actions:**\n`;
    gateReport += `1. Fix all critical security vulnerabilities\n`;
    gateReport += `2. Address high-severity findings\n`;
    gateReport += `3. Re-run security scans\n`;
    gateReport += `4. Ensure gate passes before merge\n`;
  } else if (gateStatus === 'WARN') {
    gateReport += `⚠️ **WARNING** - High number of security warnings detected.\n\n`;
    gateReport += `**Recommended Actions:**\n`;
    gateReport += `1. Review and address security warnings\n`;
    gateReport += `2. Consider implementing security improvements\n`;
    gateReport += `3. Monitor security debt over time\n`;
  } else {
    gateReport += `✅ **PASSED** - Security standards met.\n\n`;
    gateReport += `**Status:** All security checks passed successfully.\n`;
  }

  gateReport += `\n---\n`;
  gateReport += `*Generated by Security CI/CD Pipeline*\n`;

  // Write gate report
  fs.writeFileSync('security-gate-report.md', gateReport);

  // Output results for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const output = fs.readFileSync(process.env.GITHUB_OUTPUT, 'utf8');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical_issues=${criticalIssues}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `warnings=${warnings}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `gate_status=${gateStatus}\n`);
  }

  // Exit with appropriate code
  if (gateStatus === 'FAIL') {
    console.log('🚨 Security gate failed the build');
    process.exit(1);
  } else if (gateStatus === 'WARN') {
    console.log('⚠️  Security gate passed with warnings');
    process.exit(0);
  } else {
    console.log('🎉 Security gate passed successfully');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  evaluateSecurityGate();
}

module.exports = { evaluateSecurityGate };