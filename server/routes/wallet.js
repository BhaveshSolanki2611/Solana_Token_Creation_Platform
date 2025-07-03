const express = require('express');
const { check, validationResult } = require('express-validator');
const { getWalletBalance, airdropSol } = require('../utils/walletUtils');

const router = express.Router();

/**
 * @route   GET api/wallet/balance/:address
 * @desc    Get wallet SOL balance
 * @access  Public
 */
router.get('/balance/:address', async (req, res) => {
  const startTime = Date.now();
  let requestId = Math.random().toString(36).substring(7);
  
  try {
    const { network = 'devnet' } = req.query;
    const { address } = req.params;
    
    console.log(`[${requestId}] Fetching balance for address: ${address}, network: ${network}`);
    
    // Enhanced validation with detailed error messages
    if (!address || typeof address !== 'string') {
      console.error(`[${requestId}] Validation failed: Missing or invalid address`);
      return res.status(400).json({
        error: 'Wallet address is required',
        details: 'Address parameter is missing or not a string',
        requestId: requestId
      });
    }
    
    // More flexible address validation (Solana addresses can be 32-44 characters)
    if (address.length < 32 || address.length > 44) {
      console.error(`[${requestId}] Validation failed: Invalid address length: ${address.length}`);
      return res.status(400).json({
        error: 'Invalid wallet address format',
        details: `Address length must be between 32-44 characters, got ${address.length}`,
        requestId: requestId
      });
    }
    
    // Validate network
    const validNetworks = ['devnet', 'testnet', 'mainnet-beta'];
    if (!validNetworks.includes(network)) {
      console.error(`[${requestId}] Validation failed: Invalid network: ${network}`);
      return res.status(400).json({
        error: 'Invalid network specified',
        details: `Network must be one of: ${validNetworks.join(', ')}`,
        requestId: requestId
      });
    }
    
    // Add timeout to wallet balance request with production optimization
    const timeoutMs = process.env.NODE_ENV === 'production' ? 12000 : 8000; // Reduced timeout
    const balancePromise = getWalletBalance(address, network);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Wallet balance request timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    
    console.log(`[${requestId}] Starting balance fetch with ${timeoutMs}ms timeout...`);
    const balance = await Promise.race([balancePromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Balance fetched successfully: ${balance} SOL (took ${duration}ms)`);
    
    res.json({
      success: true,
      balance,
      address,
      network,
      timestamp: new Date().toISOString(),
      duration: duration,
      requestId: requestId
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Enhanced error logging with full context
    console.error(`[${requestId}] Error fetching wallet balance (took ${duration}ms):`, {
      message: error.message,
      stack: error.stack,
      address: req.params.address,
      network: req.query.network,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin')
    });
    
    // Comprehensive error handling with specific status codes
    if (error.message && error.message.includes('Invalid public key')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        details: 'The provided wallet address is not a valid Solana public key',
        address: req.params.address,
        requestId: requestId,
        duration: duration
      });
    }
    
    if (error.message && (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'))) {
      return res.status(408).json({
        success: false,
        error: 'Request timeout - Solana network is slow',
        details: `The request timed out after ${duration}ms. Please try again.`,
        address: req.params.address,
        network: req.query.network,
        requestId: requestId,
        duration: duration
      });
    }
    
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('ECONNREFUSED'))) {
      return res.status(503).json({
        success: false,
        error: 'Solana network unavailable',
        details: 'Unable to connect to Solana RPC endpoint. The network may be experiencing issues.',
        address: req.params.address,
        network: req.query.network,
        requestId: requestId,
        duration: duration
      });
    }
    
    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        details: 'Too many requests to Solana network. Please wait and try again.',
        address: req.params.address,
        network: req.query.network,
        requestId: requestId,
        duration: duration
      });
    }
    
    // For any other error, return balance 0 with detailed error info (graceful degradation)
    console.warn(`[${requestId}] Returning default balance due to unexpected error:`, error.message);
    
    res.status(200).json({
      success: false,
      balance: 0,
      address: req.params.address,
      network: req.query.network || 'devnet',
      error: 'Could not fetch balance from Solana network',
      details: error.message || 'Unknown error occurred while fetching wallet balance',
      fallback: true,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      duration: duration
    });
  }
});

/**
 * @route   POST api/wallet/airdrop
 * @desc    Request SOL airdrop (devnet and testnet only)
 * @access  Public
 */
router.post(
  '/airdrop',
  [
    check('walletAddress', 'Wallet address is required').not().isEmpty(),
    check('amount', 'Amount must be between 0.1 and 5').isFloat({ min: 0.1, max: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { walletAddress, amount = 1, network = 'devnet' } = req.body;
      
      // Check network
      if (network !== 'devnet' && network !== 'testnet') {
        return res.status(400).json({ error: 'Airdrops are only available on devnet or testnet' });
      }
      
      // Validate wallet address format
      if (!walletAddress || walletAddress.length !== 44) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }
      
      const signature = await airdropSol(walletAddress, amount, network);
      
      res.json({
        success: true,
        signature,
        message: `Airdropped ${amount} SOL to ${walletAddress}`,
      });
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      
      // Send appropriate error response based on error type
      if (error.message && error.message.includes('Invalid public key')) {
        return res.status(400).json({ error: 'Invalid wallet address' });
      } else if (error.message && error.message.includes('only available on devnet')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
);

module.exports = router;