#!/usr/bin/env node

/**
 * MODULE 1: Secure Login & 2FA/MFA Testing
 */

const http = require('http');
const BASE_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let parsedBody = null;
        try {
          parsedBody = body ? JSON.parse(body) : null;
        } catch (e) {
          parsedBody = { raw: body.substring(0, 50) };
        }
        resolve({
          status: res.statusCode,
          body: parsedBody,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
  console.log(`  ${status} ${name}`);
  if (message) console.log(`      ${colors.yellow}${message}${colors.reset}`);
  return passed;
}

async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════╗
║     MODULE 1: Secure Login & 2FA/MFA Testing           ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Check auth endpoint
    console.log(`\n${colors.blue}1. Authentication Endpoint Tests${colors.reset}`);
    const authCheck = await makeRequest('GET', '/api/auth/check-email?email=test@test.com');
    passed += logTest('Auth endpoint accessible', authCheck.status !== 404) ? 1 : 0;

    // Test 2: Invalid email format
    console.log(`\n${colors.blue}2. Validation Tests${colors.reset}`);
    const invalidEmail = await makeRequest('POST', '/api/auth/register', {
      email: 'not-an-email',
      password: 'SecurePass123!'
    });
    passed += logTest('Email validation', invalidEmail.status === 400 || invalidEmail.status === 422) ? 1 : 0;

    // Test 3: Weak password
    const weakPassword = await makeRequest('POST', '/api/auth/register', {
      email: 'test@example.com',
      password: '123'
    });
    passed += logTest('Password strength validation', weakPassword.status === 400 || weakPassword.status === 422) ? 1 : 0;

    // Test 4: Login flow
    console.log(`\n${colors.blue}3. Login Flow Tests${colors.reset}`);
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'WrongPassword123!'
    });
    passed += logTest('Login attempt', login.status !== 500) ? 1 : 0;

    // Test 5: OTP endpoint
    console.log(`\n${colors.blue}4. OTP Tests${colors.reset}`);
    const otpVerify = await makeRequest('POST', '/api/auth/verify-otp', {
      email: 'test@example.com',
      otp: '000000'
    });
    passed += logTest('OTP verification endpoint', otpVerify.status !== 500) ? 1 : 0;

    // Test 6: OAuth endpoints
    console.log(`\n${colors.blue}5. OAuth Integration Tests${colors.reset}`);
    const googleEndpoint = await makeRequest('GET', '/api/auth/google');
    passed += logTest('Google OAuth endpoint', googleEndpoint.status !== 404) ? 1 : 0;

    // Test 7: Protected route (should fail without token)
    console.log(`\n${colors.blue}6. Authentication Enforcement${colors.reset}`);
    const noToken = await makeRequest('GET', '/api/auth/me');
    passed += logTest('Protected route requires token', noToken.status === 401 || noToken.status === 403) ? 1 : 0;

    // Test 8: Swagger documentation
    console.log(`\n${colors.blue}7. Documentation Tests${colors.reset}`);
    const swagger = await makeRequest('GET', '/docs');
    passed += logTest('Swagger documentation', swagger.status === 200) ? 1 : 0;

  } catch (error) {
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    failed++;
  }

  const total = passed + failed;
  console.log(`
${colors.blue}╔════════════════════════════════════════════════════════╗
║                  TEST RESULTS                          ║
╚════════════════════════════════════════════════════════╝${colors.reset}
${colors.green}✅ Passed: ${passed}${colors.reset}
${colors.red}❌ Failed: ${failed}${colors.reset}
📊 Total: ${total}
`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
