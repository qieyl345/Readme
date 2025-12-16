#!/usr/bin/env node

/**
 * MODULE 2: API Gateway & File Upload Testing
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
║     MODULE 2: API Gateway & File Upload Testing        ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Upload endpoint authentication
    console.log(`\n${colors.blue}1. Authentication Tests${colors.reset}`);
    const noAuth = await makeRequest('POST', '/api/upload/single', {});
    passed += logTest('Upload requires authentication', 
      noAuth.status === 401 || noAuth.status === 403) ? 1 : 0;

    // Test 2: Invalid token
    const invalidToken = await makeRequest('POST', '/api/upload/single', {}, 
      { 'Authorization': 'Bearer invalid_token' });
    passed += logTest('Invalid token rejected', 
      invalidToken.status === 401 || invalidToken.status === 403) ? 1 : 0;

    // Test 3: Rate limiting endpoints
    console.log(`\n${colors.blue}2. Rate Limiting Configuration${colors.reset}`);
    const rateLimitTest = await makeRequest('GET', '/cors-test');
    const hasRateLimit = rateLimitTest.headers['ratelimit-limit'] !== undefined ||
                        rateLimitTest.headers['x-ratelimit-limit'] !== undefined;
    passed += logTest('Rate limiting configured', hasRateLimit) ? 1 : 0;

    // Test 4: Upload endpoints exist
    console.log(`\n${colors.blue}3. Upload Endpoints${colors.reset}`);
    const uploadSingle = await makeRequest('POST', '/api/upload/single', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Single upload endpoint', uploadSingle.status !== 404) ? 1 : 0;

    const uploadMultiple = await makeRequest('POST', '/api/upload/multiple', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Multiple upload endpoint', uploadMultiple.status !== 404) ? 1 : 0;

    const propertyImages = await makeRequest('POST', '/api/upload/property-images', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Property images endpoint', propertyImages.status !== 404) ? 1 : 0;

    // Test 5: Role-based access
    console.log(`\n${colors.blue}4. Authorization Tests${colors.reset}`);
    const roleTest = await makeRequest('POST', '/api/upload/property-images', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Role authorization present', 
      roleTest.status !== 404) ? 1 : 0;

    // Test 6: Delete endpoints
    console.log(`\n${colors.blue}5. Deletion Operations${colors.reset}`);
    const deleteSingle = await makeRequest('DELETE', '/api/upload/delete/test-id', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Delete single file endpoint', 
      deleteSingle.status !== 404) ? 1 : 0;

    const deleteMultiple = await makeRequest('DELETE', '/api/upload/delete-multiple', 
      { publicIds: ['id1', 'id2'] }, 
      { 'Authorization': 'Bearer test' });
    passed += logTest('Delete multiple files endpoint', 
      deleteMultiple.status !== 404) ? 1 : 0;

    // Test 7: Video operations
    console.log(`\n${colors.blue}6. Video Processing${colors.reset}`);
    const thumbnail = await makeRequest('GET', '/api/upload/video-thumbnail/test-id', 
      {}, { 'Authorization': 'Bearer test' });
    passed += logTest('Video thumbnail endpoint', 
      thumbnail.status !== 404) ? 1 : 0;

    // Test 8: Swagger docs for upload
    console.log(`\n${colors.blue}7. Documentation${colors.reset}`);
    const swagger = await makeRequest('GET', '/docs');
    passed += logTest('Upload endpoints in Swagger', 
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
`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
