import axios from 'axios';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Get SOL balance for a wallet
 * @param {string} walletAddress - Wallet address
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {Promise<number>} - SOL balance
 */
export const getWalletBalance = async (walletAddress, network = 'devnet') => {
  try {
    const response = await axios.get(`/api/wallet/balance/${walletAddress}`, {
      params: { network }
    });
    return response.data.balance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

/**
 * Request SOL airdrop (devnet and testnet only)
 * @param {string} walletAddress - Wallet address
 * @param {number} amount - Amount of SOL to request (default: 1)
 * @param {string} network - Solana network (devnet or testnet)
 * @returns {Promise<string|null>} - Transaction signature or null if failed
 */
export const requestAirdrop = async (walletAddress, amount = 1, network = 'devnet') => {
  try {
    // Only allow airdrops on devnet and testnet
    if (network !== 'devnet' && network !== 'testnet') {
      console.error('Airdrops are only available on devnet and testnet');
      return null;
    }
    
    const response = await axios.post('/api/wallet/airdrop', {
      walletAddress,
      amount,
      network,
    });
    
    if (response.data.success) {
      return response.data.signature;
    }
    return null;
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    return null;
  }
};

/**
 * Format SOL amount
 * @param {number} lamports - Amount in lamports
 * @returns {string} - Formatted SOL amount
 */
export const formatSolAmount = (lamports) => {
  if (!lamports) return '0';
  
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString('en-US', {
    maximumFractionDigits: 9,
    minimumFractionDigits: sol < 0.001 ? 6 : 2,
  });
};

/**
 * Validate Solana address
 * @param {string} address - Address to validate
 * @returns {boolean} - Whether address is valid
 */
export const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Shorten wallet address for display
 * @param {string} address - Wallet address
 * @param {number} chars - Number of characters to show at start/end (default: 4)
 * @returns {string} - Shortened address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};