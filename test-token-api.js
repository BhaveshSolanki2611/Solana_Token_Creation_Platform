const axios = require('axios');

// Test the token creation API endpoint
async function testTokenCreation() {
  console.log('Testing token creation API endpoint...');
  
  const testData = {
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 9,
    supply: 1000000,
    ownerWallet: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1', // Valid Solana wallet address
    mintPublicKey: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Valid mint address format
    network: 'devnet',
    description: 'Test token for debugging',
    mintAuthority: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
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