#!/usr/bin/env node

/**
 * MODULE 4: AI Anomaly Detection Testing
 */

const http = require('http');
const BASE_URL_BACKEND = 'http://localhost:5000';
const BASE_URL_AI = 'http://localhost:8000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function makeRequest(baseUrl, method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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
║    MODULE 4: AI Anomaly Detection Testing              ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

  let passed = 0;
  let failed = 0;

  // Backend tests
  console.log(`\n${colors.blue}Backend Integration Tests (Port 3005)${colors.reset}`);
  
  try {
    // Test 1: Login endpoint (calls AI)
    console.log(`\n${colors.blue}1. Login with AI Integration${colors.reset}`);
    const login = await makeRequest(BASE_URL_BACKEND, 'POST', '/api/auth/login', 
      { email: 'test@example.com', password: 'test123' });
    passed += logTest('Login endpoint responding', 
      login.status !== 500) ? 1 : 0;

    // Test 2: Check if AI service is configured
    console.log(`\n${colors.blue}2. AI Service Configuration${colors.reset}`);
    console.log(`  ℹ️  Check your .env file for:`);
    console.log(`      ${colors.yellow}AI_SERVICE_URL=http://localhost:8000${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}Backend error: ${error.message}${colors.reset}`);
    failed++;
  }

  // AI Service tests
  console.log(`\n${colors.blue}AI Service Tests (Port 8000)${colors.reset}`);
  
  try {
    // Test 1: AI Health check
    console.log(`\n${colors.blue}1. AI Service Health${colors.reset}`);
    const health = await makeRequest(BASE_URL_AI, 'GET', '/api/v1/health');
    if (health.status === 200) {
      passed += logTest('AI service is running', true, 
        'Service responding on port 8000') ? 1 : 0;
    } else {
      passed += logTest('AI service is running', false, 
        `Got status ${health.status} - service may not be running`) ? 1 : 0;
    }

    // Test 2: Root endpoint
    console.log(`\n${colors.blue}2. AI Root Endpoint${colors.reset}`);
    const root = await makeRequest(BASE_URL_AI, 'GET', '/');
    passed += logTest('Root endpoint accessible', 
      root.status === 200) ? 1 : 0;

    // Test 3: Price prediction endpoint
    console.log(`\n${colors.blue}3. Price Prediction${colors.reset}`);
    const prediction = await makeRequest(BASE_URL_AI, 'POST', 
      '/api/v1/classify/price',
      {
        property_type: 'Condominium',
        bedrooms: 3,
        bathrooms: 2,
        area: 1200,
        furnished: 'Yes',
        location: 'KLCC, Kuala Lumpur'
      });
    passed += logTest('Price prediction endpoint', 
      prediction.status === 200) ? 1 : 0;

    // Test 4: Listing approval endpoint
    console.log(`\n${colors.blue}4. Listing Approval Classification${colors.reset}`);
    const approval = await makeRequest(BASE_URL_AI, 'POST', 
      '/api/v1/classify/approval',
      {
        property_type: 'Condominium',
        bedrooms: 3,
        bathrooms: 2,
        area: 1200,
        furnished: 'Yes',
        location: 'KLCC, Kuala Lumpur',
        asking_price: 4500,
        property_age: 5,
        parking_spaces: 2
      });
    passed += logTest('Listing approval endpoint', 
      approval.status === 200) ? 1 : 0;

    // Test 5: Prediction batch endpoint
    console.log(`\n${colors.blue}5. Batch Predictions${colors.reset}`);
    const batch = await makeRequest(BASE_URL_AI, 'POST', 
      '/api/v1/predict/batch',
      {
        properties: [
          {
            property_type: 'Condominium',
            bedrooms: 3,
            bathrooms: 2,
            area: 1200
          }
        ]
      });
    passed += logTest('Batch prediction endpoint', 
      batch.status === 200 || batch.status === 400) ? 1 : 0;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.red}⚠️  AI service not running on port 8000${colors.reset}`);
      console.log(`${colors.yellow}Start it with: cd rentverse-ai-service && python -m uvicorn rentverse.main:app --reload${colors.reset}`);
    } else {
      console.log(`${colors.red}AI service error: ${error.message}${colors.reset}`);
    }
  }

  const total = passed + failed;
  console.log(`
${colors.blue}╔════════════════════════════════════════════════════════╗
║                  TEST RESULTS                          ║
╚════════════════════════════════════════════════════════╝${colors.reset}
${colors.green}✅ Passed: ${passed}${colors.reset}
${colors.red}❌ Failed: ${failed}${colors.reset}
📊 Total: ${total}

${colors.yellow}📝 NEXT STEPS:${colors.reset}
1. If AI service tests failed, start the Python service:
   ${colors.cyan}cd rentverse-ai-service${colors.reset}
   ${colors.cyan}python -m uvicorn rentverse.main:app --reload${colors.reset}

2. Verify .env files have correct configuration:
   ${colors.cyan}AI_SERVICE_URL=http://localhost:8000${colors.reset}

3. Check Python dependencies:
   ${colors.cyan}pip install -r requirements.txt${colors.reset}
`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
