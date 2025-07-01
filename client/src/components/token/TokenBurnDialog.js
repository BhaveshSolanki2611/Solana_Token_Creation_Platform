import React, { useState, useEffect } from 'react';
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
import { formatTokenAmount, parseTokenAmount } from '../../utils/tokenUtils';

/**
 * TokenBurnDialog component for burning tokens
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Function to close dialog
 * @param {Function} props.onBurn - Function to burn tokens
 * @param {Object} props.token - Token data
 * @param {boolean} props.loading - Whether burning is in progress
 * @param {string} props.error - Error message if any
 */
const TokenBurnDialog = ({ open, onClose, onBurn, token, loading, error }) => {
  const [amount, setAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAmount('');
      setValidationErrors({});
    }
  }, [open]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (token && parseFloat(amount) > parseFloat(formatTokenAmount(token.balance, token.decimals))) {
      errors.amount = `You cannot burn more than your balance of ${formatTokenAmount(token.balance, token.decimals)} ${token.symbol}`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle burn
  const handleBurn = () => {
    if (!token || token.decimals == null) {
      setValidationErrors({ amount: 'Token mint info is missing. Please try again later.' });
      return;
    }
    if (validateForm()) {
      const rawAmount = parseTokenAmount(amount, token.decimals);
      onBurn(token.address, rawAmount);
    }
  };

  const isTokenReady = token && token.decimals != null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Burn Tokens</DialogTitle>
      
      <DialogContent>
        <Box my={2}>
          <Typography variant="subtitle1" gutterBottom>
            Token: {token?.name || 'Unknown'} ({token?.symbol || 'N/A'})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your Balance: {isTokenReady ? formatTokenAmount(token.balance, token.decimals) : '...'} {token?.symbol || ''}
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
          label="Amount to Burn"
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
        <Alert severity="warning" sx={{ mt: 2 }}>
          Warning: Burning tokens is irreversible. The tokens will be permanently removed from circulation.
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleBurn} 
          variant="contained" 
          color="error"
          disabled={loading || !isTokenReady}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Burn Tokens'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenBurnDialog;