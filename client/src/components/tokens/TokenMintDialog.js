import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

/**
 * TokenMintDialog component for minting tokens
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onMint - Mint handler
 * @param {Object} props.token - Token data
 * @param {boolean} props.loading - Loading state
 */
const TokenMintDialog = ({ open, onClose, onMint, token, loading = false }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const mintAmount = parseFloat(amount);
    if (onMint) {
      onMint(mintAmount);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Mint {token?.symbol || 'Tokens'}
        </DialogTitle>
        
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Token: {token?.name} ({token?.symbol})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Supply: {new Intl.NumberFormat().format(token?.supply || 0)} {token?.symbol}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Amount to Mint"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            inputProps={{
              min: 0,
              step: 'any',
            }}
            disabled={loading}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Note: This will mint new tokens to your wallet. Make sure you have mint authority.
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !amount}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Minting...' : 'Mint Tokens'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TokenMintDialog;