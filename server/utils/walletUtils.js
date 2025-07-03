const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getConnection } = require('./networkUtils');

/**
 * Get wallet SOL balance
 * @param {string} walletAddress - Wallet address
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {number} SOL balance
 */
const getWalletBalance = async (walletAddress, network = 'devnet') => {
  let retries = 2; // Reduced from 3 to 2 for faster failures
  let lastError = null;
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Getting wallet balance for ${walletAddress} on ${network}`);
  
  // Validate wallet address first before making RPC calls
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

  while (retries > 0) {
    try {
      // Get connection with enhanced error handling
      let connection;
      try {
        connection = getConnection(network);
      } catch (connError) {
        console.error(`[${requestId}] Failed to get connection:`, connError.message);
        throw new Error(`Failed to connect to ${network}: ${connError.message}`);
      }
      
      // Get balance with optimized timeout
      const balancePromise = connection.getBalance(publicKey);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Balance request timeout after 5 seconds')), 5000) // Reduced from 8s to 5s
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
        code: error.code
      });
      
      retries--;
      
      // Don't retry on validation errors
      if (error.message.includes('Invalid public key') ||
          error.message.includes('Invalid wallet address') ||
          error.message.includes('must be a non-empty string')) {
        throw error;
      }
      
      if (retries > 0) {
        // Shorter delay for faster failure
        const delay = 500; // Fixed 500ms delay
        console.log(`[${requestId}] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed - log basic error info
  console.error(`[${requestId}] All retries failed for wallet balance:`, {
    error: lastError?.message,
    address: walletAddress,
    network: network
  });
  
  // Return 0 instead of throwing to allow token creation to proceed
  // This is a fallback to prevent wallet balance fetch failures from breaking token creation
  console.log(`[${requestId}] Using fallback 0 balance to avoid blocking token creation`);
  return 0;
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