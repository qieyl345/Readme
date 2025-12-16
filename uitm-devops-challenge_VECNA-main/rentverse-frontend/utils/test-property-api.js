// Quick test to verify the Railway backend API is working
const https = require('https');

const testPropertyAPI = () => {
  const url = 'https://rentverse-production.up.railway.app/api/properties/b6b7e0fb-983e-4af3-a0d4-4d0761e29fc1';
  
  console.log('🔧 Testing Railway backend API...');
  console.log('URL:', url);
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ API is working correctly!');
      } else {
        console.log('❌ API returned error status:', res.statusCode);
      }
    });
    
  }).on('error', (err) => {
    console.error('❌ API request failed:', err.message);
    console.log('💡 This might be a CORS issue or the Railway app is down');
  });
};

// Test function
testPropertyAPI();