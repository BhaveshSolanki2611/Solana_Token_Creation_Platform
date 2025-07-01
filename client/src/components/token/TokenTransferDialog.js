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
import { formatTokenAmount } from '../../utils/tokenUtils';

/**
 * TokenTransferDialog component for transferring tokens
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Function to close dialog
 * @param {Function} props.onTransfer - Function to transfer tokens
 * @param {Object} props.token - Token data
 */
const TokenTransferDialog = ({ open, onClose, onTransfer, token }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (token && parseFloat(amount) > parseFloat(formatTokenAmount(token.balance, token.decimals))) {
      errors.amount = `You cannot transfer more than your balance of ${formatTokenAmount(token.balance, token.decimals)} ${token.symbol}`;
    }
    
    // Validate recipient
    if (!recipient) {
      errors.recipient = 'Please enter a recipient wallet address';
    } else if (!isValidSolanaAddress(recipient)) {
      errors.recipient = 'Please enter a valid Solana address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInitiateTransfer = () => {
    if (validateForm()) {
      onTransfer({
        recipient,
        amount: parseFloat(amount),
      });
    }
  };

  if (!token) return null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Tokens</DialogTitle>
      
      <DialogContent>
        <Box my={2}>
          <Typography variant="subtitle1" gutterBottom>
            Token: {token?.name} ({token?.symbol})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your Balance: {formatTokenAmount(token?.balance, token?.decimals)} {token?.symbol}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          label="Amount to Transfer"
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
          disabled={loading}
        />
        
        <TextField
          label="Recipient Wallet Address"
          fullWidth
          margin="normal"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          error={!!validationErrors.recipient}
          helperText={validationErrors.recipient}
          disabled={loading}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleInitiateTransfer} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Transfer Tokens'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenTransferDialog;