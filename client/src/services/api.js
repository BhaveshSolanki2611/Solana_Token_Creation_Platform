import axios from 'axios';

// Base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 
                (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 second timeout for production stability
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors or server errors
    if (!error.response) {
      console.error('Network Error:', error);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Log error details in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', error.response);
    }
    
    return Promise.reject(error);
  }
);

// Token API endpoints
export const tokenAPI = {
  /**
   * Create a new SPL token
   * @param {Object} tokenData - Token data
   * @returns {Promise<Object>} - Created token data
   */
  createToken: (tokenData) => api.post('/api/tokens', tokenData),
  
  /**
   * Get token information by address
   * @param {string} tokenAddress - Token mint address
   * @param {string} network - Solana network (optional)
   * @returns {Promise<Object>} - Token information
   */
  getTokenInfo: (tokenAddress, network) => 
    api.get(`/api/tokens/${tokenAddress}${network ? `?network=${network}` : ''}`),
  
  /**
   * Get tokens created by a wallet
   * @param {string} walletAddress - Wallet address
   * @param {string} network - Solana network (optional)
   * @returns {Promise<Array>} - List of tokens
   */
  getWalletTokens: (walletAddress, network) =>
    api.get(`/api/tokens/owner/${walletAddress}${network ? `?network=${network}` : ''}`),
  
  /**
   * Transfer tokens
   * @param {Object} transferData - Transfer data
   * @returns {Promise<Object>} - Transaction result
   */
  transferTokens: (transferData) => api.post('/api/tokens/transfer', transferData),
  
  /**
   * Mint additional tokens
   * @param {Object} mintData - Mint data
   * @returns {Promise<Object>} - Transaction result
   */
  mintTokens: (mintData) => api.post('/api/tokens/mint', mintData),
  
  /**
   * Burn tokens
   * @param {Object} burnData - Burn data
   * @returns {Promise<Object>} - Transaction result
   */
  burnTokens: (burnData) => api.post('/api/tokens/burn', burnData),
  
  /**
   * Get token holders
   * @param {string} tokenAddress - Token mint address
   * @param {string} network - Solana network (optional)
   * @returns {Promise<Object>} - Token holders data
   */
  getTokenHolders: (tokenAddress, network) =>
    api.get(`/api/tokens/${tokenAddress}/holders${network ? `?network=${network}` : ''}`),
  
  /**
   * Get token transactions
   * @param {string} tokenAddress - Token mint address
   * @param {string} network - Solana network (optional)
   * @param {number} page - Page number (optional)
   * @param {number} limit - Items per page (optional)
   * @returns {Promise<Object>} - Token transactions data
   */
  getTokenTransactions: (tokenAddress, network, page = 1, limit = 20) =>
    api.get(`/api/tokens/${tokenAddress}/transactions?${new URLSearchParams({
      ...(network && { network }),
      page: page.toString(),
      limit: limit.toString()
    })}`),
  
  /**
   * Confirm transaction
   * @param {Object} confirmData - Transaction confirmation data
   * @returns {Promise<Object>} - Confirmation result
   */
  confirmTransaction: (confirmData) => api.post('/api/tokens/transactions/confirm', confirmData),
};

// Wallet API endpoints
export const walletAPI = {
  /**
   * Get SOL balance for a wallet
   * @param {string} walletAddress - Wallet address
   * @param {string} network - Solana network (optional)
   * @returns {Promise<Object>} - Wallet balance data
   */
  getBalance: (walletAddress, network) => 
    api.get(`/api/wallet/balance/${walletAddress}${network ? `?network=${network}` : ''}`),
  
  /**
   * Request SOL airdrop (devnet only)
   * @param {Object} airdropData - Airdrop data
   * @returns {Promise<Object>} - Airdrop result
   */
  requestAirdrop: (airdropData) => api.post('/api/wallet/airdrop', airdropData),
};

export default api;