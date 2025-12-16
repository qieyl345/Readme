// Test Railway backend status and diagnose issues
const https = require('https');

console.log('🔍 RAILWAY BACKEND DIAGNOSIS');
console.log('=====================================\n');

// Test 1: Root endpoint
console.log('1️⃣ Testing root endpoint...');
https.get('https://rentverse-production.up.railway.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`Response: ${data.substring(0, 100)}...\n`);
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}\n`);
});

// Test 2: Health endpoint
console.log('2️⃣ Testing health endpoint...');
https.get('https://rentverse-production.up.railway.app/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`Response: ${data}\n`);
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}\n`);
});

// Test 3: Properties endpoint (GET)
console.log('3️⃣ Testing properties list endpoint...');
https.get('https://rentverse-production.up.railway.app/api/properties', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`Response: ${data.substring(0, 200)}...\n`);
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}\n`);
});

// Test 4: Specific property (this will likely fail)
console.log('4️⃣ Testing specific property endpoint...');
https.get('https://rentverse-production.up.railway.app/api/properties/b6b7e0fb-983e-4af3-a0d4-4d0761e29fc1', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}\n`);
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}\n`);
});

console.log('🏁 DIAGNOSIS COMPLETE');
console.log('\n💡 SOLUTIONS:');
console.log('1. Check if Railway app is deployed and running');
console.log('2. Verify API routes are properly configured');
console.log('3. Check Railway deployment logs for errors');