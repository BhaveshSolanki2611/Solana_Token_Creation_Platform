const axios = require('axios');

// Test the token creation API endpoint
async function testTokenCreation() {
  console.log('Testing token creation API endpoint...');
  
  const testData = {
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 9,
    supply: 1000000,
    ownerWallet: '11111111111111111111111111111112', // Valid base58 address format
    mintPublicKey: '11111111111111111111111111111113', // Valid base58 address format
    network: 'devnet',
    description: 'Test token for debugging',
    mintAuthority: '11111111111111111111111111111112',
    freezeAuthority: null
  };

  try {
    console.log('Sending request to API with data:', testData);
    
    const response = await axios.post(
      'https://solana-token-creation-platform-ten.vercel.app/api/tokens',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('✅ Success! Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response?.data?.details) {
      console.error('Error Details:', error.response.data.details);
    }
    
    if (error.response?.data?.type) {
      console.error('Error Type:', error.response.data.type);
    }
  }
}

// Run the test
testTokenCreation();