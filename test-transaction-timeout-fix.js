const axios = require('axios');

// Test the token creation API with timeout handling
async function testTokenCreationAPI() {
  console.log('Testing Token Creation API with timeout fixes...');
  
  const testTokenData = {
    name: 'Test Timeout Fix Token',
    symbol: 'TTFT',
    decimals: 9,
    supply: 1000000,
    ownerWallet: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', // Example wallet
    mintPublicKey: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', // Example mint
    network: 'devnet',
    description: 'Test token for timeout fix verification',
    website: 'https://example.com',
    twitter: 'https://twitter.com/example',
    telegram: 'https://t.me/example',
    discord: 'https://discord.gg/example'
  };

  try {
    console.log('Sending token creation request...');
    const startTime = Date.now();
    
    const response = await axios.post('http://localhost:3001/api/tokens', testTokenData, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ API Response received in ${duration}ms`);
    console.log('Status:', response.status);
    console.log('Response data:', {
      hasTransaction: !!response.data.transaction,
      mintAddress: response.data.mintAddress,
      transactionLength: response.data.transaction?.length || 0
    });
    
    if (response.data.transaction && response.data.mintAddress) {
      console.log('✅ Transaction preparation successful');
      console.log('Mint Address:', response.data.mintAddress);
      console.log('Transaction size:', response.data.transaction.length, 'characters');
    } else {
      console.log('❌ Missing transaction or mint address in response');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('Network error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test connection to the API
async function testAPIConnection() {
  console.log('Testing API connection...');
  
  try {
    const response = await axios.get('http://localhost:3001/api/health', {
      timeout: 10000
    });
    
    console.log('✅ API connection successful');
    console.log('Health check response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
}

// Test wallet balance endpoint
async function testWalletBalance() {
  console.log('Testing wallet balance endpoint...');
  
  const testWallet = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
  
  try {
    const response = await axios.get(`http://localhost:3001/api/wallet/balance/${testWallet}?network=devnet`, {
      timeout: 30000
    });
    
    console.log('✅ Wallet balance endpoint working');
    console.log('Balance response:', response.data);
  } catch (error) {
    console.error('❌ Wallet balance test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Transaction Timeout Fix Tests\n');
  
  // Test 1: API Connection
  console.log('=== Test 1: API Connection ===');
  const connectionOk = await testAPIConnection();
  console.log('');
  
  if (!connectionOk) {
    console.log('❌ Cannot proceed with tests - API not accessible');
    console.log('Make sure the server is running on http://localhost:3001');
    return;
  }
  
  // Test 2: Wallet Balance
  console.log('=== Test 2: Wallet Balance Endpoint ===');
  await testWalletBalance();
  console.log('');
  
  // Test 3: Token Creation API
  console.log('=== Test 3: Token Creation API ===');
  await testTokenCreationAPI();
  console.log('');
  
  console.log('🏁 Tests completed');
  console.log('\nNext steps:');
  console.log('1. Deploy the fixes to Vercel');
  console.log('2. Test with real wallet connection');
  console.log('3. Verify transaction confirmation works');
  console.log('4. Check Solana Explorer links in success messages');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTokenCreationAPI,
  testAPIConnection,
  testWalletBalance,
  runTests
};