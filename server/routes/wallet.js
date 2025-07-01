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
  try {
    const { network = 'devnet' } = req.query;
    
    // Validate wallet address format
    if (!req.params.address || req.params.address.length !== 44) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    const balance = await getWalletBalance(req.params.address, network);
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    
    // Send appropriate error response based on error type
    if (error.message && error.message.includes('Invalid public key')) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    res.status(500).json({ error: error.message || 'Server error' });
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