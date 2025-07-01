const axios = require('axios');

// Test script to verify deployment
async function testDeployment(baseUrl) {
  console.log(`🧪 Testing deployment at: ${baseUrl}`);
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET'
    },
    {
      name: 'Frontend Loading',
      url: baseUrl,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 10000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${test.name}: PASSED (${response.status})`);
        if (test.name === 'Health Check') {
          console.log(`   Response:`, response.data);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`);
        console.log(`   Error:`, response.data || response.statusText);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   Error:`, error.message);
    }
  }
}

// Usage
if (process.argv.length < 3) {
  console.log('Usage: node test-deployment.js <base-url>');
  console.log('Example: node test-deployment.js https://your-app.vercel.app');
  process.exit(1);
}

const baseUrl = process.argv[2];
testDeployment(baseUrl)
  .then(() => {
    console.log('\n🎉 Deployment test completed!');
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });