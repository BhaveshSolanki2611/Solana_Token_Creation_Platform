const express = require('express');
const { check, validationResult } = require('express-validator');
const { 
  createToken, 
  getTokenInfo, 
  getTokenAccountsByOwner,
  transferTokens,
  mintAdditionalTokens,
  burnTokens,
  prepareCreateTokenTransaction,
  getMint,
  TOKEN_PROGRAM_ID
} = require('../utils/tokenUtils');
const { getConnection } = require('../utils/networkUtils');
const { PublicKey } = require('@solana/web3.js');
const Token = require('../models/Token');
const TransactionLog = require('../models/TransactionLog');
const User = require('../models/User');
const { safeDbOperation } = require('../utils/database');

const router = express.Router();

/**
 * @route   POST api/tokens
 * @desc    Create a new token
 * @access  Public
 */
router.post(
  '/',
  [
    check('name', 'Token name is required').not().isEmpty().isLength({ min: 1, max: 32 }),
    check('symbol', 'Token symbol is required').not().isEmpty().isLength({ min: 1, max: 10 }),
    check('decimals', 'Decimals must be a number between 0 and 9').isInt({ min: 0, max: 9 }),
    check('supply', 'Initial supply is required').isNumeric().isFloat({ min: 0 }),
    check('ownerWallet', 'Owner wallet address is required').not().isEmpty(),
    check('description', 'Description is optional').optional().isLength({ max: 500 }),
    check('website', 'Website must be a valid URL').optional().custom(value => {
      if (value && value.trim() !== '') {
        try {
          new URL(value);
          return true;
        } catch (error) {
          throw new Error('Website must be a valid URL');
        }
      }
      return true;
    }),
    check('twitter', 'Twitter handle is optional').optional().isLength({ max: 50 }),
    check('telegram', 'Telegram handle is optional').optional().isLength({ max: 50 }),
    check('discord', 'Discord handle is optional').optional().isLength({ max: 50 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { network = 'devnet' } = req.body;

    try {
      console.log('Token creation request received:', {
        name: req.body.name,
        symbol: req.body.symbol,
        decimals: req.body.decimals,
        supply: req.body.supply,
        ownerWallet: req.body.ownerWallet,
        network: network
      });

      const connection = getConnection(network);
      console.log('Solana connection established for network:', network);
      
      const preparedData = await prepareCreateTokenTransaction({ ...req.body, network }, connection);
      console.log('Token transaction prepared successfully:', preparedData.mintAddress);

      // Return the prepared transaction data immediately - NO DATABASE OPERATIONS
      // Database operations will be handled after successful transaction confirmation
      res.json(preparedData);
    } catch (error) {
      console.error('Error preparing token creation - Full error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to prepare token creation';
      let statusCode = 500;
      
      if (error.message.includes('Invalid public key')) {
        errorMessage = 'Invalid wallet address provided';
        statusCode = 400;
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        errorMessage = 'Solana network connection failed';
        statusCode = 503;
      } else if (error.message.includes('Insufficient funds')) {
        errorMessage = 'Insufficient SOL balance for token creation';
        statusCode = 400;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
        statusCode = 408;
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid input parameters';
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        error: errorMessage,
        details: error.message,
        type: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route   POST api/tokens/save-metadata
 * @desc    Save token metadata after successful transaction confirmation
 * @access  Public
 */
router.post('/save-metadata', async (req, res) => {
  try {
    const {
      mintAddress,
      name,
      symbol,
      decimals,
      supply,
      ownerWallet,
      network = 'devnet',
      mintAuthority,
      freezeAuthority,
      description,
      image,
      website,
      twitter,
      telegram,
      discord,
      txSignature
    } = req.body;

    console.log('Saving token metadata for:', mintAddress);

    // Validate required fields
    if (!mintAddress || !name || !symbol || !ownerWallet) {
      return res.status(400).json({
        error: 'Missing required fields: mintAddress, name, symbol, ownerWallet'
      });
    }

    // Save token metadata (non-blocking)
    const tokenSaved = await safeDbOperation(async () => {
      const tokenDoc = new Token({
        mint: mintAddress,
        name,
        symbol,
        decimals: parseInt(decimals) || 9,
        supply: supply.toString(),
        owner: ownerWallet,
        network,
        mintAuthority: mintAuthority || ownerWallet,
        freezeAuthority: freezeAuthority || null,
        description: description || '',
        image: image || '',
        website: website || '',
        twitter: twitter || '',
        telegram: telegram || '',
        discord: discord || '',
      });
      return await tokenDoc.save();
    }, null);

    // Save user (non-blocking)
    const userSaved = await safeDbOperation(async () => {
      return await User.updateOne(
        { wallet: ownerWallet },
        {
          $setOnInsert: {
            wallet: ownerWallet,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    }, null);

    // Log creation event (non-blocking)
    const logSaved = await safeDbOperation(async () => {
      return await TransactionLog.create({
        type: 'mint',
        mint: mintAddress,
        from: null,
        to: ownerWallet,
        amount: (parseFloat(supply) * Math.pow(10, parseInt(decimals) || 9)).toString(),
        decimals: parseInt(decimals) || 9,
        txSignature: txSignature || null,
        meta: {
          event: 'create',
          tokenName: name,
          tokenSymbol: symbol,
          network
        },
        network,
      });
    }, null);

    console.log('Token metadata save results:', {
      tokenSaved: !!tokenSaved,
      userSaved: !!userSaved,
      logSaved: !!logSaved
    });

    res.json({
      success: true,
      saved: {
        token: !!tokenSaved,
        user: !!userSaved,
        log: !!logSaved
      }
    });

  } catch (error) {
    console.error('Error saving token metadata:', error);
    res.status(500).json({
      error: 'Failed to save token metadata',
      details: error.message
    });
  }
});

/**
 * @route   GET api/tokens/:address
 * @desc    Get token information by address
 * @access  Public
 */
router.get('/:address', async (req, res) => {
  try {
    const { network = 'devnet' } = req.query;
    const tokenAddress = req.params.address;
    
    console.log(`Fetching token info for: ${tokenAddress} on network: ${network}`);
    
    // Validate token address format
    if (!tokenAddress || tokenAddress.length < 32 || tokenAddress.length > 44) {
      return res.status(400).json({ error: 'Invalid token address format' });
    }
    
    // Get token info from Solana network with timeout protection
    let tokenInfo;
    try {
      const tokenInfoPromise = getTokenInfo(tokenAddress, network);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Token info fetch timeout')), 25000)
      );
      
      tokenInfo = await Promise.race([tokenInfoPromise, timeoutPromise]);
      
      if (!tokenInfo) {
        console.log(`Token not found on network: ${tokenAddress}`);
        return res.status(404).json({ error: 'Token not found on the blockchain' });
      }
      
      console.log(`Token info fetched successfully: ${tokenAddress}`);
    } catch (tokenError) {
      console.error(`Error fetching token from blockchain: ${tokenAddress}`, tokenError.message);
      
      // Handle specific blockchain errors
      if (tokenError.message.includes('Invalid public key') ||
          tokenError.message.includes('invalid') ||
          tokenError.message.includes('not found')) {
        return res.status(404).json({ error: 'Token not found or invalid address' });
      }
      
      if (tokenError.message.includes('429') || tokenError.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again in a moment.'
        });
      }
      
      if (tokenError.message.includes('timeout')) {
        return res.status(408).json({
          error: 'Request timeout. Please try again.'
        });
      }
      
      // For other errors, return a generic error but still try to get DB metadata
      console.warn(`Blockchain fetch failed, trying database only: ${tokenError.message}`);
      tokenInfo = {
        address: tokenAddress,
        decimals: 9, // Default decimals
        supply: '0',
        mintAuthority: null,
        freezeAuthority: null,
        isInitialized: true,
        holders: 0,
        largestAccounts: []
      };
    }
    
    // Try to get metadata from MongoDB using safe operation (non-blocking)
    const dbMeta = await safeDbOperation(async () => {
      return await Token.findOne({ mint: tokenAddress }).lean();
    }, null);
    
    console.log(`Database metadata ${dbMeta ? 'found' : 'not found'} for: ${tokenAddress}`);
    
    // Merge database metadata with blockchain data
    const merged = {
      ...tokenInfo,
      // Prefer database metadata for display information
      name: dbMeta?.name || tokenInfo.name || 'Unknown Token',
      symbol: dbMeta?.symbol || tokenInfo.symbol || 'UNKNOWN',
      description: dbMeta?.description || '',
      image: dbMeta?.image || '',
      website: dbMeta?.website || '',
      twitter: dbMeta?.twitter || '',
      telegram: dbMeta?.telegram || '',
      discord: dbMeta?.discord || '',
      // Always prefer blockchain data for critical information
      address: tokenAddress,
      decimals: tokenInfo.decimals,
      supply: tokenInfo.supply,
      mintAuthority: tokenInfo.mintAuthority,
      freezeAuthority: tokenInfo.freezeAuthority,
      isInitialized: tokenInfo.isInitialized
    };
    
    console.log(`Returning merged token data for: ${tokenAddress}`);
    res.json(merged);
    
  } catch (error) {
    console.error('Error in token info endpoint:', {
      address: req.params.address,
      network: req.query.network,
      error: error.message,
      stack: error.stack
    });
    
    // Provide detailed error response
    let errorMessage = 'Failed to fetch token information';
    let statusCode = 500;
    
    if (error.message.includes('Invalid token address')) {
      errorMessage = 'Invalid token address format';
      statusCode = 400;
    } else if (error.message.includes('Token not found')) {
      errorMessage = 'Token not found';
      statusCode = 404;
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. Please try again.';
      statusCode = 408;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET api/tokens/owner/:address
 * @desc    Get token accounts for a specific owner
 * @access  Public
 */
router.get('/owner/:address', async (req, res) => {
  try {
    const { network = 'devnet' } = req.query;
    const ownerAddress = req.params.address;
    
    console.log(`Fetching token accounts for owner: ${ownerAddress} on network: ${network}`);
    
    // Validate wallet address format
    if (!ownerAddress || ownerAddress.length < 32 || ownerAddress.length > 44) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Get token accounts with timeout protection
    let tokenAccounts = [];
    try {
      const tokenAccountsPromise = getTokenAccountsByOwner(ownerAddress, network);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Token accounts fetch timeout')), 30000)
      );
      
      tokenAccounts = await Promise.race([tokenAccountsPromise, timeoutPromise]);
      console.log(`Found ${tokenAccounts.length} token accounts for owner: ${ownerAddress}`);
      
    } catch (fetchError) {
      console.error(`Error fetching token accounts for ${ownerAddress}:`, fetchError.message);
      
      // Handle specific errors but don't fail completely
      if (fetchError.message.includes('Invalid public key')) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }
      
      if (fetchError.message.includes('429') || fetchError.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again in a moment.'
        });
      }
      
      if (fetchError.message.includes('timeout')) {
        console.warn(`Token accounts fetch timeout for ${ownerAddress}, returning empty array`);
        tokenAccounts = []; // Return empty array instead of failing
      } else {
        // For other errors, log but return empty array to avoid breaking the UI
        console.warn(`Token accounts fetch failed for ${ownerAddress}, returning empty array:`, fetchError.message);
        tokenAccounts = [];
      }
    }
    
    // Filter out invalid token accounts
    const validTokenAccounts = tokenAccounts.filter(account =>
      account &&
      account.mint &&
      account.mint.length >= 32 &&
      account.amount !== undefined
    );
    
    console.log(`Returning ${validTokenAccounts.length} valid token accounts for owner: ${ownerAddress}`);
    
    res.json({
      tokens: validTokenAccounts,
      total: validTokenAccounts.length,
      owner: ownerAddress,
      network: network
    });
    
  } catch (error) {
    console.error('Error in token accounts endpoint:', {
      owner: req.params.address,
      network: req.query.network,
      error: error.message,
      stack: error.stack
    });
    
    // Provide detailed error response
    let errorMessage = 'Failed to fetch token accounts';
    let statusCode = 500;
    
    if (error.message.includes('Invalid wallet address')) {
      errorMessage = 'Invalid wallet address format';
      statusCode = 400;
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. Please try again.';
      statusCode = 408;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      tokens: [], // Always provide empty array as fallback
      total: 0,
      owner: req.params.address,
      network: req.query.network || 'devnet',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST api/tokens/transfer
 * @desc    Prepares a token transfer transaction for client-side signing.
 * @access  Public
 */
router.post(
  '/transfer',
  [
    check('tokenMint', 'Token mint address is required').not().isEmpty(),
    check('sender', 'Sender address is required').not().isEmpty(),
    check('recipient', 'Recipient address is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric().isFloat({ min: 0 }),
    check('decimals', 'Decimals are required').isInt({ min: 0, max: 9 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { network = 'devnet' } = req.body;

    try {
      const connection = getConnection(network);
      const result = await transferTokens(req.body, connection);

      // Log the transfer transaction using safe operation
      await safeDbOperation(async () => {
        return await TransactionLog.create({
          type: 'transfer',
          mint: req.body.tokenMint,
          from: req.body.sender,
          to: req.body.recipient,
          amount: (req.body.amount * Math.pow(10, req.body.decimals)).toString(),
          decimals: req.body.decimals,
          txSignature: null, // Will be updated when client confirms
          meta: {
            event: 'transfer_prepared',
            ...req.body
          },
          network: network,
        });
      });

      res.json(result);
    } catch (error) {
      console.error('Error preparing transfer:', error);
      res.status(500).json({ error: error.message || 'Server error during transfer preparation' });
    }
  }
);

/**
 * @route   POST api/tokens/mint
 * @desc    Mint additional tokens
 * @access  Public
 */
router.post(
  '/mint',
  [
    check('tokenMint', 'Token mint address is required').not().isEmpty(),
    check('destinationAccount', 'Destination account is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric().isFloat({ min: 0 }),
    check('decimals', 'Decimals is required').isInt({ min: 0, max: 9 }),
    check('mintAuthority', 'Mint authority public key is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { network = 'devnet' } = req.body;

    try {
      const connection = getConnection(network);
      const result = await mintAdditionalTokens(req.body, connection);

      // Log the mint transaction using safe operation
      await safeDbOperation(async () => {
        return await TransactionLog.create({
          type: 'mint',
          mint: req.body.tokenMint,
          from: null,
          to: req.body.mintAuthority, // Mint authority is typically the recipient
          amount: (req.body.amount * Math.pow(10, req.body.decimals)).toString(),
          decimals: req.body.decimals,
          txSignature: null, // Will be updated when client confirms
          meta: {
            event: 'mint_prepared',
            destinationAccount: req.body.destinationAccount,
            ...req.body
          },
          network: network,
        });
      });

      res.json(result);
    } catch (error) {
      console.error('Error minting tokens:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
);

/**
 * @route   POST api/tokens/burn
 * @desc    Burn tokens (reduce supply)
 * @access  Public
 */
router.post(
  '/burn',
  [
    check('tokenMint', 'Token mint address is required').not().isEmpty(),
    check('tokenAccount', 'Token account is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric().isFloat({ min: 0 }),
    check('decimals', 'Decimals is required').isInt({ min: 0, max: 9 }),
    check('owner', 'Owner public key is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { network = 'devnet' } = req.body;

    try {
      const connection = getConnection(network);
      const result = await burnTokens(req.body, connection);

      // Log the burn transaction using safe operation
      await safeDbOperation(async () => {
        return await TransactionLog.create({
          type: 'burn',
          mint: req.body.tokenMint,
          from: req.body.owner,
          to: null,
          amount: (req.body.amount * Math.pow(10, req.body.decimals)).toString(),
          decimals: req.body.decimals,
          txSignature: null, // Will be updated when client confirms
          meta: {
            event: 'burn_prepared',
            tokenAccount: req.body.tokenAccount,
            ...req.body
          },
          network: network,
        });
      });

      res.json(result);
    } catch (error) {
      console.error('Error burning tokens:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
);

/**
 * @route   GET api/tokens/:address/holders
 * @desc    Get detailed token holders information
 * @access  Public
 */
router.get('/:address/holders', async (req, res) => {
  try {
    const { network = 'devnet' } = req.query;
    const connection = getConnection(network);
    const mintPublicKey = new PublicKey(req.params.address);
    
    // Get mint info for supply calculation
    const mintInfo = await getMint(connection, mintPublicKey);
    
    // Get all token accounts for this mint
    let tokenAccounts;
    if (typeof connection.getParsedTokenAccountsByMint === 'function') {
      tokenAccounts = await connection.getParsedTokenAccountsByMint(mintPublicKey);
    } else if (typeof connection.getParsedProgramAccounts === 'function') {
      tokenAccounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: mintPublicKey.toBase58() } }
          ]
        }
      );
      tokenAccounts = { value: tokenAccounts };
    } else {
      throw new Error('No compatible method to fetch token accounts');
    }

    // Process holders data
    const holders = tokenAccounts.value
      .map(account => {
        const data = account.account.data.parsed.info;
        const balance = data.tokenAmount.amount;
        const uiAmount = data.tokenAmount.uiAmount;
        
        // Only include accounts with non-zero balance
        if (parseInt(balance) > 0) {
          return {
            address: data.owner,
            balance: balance,
            uiAmount: uiAmount,
            tokenAccount: account.pubkey.toString()
          };
        }
        return null;
      })
      .filter(holder => holder !== null)
      .sort((a, b) => parseInt(b.balance) - parseInt(a.balance)); // Sort by balance descending

    res.json({ holders, totalSupply: mintInfo.supply.toString() });
  } catch (error) {
    console.error('Error fetching token holders:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @route   GET api/tokens/:address/transactions
 * @desc    Get transaction history for a specific token
 * @access  Public
 */
router.get('/:address/transactions', async (req, res) => {
  try {
    const { network = 'devnet' } = req.query;
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    console.log(`Fetching transactions for mint: ${address}, network: ${network}, page: ${page}, limit: ${limit}`);
    
    // Get transactions from database using safe operation
    const query = { mint: address };
    if (network) {
      query.network = network;
    }
    
    const transactions = await safeDbOperation(async () => {
      return await TransactionLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();
    }, []);

    console.log(`Found ${transactions.length} transactions`);
    
    // Get total count for pagination using safe operation
    const total = await safeDbOperation(async () => {
      return await TransactionLog.countDocuments(query);
    }, 0);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      decimals: tx.decimals,
      signature: tx.txSignature,
      timestamp: tx.timestamp,
      network: tx.network || network,
      meta: tx.meta || {}
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @route   POST api/tokens/transactions/confirm
 * @desc    Update transaction signature when transaction is confirmed
 * @access  Public
 */
router.post('/transactions/confirm', async (req, res) => {
  try {
    const { network = 'devnet' } = req.body;
    const { mint, signature, type } = req.body;
    
    if (!mint || !signature || !type) {
      return res.status(400).json({ error: 'Missing required fields: mint, signature, or type' });
    }
    
    console.log(`Confirming transaction: mint=${mint}, signature=${signature}, type=${type}, network=${network}`);
    
    // Convert amount to blockchain format if it's not already
    let blockchainAmount = req.body.amount;
    if (typeof req.body.amount === 'string' && !req.body.amount.includes('e')) {
      // If it's a simple number string, convert to blockchain amount
      const decimals = req.body.decimals || 9;
      blockchainAmount = (parseFloat(req.body.amount) * Math.pow(10, decimals)).toString();
    }
    
    // Find and update the most recent transaction using safe operation
    const transaction = await safeDbOperation(async () => {
      return await TransactionLog.findOneAndUpdate(
        {
          mint,
          type,
          txSignature: null,
          network
        },
        {
          txSignature: signature,
          meta: { ...req.body.meta, confirmed: true, confirmedAt: new Date() },
          network
        },
        { sort: { timestamp: -1 }, new: true }
      );
    });

    if (!transaction) {
      console.log(`No matching transaction found for mint=${mint}, type=${type}, network=${network}`);
      
      // If no transaction was found to update, create a new one using safe operation
      const newTransaction = await safeDbOperation(async () => {
        const txLog = new TransactionLog({
          type,
          mint,
          from: req.body.from || null,
          to: req.body.to || null,
          amount: blockchainAmount,
          decimals: req.body.decimals || 9,
          txSignature: signature,
          meta: { ...req.body.meta, confirmed: true, confirmedAt: new Date() },
          network
        });
        return await txLog.save();
      });
      
      if (newTransaction) {
        console.log(`Created new transaction record with signature=${signature}`);
        return res.json({ success: true, transaction: newTransaction });
      } else {
        console.log(`Failed to create new transaction record`);
        return res.json({ success: true, message: 'Transaction processed but not logged' });
      }
    }

    console.log(`Updated transaction record: ${transaction._id}`);
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Error confirming transaction:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;