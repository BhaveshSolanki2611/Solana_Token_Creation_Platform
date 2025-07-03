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
      'https://devnet.rpcpool.com/',
      'https://mango.devnet.rpcpool.com',
      'https://trashpandas.rpcpool.com'
    ],
    'testnet': [
      'https://api.testnet.solana.com',
      'https://testnet.rpcpool.com/'
    ],
    'mainnet-beta': [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      'https://solana-mainnet.g.alchemy.com/v2/demo',
      'https://ssc-dao.genesysgo.net'
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
    // Create connection with optimized parameters for better reliability
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000, // Reduced to 30 seconds from 60
      disableRetryOnRateLimit: false,
      httpAgent: false, // Use default agent with keep-alive
      wsEndpoint: null, // Disable WebSocket for more reliable REST API usage
    });
    
    // Add custom properties to help with debugging
    connection._customEndpoint = endpoint;
    connection._customNetwork = network;
    connection._createdAt = new Date().toISOString();
    
    console.log('Solana connection created successfully');
    return connection;
  } catch (error) {
    console.error('Failed to create Solana connection:', error);
    throw new Error(`Failed to create Solana connection: ${error.message}`);
  }
};

// Utility function to test a connection's health
const testConnectionHealth = async (connection) => {
  try {
    const startTime = Date.now();
    const slot = await connection.getSlot('confirmed');
    const elapsed = Date.now() - startTime;
    
    return {
      healthy: true,
      latency: elapsed,
      endpoint: connection._customEndpoint,
      slot: slot
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      endpoint: connection._customEndpoint
    };
  }
};

module.exports = {
  getConnection,
  testConnectionHealth
}; 