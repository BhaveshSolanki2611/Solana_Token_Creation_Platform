import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import axios from 'axios';
import { getAssociatedTokenAddress } from '@solana/spl-token';

/**
 * Create a new SPL token
 * @param {Object} tokenData - Token data
 * @param {string} tokenData.name - Token name
 * @param {string} tokenData.symbol - Token symbol
 * @param {number} tokenData.decimals - Token decimals
 * @param {number} tokenData.supply - Initial token supply
 * @param {string} tokenData.ownerWallet - Owner wallet address
 * @returns {Promise<Object>} - Created token data
 */
export const createToken = async (tokenData) => {
  try {
    const response = await axios.post('/api/tokens/create', tokenData);
    return response.data;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

/**
 * Get token information by address
 * @param {string} tokenAddress - Token mint address
 * @returns {Promise<Object>} - Token information
 */
export const getTokenInfo = async (tokenAddress) => {
  try {
    const response = await axios.get(`/api/tokens/${tokenAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
};

/**
 * Get tokens created by a wallet
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Array>} - List of tokens
 */
export const getWalletTokens = async (walletAddress) => {
  try {
    const response = await axios.get(`/api/tokens/wallet/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    throw error;
  }
};

/**
 * Mint additional tokens
 * @param {string} tokenMint - Token mint address
 * @param {string} destinationAccount - Destination token account address
 * @param {number} amount - Amount to mint
 * @param {number} decimals - Token decimals
 * @param {string} mintAuthorityPrivateKey - Mint authority private key
 * @returns {Promise<Object>} - Transaction result
 */
export const mintTokens = async (tokenMint, destinationAccount, amount, decimals, mintAuthorityPrivateKey) => {
  try {
    const response = await axios.post('/api/tokens/mint', {
      tokenMint,
      destinationAccount,
      amount,
      decimals,
      mintAuthorityPrivateKey,
    });
    return response.data;
  } catch (error) {
    console.error('Error minting tokens:', error);
    throw error;
  }
};

/**
 * Format token amount based on decimals
 * @param {number|string} amount - Raw amount
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount
 */
export const formatTokenAmount = (amount, decimals) => {
  if (!amount) return '0';
  
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const formattedAmount = (amountNum / divisor).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
  
  return formattedAmount;
};

/**
 * Parse token amount to raw value based on decimals
 * @param {number|string} amount - Formatted amount
 * @param {number} decimals - Token decimals
 * @returns {number} - Raw amount
 */
export const parseTokenAmount = (amount, decimals) => {
  if (!amount) return 0;
  
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const multiplier = Math.pow(10, decimals);
  return Math.floor(amountNum * multiplier);
};

/**
 * Burn tokens
 * @param {string} tokenMint - Token mint address
 * @param {string} tokenAccount - Token account address
 * @param {number} amount - Amount to burn
 * @param {number} decimals - Token decimals
 * @param {string} ownerPrivateKey - Owner's private key
 * @returns {Promise<Object>} - Transaction result
 */
export const burnTokens = async (tokenMint, tokenAccount, amount, decimals, ownerPrivateKey) => {
  try {
    const response = await axios.post('/api/tokens/burn', {
      tokenMint,
      tokenAccount,
      amount,
      decimals,
      ownerPrivateKey,
    });
    return response.data;
  } catch (error) {
    console.error('Error burning tokens:', error);
    throw error;
  }
};

/**
 * Get the associated token account address for a given mint and owner
 * @param {string} mint - Token mint address
 * @param {string} owner - Owner wallet address
 * @returns {Promise<string>} - Associated token account address
 */
export const getAssociatedTokenAccount = async (mint, owner) => {
  try {
    const mintPubkey = new PublicKey(mint);
    const ownerPubkey = new PublicKey(owner);
    const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
    return ata.toString();
  } catch (error) {
    console.error('Error getting associated token account:', error);
    throw error;
  }
};