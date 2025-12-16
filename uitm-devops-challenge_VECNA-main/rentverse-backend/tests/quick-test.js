#!/usr/bin/env node

/**
 * Quick Test - Simple health check and basic tests
 */

const http = require('http');
const BASE_URL = 'http://localhost:5000';

let testsPassed = 0;
let testsFailed = 0;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body ? JSON.parse(body) : null,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} ${name}`);
  if (message) {
    console.log(`      ${message}`);
  }
  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n🔍 QUICK TEST SUITE');
  console.log('==================\n');

  try {
    // Health check
    console.log('📋 Module 1: Auth Tests');
    const health = await makeRequest('GET', '/health');
    logTest('API Health Check', health.status === 200, `Status: ${health.status}`);

    // Try to access auth endpoint
    const authCheck = await makeRequest('GET', '/api/auth/check-email?email=test@test.com');
    logTest('Auth Endpoint Accessible', [200, 400, 401].includes(authCheck.status), `Status: ${authCheck.status}`);

    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%\n`);

    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

runTests();
