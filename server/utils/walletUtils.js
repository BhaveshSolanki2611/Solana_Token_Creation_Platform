const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getConnection } = require('./networkUtils');

/**
 * Get wallet SOL balance
 * @param {string} walletAddress - Wallet address
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {number} SOL balance
 */
const getWalletBalance = async (walletAddress, network = 'devnet') => {
  let retries = 3;
  let lastError = null;
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Getting wallet balance for ${walletAddress} on ${network}`);
  
  while (retries > 0) {
    try {
      // Enhanced wallet address validation
      let publicKey;
      try {
        if (!walletAddress || typeof walletAddress !== 'string') {
          throw new Error('Wallet address must be a non-empty string');
        }
        
        if (walletAddress.length < 32 || walletAddress.length > 44) {
          throw new Error(`Invalid wallet address length: ${walletAddress.length} (expected 32-44 characters)`);
        }
        
        publicKey = new PublicKey(walletAddress);
        console.log(`[${requestId}] Public key validation successful`);
      } catch (keyError) {
        console.error(`[${requestId}] Public key validation failed:`, keyError.message);
        throw new Error(`Invalid public key format: ${keyError.message}`);
      }
      
      // Get connection with enhanced error handling
      let connection;
      try {
        connection = getConnection(network);
        console.log(`[${requestId}] Connection obtained for network: ${network}`);
      } catch (connError) {
        console.error(`[${requestId}] Failed to get connection:`, connError.message);
        throw new Error(`Failed to connect to ${network}: ${connError.message}`);
      }
      
      // Test connection with reduced timeout for faster failure
      try {
        const slotPromise = connection.getSlot();
        const slotTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        );
        
        const slot = await Promise.race([slotPromise, slotTimeoutPromise]);
        console.log(`[${requestId}] Connection test successful, current slot: ${slot}`);
      } catch (connectionError) {
        console.error(`[${requestId}] Connection test failed:`, connectionError.message);
        
        // Specific error handling for different connection issues
        if (connectionError.message.includes('timeout')) {
          throw new Error(`Network timeout: Unable to connect to ${network} RPC endpoint`);
        } else if (connectionError.message.includes('ENOTFOUND') || connectionError.message.includes('ECONNREFUSED')) {
          throw new Error(`Network unavailable: ${network} RPC endpoint is not reachable`);
        } else {
          throw new Error(`Network connection failed: ${connectionError.message}`);
        }
      }
      
      // Get balance with optimized timeout
      const balancePromise = connection.getBalance(publicKey);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Balance request timeout after 8 seconds`)), 8000)
      );
      
      console.log(`[${requestId}] Requesting balance...`);
      const balance = await Promise.race([balancePromise, timeoutPromise]);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      console.log(`[${requestId}] Balance retrieved successfully: ${solBalance} SOL`);
      return solBalance;
    } catch (error) {
      lastError = error;
      console.error(`[${requestId}] Error in getWalletBalance (retries left: ${retries - 1}):`, {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
        stack: error.stack?.split('\n')[0] // Only first line of stack
      });
      
      retries--;
      
      // Don't retry on validation errors or client errors
      if (error.message.includes('Invalid public key') ||
          error.message.includes('Invalid wallet address') ||
          error.message.includes('must be a non-empty string')) {
        console.error(`[${requestId}] Validation error, not retrying:`, error.message);
        throw error;
      }
      
      // Don't retry on certain network errors that won't resolve quickly
      if (error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('Network unavailable')) {
        console.error(`[${requestId}] Network unavailable, not retrying:`, error.message);
        throw error;
      }
      
      if (retries > 0) {
        // Shorter delays for faster failure
        const delay = (4 - retries) * 500; // 500ms, 1000ms delays
        console.log(`[${requestId}] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed - provide detailed error information
  const finalError = lastError || new Error('Unknown error occurred');
  console.error(`[${requestId}] All retries failed for wallet balance:`, {
    finalError: finalError.message,
    address: walletAddress,
    network: network,
    totalRetries: 3
  });
  
  // Enhance error message for better debugging
  if (finalError.message.includes('timeout')) {
    throw new Error(`Solana network timeout: Unable to fetch balance for ${walletAddress} on ${network} after multiple attempts`);
  } else if (finalError.message.includes('Network')) {
    throw new Error(`Solana network error: ${finalError.message}`);
  } else {
    throw new Error(`Failed to get wallet balance: ${finalError.message}`);
  }
};

/**
 * Request SOL airdrop (devnet only)
 * @param {string} walletAddress - Wallet address
 * @param {number} amount - Amount of SOL to request (default: 1)
 * @param {string} network - Solana network (devnet or testnet)
 * @returns {Promise<string>} Airdrop transaction signature
 */
const airdropSol = async (walletAddress, amount = 1, network = 'devnet') => {
  try {
    // Only allow airdrops on devnet or testnet
    if (network !== 'devnet' && network !== 'testnet') {
      throw new Error('Airdrops are only available on devnet or testnet');
    }
    
    const connection = getConnection(network);
    const publicKey = new PublicKey(walletAddress);
    
    // Convert SOL to lamports
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Request airdrop with retry logic
    let retries = 3;
    let signature = null;
    let lastError = null;
    
    while (retries > 0) {
      try {
        signature = await connection.requestAirdrop(publicKey, lamports);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        return signature;
      } catch (error) {
        lastError = error;
        console.error(`Airdrop attempt failed (retries left: ${retries}):`, error);
        retries--;
        
        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Airdrop failed after multiple attempts');
  } catch (error) {
    console.error('Error in airdropSol:', error);
    throw error;
  }
};

module.exports = {
  getWalletBalance,
  airdropSol
};