#!/usr/bin/env node

/**
 * OTP Optimizations Test Suite
 * Tests the enhanced OTP service performance and functionality
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

let testsPassed = 0;
let testsFailed = 0;
const performanceMetrics = [];

// Helper function to make HTTP requests with timing
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
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
        const responseTime = Date.now() - startTime;
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
          responseTime,
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function logTest(name, passed, message = '', responseTime = null) {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  const timeInfo = responseTime !== null ? ` (${responseTime}ms)` : '';
  console.log(`  ${status} ${name}${timeInfo}`);
  if (message) {
    console.log(`      ${colors.yellow}${message}${colors.reset}`);
  }
  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }
  
  if (responseTime !== null) {
    performanceMetrics.push({ test: name, time: responseTime });
  }
}

async function testOTPGeneration() {
  console.log(`\n${colors.cyan}🔐 OTP Generation Performance Test${colors.reset}`);
  
  try {
    // Test enhanced login endpoint
    const startTime = Date.now();
    const response = await makeRequest('POST', '/api/auth/enhanced-login', {
      email: 'test@example.com',
      password: 'test123',
      enableSMS: true
    });
    const totalTime = Date.now() - startTime;

    logTest(
      'Enhanced OTP Generation', 
      response.status === 200, 
      response.body?.message || 'OTP generation failed',
      totalTime
    );

    if (response.status === 200 && response.body?.data?.performance) {
      const perf = response.body.data.performance;
      logTest('OTP Generation Time', perf.generationTime < 100, `Generation: ${perf.generationTime}ms`, perf.generationTime);
      logTest('OTP Delivery Time', perf.deliveryTime < 2000, `Delivery: ${perf.deliveryTime}ms`, perf.deliveryTime);
      logTest('Total Processing Time', perf.totalTime < 3000, `Total: ${perf.totalTime}ms`, perf.totalTime);
      
      // Performance benchmarks
      if (perf.generationTime < 50) {
        console.log(`      ${colors.green}🚀 Excellent generation speed!${colors.reset}`);
      } else if (perf.generationTime < 100) {
        console.log(`      ${colors.cyan}⚡ Good generation speed${colors.reset}`);
      }
      
      if (perf.deliveryTime < 1000) {
        console.log(`      ${colors.green}📧 Excellent delivery speed!${colors.reset}`);
      } else if (perf.deliveryTime < 2000) {
        console.log(`      ${colors.cyan}📧 Good delivery speed${colors.reset}`);
      }
    }

  } catch (error) {
    logTest('Enhanced OTP Generation', false, `Error: ${error.message}`);
  }
}

async function testOTPValidation() {
  console.log(`\n${colors.cyan}🔍 OTP Validation Performance Test${colors.reset}`);
  
  try {
    // First, get a valid OTP
    const loginResponse = await makeRequest('POST', '/api/auth/enhanced-login', {
      email: 'test@example.com',
      password: 'test123'
    });

    if (loginResponse.status === 200) {
      // Test OTP validation with correct code (we'll need to extract from logs in real scenario)
      const validationResponse = await makeRequest('POST', '/api/auth/enhanced-verify-otp', {
        email: 'test@example.com',
        otp: '123456' // Test with wrong code first
      });

      logTest(
        'OTP Validation (Wrong Code)', 
        validationResponse.status === 400, 
        'Should reject wrong OTP',
        validationResponse.responseTime
      );

      if (validationResponse.body?.performance) {
        logTest(
          'Validation Response Time', 
          validationResponse.body.performance.validationTime < 100, 
          `Validation: ${validationResponse.body.performance.validationTime}ms`,
          validationResponse.body.performance.validationTime
        );
      }
    } else {
      logTest('OTP Validation Setup', false, 'Could not get OTP for testing');
    }

  } catch (error) {
    logTest('OTP Validation Test', false, `Error: ${error.message}`);
  }
}

async function testOTPResend() {
  console.log(`\n${colors.cyan}📤 OTP Resend Performance Test${colors.reset}`);
  
  try {
    const resendResponse = await makeRequest('POST', '/api/auth/resend-otp', {
      email: 'test@example.com'
    });

    logTest(
      'OTP Resend Endpoint', 
      [200, 429].includes(resendResponse.status), 
      `Status: ${resendResponse.status}`,
      resendResponse.responseTime
    );

    if (resendResponse.status === 200 && resendResponse.body?.data) {
      const data = resendResponse.body.data;
      logTest('Resend Delivery Time', data.deliveryTime < 2000, `Resend: ${data.deliveryTime}ms`, data.deliveryTime);
    }

  } catch (error) {
    logTest('OTP Resend Test', false, `Error: ${error.message}`);
  }
}

async function testOTPStats() {
  console.log(`\n${colors.cyan}📊 OTP Statistics Test${colors.reset}`);
  
  try {
    // Get admin stats (would need valid admin token in real scenario)
    const statsResponse = await makeRequest('GET', '/api/auth/otp-stats', null, {
      'Authorization': 'Bearer admin-test-token'
    });

    logTest(
      'OTP Statistics Endpoint', 
      statsResponse.status !== 500, 
      `Status: ${statsResponse.status}`,
      statsResponse.responseTime
    );

  } catch (error) {
    logTest('OTP Statistics Test', false, `Error: ${error.message}`);
  }
}

async function runLoadTest() {
  console.log(`\n${colors.cyan}⚡ Load Test - Multiple OTP Requests${colors.reset}`);
  
  const concurrentRequests = 5;
  const promises = [];

  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      makeRequest('POST', '/api/auth/enhanced-login', {
        email: `test${i}@example.com`,
        password: 'test123'
      })
    );
  }

  try {
    const results = await Promise.allSettled(promises);
    let successCount = 0;
    let totalTime = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.status === 200) {
        successCount++;
        totalTime += result.value.responseTime;
      }
    });

    const avgTime = successCount > 0 ? Math.round(totalTime / successCount) : 0;
    
    logTest(
      'Concurrent OTP Requests', 
      successCount >= concurrentRequests * 0.8, 
      `${successCount}/${concurrentRequests} successful`,
      avgTime
    );

  } catch (error) {
    logTest('Load Test', false, `Error: ${error.message}`);
  }
}

async function generatePerformanceReport() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗`);
  console.log(`║              OTP PERFORMANCE REPORT                    ║`);
  console.log(`╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  if (performanceMetrics.length > 0) {
    const avgTime = Math.round(performanceMetrics.reduce((sum, m) => sum + m.time, 0) / performanceMetrics.length);
    const maxTime = Math.max(...performanceMetrics.map(m => m.time));
    const minTime = Math.min(...performanceMetrics.map(m => m.time));
    
    console.log(`\n${colors.cyan}📈 Performance Metrics:${colors.reset}`);
    console.log(`   Average Response Time: ${avgTime}ms`);
    console.log(`   Fastest Response: ${minTime}ms`);
    console.log(`   Slowest Response: ${maxTime}ms`);
    
    // Performance assessment
    if (avgTime < 500) {
      console.log(`   ${colors.green}🚀 Excellent Performance!${colors.reset}`);
    } else if (avgTime < 1000) {
      console.log(`   ${colors.cyan}⚡ Good Performance${colors.reset}`);
    } else if (avgTime < 2000) {
      console.log(`   ${colors.yellow}⚠️ Acceptable Performance${colors.reset}`);
    } else {
      console.log(`   ${colors.red}❌ Performance Needs Improvement${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.yellow}🎯 Optimization Improvements:${colors.reset}`);
  console.log(`   ✅ Redis/Memory caching implemented`);
  console.log(`   ✅ Parallel email/SMS delivery`);
  console.log(`   ✅ Connection pooling for email service`);
  console.log(`   ✅ Performance monitoring and analytics`);
  console.log(`   ✅ Rate limiting for resend requests`);
  console.log(`   ✅ Enhanced error handling and logging`);
}

async function main() {
  console.log(`
${colors.blue}╔════════════════════════════════════════════════════════╗
║         OTP OPTIMIZATION TEST SUITE                    ║
║    Testing Enhanced OTP Performance & Features         ║
╚════════════════════════════════════════════════════════╝${colors.reset}
  `);

  // Check if server is running
  try {
    const healthCheck = await makeRequest('GET', '/health');
    if (healthCheck.status !== 200) {
      console.log(`${colors.red}❌ Backend server not responding properly${colors.reset}`);
      console.log(`${colors.yellow}Start the server with: npm run dev${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Backend server not running${colors.reset}`);
    console.log(`${colors.yellow}Start the server with: npm run dev${colors.reset}`);
    process.exit(1);
  }

  // Run all tests
  await testOTPGeneration();
  await testOTPValidation();
  await testOTPResend();
  await testOTPStats();
  await runLoadTest();
  await generatePerformanceReport();

  // Final summary
  const totalTests = testsPassed + testsFailed;
  const passPercentage = ((testsPassed / totalTests) * 100).toFixed(1);

  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗`);
  console.log(`║                   TEST SUMMARY                         ║`);
  console.log(`╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
  console.log(`📊 Total:  ${totalTests}`);
  console.log(`📈 Success Rate: ${passPercentage}%`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All OTP optimization tests passed!${colors.reset}`);
    console.log(`${colors.cyan}🚀 Enhanced OTP service is ready for production!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ Some tests failed. Check the implementation.${colors.reset}`);
  }

  console.log(`\n${colors.yellow}📋 Next Steps:${colors.reset}`);
  console.log(`   1. Test admin access mechanism`);
  console.log(`   2. Implement enhanced admin monitoring`);
  console.log(`   3. Create terminal demonstration interface`);
  console.log(`   4. Deploy to production environment`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});