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
  
  console.log(`Getting wallet balance for ${walletAddress} on ${network}`);
  
  while (retries > 0) {
    try {
      // Validate wallet address first
      let publicKey;
      try {
        publicKey = new PublicKey(walletAddress);
      } catch (keyError) {
        throw new Error(`Invalid public key format: ${walletAddress}`);
      }
      
      const connection = getConnection(network);
      
      // Test connection first
      try {
        const slot = await connection.getSlot();
        console.log(`Connection test successful, current slot: ${slot}`);
      } catch (connectionError) {
        console.error('Connection test failed:', connectionError.message);
        throw new Error(`Network connection failed: ${connectionError.message}`);
      }
      
      // Get balance with timeout
      const balancePromise = connection.getBalance(publicKey);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Balance request timeout')), 10000)
      );
      
      const balance = await Promise.race([balancePromise, timeoutPromise]);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      console.log(`Balance retrieved: ${solBalance} SOL`);
      return solBalance;
    } catch (error) {
      lastError = error;
      console.error(`Error in getWalletBalance (retries left: ${retries}):`, error.message);
      retries--;
      
      // Don't retry on validation errors
      if (error.message.includes('Invalid public key')) {
        throw error;
      }
      
      if (retries > 0) {
        // Exponential backoff
        const delay = (4 - retries) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error('All retries failed for wallet balance');
  throw lastError || new Error('Failed to get wallet balance after multiple attempts');
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