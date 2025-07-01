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
  
  while (retries > 0) {
    try {
      const connection = getConnection(network);
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    } catch (error) {
      lastError = error;
      console.error(`Error in getWalletBalance (retries left: ${retries}):`, error);
      retries--;
      
      if (retries > 0) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // All retries failed
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