const { Connection, clusterApiUrl } = require('@solana/web3.js');

/**
 * Get a Solana connection for the specified network
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {Connection} Solana connection
 */
const getConnection = (network = 'devnet') => {
  let endpoint;
  
  console.log(`Creating Solana connection for network: ${network}`);
  
  // Define alternative RPC endpoints for better reliability
  const ALTERNATIVE_ENDPOINTS = {
    'devnet': [
      'https://api.devnet.solana.com',
      'https://devnet.genesysgo.net/',
      'https://devnet.rpcpool.com/'
    ],
    'testnet': [
      'https://api.testnet.solana.com',
      'https://testnet.rpcpool.com/'
    ],
    'mainnet-beta': [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ]
  };
  
  // Use a random alternative endpoint to distribute load
  const availableEndpoints = ALTERNATIVE_ENDPOINTS[network] || [];
  
  if (availableEndpoints.length > 0) {
    // Select a random endpoint from the available options
    const randomIndex = Math.floor(Math.random() * availableEndpoints.length);
    endpoint = availableEndpoints[randomIndex];
  } else {
    // Fallback to default endpoint if no alternatives are available
    endpoint = clusterApiUrl(network);
  }
  
  console.log(`Using RPC endpoint: ${endpoint}`);
  
  try {
    // Create connection with higher commitment and increased timeouts
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      disableRetryOnRateLimit: false,
      httpAgent: false // Use default agent with keep-alive
    });
    
    console.log('Solana connection created successfully');
    return connection;
  } catch (error) {
    console.error('Failed to create Solana connection:', error);
    throw new Error(`Failed to create Solana connection: ${error.message}`);
  }
};

module.exports = {
  getConnection
}; 