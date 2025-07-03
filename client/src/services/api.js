import axios from 'axios';

// Base URL for API requests
const API_URL = process.env.REACT_APP_API_URL ||
                (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased timeout for production stability
  withCredentials: false, // Disable credentials for CORS
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    // Handle network errors or server errors
    if (!error.response) {
      console.error('Network Error - Full Details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        config: error.config
      });
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Log comprehensive error details to prevent truncation
    console.error('API Error - Full Details:', {
      status: error.response.status,
      statusText: error.response.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      headers: error.response.headers,
      data: error.response.data,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Extract error message from response data
    let errorMessage = 'An error occurred';
    
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.details) {
        errorMessage = error.response.data.details;
      }
    }
    
    // Handle specific error cases with detailed messages
    if (error.response.status === 408) {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.response.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.response.status === 400) {
      errorMessage = error.response.data?.error || 'Invalid request. Please check your input.';
    } else if (error.response.status === 404) {
      errorMessage = error.response.data?.error || 'Resource not found.';
    } else if (error.response.status >= 500) {
      errorMessage = error.response.data?.error || 'Server error. Please try again later.';
    }
    
    // Create enhanced error object with full details
    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response.status;
    enhancedError.statusText = error.response.statusText;
    enhancedError.data = error.response.data;
    enhancedError.code = error.code;
    enhancedError.config = error.config;
    enhancedError.response = error.response;
    
    return Promise.reject(enhancedError);
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