import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { isValidSolanaAddress } from '../../utils/walletUtils';
import { formatTokenAmount, parseTokenAmount } from '../../utils/tokenUtils';

/**
 * TokenMintDialog component for minting additional tokens
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Function to close dialog
 * @param {Function} props.onMint - Function to mint tokens
 * @param {Object} props.token - Token data
 * @param {boolean} props.loading - Whether minting is in progress
 * @param {string} props.error - Error message if any
 */
const TokenMintDialog = ({ open, onClose, onMint, token, loading, error }) => {
  const [amount, setAmount] = useState('');
  const [destinationWallet, setDestinationWallet] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setAmount('');
      setDestinationWallet('');
      setValidationErrors({});
    }
  }, [open]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    
    // Validate destination wallet
    if (!destinationWallet) {
      errors.destinationWallet = 'Please enter a destination wallet address';
    } else if (!isValidSolanaAddress(destinationWallet)) {
      errors.destinationWallet = 'Please enter a valid Solana address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle mint
  const handleMint = () => {
    if (!token || token.decimals == null) {
      setValidationErrors({ amount: 'Token mint info is missing. Please try again later.' });
      return;
    }
    if (validateForm()) {
      const rawAmount = parseTokenAmount(amount, token.decimals);
      onMint(token.address, destinationWallet, rawAmount);
    }
  };

  const isTokenReady = token && token.decimals != null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mint Additional Tokens</DialogTitle>
      
      <DialogContent>
        <Box my={2}>
          <Typography variant="subtitle1" gutterBottom>
            Token: {token?.name || 'Unknown'} ({token?.symbol || 'N/A'})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Supply: {isTokenReady ? formatTokenAmount(token.supply, token.decimals) : '...'} {token?.symbol || ''}
          </Typography>
        </Box>
        {!isTokenReady && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Token mint info is missing. Please try again later.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Amount to Mint"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          InputProps={{
            endAdornment: <InputAdornment position="end">{token?.symbol}</InputAdornment>,
          }}
          error={!!validationErrors.amount}
          helperText={validationErrors.amount}
          disabled={loading || !isTokenReady}
        />
        <TextField
          label="Destination Wallet Address"
          fullWidth
          margin="normal"
          value={destinationWallet}
          onChange={(e) => setDestinationWallet(e.target.value)}
          error={!!validationErrors.destinationWallet}
          helperText={validationErrors.destinationWallet}
          disabled={loading || !isTokenReady}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleMint} 
          variant="contained" 
          color="primary"
          disabled={loading || !isTokenReady}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Mint Tokens'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenMintDialog;