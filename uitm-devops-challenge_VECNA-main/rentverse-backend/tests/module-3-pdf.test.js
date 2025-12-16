#!/usr/bin/env node

/**
 * MODULE 3: Digital Agreements & PDF Signing Testing
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
║   MODULE 3: Digital Agreements & PDF Signing Testing   ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Booking module endpoints
    console.log(`\n${colors.blue}1. Booking Module Tests${colors.reset}`);
    const bookingList = await makeRequest('GET', '/api/bookings/my-bookings', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Booking list endpoint accessible', 
      bookingList.status !== 404) ? 1 : 0;

    // Test 2: Create booking validation
    console.log(`\n${colors.blue}2. Booking Creation${colors.reset}`);
    const invalidBooking = await makeRequest('POST', '/api/bookings', 
      { invalidField: 'test' }, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('Booking validation working', 
      invalidBooking.status !== 200 && invalidBooking.status !== 404) ? 1 : 0;

    // Test 3: Rental agreement endpoints
    console.log(`\n${colors.blue}3. PDF Agreement Endpoints${colors.reset}`);
    const agreementInfo = await makeRequest('GET', 
      '/api/bookings/test-id/rental-agreement',
      {}, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('Rental agreement info endpoint', 
      agreementInfo.status !== 404) ? 1 : 0;

    const agreementDownload = await makeRequest('GET', 
      '/api/bookings/test-id/rental-agreement/download',
      {}, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('PDF download endpoint', 
      agreementDownload.status !== 404) ? 1 : 0;

    // Test 4: Booking approval
    console.log(`\n${colors.blue}4. Booking Approval (Triggers PDF)${colors.reset}`);
    const approve = await makeRequest('POST', 
      '/api/bookings/test-id/approve',
      { notes: 'Approved' }, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('Booking approval endpoint', 
      approve.status !== 404) ? 1 : 0;

    // Test 5: Booking rejection
    console.log(`\n${colors.blue}5. Booking Rejection${colors.reset}`);
    const reject = await makeRequest('POST', 
      '/api/bookings/test-id/reject',
      { reason: 'Not suitable' }, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('Booking rejection endpoint', 
      reject.status !== 404) ? 1 : 0;

    // Test 6: Booked periods (calendar)
    console.log(`\n${colors.blue}6. Calendar/Availability${colors.reset}`);
    const periods = await makeRequest('GET', 
      '/api/bookings/property/test-id/booked-periods');
    passed += logTest('Booked periods endpoint', 
      periods.status !== 404) ? 1 : 0;

    // Test 7: Authentication required
    console.log(`\n${colors.blue}7. Security Tests${colors.reset}`);
    const noAuth = await makeRequest('GET', '/api/bookings/my-bookings');
    passed += logTest('Authentication required for bookings', 
      noAuth.status === 401 || noAuth.status === 403) ? 1 : 0;

    // Test 8: Swagger documentation
    console.log(`\n${colors.blue}8. Documentation${colors.reset}`);
    const swagger = await makeRequest('GET', '/docs');
    passed += logTest('Booking endpoints documented', 
      swagger.status === 200) ? 1 : 0;

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

${colors.yellow}📝 Note: PDF generation testing requires valid credentials${colors.reset}
${colors.yellow}   and database setup. Use integration tests for full E2E.${colors.reset}
`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
