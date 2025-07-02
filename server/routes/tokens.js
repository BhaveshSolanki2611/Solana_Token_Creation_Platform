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
      const connection = getConnection(network);
      const preparedData = await prepareCreateTokenTransaction({ ...req.body, network }, connection);

      // Database operations using safe wrapper - run in background
      const dbOperations = async () => {
        // Save token metadata
        await safeDbOperation(async () => {
          const tokenDoc = new Token({
            mint: preparedData.mintAddress,
            name: req.body.name,
            symbol: req.body.symbol,
            decimals: req.body.decimals,
            supply: req.body.supply,
            owner: req.body.ownerWallet,
            network: network,
            mintAuthority: req.body.mintAuthority,
            freezeAuthority: req.body.freezeAuthority,
            description: req.body.description,
            image: req.body.image,
            website: req.body.website,
            twitter: req.body.twitter,
            telegram: req.body.telegram,
            discord: req.body.discord,
          });
          return await tokenDoc.save();
        });

        // Save user if not present
        if (req.body.ownerWallet) {
          await safeDbOperation(async () => {
            return await User.updateOne(
              { wallet: req.body.ownerWallet },
              { $setOnInsert: { wallet: req.body.ownerWallet } },
              { upsert: true }
            );
          });
        }

        // Log creation event
        await safeDbOperation(async () => {
          return await TransactionLog.create({
            type: 'mint',
            mint: preparedData.mintAddress,
            from: null,
            to: req.body.ownerWallet,
            amount: (req.body.supply * Math.pow(10, req.body.decimals)).toString(),
            decimals: req.body.decimals,
            txSignature: null,
            meta: { event: 'create', ...req.body },
            network: network,
          });
        });
      };

      // Run database operations in background, don't wait for them
      dbOperations();

      // Return the prepared transaction data immediately
      res.json(preparedData);
    } catch (error) {
      console.error('Error preparing token creation:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
);

/**
 * @route   GET api/tokens/:address
 * @desc    Get token information by address
 * @access  Public
 */
router.get('/:address', async (req, res) => {
  try {
    const { network = 'devnet' } = req.query;
    const tokenInfo = await getTokenInfo(req.params.address, network);
    if (!tokenInfo) {
      // If tokenInfo is null, it means the token was not found.
      return res.status(404).json({ error: 'Token not found' });
    }
    // Try to get metadata from MongoDB using safe operation
    const dbMeta = await safeDbOperation(async () => {
      return await Token.findOne({ mint: req.params.address }).lean();
    });
    // Merge dbMeta into tokenInfo, preferring on-chain for supply/decimals, dbMeta for name/symbol/description
    const merged = {
      ...dbMeta,
      ...tokenInfo,
      name: dbMeta?.name || tokenInfo.name || 'Unnamed Token',
      symbol: dbMeta?.symbol || tokenInfo.symbol || '',
      description: dbMeta?.description || '',
      image: dbMeta?.image || '',
      website: dbMeta?.website || '',
      twitter: dbMeta?.twitter || '',
      telegram: dbMeta?.telegram || '',
      discord: dbMeta?.discord || '',
    };
    res.json(merged);
  } catch (error) {
    console.error('Error fetching token info:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'Too many requests to the Solana network. Please try again in a moment.' 
      });
    }
    
    if (error.message && error.message.includes('Invalid public key')) {
      return res.status(400).json({ error: 'Invalid token address format' });
    }
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Generic server error
    res.status(500).json({ error: 'Server error while fetching token information. Please try again later.' });
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
    
    // Validate wallet address format
    if (!req.params.address || req.params.address.length !== 44) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    const tokenAccounts = await getTokenAccountsByOwner(req.params.address, network);
    res.json({ tokens: tokenAccounts });
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'Too many requests to the Solana network. Please try again in a moment.' 
      });
    }
    
    if (error.message && error.message.includes('Invalid public key')) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Generic server error
    res.status(500).json({ error: 'Server error while fetching token accounts. Please try again later.' });
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